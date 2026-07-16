const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const Employee = require("../models/employee.js");
const EmployeeLeave = require("../models/employeeLeave.js");
const LeaveRule = require("../models/leaveRule.js");
const employeeLeaveValidationSchema = require("../validations/employeeLeaveValidationSchema.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const { countLeaveDaysInARange, countDatesInARange } = require("../utils/dates.js");
const Notification = require("../models/notificationModel.js");
const catchAsync = require('../utils/catchAsync');
const logger = require('../logger')('EMPLOYEELEAVE_CONTROLLER');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeLeaveValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  if (req.body.employeeID) {
    const employee = await Employee.findOne({ _id: req.body.employeeID, isActive: true });
    if (!employee) {
      return next(new AppError("Invalid employee ID!", 422))
    }
  }
  else { //create request is sent from UI route my-leaves/new
    if (req.user.employee_id) { //null for superadmin and admins
      req.body.employeeID = req.user.employee_id;
    }
    else {
      return next(new AppError("Invalid employee ID!", 422));
    }
  }
  const existingEmployee = await Employee.findOne({ _id: req.body.employeeID, isActive: true });
  if (!existingEmployee) {
    return next(new AppError("Invalid employee ID!", 422));
  }

  //End date shouldn't be earlier than start date.
  if (req.body.endDate.getTime() < req.body.startDate.getTime()) {
    return next(new AppError("Leave end date shouldn't be earlier than start date.", 422));
  }

  //Finding number of leaves allowed per year
  const existingLeaveRule = await LeaveRule.findOne(
    { roleID: existingEmployee.roleID, isActive: true }
  );

  if (!existingLeaveRule) {
    return next(new AppError("Leave rules for the given role not found.", 422));
  }

  let dtNow = DateTime.now();
  let dtStartOfYear = dtNow.startOf('year').startOf('day');
  let dtEndOfYear = dtNow.endOf('year').startOf('day');

  const casualLeaves = await EmployeeLeave.find(
    {
      employeeID: req.body.employeeID,
      type: 'Casual',
      status: 'Granted',
      isActive: true
    }
  );

  const medicalLeaves = await EmployeeLeave.find(
    {
      employeeID: req.body.employeeID,
      type: 'Medical',
      status: 'Granted',
      isActive: true
    }
  );

  let casualLeavesCount = countLeaveDaysInARange(casualLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());
  let medicalLeavesCount = countLeaveDaysInARange(medicalLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());

  if (req.body.type === "Casual") {
    if (casualLeavesCount >= existingLeaveRule.casualLeaves) {
      return next(new AppError(`Error! Casual leaves quota exceeded. Leaves granted: ${casualLeavesCount}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
    }
  }

  if (req.body.type === "Medical") {
    if (medicalLeavesCount >= existingLeaveRule.medicalLeaves) {
      return next(new AppError(`Error! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
    }
  }

  let numberOfLeavesBeingRequested = countDatesInARange(req.body.startDate, req.body.endDate);

  if (req.body.type === "Casual") {
    if ((casualLeavesCount + numberOfLeavesBeingRequested) > existingLeaveRule.casualLeaves) {
      return next(new AppError(`Too many leaves requested! Casual leaves quota exceeded. Leaves granted: ${casualLeavesCount}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
    }
  }

  if (req.body.type === "Medical") {
    if ((medicalLeavesCount + numberOfLeavesBeingRequested) > existingLeaveRule.medicalLeaves) {
      return next(new AppError(`Too many leaves requested! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
    }
  }

  //Checking if employee is already on leave on given dates
  const leaves = await EmployeeLeave.find(
    {
      $and: [
        { employeeID: req.body.employeeID },
        {
          $or: [
            { startDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            { endDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            {
              $and: [
                { startDate: { $lte: req.body.startDate } },
                { endDate: { $gte: req.body.endDate } }
              ]
            }
          ]
        },
        { isActive: true }
      ]
    },
  );

  if (leaves.length > 0) {
    return next(new AppError("Your leave application for the given date(s) already exists in the system.", 403)); //early return
  }

  const newEmployeeLeave = await EmployeeLeave.create({ ...req.body });
  const newIDNumber = await getNextInSequence("employeeleaves");
  newEmployeeLeave.employeeLeaveID = newIDNumber;
  await newEmployeeLeave.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Employee leave created successfully",
    doc: newEmployeeLeave,
  });

});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeLeaves = await EmployeeLeave.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  const docsCount = await EmployeeLeave.countDocuments({ isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of employees leaves retrieved successfully.",
    docs: employeeLeaves,
    docsCount: docsCount
  });
});

exports.myLeaves = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError("Invalid Employee ID!", 422)); //early return
  }
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeLeaves = await EmployeeLeave.find({ employeeID: req.user.employee_id, isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  const docsCount = await EmployeeLeave.countDocuments({ employeeID: req.user.employee_id, isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of my leaves retrieved successfully.",
    docs: employeeLeaves,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return

  }
  const employeeLeave = await EmployeeLeave.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  if (!employeeLeave) {
    return next(new AppError("Employee leave not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee leave found!",
    doc: employeeLeave,
  });
});

exports.getMyLeave = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return
  }

  const employeeLeave = await EmployeeLeave.findOne(
    { _id: req.params.id, employeeID: req.user.employee_id, isActive: true }
  )
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();
  if (!employeeLeave) {
    return next(new AppError("Employee leave not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee leave found!",
    doc: employeeLeave,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { error } = employeeLeaveValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); //early return
  }

  const existingEmployeeLeave = await EmployeeLeave.findOne({_id:req.params.id, isActive:true});
  if (!existingEmployeeLeave) {
    return next(new AppError("Invalid employee ID!", 422)); //early return
  }

  const employee = await Employee.findOne({_id:req.body.employeeID, isActive:true});
  if (!employee) {
    return next(new AppError("Invalid employee ID!", 422)); //early return
  }

  //End date shouldn't be earlier than start date.
  if (req.body.endDate.getTime() < req.body.startDate.getTime()) {
    return next(new AppError("Leave end date shouldn't be earlier than start date.", 422)); //early return
  }

  //Finding number of leaves allowed per year
  const existingLeaveRule = await LeaveRule.findOne(
    { roleID: employee.roleID, isActive: true }
  );

  if (!existingLeaveRule) {
    return next(new AppError("Leave rules for the given role not found.", 422)); //early return
  }

  let leavesInThisDocument = countDatesInARange(existingEmployeeLeave.startDate, existingEmployeeLeave.endDate);

  let dtNow = DateTime.now();
  let dtStartOfYear = dtNow.startOf('year').startOf('day');
  let dtEndOfYear = dtNow.endOf('year').startOf('day');

  const casualLeaves = await EmployeeLeave.find(
    {
      employeeID: req.body.employeeID,
      status: 'Granted',
      type: 'Casual',
      isActive: true
    }
  );

  const medicalLeaves = await EmployeeLeave.find(
    {
      employeeID: req.body.employeeID,
      status: 'Granted',
      type: 'Medical',
      isActive: true
    }
  );

  let casualLeavesCount = countLeaveDaysInARange(casualLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());
  let medicalLeavesCount = countLeaveDaysInARange(medicalLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());

  if (req.body.type === "Casual") {
    if (existingEmployeeLeave.type === "Casual") {
      if ((casualLeavesCount - leavesInThisDocument) >= existingLeaveRule.casualLeaves) {
        return next(new AppError(`Error! Casual leaves quota exceeded. Leaves granted: ${casualLeavesCount}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
      }
    }
  }

  if (req.body.type === "Medical") {
    if (existingEmployeeLeave.type === "Medical") {
      if ((medicalLeavesCount - leavesInThisDocument) >= existingLeaveRule.medicalLeaves) {
        return next(new AppError(`Error! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
      }
    }
  }

  let numberOfLeavesBeingRequested = countDatesInARange(req.body.startDate, req.body.endDate);

  if (req.body.type === "Casual") {
    if (((casualLeavesCount - leavesInThisDocument) + numberOfLeavesBeingRequested) > existingLeaveRule.casualLeaves) {
      return next(new AppError(`Too many leaves requested! Casual leaves quota exceeded. Leaves granted: ${casualLeavesCount}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
    }
  }

  if (req.body.type === "Medical") {
    if (((medicalLeavesCount - leavesInThisDocument) + numberOfLeavesBeingRequested) > existingLeaveRule.medicalLeaves) {
      return next(new AppError(`Too many leaves requested! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
    }
  }

  //Checking if employee is already on leave on given dates
  const leaves = await EmployeeLeave.find(
    {
      $and: [
        { employeeID: req.body.employeeID },
        {
          $or: [
            { startDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            { endDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            {
              $and: [
                { startDate: { $lte: req.body.startDate } },
                { endDate: { $gte: req.body.endDate } }
              ]
            }
          ]
        },
        { isActive: true }
      ]
    },
  );

  if (leaves.length > 0) {
    //Checking if leaves array includes the document which is being modified in this request

    let findStatus = leaves.some((element) => element._id.toString() !== req.params.id);

    if (findStatus) {
      return next(new AppError("A leave application for the given date(s) already exists in the system.", 403)); //early return
    }
  }

  const updatedEmployeeLeave = await EmployeeLeave.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body },
    { new: true, runValidators: true }
  );

  if (existingEmployeeLeave.status !== updatedEmployeeLeave.status) {
    const message = `Your leave application status has been updated to "${updatedEmployeeLeave.status}"`;
    const redirectPage = `my-leaves/edit/${updatedEmployeeLeave._id}`;
    await Notification.create({
      employeeID: employee._id,
      redirectPage,
      message,
    });
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Employee leave updated successfully",
    doc: updatedEmployeeLeave,
  });
});

exports.updateMyLeave = catchAsync(async (req, res, next) => {
  const { error } = employeeLeaveValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  const existingEmployeeLeave = await EmployeeLeave.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  if (!existingEmployeeLeave) {
    return next(new AppError("Invalid employee leave ID!", 422))
  }

  //Checking if status is other than pending.
  if (existingEmployeeLeave.status !== "Pending") {
    return next(new AppError(`Can't edit after your leave status is set to ${existingEmployeeLeave.status}`, 409)); // early return
  }

  //Checking if logged in user owns this leave
  if (req.user.employee_id) {
    if (!(req.user.employee_id.toString() === existingEmployeeLeave.employeeID._id.toString())) {
      return next(new AppError("Forbidden!", 403)); //early return
    }
  }
  else {
    return next(new AppError("Invalid employee ID!", 422)); //early return
  }

  //End date shouldn't be earlier than start date.
  if (req.body.endDate.getTime() < req.body.startDate.getTime()) {
    return next(new AppError("Leave end date shouldn't be earlier than start date.", 422)); //early return
  }

  const employee = await Employee.findOne({ _id: req.user.employee_id, isActive: true });
  if (!employee) {
    return next(new AppError("Invalid employee ID!", 422)); //early return
  }

  //Finding number of leaves allowed per year
  const existingLeaveRule = await LeaveRule.findOne(
    { roleID: employee.roleID, isActive: true }
  );

  if (!existingLeaveRule) {
    return next(new AppError("Leave rules for the given role not found.", 422)); //early return
  }

  let leavesInThisDocument = countDatesInARange(existingEmployeeLeave.startDate, existingEmployeeLeave.endDate);

  let dtNow = DateTime.now();
  let dtStartOfYear = dtNow.startOf('year').startOf('day');
  let dtEndOfYear = dtNow.endOf('year').startOf('day');

  const casualLeaves = await EmployeeLeave.find(
    {
      employeeID: req.user.employee_id,
      type: 'Casual',
      status: 'Granted',
      isActive: true
    }
  );

  const medicalLeaves = await EmployeeLeave.find(
    {
      employeeID: req.user.employee_id,
      type: 'Medical',
      status: 'Granted',
      isActive: true
    }
  );

  let casualLeavesCount = countLeaveDaysInARange(casualLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());
  let medicalLeavesCount = countLeaveDaysInARange(medicalLeaves, dtStartOfYear.toJSDate(), dtEndOfYear.toJSDate());

  if (req.body.type === "Casual") {

    if (existingEmployeeLeave.type === "Casual") {
      if ((casualLeavesCount - leavesInThisDocument) >= existingLeaveRule.casualLeaves) {
        return next(new AppError(`Error! Casual leaves quota exceeded. Leaves granted: ${casualLeavesCount - leavesInThisDocument}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
      }
    }

  }

  if (req.body.type === "Medical") {

    if (existingEmployeeLeave.type === "Medical") {
      if ((medicalLeavesCount - leavesInThisDocument) >= existingLeaveRule.medicalLeaves) {
        return next(new AppError(`Error! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount - leavesInThisDocument}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
      }
    }
  }

  let numberOfLeavesBeingRequested = countDatesInARange(req.body.startDate, req.body.endDate);

  if (req.body.type === "Casual") {
    if (existingEmployeeLeave.type === "Casual") {
      if (((casualLeavesCount - leavesInThisDocument) + numberOfLeavesBeingRequested) > existingLeaveRule.casualLeaves) {
        return next(new AppError(`Too many leaves requested! Medical leaves quota exceeded. Leaves granted: ${casualLeavesCount}. Limit: ${existingLeaveRule.casualLeaves}`, 403)); //early return
      }
    }
  }

  if (req.body.type === "Medical") {
    if (existingEmployeeLeave.type === "Medical") {
      if (((medicalLeavesCount - leavesInThisDocument) + numberOfLeavesBeingRequested) > existingLeaveRule.medicalLeaves) {
        return next(new AppError(`Too many leaves requested! Medical leaves quota exceeded. Leaves granted: ${medicalLeavesCount}. Limit: ${existingLeaveRule.medicalLeaves}`, 403)); //early return
      }
    }
  }

  //Checking if employee is already on leave on given dates
  const leaves = await EmployeeLeave.find(
    {
      $and: [
        { employeeID: req.user.employee_id },
        {
          $or: [
            { startDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            { endDate: { $gte: req.body.startDate, $lte: req.body.endDate } },
            {
              $and: [
                { startDate: { $lte: req.body.startDate } },
                { endDate: { $gte: req.body.endDate } }
              ]
            }
          ]
        },
        { isActive: true }
      ]
    },
  );

  if (leaves.length > 0) {
    //Checking if leaves array includes the document which is being modified in this request

    let findStatus = leaves.some((element) => element._id.toString() !== req.params.id);

    if (findStatus) {
      return next(new AppError("Your leave application for the given date(s) already exists in the system.", 403)); //early return
    }
  }

  const updatedEmployeeLeave = await EmployeeLeave.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Employee leave updated successfully",
    doc: updatedEmployeeLeave,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeLeave = await EmployeeLeave.findOne({ _id: req.params.id, isActive: true });
  if (!employeeLeave) {
    return next(new AppError("Employee leave not found!", 404));
  }

  employeeLeave.isActive = false;
  await employeeLeave.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee leave deleted successfully.',
    doc: null
  });
});
