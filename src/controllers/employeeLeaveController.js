const mongoose = require('mongoose');
const dayjs = require('dayjs');
const Employee = require('../models/employeeModel');
const EmployeeLeave = require('../models/employeeLeaveModel');
const LeaveRule = require('../models/leaveRuleModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const logger = require('../logger')('EMPLOYEE_LEAVE_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createEmployeeLeaveValidationSchema, updateEmployeeLeaveValidationSchema } = require('../validations/employeeLeaveValidation');
const { getNextInSequence } = require('../utils/db');
const { countDatesInARange, countLeaveDaysInARange } = require('../utils/dates');
const { PREFIX_EMPLOYEE_LEAVE_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employee', select: 'fullName customId department company role' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Helper to get leave rule for employee's role
const getLeaveRuleForEmployee = async (employeeId) => {
  const employee = await Employee.findById(employeeId).select('role');
  if (!employee) throw new AppError('Employee not found', 404);

  const rule = await LeaveRule.findOne({ role: employee.role, status: { $ne: 'deleted' } });
  if (!rule) throw new AppError('Leave rules not configured for this role', 422);
  return rule;
};

const validateLeaveRequest = async (employeeId, type, startDate, endDate, existingLeaveId = null) => {
  if (dayjs(endDate).isBefore(dayjs(startDate))) {
    throw new AppError('End date cannot be before start date', 422);
  }

  const rule = await getLeaveRuleForEmployee(employeeId);

  const yearStart = dayjs().startOf('year').toDate();
  const yearEnd = dayjs().endOf('year').toDate();

  const grantedFilter = {
    employee: employeeId,
    type,
    leaveStatus: 'Granted',
    status: 'active',
  };

  if (existingLeaveId) {
    grantedFilter._id = { $ne: existingLeaveId };
  }

  const grantedLeaves = await EmployeeLeave.find(grantedFilter);
  const usedDays = countLeaveDaysInARange(grantedLeaves, yearStart, yearEnd);
  const requestedDays = countDatesInARange(startDate, endDate);

  const limit = type === 'Casual' ? rule.casualLeaves : rule.medicalLeaves;

  if (requestedDays > limit) {
    throw new AppError(`You cannot apply for more than ${limit} ${type} leaves`, 422);
  }

  if (usedDays + requestedDays > limit) {
    throw new AppError(
      `Quota exceeded: You already used ${usedDays} days out of ${limit} allowed ${type} leaves`,
      403
    );
  }

  // Check overlapping leaves (any type, active, not necessarily granted)
  const overlapFilter = {
    employee: employeeId,
    status: 'active',
    $or: [
      { startDate: { $lte: endDate, $gte: startDate } },
      { endDate: { $lte: endDate, $gte: startDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
    ],
  };
  if (existingLeaveId) {
    overlapFilter._id = { $ne: existingLeaveId };
  }

  const overlapping = await EmployeeLeave.findOne(overlapFilter);
  if (overlapping) {
    throw new AppError('You already have a leave application overlapping these dates', 403);
  }

  return rule;
};

// Admin create — employee ID required
exports.create = catchAsync(async (req, res, next) => {
    const { error } = createEmployeeLeaveValidationSchema.validate(req.body);
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

    await validateLeaveRequest(req.body.employee, req.body.type, req.body.startDate, req.body.endDate);

    const leave = await EmployeeLeave.create({
        ...req.body,
        createdBy: req.user._id,
        leaveStatus: req.body.leaveStatus || 'Pending',
    });

    const newIDNumber = await getNextInSequence('employeeLeaves');
    leave.autoIncrementId = newIDNumber;
    leave.longAutoIncrementId = getLongAutoIncrementId(PREFIX_EMPLOYEE_LEAVE_AUTOINCREMENTID, newIDNumber);
    await leave.save();

    sendSuccessResponse(res, 201, logger, {
        message: 'Leave application created successfully',
        doc: leave,
    });
});

// Employee self create — employee ID token 
exports.createMyLeave = catchAsync(async (req, res, next) => {
    if (!req.user.employee_id) {
        return next(new AppError('No employee profile linked to your account', 403));
    }

    delete req.body.employee;
    delete req.body.leaveStatus;

    const { error } = createEmployeeLeaveValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const employeeId = req.user.employee_id;

    const employee = await Employee.findOne({
        _id: employeeId,
        status: { $nin: ['deleted', 'inactive'] },
        employmentStatus: { $nin: ['terminated', 'resigned'] }
    });
    if (!employee) return next(new AppError('Employee not found', 404));

    await validateLeaveRequest(employeeId, req.body.type, req.body.startDate, req.body.endDate);

    const leave = await EmployeeLeave.create({
        ...req.body,
        employee: employeeId,
        createdBy: req.user._id,
        leaveStatus: 'Pending',
    });

    const newIDNumber = await getNextInSequence('employeeLeaves');
    leave.autoIncrementId = newIDNumber;
    leave.longAutoIncrementId = getLongAutoIncrementId(PREFIX_EMPLOYEE_LEAVE_AUTOINCREMENTID, newIDNumber);
    await leave.save();

    sendSuccessResponse(res, 201, logger, {
        message: 'Leave application submitted successfully',
        doc: leave,
    });
});

// Admin LIST
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeLeave, popObj, logger, query)(req, res, next);
});

