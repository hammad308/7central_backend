const mongoose = require('mongoose');
const Employee = require('../models/employeeModel');
const EmployeeAttendance = require("../models/employeeAttendanceModel");
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const Company = require('../models/companyModel');
const Department = require('../models/departmentModel');
const WorkingHour = require("../models/workingHourModel");
const EmployeeLeave = require('../models/employeeLeaveModel');
const logger = require('../logger')('EMPLOYEE_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const {
  sendSuccessResponse,
  getLongAutoIncrementId,
} = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { createEmployeeValidationSchema, updateEmployeeValidationSchema } = require('../validations/employeeValidation');
const userValidationSchema = require('../validations/userValidations');
const { getNextInSequence } = require('../utils/db');
const { uploadBase64Image, uploadDataFile } = require('../utils/uploadFiles');
const { PREFIX_EMPLOYEE_AUTOINCREMENTID } = require('../constants/app.constants'); // add this
const employeeAttendanceModel = require('../models/employeeAttendanceModel');

const popObj = [
  { path: 'company', select: 'name autoIncrementId longAutoIncrementId' },
  { path: 'department', select: 'name autoIncrementId longAutoIncrementId' },
  { path: 'role', select: 'name slug' },
  { path: 'workingShift', select: 'name startTime endTime' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new employee (also creates a User account)
exports.create = catchAsync(async (req, res, next) => {
  const { error } = createEmployeeValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Check email uniqueness in Employee and User
  const existingEmployee = await Employee.findOne({
    $or: [
      { email: req.body.email },
      { cnic: req.body.cnic },
      { phoneNumber: req.body.phoneNumber },
      { username: req.body.username }
    ]
  });
  if (existingEmployee) {
    return next(new AppError('Email, Username, Phone Number or CNIC already in use by another employee.', 422));
  }
  const existingUser = await User.findOne({
    $or: [
      { email: req.body.email },
      { username: req.body.username }
    ]
  });
  if (existingUser) {
    return next(new AppError('Email, Username or CNIC already in use by another User', 422));
  }

  // Validate company and department
  const company = await Company.findOne({ _id: req.body.company, status: { $ne: 'deleted' } });
  if (!company) return next(new AppError('Company not found.', 404));

  const department = await Department.findOne({ _id: req.body.department, status: { $ne: 'deleted' } });
  if (!department) return next(new AppError('Department not found.', 404));
  if (department.company.toString() !== company._id.toString()) {
    return next(new AppError('Department does not belong to the specified company.', 400));
  }

  // Validate role
  const role = await Role.findOne({ _id: req.body.role, slug: req.body.roleSlug });
  if (!role) return next(new AppError('Role not found.', 404));

  const workingShift = await WorkingHour.findById(req.body.workingShift);
  if (!workingShift) return next(new AppError('Working Shift not Found', 404));

  const userData = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.cnic,
    role: req.body.role
  }
  const { error: userValidationError } = userValidationSchema.validate(userData);
  if (userValidationError) {
    return next(new AppError(userValidationError.details[0].message, 400));
  }
  const newUser = await User.create(userData);

  const newIDNumber = await getNextInSequence('employees');
  const customId = `TP-${newIDNumber}`;
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_AUTOINCREMENTID,
    newIDNumber
  );

  const imageFields = ['image', 'cnicFront', 'cnicBack', 'policeCertificate'];

  for (const field of imageFields) {
    if (req.body[field] && req.body[field].startsWith('data:image/')) {
      const base64String = req.body[field].split(',')[1];
      const result = await uploadBase64Image(base64String, `/uploads/${req.uploadDirectory}`);
      req.body[field] = `${req.uploadDirectory}/${result.fileName}`;
    }
  }

  if (req.body.resume && req.body.resume.startsWith('data:application/pdf')) {
    const base64String = req.body.resume.split(',')[1];
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    await uploadDataFile(base64String, req.uploadDirectory, fileName);
    req.body.resume = `${req.uploadDirectory}/${fileName}`;
  }

  const employeeData = {
    ...req.body,
    customId,
    autoIncrementId: newIDNumber,
    longAutoIncrementId,
    createdBy: req.user._id,
  };

  const employee = await Employee.create(employeeData);

  // Link employee ID to the user account
  newUser.employee_id = employee._id;
  await newUser.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Employee created successfully.',
    doc: employee,
  });
});

// Get all employees (custom to include employee leaves info)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: { $ne: 'deleted' } };

  if (req.query.company) {
    query.company = req.query.company;
  }

  const features = new (require('../utils/APIFeatures'))(Employee.find(query), req.query)
    .filter()
    .limitFields()
    .sort()
    .paginate();

  const employees = await features.query.populate(popObj);
  const docsCount = await Employee.countDocuments({ ...query, ...features.queryObj });

  // Fetch granted leaves for these employees
  const employeeIds = employees.map(emp => emp._id);
  const leaves = await EmployeeLeave.find({
    employee: { $in: employeeIds },
    leaveStatus: 'Granted',
    status: { $ne: 'deleted' },
  }).populate('employee', 'name customId');

  const pages = Math.ceil(docsCount / (features.pageSize || 12));

  sendSuccessResponse(res, 200, logger, {
    docs: employees,
    page: features.page,
    pages,
    docsCount,
    employeeLeaves: leaves
  });
});

exports.getAllOfCompany = catchAsync(async (req, res, next) => {
  const companyId = req.params.companyId;
  const company = await Company.findOne({ _id: companyId, status: { $ne: 'deleted' } });
  if (!company) return next(new AppError('Company not found.', 404));

  const query = { company: companyId, status: { $ne: 'deleted' } };
  handlerFactory.getAll(Employee, popObj, logger, query)(req, res, next);
});

