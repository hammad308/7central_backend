const Department = require('../models/departmentModel');
const Company = require('../models/companyModel');
const Employee = require('../models/employeeModel');
const logger = require('../logger')('DEPARTMENT_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const departmentValidationSchema = require('../validations/departmentValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_DEPARTMENT_AUTOINCREMENTID } = require('../constants/app.constants'); // add this constant

const popObj = [
  { path: 'company', select: 'name autoIncrementId longAutoIncrementId' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new department
exports.create = catchAsync(async (req, res, next) => {
  const { error } = departmentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Check that the company exists and is not deleted
  const company = await Company.findOne({
    _id: req.body.company,
    status: { $ne: 'deleted' },
  });
  if (!company) {
    return next(new AppError('Company not found.', 404));
  }

  // Check duplicate name within the same company (including soft‑deleted)
  const duplicate = await Department.findOne({
    name: req.body.name,
    company: req.body.company,
  });
  if (duplicate) {
    return next(
      new AppError('Department name already exists in this company.', 422)
    );
  }

  // Prepare document
  req.body.createdBy = req.user._id;

  const department = await Department.create(req.body);

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('departments');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_DEPARTMENT_AUTOINCREMENTID,
    newIDNumber
  );
  department.autoIncrementId = newIDNumber;
  department.longAutoIncrementId = longAutoIncrementId;
  await department.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Department created successfully.',
    doc: department,
  });
});

// Get all departments of a specific company
exports.getAllByCompany = catchAsync(async (req, res, next) => {
  const companyId = req.params.companyId;

  // Check company exists
  const company = await Company.findOne({
    _id: companyId,
    status: { $ne: 'deleted' },
  });
  if (!company) {
    return next(new AppError('Company not found.', 404));
  }

  const query = {
    company: companyId,
    status: { $ne: 'deleted' },
  };
  handlerFactory.getAll(Department, popObj, logger, query)(req, res, next);
});

// Get all departments (global list) – optional, you can keep if needed
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: { $ne: 'deleted' } };
  handlerFactory.getAll(Department, popObj, logger, query)(req, res, next);
});

// Get a single department
exports.getOne = handlerFactory.getOne(Department, popObj, logger);

// Update a department
exports.update = catchAsync(async (req, res, next) => {
  const { error } = departmentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const department = await Department.findOne({
    _id: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (!department) {
    return next(new AppError('Department not found.', 404));
  }

  // Prevent changing the company
  if (req.body.company && req.body.company !== department.company.toString()) {
    return next(new AppError('Changing the company of a department is not allowed.', 400));
  }

  // Check for duplicate name within the same company (excluding self)
  if (req.body.name && req.body.name !== department.name) {
    const duplicate = await Department.findOne({
      name: req.body.name,
      company: department.company,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return next(
        new AppError('Department name already exists in this company.', 422)
      );
    }
  }

  const updatedDepartment = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Department updated successfully.',
    doc: updatedDepartment,
  });
});

// Soft delete a department
exports.delete = catchAsync(async (req, res, next) => {
  const department = await Department.findOne({
    _id: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (!department) {
    return next(new AppError('Department not found.', 404));
  }

  // Check if any active employees exist in this department
  const employeesCount = await Employee.countDocuments({
    department: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (employeesCount > 0) {
    return next(
      new AppError(
        `Cannot delete department with ${employeesCount} active employee(s). Reassign or remove them first.`,
        403
      )
    );
  }

  department.status = 'deleted';
  await department.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Department deleted successfully.',
    doc: department,
  });
});