// Employee: my leaves
exports.myLeaves = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const query = { employee: req.user.employee_id, status: 'active' };
  handlerFactory.getAll(EmployeeLeave, popObj, logger, query)(req, res, next);
});

// READ single (admin)
exports.getOne = handlerFactory.getOne(EmployeeLeave, popObj, logger);

// READ my leave (employee)
exports.getMyLeave = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const leave = await EmployeeLeave.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  }).populate(popObj);

  if (!leave) return next(new AppError('Leave application not found', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave retrieved',
    doc: leave,
  });
});

// UPDATE (admin)
exports.update = catchAsync(async (req, res, next) => {
  const { error } = updateEmployeeLeaveValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const leave = await EmployeeLeave.findOne({ _id: req.params.id, status: 'active' });
  if (!leave) return next(new AppError('Leave not found', 404));

  // If employee is changed, verify
  if (req.body.employee && req.body.employee !== leave.employee.toString()) {
    const emp = await Employee.findOne({
      _id: req.body.employee,
      status: { $nin: ['deleted', 'inactive'] },
      employmentStatus: { $nin: ['terminated', 'resigned'] }
    });
    if (!emp) return next(new AppError('New employee not found', 404));
  }

  // Validate leave rules (pass existing leave ID to exclude it)
  const type = req.body.type || leave.type;
  const startDate = req.body.startDate || leave.startDate;
  const endDate = req.body.endDate || leave.endDate;
  await validateLeaveRequest(
    req.body.employee || leave.employee,
    type,
    startDate,
    endDate,
    leave._id
  );

  const oldStatus = leave.leaveStatus;
  const updated = await EmployeeLeave.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  // Notify if status changed
  if (req.body.leaveStatus && req.body.leaveStatus !== oldStatus) {
    try {
      await EmployeeNotification.create({
        employee: updated.employee._id,
        redirectPage: `my-leaves/edit/${updated._id}`,
        message: `Your leave application status has been changed to ${updated.leaveStatus}`,
      });
    } catch (err) {
      logger.error('Notification failed', err);
    }
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave updated successfully',
    doc: updated,
  });
});

// UPDATE my own leave (employee) – only if pending
exports.updateMyLeave = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }

  const { error } = updateEmployeeLeaveValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const leave = await EmployeeLeave.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  });
  if (!leave) return next(new AppError('Leave application not found', 404));

  if (leave.leaveStatus !== 'Pending') {
    return next(new AppError(`Cannot edit a leave that is already ${leave.leaveStatus}`, 403));
  }

  // Validate dates and quota (excluding this leave)
  const type = req.body.type || leave.type;
  const startDate = req.body.startDate || leave.startDate;
  const endDate = req.body.endDate || leave.endDate;
  await validateLeaveRequest(req.user.employee_id, type, startDate, endDate, leave._id);

  // Employees can only update certain fields
  const allowedFields = ['title', 'startDate', 'endDate', 'type', 'description'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      leave[field] = req.body[field];
    }
  }
  await leave.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave updated successfully',
    doc: leave,
  });
});

// DELETE (soft)
exports.delete = catchAsync(async (req, res, next) => {
  const leave = await EmployeeLeave.findOne({ _id: req.params.id, status: 'active' });
  if (!leave) return next(new AppError('Leave not found', 404));

  leave.status = 'deleted';
  await leave.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave deleted successfully',
    doc: leave,
  });
});