exports.getDashboardAttendance = catchAsync(async (req, res, next) => {
  const query = {};
  if (req.query?.company) {
    query.company = req.query.company;
    const companyExists = await Company.findById(query.company);
    if (!companyExists) return next(new AppError("Company Not Found", 404));
  }
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const totalEmployees = await Employee.countDocuments({
    ...query,
    status: "active",
    employmentStatus: { $ne: "terminated" }
  });

  const employeeIds = await Employee.find({
    ...query,
    status: 'active',
    employmentStatus: { $ne: "terminated" }
  }).distinct('_id');

  const todayAttendance = await EmployeeAttendance.aggregate([
    {
      $match: {
        employee: { $in: employeeIds },
        status: 'active',
        checkInTime: { $gte: todayStart, $lte: todayEnd }
      }
    },
    {
      $group: {
        _id: "$attendanceStatus", count: { $sum: 1 }
      }
    }
  ]);

  const attendanceMap = {
    'On Time': 0,
    "Off Day": 0,
    "Half Day": 0,
    "Late": 0
  };

  todayAttendance.forEach(item => {
    attendanceMap[item._id] = item.count;
  });

  const totalPresent = attendanceMap["On Time"] + attendanceMap["Half Day"] + attendanceMap["Late"];
  const totalLate = attendanceMap["Late"];
  const totalAbsent = totalEmployees - totalPresent - attendanceMap["Off Day"];

  sendSuccessResponse(res, 200, logger, {
    message: "Dashboard Attendence Fetched Successfully",
    doc: {
      totalPresent,
      totalLate,
      totalAbsent,
      totalOffDay: attendanceMap["Off Day"],
      totalHalfDay: attendanceMap["Half Day"],
      totalOnTime: attendanceMap["On Time"]
    }
  });
});

// Get single employee
exports.getOne = handlerFactory.getOne(Employee, popObj, logger, { status: 'active' });

// Get full profile (with more populated fields)
exports.profile = catchAsync(async (req, res, next) => {
  const employee = await Employee.findOne({
    _id: req.params.id,
    status: { $ne: 'deleted' },
  }).populate([
    { path: 'company' },
    { path: 'department' },
    { path: 'role' },
    { path: 'workingShift' },
    { path: 'createdBy', select: 'username image email' },
  ]);

  if (!employee) return next(new AppError('Employee not found.', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee profile retrieved.',
    doc: employee,
  });
});

// Update employee
exports.update = catchAsync(async (req, res, next) => {
  const { error } = updateEmployeeValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const employee = await Employee.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
  if (!employee) return next(new AppError('Employee not found.', 404));

  // Email cannot be changed
  if (req.body.email && req.body.email !== employee.email) {
    return next(new AppError('Email cannot be changed.', 400));
  }

  // Validate company, department, role
  if (req.body.company) {
    const company = await Company.findOne({ _id: req.body.company, status: { $ne: 'deleted' } });
    if (!company) return next(new AppError('Company not found.', 404));
  }
  if (req.body.department) {
    const department = await Department.findOne({ _id: req.body.department, company: employee.company, status: { $ne: 'deleted' } });
    if (!department) return next(new AppError('Department not found or does not belong to employee company', 404));
    if (req.body.company && department.company.toString() !== req.body.company) {
      return next(new AppError('Department does not belong to the specified company.', 400));
    }
  }
  if (req.body.roleSlug) {
    const role = await Role.findOne({ slug: req.body.roleSlug });
    if (!role) return next(new AppError('Role not found.', 404));
    req.body.role = role._id;
  }
  if (req.body.workingShift) {
    const workingShift = await WorkingHour.findById(req.body.workingShift);
    if (!workingShift) return next(new AppError('Working Shift not Found', 404));
  }

  // Handle image uploads for updated fields
  const imageFields = ['image', 'cnicFront', 'cnicBack', 'policeCertificate'];
  for (const field of imageFields) {
    if (req.body[field] && req.body[field].startsWith('data:image/')) {
      const base64String = req.body[field].split(',')[1];
      const result = await uploadBase64Image(base64String, `/uploads/${req.uploadDirectory}`);
      req.body[field] = `${req.uploadDirectory}/${result.fileName}`;
    }
  }

  if (req.body.resume && req.body.resume.startsWith('data:application/pdf')) {
    const base64String = req.body.resume.split(',')[1];
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
    await uploadDataFile(base64String, req.uploadDirectory, fileName);
    req.body.resume = `${req.uploadDirectory}/${fileName}`;
  }

  const user = await User.findOne({ email: employee.email });
  if (user) {
    if (req.body.employmentStatus) {
      if (['terminated', 'resigned'].includes(req.body.employmentStatus)) {
        user.status = 'blocked';
      } else {
        user.status = 'active';
      }
    }

    if (req.body.role || req.body.roleSlug) {
      user.role = req.body.role || employee.role;
      user.roleSlug = req.body.roleSlug || employee.roleSlug;
    }

    if (req.body.username) {
      const usernameExists = await User.findOne({
        username: req.body.username,
        _id: { $ne: user._id }
      });
      if (usernameExists) {
        return next(new AppError('Username already taken', 422));
      }
      user.username = req.body.username;
    }
    if (req.body.cnic) {
      user.password = req.body.cnic;
    }

    await user.save();
  }

  const updatedEmployee = await Employee.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee updated successfully.',
    doc: updatedEmployee,
  });
});

// Soft delete employee
exports.delete = catchAsync(async (req, res, next) => {
  const employee = await Employee.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
  if (!employee) return next(new AppError('Employee not found.', 404));

  // Deactivate associated user account
  const user = await User.findOne({ email: employee.email });
  if (user) {
    user.status = 'deleted';
    await user.save();
  }

  employee.status = 'deleted';
  await employee.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee deleted successfully.',
    doc: employee,
  });
});