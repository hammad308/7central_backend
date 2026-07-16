const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const EmployeeBonus = require("../models/employeeBonus.js");
const Notification = require("../models/notificationModel.js");
const employeeBonusValidationSchema = require("../validations/employeeBonusValidationSchema.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeBonusValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400))
  }

  const newEmployeeBonus = await EmployeeBonus.create({ ...req.body });
  const newIDNumber = await getNextInSequence("employeebonus");
  newEmployeeBonus.employeeBonusID = newIDNumber;
  await newEmployeeBonus.save();

  const bonusMonth = DateTime.fromJSDate(newEmployeeBonus.bonusMonth);
  const bonusMonthText = `${bonusMonth.monthShort} ${bonusMonth.year}`;

  for (let i = 0; i < newEmployeeBonus.employeeIDs.length; ++i) {
    const message = `You have been awarded a bonus of Rs. ${newEmployeeBonus.bonusAmount} for the month of ${bonusMonthText}.`;
    const redirectPage = "my-bonuses";
    await Notification.create({
      employeeID: newEmployeeBonus.employeeIDs[i],
      redirectPage,
      message,
    });
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Employee bonus created successfully",
    doc: newEmployeeBonus,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeesBonuses = await EmployeeBonus.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeIDs'
      }
    ])
    .exec();

  const docsCount = await EmployeeBonus.countDocuments({ isActive: true });

  sendSuccessResponse(res, 200, logger, {
    message: "List of employees bonuses retrieved successfully.",
    docs: employeesBonuses,
    docsCount: docsCount
  })
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employeeBonus = await EmployeeBonus.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeIDs'
      }
    ])
    .exec();

  if (!employeeBonus) {
    return next(new AppError("Employee Bonus not found!", 404))
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee Bonus found!",
    doc: employeeBonus,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeBonus = await EmployeeBonus.findOne({ _id: req.params.id, isActive: true });
  if (!employeeBonus) {
    return next(new AppError("Employee Bonus not found!", 404));
  }

  employeeBonus.isActive = false;
  await employeeBonus.save();

  const bonusMonth = DateTime.fromJSDate(employeeBonus.bonusMonth);
  const bonusMonthText = `${bonusMonth.monthShort} ${bonusMonth.year}`;

  for (let i = 0; i < employeeBonus.employeeIDs.length; ++i) {
    const message = `Bonus of Rs. ${employeeBonus.bonusAmount} for the month of ${bonusMonthText} is deleted.`;
    const redirectPage = "my-bonuses";
    await Notification.create({
      employeeID: employeeBonus.employeeIDs[i],
      redirectPage,
      message,
    });
  }

  sendSuccessResponse(res, 200, {
    message: 'Employee bonus deleted successfully.',
    doc: null
  });
});