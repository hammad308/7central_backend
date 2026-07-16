const mongoose = require("mongoose");
const PublicHoliday = require("../models/publicHoliday.js");
const publicHolidayValidationSchema = require("../validations/publicHolidayValidationSchema.js");
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const catchAsync = require('../utils/catchAsync');
const logger = require('../logger')('PUBLICHOLIDAY_CONTROLLER');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = publicHolidayValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const newPublicHoliday = await PublicHoliday.create({ ...req.body });
  const newIDNumber = await getNextInSequence("publicholidays");
  newPublicHoliday.publicHolidayID = newIDNumber;
  await newPublicHoliday.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Public Holiday created successfully",
    doc: newPublicHoliday,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const publicHolidays = await PublicHoliday.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .exec();

  const docsCount = await PublicHoliday.countDocuments({ isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of public holidays retrieved successfully.",
    docs: publicHolidays,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return
  }

  const publicHoliday = await PublicHoliday.findOne({ _id: req.params.id, isActive: true });
  if (!publicHoliday) {
    return next(new AppError("Public Holiday not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Public Holiday found!",
    doc: publicHoliday,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { error } = publicHolidayValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const existingPublicHoliday = await PublicHoliday.findOne({ _id: req.params.id, isActive: true });
  if (!existingPublicHoliday) {
    return next(new AppError("Invalid ID!", 422)); //early return

  }

  const updatedPublicHoliday = await PublicHoliday.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Public Holiday updated successfully",
    doc: updatedPublicHoliday,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return
  }

  const publicHoliday = await PublicHoliday.findOne({ _id: req.params.id, isActive: true });
  if (!publicHoliday) {
    return next(new AppError("Public Holiday not found!", 404));
  }

  publicHoliday.isActive = false;
  await publicHoliday.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Public Holiday deleted successfully.',
    doc: null
  });
});