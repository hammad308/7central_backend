const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const EmployeeComplaint = require('../models/employeeComplaintModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const logger = require('../logger')('EMPLOYEE_COMPLAINT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const employeeComplaintValidationSchema = require('../validations/employeeComplaintValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'employee', select: 'name customId department company' },
  { path: 'createdBy', select: 'username image email -_id' },
];


// Admin / HR creates a complaint on behalf of an employee
exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Determine employee ID
  let employeeId = req.body.employee;

  // If not provided, use the authenticated user's linked employee (for employee self-service)
  if (!employeeId) {
    if (!req.user.employee_id) {
      return next(new AppError('No employee profile linked to your account', 403));
    }
    employeeId = req.user.employee_id;
  }

  // Verify employee exists
  const employee = await Employee.findOne({
    _id: employeeId,
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] }
  });
  if (!employee) return next(new AppError('Employee not found, may be terminated, resigned or inactive', 404));

  const complaint = await EmployeeComplaint.create({
    ...req.body,
    employee: employeeId,
    createdBy: req.user._id,
  });

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('employeeComplaints');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_COMPLAINT_AUTOINCREMENTID,
    newIDNumber
  );
  complaint.autoIncrementId = newIDNumber;
  complaint.longAutoIncrementId = longAutoIncrementId;
  await complaint.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Complaint created successfully',
    doc: complaint,
  });
});

// List all complaints (admin)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(EmployeeComplaint, popObj, logger, query)(req, res, next);
});

// Get my own complaints (employee)
exports.myComplaints = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const query = { employee: req.user.employee_id, status: 'active' };
  handlerFactory.getAll(EmployeeComplaint, popObj, logger, query)(req, res, next);
});

// Get single complaint (admin)
exports.getOne = handlerFactory.getOne(EmployeeComplaint, popObj, logger);

// Get my single complaint (employee)
exports.getMyComplaint = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }
  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  }).populate(popObj);

  if (!complaint) return next(new AppError('Complaint not found', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint retrieved',
    doc: complaint,
  });
});

// Admin update complaint (status, etc.)
exports.update = catchAsync(async (req, res, next) => {
  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!complaint) return next(new AppError('Complaint not found', 404));

  // If employee is provided, verify it
  if (req.body.employee) {
    const employee = await Employee.findOne({
      _id: req.body.employee,
      status: { $nin: ['deleted', 'inactive'] },
      employmentStatus: { $nin: ['terminated', 'resigned'] }
    });
    if (!employee) return next(new AppError('Employee not found', 404));
  }

  const oldStatus = complaint.complaintStatus;
  const updatedComplaint = await EmployeeComplaint.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  // Notify employee if status changed
  if (req.body.complaintStatus && req.body.complaintStatus !== oldStatus) {
    try {
      await EmployeeNotification.create({
        employee: updatedComplaint.employee._id,
        redirectPage: `my-complaints/edit/${updatedComplaint._id}`,
        message: `Your ${updatedComplaint.type} status has been changed to ${updatedComplaint.complaintStatus}.`,
      });
    } catch (err) {
      logger.error('Notification failed', err);
    }
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint updated successfully',
    doc: updatedComplaint,
  });
});


// Employee updates own complaint (only if still pending)
exports.updateMyComplaint = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }

  const { error } = employeeComplaintValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    employee: req.user.employee_id,
    status: 'active',
  });

  if (!complaint) return next(new AppError('Complaint not found', 404));

  // Only allow editing if still pending
  if (complaint.complaintStatus !== 'pending') {
    return next(
      new AppError(`Cannot edit a complaint that is already ${complaint.complaintStatus}`, 403)
    );
  }

  // Employees can only change subject, description, type – not employee or status
  const { subject, description, type } = req.body;
  if (subject) complaint.subject = subject;
  if (description !== undefined) complaint.description = description;
  if (type) complaint.type = type;
  await complaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint updated successfully',
    doc: complaint,
  });
});

// Soft delete
exports.delete = catchAsync(async (req, res, next) => {
  const complaint = await EmployeeComplaint.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!complaint) return next(new AppError('Complaint not found', 404));

  complaint.status = 'deleted';
  await complaint.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Complaint deleted successfully',
    doc: complaint,
  });
});