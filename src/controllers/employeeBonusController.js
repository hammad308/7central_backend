const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const EmployeeBonus = require('../models/employeeBonusModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const logger = require('../logger')('EMPLOYEE_BONUS_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const employeeBonusValidationSchema = require('../validations/employeeBonusValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_EMPLOYEE_BONUS_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employees', select: 'name customId department company' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create bonus for one or more employees
exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeBonusValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Verify all employees exist and are active
  const Employee = require('../models/employeeModel');
  const employeeIds = req.body.employees;
  const validEmployees = await Employee.find({
    _id: { $in: employeeIds },
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] }
  });
  if (validEmployees.length !== employeeIds.length) {
    return next(new AppError('One or more employees not found or inactive or terminated or resigned', 404));
  }

  const bonus = await EmployeeBonus.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Generate auto-increment IDs
  const newIDNumber = await getNextInSequence('employeeBonuses');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_BONUS_AUTOINCREMENTID,
    newIDNumber
  );
  bonus.autoIncrementId = newIDNumber;
  bonus.longAutoIncrementId = longAutoIncrementId;
  await bonus.save();

  try {
    const bonusMonth = DateTime.fromJSDate(bonus.bonusMonth);
    const bonusMonthText = `${bonusMonth.monthShort} ${bonusMonth.year}`;
    for (const empId of bonus.employees) {
      await EmployeeNotification.create({
        employee: empId,
        redirectPage: 'my-bonuses',
        message: `You have been awarded a bonus of Rs. ${bonus.amount} for the month of ${bonusMonthText}.`,
      });
    }
  } catch (err) {
    // Non‑critical, log but don't fail the request
    logger.error('Failed to send bonus notifications', err);
  }

  sendSuccessResponse(res, 201, logger, {
    message: 'Bonus created successfully',
    doc: bonus,
  });
});

// Get all bonuses (admin)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeBonus, popObj, logger, query)(req, res, next);
});

// Get a single bonus
exports.getOne = handlerFactory.getOne(EmployeeBonus, popObj, logger);

// Delete (soft)
exports.delete = catchAsync(async (req, res, next) => {
  const bonus = await EmployeeBonus.findOne({ _id: req.params.id, status: 'active' });
  if (!bonus) return next(new AppError('Bonus record not found', 404));

  bonus.status = 'deleted';
  await bonus.save();

  try {
    const bonusMonth = DateTime.fromJSDate(bonus.bonusMonth);
    const bonusMonthText = `${bonusMonth.monthShort} ${bonusMonth.year}`;
    for (const empId of bonus.employees) {
      await EmployeeNotification.create({
        employee: empId,
        redirectPage: 'my-bonuses',
        message: `Bonus of Rs. ${bonus.amount} for ${bonusMonthText} has been revoked.`,
      });
    }
  } catch (err) {
    logger.error('Failed to send bonus deletion notifications', err);
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Bonus deleted successfully',
    doc: bonus,
  });
});

exports.myBonuses = catchAsync(async (req, res, next) => {
  const employeeId = req.user.employee_id;
  if (!employeeId) {
    return next(new AppError("No Employee Profile Linked To Your Account", 403));
  }
  const bonuses = await EmployeeBonus.find({
    employees: { $in: [employeeId] },
    status: "active"
  })
    .populate(popObj)
    .sort({ createdAt: -1 });

  sendSuccessResponse(res, logger, 200, {
    message: 'Your Bunuses Fetched Successfully',
    docs: bonuses
  })
});

exports.getMyBonus = catchAsync(async (req, res, next) => {
  const employeeId = req.user.employee_id;
  const bonus = await EmployeeBonus.findOne({
    _id: req.params.id,
    employees: { $in: [employeeId] },
    status: "active"
  });
  if (!bonus) return next(new AppError("Bonus Not found or not yours", 404));
  sendSuccessResponse(res, 200, logger, {
    message: "Bonus Details",
    doc: bonus
  });
})