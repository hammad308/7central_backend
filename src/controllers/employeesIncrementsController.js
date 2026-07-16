const mongoose = require("mongoose");
const Employee = require("../models/employee.js");
const EmployeeIncrement = require("../models/employeeIncrement.js");
const employeeIncrementValidationSchema = require("../validations/employeeIncrementValidationSchema.js");
const Notification = require("../models/notificationModel.js");
const catchAsync = require('../utils/catchAsync');
const logger = require('../logger')('EMPLOYEEINCREMENT_CONTROLLER');
const { getNextInSequence } = require("../utils/db.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const AppError = require("../utils/appError.js");

exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeIncrementValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }
  const employee = await Employee.findOne({ _id: req.body.employeeID, isActive: true });
  if (!employee) {
    return next(new AppError("Invalid employee ID!", 422));
  }
  const newEmployeeIncrement = await EmployeeIncrement.create({ ...req.body });
  const newIDNumber = await getNextInSequence("employeeincrements");
  newEmployeeIncrement.employeeIncrementID = newIDNumber;
  await newEmployeeIncrement.save();

  employee.salary = employee.salary + req.body.incrementAmount;
  await employee.save();

  const message = `You have been given a salary increment of Rs. ${req.body.incrementAmount}`;
  const redirectPage = "my-increments";
  await Notification.create({
    employeeID: employee._id,
    redirectPage,
    message,
  });

  sendSuccessResponse(res, 200, logger, {
    message: "Employee increment created successfully",
    doc: newEmployeeIncrement,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeesIncrements = await EmployeeIncrement.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  const docsCount = await EmployeeIncrement.countDocuments({ isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of employees increments retrieved successfully.",
    docs: employeesIncrements,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employeeIncrement = await EmployeeIncrement.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  if (!employeeIncrement) {
    return next(new AppError("Employee Increment not found!", 404))
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee Increment found!",
    doc: employeeIncrement
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeIncrement = await EmployeeIncrement.findOne({ _id: req.params.id, isActive: true });
  if (!employeeIncrement) {
    return next(new AppError("Employee Increment not found!", 404));
  }

  await Employee.findOneAndUpdate(
    { _id: employeeIncrement.employeeID, isActive: true },
    { $inc: { salary: (0 - employeeIncrement.incrementAmount) } }
  );

  employeeIncrement.isActive = false;
  await employeeIncrement.save();

  const message = `Your salary increment of Rs. ${employeeIncrement.incrementAmount} is deleted.`;
  const redirectPage = "my-increments";
  await Notification.create({
    employeeID: employeeIncrement.employeeID,
    redirectPage,
    message,
  });

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee increment deleted successfully.',
    doc: null
  });
});