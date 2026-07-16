const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Employee = require("../models/employee.js");
const EmployeeAttendance = require("../models/employeeAttendance.js");
const employeeAttendanceValidationSchema = require("../validations/employeeAttendanceValidationSchema.js");
const PublicHoliday = require("../models/publicHoliday.js");
const EmployeeLeave = require("../models/employeeLeave.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = departmentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const existingEmployee = await Employee.findOne({ _id: req.user.employee_id, isActive: true })
    .populate([
      {
        path: "workingShift"
      }
    ])
    .exec();
  if (!existingEmployee) {
    return next(new AppError("Invalid Employee ID!", 400));
  }
  let shiftStart = DateTime.fromObject({
    hour: existingEmployee.workingShift.shiftStart.hour,
    minute: existingEmployee.workingShift.shiftStart.minute,
  }, { zone: 'Asia/Karachi' });
  let shiftEnd = DateTime.fromObject({
    hour: existingEmployee.workingShift.shiftEnd.hour,
    minute: existingEmployee.workingShift.shiftEnd.minute,
  }, { zone: 'Asia/Karachi' });
  //Checking if checkInTime in payload is today, in other words if time set in user's computer is correct.
  //It could be one month behind
  let userCheckInTime = DateTime.fromISO(req.body.checkInTime.toISOString());
  if (!((userCheckInTime > shiftStart) && (userCheckInTime < shiftEnd))) {
    return next(new AppError("Wrong date! Make sure that your's computer date is correct", 400));
  }
  const now = DateTime.now().setZone('Asia/Karachi');
  if ((now < shiftStart) || (now > shiftEnd)) {
    return next(new AppError("Can't check in outside shift timings.", 403));
  }
  if (now.weekday === 7) {
    return next(new AppError("Can't check in on Sunday", 403));
  }
  const nowDateOnly = new Date(Date.parse(now.toISO().split('T')[0]));
  //Checking if today is a public holiday
  const publicHoliday = await PublicHoliday.findOne({ date: nowDateOnly, isActive: true });
  if (publicHoliday) {
    return next(new AppError("Can't check in on a public holiday", 400));
  }
  //Checking if there is any granted leave today
  const leaves = await EmployeeLeave.find({
    employeeID: existingEmployee._id,
    status: "Granted",
    $or: [
      { startDate: nowDateOnly },
      { endDate: nowDateOnly },
      {
        $and: [
          { startDate: { $lt: nowDateOnly } },
          { endDate: { $gt: nowDateOnly } }
        ]
      }
    ],
    isActive: true
  });

  if (leaves && leaves.length > 0) {
    return next(new AppError("You are on leave today", 403));
  }

  //Checking if user has already marked his today's attendance.

  const employeeAttendance = await EmployeeAttendance.findOne(
    {
      employeeID: req.user.employee_id,
      checkInTime: { $gt: shiftStart, $lt: shiftEnd },
      isActive: true
    }
  );

  if (employeeAttendance) {
    return next(new AppError("Today's attendance is already marked.", 409));
  }
  const newEmployeeAttendance = await EmployeeAttendance.create({ ...validData });
  const newIDNumber = await getNextInSequence("employeeattendances");
  newEmployeeAttendance.employeeAttendanceID = newIDNumber;
  await newEmployeeAttendance.save();
  sendSuccessResponse(res, 200, logger{
    message: "Employee attendance marked successfully",
    doc: newEmployeeAttendance,
  });
});
exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeAttendances = await EmployeeAttendance.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  const docsCount = await EmployeeAttendance.countDocuments({ isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of employee attendances retrieved successfully.",
    docs: employeeAttendances,
    docsCount: docsCount
  });
});
exports.myAttendances = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError("Invalid Employee ID!", 422));
  }
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeAttendances = await EmployeeAttendance.find({ employeeID: req.user.employee_id, isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  const docsCount = await EmployeeAttendance.countDocuments({ employeeID: req.user.employee_id, isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of my attendances retrieved successfully.",
    docs: employeeAttendances,
    docsCount: docsCount
  });
});
exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employeeAttendance = await EmployeeAttendance.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  if (!employeeAttendance) {
    return next(new AppError("Employee attendance not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee attendance found!",
    doc: employeeAttendance,
  });
});
exports.update = catchAsync(async (req, res, next) => {
  const { error } = employeeAttendanceValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const existingEmployeeAttendance = await EmployeeAttendance.findOne({ _id: req.params.id, isActive: true });
  if (!existingEmployeeAttendance) {
    return next(new AppError("Invalid employee attendence ID!", 422));
  }
  const employee = await Employee.findOne({ _id: req.body.employeeID });
  if (!employee) {
    return next(new AppError("Invalid employee ID!", 422));
  }
  const updatedEmployeeAttendance = await EmployeeAttendance.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body }
  );
  sendSuccessResponse(res, 200, logger, {
    message: "Employee attendance updated successfully",
    doc: updatedEmployeeAttendance,
  });
});
exports.checkOut = catchAsync(async (req, res, next) => {
  const existingEmployee = await Employee.findOne({ _id: req.user.employee_id, isActive: true })
    .populate([
      {
        path: "workingShift"
      }
    ])
    .exec();

  if (!existingEmployee) {
    return next(new AppError("Invalid Employee ID!", 422));
  }

  let shiftStart = DateTime.fromObject({
    hour: existingEmployee.workingShift.shiftStart.hour,
    minute: existingEmployee.workingShift.shiftStart.minute,
  }, { zone: 'Asia/Karachi' });

  let shiftEnd = DateTime.fromObject({
    hour: existingEmployee.workingShift.shiftEnd.hour,
    minute: existingEmployee.workingShift.shiftEnd.minute,
  }, { zone: 'Asia/Karachi' });

  //Checking if time set in user's computer is correct.
  //It could be one month behind

  let userCheckOutTime = DateTime.fromISO(req.body.checkOutTime);

  if (!((userCheckOutTime > shiftStart) && (userCheckOutTime < shiftEnd))) {
    return next(new AppError("Wrong date! Make sure that your's computer date is correct", 403));

  }

  const now = DateTime.now().setZone('Asia/Karachi');

  if (now.weekday === 7) {
    return next(new AppError("Can't check out on Sunday", 403));
  }

  const nowDateOnly = new Date(Date.parse(now.toISO().split('T')[0]));

  //Checking if today is a public holiday

  const publicHoliday = await PublicHoliday.findOne({ date: nowDateOnly, isActive: true });

  if (publicHoliday) {
    return next(new AppError("Can't check out on public holiday", 403));
  }

  //Checking if there is any granted leave today

  const leaves = await EmployeeLeave.find({
    employeeID: existingEmployee._id,
    status: "Granted",
    $or: [
      { startDate: nowDateOnly },
      { endDate: nowDateOnly },
      {
        $and: [
          { startDate: { $lt: nowDateOnly } },
          { endDate: { $gt: nowDateOnly } }
        ]
      }
    ],
    isActive: true
  });

  if (leaves && leaves.length > 0) {
    return next(new AppError("You are on leave today", 403));
  }

  //Checking if user checked in today

  const employeeAttendance = await EmployeeAttendance.findOne(
    {
      employeeID: req.user.employee_id,
      checkInTime: { $gt: shiftStart, $lt: shiftEnd },
      isActive: true
    }
  );

  if (!employeeAttendance) {
    return next(new AppError("Can't check out without checking in first!", 403));
  }

  //Checking if user already checked out today

  const employeeExit = await EmployeeAttendance.findOne(
    {
      employeeID: req.user.employee_id,
      checkOutTime: { $gt: shiftStart, $lt: shiftEnd },
      isActive: true
    }
  );

  if (employeeExit) {
    return next(new AppError("Today's checkout is already marked!", 403));
  }

  if ((now < shiftStart) || (now > shiftEnd)) {
    return next(new AppError("Can't check out outside shift timings!", 403));
  }

  const updatedEmployeeAttendance = await EmployeeAttendance.findOneAndUpdate(
    {
      employeeID: req.user.employee_id,
      checkInTime: { $gt: shiftStart, $lt: shiftEnd },
      isActive: true
    },
    {
      checkOutTime: new Date(Date.parse(req.body.checkOutTime))
    }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Check out time noted successfully",
    doc: updatedEmployeeAttendance,
  });
});
exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 400));
  }

  const employeeAttendance = await EmployeeAttendance.findOne({ _id: req.params.id, isActive: true });
  if (!employeeAttendance) {
    return next(new AppError("Employee attendance not found!", 404));
  }
  employeeAttendance.isActive = false;
  await employeeAttendance.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee attendance deleted successfully.',
    doc: null
  });
});