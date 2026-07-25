const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Employee = require('../models/employeeModel');
const EmployeeAttendance = require('../models/employeeAttendanceModel');
const PublicHoliday = require('../models/publicHolidayModel');
const EmployeeLeave = require('../models/employeeLeaveModel');
const logger = require('../logger')('EMPLOYEE_ATTENDANCE_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const employeeAttendanceValidationSchema = require('../validations/employeeAttendanceValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_EMPLOYEE_ATTENDANCE_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employee', select: 'name customId department company' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Helper to check if employee can mark attendance (no holiday, no leave, not Sunday, within shift)
const canMarkAttendance = async (employeeId, now = DateTime.now().setZone('Asia/Karachi')) => {
  const employee = await Employee.findOne({ _id: employeeId, status: { $ne: 'deleted' } }).populate('workingShift');
  if (!employee) throw new AppError('Employee not found', 404);

  const shift = employee.workingShift;
  const shiftStart = DateTime.fromObject(
    { hour: shift.shiftStart?.hour || 9, minute: shift.shiftStart?.minute || 0 },
    { zone: 'Asia/Karachi' }
  );
  const shiftEnd = DateTime.fromObject(
    { hour: shift.shiftEnd?.hour || 18, minute: shift.shiftEnd?.minute || 0 },
    { zone: 'Asia/Karachi' }
  );

  const today = now.startOf('day');
  const nowDateOnly = today.toJSDate();

  if (now.weekday === 7) throw new AppError("Attendance not allowed on Sunday", 403);
  if (now < shiftStart || now > shiftEnd) throw new AppError("Attendance only allowed during shift hours", 403);

  const publicHoliday = await PublicHoliday.findOne({ date: nowDateOnly, status: 'active' });
  if (publicHoliday) throw new AppError("Attendance not allowed on public holiday", 400);

  const leave = await EmployeeLeave.findOne({
    employee: employeeId,
    status: 'Granted',
    startDate: { $lte: nowDateOnly },
    endDate: { $gte: nowDateOnly },
    status: { $ne: 'deleted' }, 
  });
  if (leave) throw new AppError("You are on leave today", 403);

  return { employee, shiftStart, shiftEnd };
};

// Mark check-in (employee self-service)
exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeAttendanceValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Get employee from authenticated user
  
  const employeeId = req.user.employee_id; 
  if (!employeeId) return next(new AppError('No employee profile linked to this user', 403));

  const now = DateTime.now().setZone('Asia/Karachi');
  const { employee, shiftStart, shiftEnd } = await canMarkAttendance(employeeId, now);

  // Ensure submitted checkInTime is within today's shift
  const userCheckInTime = DateTime.fromISO(req.body.checkInTime);
  if (userCheckInTime < shiftStart || userCheckInTime > shiftEnd) {
    return next(new AppError("Invalid check-in time", 400));
  }

  // Check for existing attendance today
  const existing = await EmployeeAttendance.findOne({
    employee: employeeId,
    checkInTime: { $gte: shiftStart.toJSDate(), $lt: shiftEnd.toJSDate() },
    status: 'active',
  });
  if (existing) return next(new AppError("Today's attendance already marked", 409));

  // Determine attendance status (late if after shift start + some grace)
  const graceMinutes = 15; 
  const lateThreshold = shiftStart.plus({ minutes: graceMinutes });
  let attendanceStatus = 'On Time';
  if (userCheckInTime > lateThreshold) attendanceStatus = 'Late';

  const attendance = await EmployeeAttendance.create({
    employee: employeeId,
    checkInTime: userCheckInTime.toJSDate(),
    attendanceStatus,
    createdBy: req.user._id,
  });

  // Generate auto-increment IDs
  const newIDNumber = await getNextInSequence('employeeAttendances');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_ATTENDANCE_AUTOINCREMENTID,
    newIDNumber
  );
  attendance.autoIncrementId = newIDNumber;
  attendance.longAutoIncrementId = longAutoIncrementId;
  await attendance.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Check‑in recorded successfully',
    doc: attendance,
  });
});

// Check-out (employee self-service)
exports.checkOut = catchAsync(async (req, res, next) => {
  const employeeId = req.user.employee;
  if (!employeeId) return next(new AppError('No employee profile linked to this user', 403));

  const now = DateTime.now().setZone('Asia/Karachi');
  const { employee, shiftStart, shiftEnd } = await canMarkAttendance(employeeId, now);

  // Find today's attendance record (check‑in, no check‑out)
  const attendance = await EmployeeAttendance.findOne({
    employee: employeeId,
    checkInTime: { $gte: shiftStart.toJSDate(), $lt: shiftEnd.toJSDate() },
    checkOutTime: null,
    status: 'active',
  });
  if (!attendance) return next(new AppError('No check‑in found for today, cannot check out', 403));

  // Validate checkOutTime
  const userCheckOutTime = DateTime.fromISO(req.body.checkOutTime);
  if (userCheckOutTime < shiftStart || userCheckOutTime > shiftEnd) {
    return next(new AppError('Invalid check-out time', 400));
  }

  attendance.checkOutTime = userCheckOutTime.toJSDate();
  // Optionally update status to 'Half Day' if checkout before half of shift
  const halfShift = shiftStart.plus({ hours: (shiftEnd.diff(shiftStart, 'hours').hours) / 2 });
  if (userCheckOutTime <= halfShift) {
    attendance.attendanceStatus = 'Half Day';
  }
  await attendance.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Check‑out recorded successfully',
    doc: attendance,
  });
});

// Get all attendances (admin list)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeAttendance, popObj, logger, query)(req, res, next);
});

// Get my own attendances (employee)
exports.myAttendances = catchAsync(async (req, res, next) => {
  const employeeId = req.user.employee;
  if (!employeeId) return next(new AppError('No employee profile linked', 403));

  const query = { employee: employeeId, status: 'active' };
  handlerFactory.getAll(EmployeeAttendance, popObj, logger, query)(req, res, next);
});

// Get single attendance record
exports.getOne = handlerFactory.getOne(EmployeeAttendance, popObj, logger);

// Admin update attendance (e.g., correct status)
exports.update = catchAsync(async (req, res, next) => {
  const { error } = employeeAttendanceValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const attendance = await EmployeeAttendance.findOne({ _id: req.params.id, status: 'active' });
  if (!attendance) return next(new AppError('Attendance record not found', 404));

  // If employee is changed, verify it
  if (req.body.employee) {
    const employee = await Employee.findOne({ _id: req.body.employee, status: { $ne: 'deleted' } });
    if (!employee) return next(new AppError('Employee not found', 404));
  }

  const updated = await EmployeeAttendance.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Attendance updated successfully',
    doc: updated,
  });
});

// Soft delete attendance
exports.delete = catchAsync(async (req, res, next) => {
  const attendance = await EmployeeAttendance.findOne({ _id: req.params.id, status: 'active' });
  if (!attendance) return next(new AppError('Attendance record not found', 404));

  attendance.status = 'deleted';
  await attendance.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Attendance deleted successfully',
    doc: attendance,
  });
});