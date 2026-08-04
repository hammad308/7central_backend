const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const EmployeeComplaint = require('../models/employeeComplaintModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const logger = require('../logger')('EMPLOYEE_COMPLAINT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createEmployeeComplaintValidationSchema, updateEmployeeComplaintValidationSchema } = require('../validations/employeeComplaintValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employee', select: 'fullName customId department company' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Admin create — employee ID required
exports.create = catchAsync(async (req, res, next) => {
  const { error } = createEmployeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  if (!req.body.employee) {
    return next(new AppError('Employee ID is required', 422));
  }
  if (!mongoose.isValidObjectId(req.body.employee)) {
    return next(new AppError('Invalid Employee ID', 400));
  }

  const employee = await Employee.findOne({
    _id: req.body.employee,
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] }
  });
  if (!employee) return next(new AppError('Employee not found', 404));

  const isDuplicate = await EmployeeComplaint.findOne({
    employee: req.body.employee,
    subject: req.body.subject,
    complaintStatus: 'pending'
  });
  if (isDuplicate) return next(new AppError('Pending complaint for this subject already exists', 422));

  const complaint = await EmployeeComplaint.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const newIDNumber = await getNextInSequence('employeeComplaints');
  complaint.autoIncrementId = newIDNumber;
  complaint.longAutoIncrementId = getLongAutoIncrementId(PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID, newIDNumber);
  await complaint.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Complaint created successfully',
    doc: complaint,
  });
});

// Employee self create — employee ID token
exports.createMyComplaint = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked to your account', 403));
  }

  // employee field body mein allow mat karo
  delete req.body.employee;

  const { error } = createEmployeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const employeeId = req.user.employee_id;

  const employee = await Employee.findOne({
    _id: employeeId,
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] }
  });
  if (!employee) return next(new AppError('Employee not found', 404));

  const isDuplicate = await EmployeeComplaint.findOne({
    employee: employeeId,
    subject: req.body.subject,
    complaintStatus: 'pending'
  });
  if (isDuplicate) return next(new AppError('Pending complaint for this subject already exists', 422));

  const complaint = await EmployeeComplaint.create({
    ...req.body,
    employee: employeeId,
    createdBy: req.user._id,
  });

  const newIDNumber = await getNextInSequence('employeeComplaints');
  complaint.autoIncrementId = newIDNumber;
  complaint.longAutoIncrementId = getLongAutoIncrementId(PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID, newIDNumber);
  await complaint.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Complaint submitted successfully',
    doc: complaint,
  });
});

// List all complaints (admin)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeComplaint, popObj, logger, query)(req, res, next);
});

// Get my own complaints (employee)
exports.myComplaints = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const query = { employee: req.user.employee_id, status: 'active' };
  handlerFactory.getAll(EmployeeComplaint, popObj, logger, query)(req, res, next);
});

// Get single complaint (admin)
exports.getOne = handlerFactory.getOne(EmployeeComplaint, popObj, logger);

// Get my single complaint (employee)
exports.getMyComplaint = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  }).populate(popObj);

  if (!complaint) return next(new AppError('Complaint not found', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint retrieved',
    doc: complaint,
  });
});

// Admin update complaint (status, etc.)
exports.update = catchAsync(async (req, res, next) => {
  const { error } = updateEmployeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!complaint) return next(new AppError('Complaint not found', 404));

  // If employee is provided, verify it
  if (req.body.employee) {
    const employee = await Employee.findOne({
      _id: req.body.employee,
      status: { $nin: ['deleted', 'inactive'] },
      employmentStatus: { $nin: ['terminated', 'resigned'] }
    });
    if (!employee) return next(new AppError('Employee not found', 404));
  }

  const oldStatus = complaint.complaintStatus;
  const updatedComplaint = await EmployeeComplaint.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  // Notify employee if status changed
  if (req.body.complaintStatus && req.body.complaintStatus !== oldStatus) {
    try {
      await EmployeeNotification.create({
        employee: updatedComplaint.employee._id,
        redirectPage: `my-complaints/edit/${updatedComplaint._id}`,
        message: `Your ${updatedComplaint.type} status has been changed to ${updatedComplaint.complaintStatus}.`,
      });
    } catch (err) {
      logger.error('Notification failed', err);
    }
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint updated successfully',
    doc: updatedComplaint,
  });
});


// Employee updates own complaint (only if still pending)
exports.updateMyComplaint = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }

  if (req.body.employee) {
    return next(new AppError("Employee ID is not allowed", 422));
  }

  const { error } = update.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  });

  if (!complaint) return next(new AppError('Complaint not found', 404));

  // Only allow editing if still pending
  if (complaint.complaintStatus !== 'pending') {
    return next(
      new AppError(`Cannot edit a complaint that is already ${complaint.complaintStatus}`, 403)
    );
  }

  // Employees can only change subject, description, type – not employee or status
  const { subject, description, type } = req.body;
  if (subject) complaint.subject = subject;
  if (description !== undefined) complaint.description = description;
  if (type) complaint.type = type;
  await complaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint updated successfully',
    doc: complaint,
  });
});

// Soft delete
exports.delete = catchAsync(async (req, res, next) => {
  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!complaint) return next(new AppError('Complaint not found', 404));

  complaint.status = 'deleted';
  await complaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint deleted successfully',
    doc: complaint,
  });
});