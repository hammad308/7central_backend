const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const EmployeeIncrement = require('../models/employeeIncrementModel');
const Notification = require('../models/notificationModel');
const logger = require('../logger')('EMPLOYEE_INCREMENT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const employeeIncrementValidationSchema = require('../validations/employeeIncrementValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_EMPLOYEE_INCREMENT_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employee', select: 'name customId department company salary' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new increment
exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeIncrementValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const employeeId = req.body.employee;

  // Verify employee exists and is active
  const employee = await Employee.findOne({ _id: employeeId, status: { $ne: 'deleted' } });
  if (!employee) return next(new AppError('Employee not found', 404));

  // Create increment record
  const increment = await EmployeeIncrement.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('employeeIncrements');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_INCREMENT_AUTOINCREMENTID,
    newIDNumber
  );
  increment.autoIncrementId = newIDNumber;
  increment.longAutoIncrementId = longAutoIncrementId;
  await increment.save();

  // Update employee salary
  employee.salary = (employee.salary || 0) + req.body.incrementAmount;
  await employee.save();

  // Notify employee
  try {
    await Notification.create({
      employee: employee._id,
      redirectPage: 'my-increments',
      message: `You have been awarded a salary increment of Rs. ${req.body.incrementAmount}.`,
    });
  } catch (err) {
    logger.error('Failed to send increment notification', err);
  }

  sendSuccessResponse(res, 201, logger, {
    message: 'Employee increment created successfully',
    doc: increment,
  });
});

// Get all increments (admin)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeIncrement, popObj, logger, query)(req, res, next);
});

// Get single increment
exports.getOne = handlerFactory.getOne(EmployeeIncrement, popObj, logger);

// Delete (soft) and reverse salary change
exports.delete = catchAsync(async (req, res, next) => {
  const increment = await EmployeeIncrement.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!increment) return next(new AppError('Increment record not found', 404));

  // Reverse the salary increment
  const employee = await Employee.findOne({
    _id: increment.employee,
    status: { $ne: 'deleted' },
  });
  if (employee) {
    employee.salary = Math.max(0, (employee.salary || 0) - increment.incrementAmount); // avoid negative salary
    await employee.save();
  }

  // Soft delete
  increment.status = 'deleted';
  await increment.save();

  // Notify employee
  try {
    await Notification.create({
      employee: increment.employee,
      redirectPage: 'my-increments',
      message: `Your salary increment of Rs. ${increment.incrementAmount} has been revoked.`,
    });
  } catch (err) {
    logger.error('Failed to send increment deletion notification', err);
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee increment deleted successfully',
    doc: increment,
  });
});