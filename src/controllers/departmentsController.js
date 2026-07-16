const mongoose = require("mongoose");
const Department = require("../models/department.js");
const Employee = require("../models/employee.js");
const departmentValidationSchema = require("../validations/departmentValidationSchema.js");
const Company = require("../models/company.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const AppError = require("../utils/appError.js");
const logger = require('../logger')('DEPARTMENT_CONTROLLER');
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = departmentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const existingCompany = await Company.findOne({ _id: req.body.company_id, isActive: true });
  if (!existingCompany) {
    return next(new AppError("Comapany Not Found", 404));
  }
  //Duplicate departments names within the same company should not be allowed.
  //Checking among deleted departments too.
  const existingDepartment = await Department.findOne({
    company_id: req.body.company_id,
    department_name: req.body.department_name,
  });
  if (existingDepartment) {
    return next(new AppError("Department name already taken. Please choose some other name.", 422));
  }
  const newDepartment = await Department.create(req.body);
  sendSuccessResponse(res, 200, logger, {
    message: "Department created successfully",
    doc: newDepartment,
  });
});
exports.getAll = catchAsync(async (req, res, next) => { //getAll departments of a company
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 400))
  }
  //Checking if company exists
  const company = await Company.findOne({ _id: req.params.id, isActive: true });
  if (!company) {
    return next(new AppError("Comapany Not Found", 404));
  }
  const departments = await Department.find({ company_id: req.params.id, isActive: true })
    .populate('company_id')
    .exec();
  const docsCount = await Department.countDocuments({ company_id: req.params.id, isActive: true });
  sendSuccessResponse(res, 200, logger, {
    docs: departments,
    docsCount: docsCount
  });
});
exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 400));
  }
  const department = await Department.findOne({ _id: req.params.id, isActive: true });
  if (!department) {
    return next(new AppError("Department Not Found", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Department found!",
    doc: department,
  });
});
exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 400))
  }
  const { error } = departmentValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const department = await Department.findOne({
    company_id: req.body.company_id,
    isActive: true
  });
  if (department) {
    return next(new AppError("Department Not Found", 404));
  }
  const existingCompany = await Company.findOne({ _id: req.body.company_id, isActive: true });
  if (!existingCompany) {
    return next(new AppError("Comapany Not Found", 404));
  }
  //Changing the company of an existing department is not allowed.
  if (req.body.company_id !== department.company_id.toString()) {
    return next(new AppError("Changing the company of an existing department is not allowed.", 404));
  }
  //Duplicate departments names within the same company should not be allowed.
  const duplicate = await Department.findOne({
    _id: { $ne: req.params.id },
    company_id: req.body.company_id,
    department_name: req.body.department_name, //new name
  });
  if (duplicate) {
    return next(new AppError("Department name already taken. Please choose some other name.", 409));
  }
  const updatedDepartment = await Department.findOneAndUpdate({ _id: req.params.id, isActive: true }, req.body, { new: true, runValidators: true });
  sendSuccessResponse(res, 200, logger {
    message: "Department updated successfully",
    doc: updatedDepartment,
  });
});
exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 400));
  }
  const department = await Department.findOne({ _id: req.params.id, isActive: true });
  if (!department) {
    return next(new AppError("Department Not Found", 404));
  }
  const employeesCount = await Employee.countDocuments({ department: req.params.id, isActive: true });
  if (employeesCount > 0) {
    return next(new AppError(`There ${employeesCount === 1 ? "is" : "are"} ${employeesCount === 1 ? "employee" : "employees"} associated with this department. If you want to remove this department, then you'll have to remove ${employeesCount === 1 ? "employee" : "all employees"} from this department or reassign first!`, 409));
  }
  // Race Condition
  const deletedDepartment = await Department.findOneAndUpdate({ _id: req.params.id, isActive: true }, { isActive: false }, { new: true });
  if (!deletedDepartment) {
    return next(new AppError("Department not Found", 404));
  }
  sendSuccessResponse(res, 200, logger {
    message: 'Department deleted successfully.',
    doc: null
  });
}
);
