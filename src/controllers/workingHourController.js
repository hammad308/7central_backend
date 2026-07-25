const mongoose = require('mongoose');
const WorkingHour = require('../models/workingHourModel');
const logger = require('../logger')('WORKING_HOUR_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const workingHourValidationSchema = require('../validations/workingHourValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_WORKINGHOUR_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new shift
exports.create = catchAsync(async (req, res, next) => {
  const { error } = workingHourValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const shift = await WorkingHour.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('workingHours');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_WORKINGHOUR_AUTOINCREMENTID,
    newIDNumber
  );
  shift.autoIncrementId = newIDNumber;
  shift.longAutoIncrementId = longAutoIncrementId;
  await shift.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Working hours created successfully',
    doc: shift,
  });
});

// Get all shifts
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(WorkingHour, popObj, logger, query)(req, res, next);
});

// Get single shift
exports.getOne = handlerFactory.getOne(WorkingHour, popObj, logger);

// Update shift
exports.update = catchAsync(async (req, res, next) => {
  const { error } = workingHourValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const shift = await WorkingHour.findOne({ _id: req.params.id, status: 'active' });
  if (!shift) return next(new AppError('Working hours not found', 404));

  // If late policy is disabled, nullify related fields
  if (req.body.isLatePolicy === false) {
    req.body.onTime = null;
    req.body.halfDay = null;
    req.body.offDay = null;
  } else {
    // If missing but policy enabled, keep existing or set null
    if (!req.body.onTime) req.body.onTime = null;
    if (!req.body.halfDay) req.body.halfDay = null;
    if (!req.body.offDay) req.body.offDay = null;
  }

  const updated = await WorkingHour.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Working hours updated successfully',
    doc: updated,
  });
});

// Soft delete
exports.delete = catchAsync(async (req, res, next) => {
  const shift = await WorkingHour.findOne({ _id: req.params.id, status: 'active' });
  if (!shift) return next(new AppError('Working hours not found', 404));

  shift.status = 'deleted';
  await shift.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Working hours deleted successfully',
    doc: shift,
  });
});