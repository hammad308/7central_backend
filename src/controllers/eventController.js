const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Employee = require('../models/employeeModel');
const Event = require('../models/eventModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const logger = require('../logger')('EVENT_CONTROLLER');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require('../utils/db');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  createEventValidationSchema,
  updateEventValidationSchema,
} = require('../validations/eventValidation');
const { PREFIX_EVENT_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'people', select: 'fullName customId department company email' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// ==================== HELPER: Validate attendees exist and are active ====================
const validateAttendees = async (peopleIds) => {
  const employees = await Employee.find({
    _id: { $in: peopleIds },
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] },
  });

  const foundIds = employees.map((e) => e._id.toString());

  for (const id of peopleIds) {
    if (!foundIds.includes(id.toString())) {
      throw new AppError(`Employee ${id} not found, inactive, terminated, or resigned`, 404);
    }
  }

  return employees;
};

// ==================== HELPER: Check duplicate event ====================
const checkDuplicateEvent = async (title, startDate, endDate, peopleIds, excludeId = null) => {
  // Step 1: Exact match within 24 hours (accidental double-submit)
  const recentExactDuplicate = await Event.findOne({
    title,
    recordStatus: 'active',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    startDate,
    endDate,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

  if (recentExactDuplicate) {
    throw new AppError(
      'An event with the same title and dates was created recently. Please check and try again.',
      409
    );
  }

  // Step 2: Overlapping date range with same title (any time)
  const overlappingEvent = await Event.findOne({
    title,
    recordStatus: 'active',
    $or: [
      { startDate: { $lte: startDate }, endDate: { $gte: startDate } },
      { startDate: { $lte: endDate }, endDate: { $gte: endDate } },
      { startDate: { $gte: startDate }, endDate: { $lte: endDate } },
    ],
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

  if (overlappingEvent) {
    throw new AppError(
      'An event with the same title already exists in this date range.',
      409
    );
  }
};

// ==================== CREATE ====================
exports.create = catchAsync(async (req, res, next) => {
  const { error } = createEventValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Validate attendees exist and are active
  await validateAttendees(req.body.people);

  // Duplicate check
  await checkDuplicateEvent(
    req.body.title,
    req.body.startDate,
    req.body.endDate,
    req.body.people
  );

  // Generate IDs before create (single write)
  const newIDNumber = await getNextInSequence('events');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EVENT_AUTOINCREMENTID || 'EVT',
    newIDNumber
  );

  const event = await Event.create({
    ...req.body,
    autoIncrementId: newIDNumber,
    longAutoIncrementId,
    createdBy: req.user._id,
  });

  // Notify attendees
  for (const personId of event.people) {
    try {
      await EmployeeNotification.create({
        employee: personId,
        redirectPage: 'my-meetings',
        message: `You have been invited to a new event "${event.title}".`,
      });
    } catch (err) {
      logger.error('Failed to send event notification', err);
    }
  }

  const populatedEvent = await Event.findById(event._id).populate(popObj);

  sendSuccessResponse(res, 201, logger, {
    message: 'Event created successfully.',
    doc: populatedEvent,
  });
});

// ==================== ADMIN: Get all events ====================
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { recordStatus: 'active' };

  // Filter by employee if provided (for "my-meetings");
  if (req.query.employeeID) {
    const employee = await Employee.findOne({
      _id: req.query.employeeID,
      status: { $nin: ['deleted', 'inactive'] },
      employmentStatus: { $nin: ['terminated', 'resigned'] }
    });
    if (!employee) return next(new AppError('Employee not found', 404));
    query.people = req.query.employeeID;
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const events = await Event.find(query)
    .limit(req.query.skip === 'no' ? 0 : pageSize)
    .skip(req.query.skip === 'no' ? 0 : pageSize * (page - 1))
    .populate(popObj)
    .sort({ startDate: 1 });

  const docsCount = await Event.countDocuments(query);

  sendSuccessResponse(res, 200, logger, {
    message: 'Events fetched successfully',
    docs: events,
    page,
    pages: Math.ceil(docsCount / pageSize),
    docsCount,
  });
});

// ==================== Get today's meetings for an employee ====================
exports.meetingsToday = catchAsync(async (req, res, next) => {
  if (!req.query.employeeID) {
    return next(new AppError('Employee ID is required', 400));
  }

  if (!mongoose.isValidObjectId(req.query.employeeID)) {
    return next(new AppError('Invalid employee ID', 422));
  }

  const now = DateTime.now().setZone('Asia/Karachi');
  const todayStart = now.startOf('day').toJSDate();
  const todayEnd = now.endOf('day').toJSDate();

  const employee = await Employee.findOne({
    _id: req.query.employeeID,
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] }
  });
  if (!employee) return next(new AppError('Employee not found', 404));

  const events = await Event.find({
    people: req.query.employeeID,
    startDate: { $lte: todayEnd },
    endDate: { $gte: todayStart },
    status: { $ne: 'cancelled' },
    recordStatus: 'active',
  })
    .populate(popObj)
    .sort({ startDate: 1 });

  sendSuccessResponse(res, 200, logger, {
    message: "Today's meetings fetched successfully",
    docs: events,
    docsCount: events.length,
  });
});

// ==================== Get single event ====================
exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid event ID', 422));
  }

  const event = await Event.findOne({
    _id: req.params.id,
    recordStatus: 'active',
  }).populate(popObj);

  if (!event) return next(new AppError('Event not found', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Event found',
    doc: event,
  });
});

// ==================== ADMIN: Update event ====================
exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid event ID', 422));
  }

  const { error } = updateEventValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const existingEvent = await Event.findOne({
    _id: req.params.id,
    recordStatus: 'active',
  });
  if (!existingEvent) return next(new AppError('Event not found', 404));

  // Validate attendees if provided
  if (req.body.people && req.body.people.length > 0) {
    await validateAttendees(req.body.people);
  }

  // Duplicate check if relevant fields changed
  if (req.body.title || req.body.startDate || req.body.endDate) {
    const finalTitle = req.body.title || existingEvent.title;
    const finalStartDate = req.body.startDate || existingEvent.startDate;
    const finalEndDate = req.body.endDate || existingEvent.endDate;

    await checkDuplicateEvent(
      finalTitle,
      finalStartDate,
      finalEndDate,
      req.body.people || existingEvent.people,
      req.params.id // Exclude current event
    );
  }

  const updatedEvent = await Event.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  // Notify attendees of update
  for (const person of updatedEvent.people) {
    try {
      await EmployeeNotification.create({
        employee: person._id || person,
        redirectPage: 'my-meetings',
        message: `The event "${updatedEvent.title}" has been updated.`,
      });
    } catch (err) {
      logger.error('Event update notification failed', err);
    }
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Event updated successfully',
    doc: updatedEvent,
  });
});

// ==================== ADMIN: Soft delete ====================
exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid event ID', 422));
  }

  const event = await Event.findOne({
    _id: req.params.id,
    recordStatus: 'active',
  });
  if (!event) return next(new AppError('Event not found', 404));

  event.recordStatus = 'deleted';
  await event.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Event deleted successfully',
    doc: null,
  });
});