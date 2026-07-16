const mongoose = require("mongoose");
const WorkingHour = require("../models/workingHours.js");
const workingHoursValidationSchema = require("../validations/workingHoursValidationSchema.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const { findOneDocument } = require("../utils/findDocuments.js");
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const catchAsync = require('../utils/catchAsync');
const logger = require('../logger')('WORKINGHOUR_CONTROLLER');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = workingHoursValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const newWorkingHour = await WorkingHour.create({ ...req.body });
  const newIDNumber = await getNextInSequence("workinghours");
  newWorkingHour.workingHoursID = newIDNumber;
  await newWorkingHour.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Working hours created successfully",
    doc: newWorkingHour,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const workingHours = await WorkingHour.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .exec();

  const docsCount = await WorkingHour.countDocuments({ isActive: true });

  sendSuccessResponse(res, 200, logger, {
    message: "List of working hours retrieved successfully.",
    docs: workingHours,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const workingHour = await WorkingHour.findOne({ _id: req.params.id, isActive: true });

  if (!workingHour) {
    return next(new AppError("Working hours not found", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Working hours found!",
    doc: workingHour,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { error } = workingHoursValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const existingWorkingHour = await WorkingHour.findOne({ _id: req.params.id, isActive: true });
  if (!existingWorkingHour) {
    return next(new AppError("Invalid Employee Leave ID!", 422)); //early return
  }

  if (!req.body.onTime) { //the case when Late Tracking was enabled earlier but disabled in update
    req.body.onTime = null
  }
  if (!req.body.halfDay) {
    req.body.halfDay = null
  }
  if (!req.body.offDay) {
    req.body.offDay = null
  }

  const updatedWorkingHour = await WorkingHour.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Working hours updated successfully",
    doc: updatedWorkingHour,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return
  }

  const workingHour = await WorkingHour.findOne({ _id: req.params.id, isActive: true });
  if (!workingHour) {
    return next(new AppError("Working hours not found", 404));
  }

  workingHour.isActive = false;
  await workingHour.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Working hours deleted successfully.',
    doc: null
  });
});