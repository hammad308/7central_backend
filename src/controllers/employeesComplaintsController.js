const mongoose = require("mongoose");
const Employee = require("../models/employee.js");
const EmployeeComplaint = require("../models/employeeComplaint.js");
const Notification = require("../models/notification.js");
const employeeComplaintValidationSchema = require("../validations/employeeComplaintValidationSchema.js");
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  if (req.body.employeeID) {
    const employee = await Employee.findOne({ _id: req.body.employeeID, isActive: true });
    if (!employee) {
      return next(new AppError("Invalid Employee ID!", 422))
    }
  }
  else { //create request is sent from UI route my-complaints/new
    if (req.user.employee_id) { //null for superadmin and admins
      req.body.employeeID = req.user.employee_id;
    }
    else {
      return next(new AppError("Invalid Employee ID!", 422));
    }
  }
  const newEmployeeComplaint = await EmployeeComplaint.create({ ...req.body });
  const newIDNumber = await getNextInSequence("employeecomplaints");
  newEmployeeComplaint.employeeComplaintID = newIDNumber;
  await newEmployeeComplaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: "Employee complaint created successfully",
    doc: newEmployeeComplaint,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeComplaints = await EmployeeComplaint.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  const docsCount = await EmployeeComplaint.countDocuments({ isActive: true });

  sendSuccessResponse(res, 200, logger, {
    message: "List of employee complaints retrieved successfully.",
    docs: employeeComplaints,
    docsCount: docsCount
  });
});

exports.myComplaints = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError("Invalid Employee ID!", 422));
  }
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const employeeComplaints = await EmployeeComplaint.find({ employeeID: req.user.employee_id, isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  const docsCount = await EmployeeComplaint.countDocuments({ employeeID: req.user.employee_id, isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of my complaints retrieved successfully.",
    docs: employeeComplaints,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeComplaint = await EmployeeComplaint.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  if (!employeeComplaint) {
    return next(new AppError("Employee complaint not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee complaint found!",
    doc: employeeComplaint,
  });
});

exports.getMyComplaint = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeComplaint = await EmployeeComplaint.findOne(
    { _id: req.params.id, employeeID: req.user.employee_id, isActive: true },
  )
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  if (!employeeComplaint) {
    return next(new AppError("Employee complaint not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee complaint found!",
    doc: employeeComplaint,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message), 422);
  }

  const existingEmployeeComplaint = await findOneDocument(EmployeeComplaint, req.params.id);
  if (!existingEmployeeComplaint) {
    return next(new AppError("Invalid employee complaint ID!", 422));
  }

  const employee = await findOneDocument(Employee, req.body.employeeID);
  if (!employee) {
    return next(new AppError("Invalid employee ID!", 422));
  }

  const updatedEmployeeComplaint = await EmployeeComplaint.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body },
    { new: true }
  );

  if (existingEmployeeComplaint.status !== updatedEmployeeComplaint.status) {
    const message = `Your ${updatedEmployeeComplaint.type} status has been changed to ${updatedEmployeeComplaint.status}.`;
    const redirectPage = `my-complaints/edit/${updatedEmployeeComplaint._id}`;
    await Notification.create({
      employeeID: updatedEmployeeComplaint.employeeID,
      redirectPage,
      message,
    });
  }

  sendSuccessResponse(res, 200, logger, {
    message: "Employee complaint updated successfully",
    doc: updatedEmployeeComplaint,
  });

});

exports.updateMyComplaint = catchAsync(async (req, res, next) => {
  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const existingEmployeeComplaint = await EmployeeComplaint.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  if (!existingEmployeeComplaint) {
    return next(new AppError("Invalid employee complaint ID!", 422));
  }

  //Checking if status is other than pending.
  if (existingEmployeeComplaint.status !== "pending") {
    return next(new AppError(`Can't edit after your complaint status is set to ${existingEmployeeComplaint.status}`, 409));
  }

  //Checking if logged in user owns this complaint
  if (req.user.employee_id) {
    if (!(req.user.employee_id.toString() === existingEmployeeComplaint.employeeID._id.toString())) {
      return next(new AppError("Forbidden!", 403));
    }
  }
  else {
    return next(new AppError("Invalid Employee ID!", 422));
  }

  const updatedEmployeeComplaint = await EmployeeComplaint.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Employee complaint updated successfully",
    doc: updatedEmployeeComplaint,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }

  const employeeComplaint = await EmployeeComplaint.findOne({ _id: req.params.id, isActive: true });
  if (!employeeComplaint) {
    return next(new AppError("Employee Complaint not found", 404));
  }

  employeeComplaint.isActive = false;
  await employeeComplaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee complaint deleted successfully.',
    doc: null
  });
});