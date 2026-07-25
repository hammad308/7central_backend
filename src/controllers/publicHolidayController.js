const mongoose = require('mongoose');
const PublicHoliday = require('../models/publicHolidayModel');
const logger = require('../logger')('PUBLIC_HOLIDAY_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const publicHolidayValidationSchema = require('../validations/publicHolidayValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_PUBLICHOLIDAY_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new public holiday
exports.create = catchAsync(async (req, res, next) => {
  const { error } = publicHolidayValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const holiday = await PublicHoliday.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('publicHolidays');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_PUBLICHOLIDAY_AUTOINCREMENTID,
    newIDNumber
  );
  holiday.autoIncrementId = newIDNumber;
  holiday.longAutoIncrementId = longAutoIncrementId;
  await holiday.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Public holiday created successfully',
    doc: holiday,
  });
});

// Get all holidays
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(PublicHoliday, popObj, logger, query)(req, res, next);
});

// Get single holiday
exports.getOne = handlerFactory.getOne(PublicHoliday, popObj, logger);

// Update holiday
exports.update = catchAsync(async (req, res, next) => {
  const { error } = publicHolidayValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const holiday = await PublicHoliday.findOne({ _id: req.params.id, status: 'active' });
  if (!holiday) return next(new AppError('Public holiday not found', 404));

  const updatedHoliday = await PublicHoliday.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Public holiday updated successfully',
    doc: updatedHoliday,
  });
});

// Soft delete
exports.delete = catchAsync(async (req, res, next) => {
  const holiday = await PublicHoliday.findOne({ _id: req.params.id, status: 'active' });
  if (!holiday) return next(new AppError('Public holiday not found', 404));

  holiday.status = 'deleted';
  await holiday.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Public holiday deleted successfully',
    doc: holiday,
  });
});