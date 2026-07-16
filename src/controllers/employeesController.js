const mongoose = require("mongoose");
const User = require("../models/user.js");
const Employee = require("../models/employee.js");
const Role = require("../models/role.js");
const Company = require("../models/company.js");
const Department = require("../models/department.js");
const EmployeeLeave = require("../models/employeeLeave.js");
const employeeValidationSchema = require("../validations/employeeValidationSchema.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const { uploadImage } = require("../utils/uploadImage.js");
const { getNextInSequence } = require("../utils/db.js");
const { writeFile } = require('node:fs/promises');
const path = require('path');
const AppError = require("../utils/appError.js");

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const companyID = req.query.companyID;

  const query = { isActive: true };

  if (companyID) {
    const existingCompany = await findOneDocument(Company, companyID);
    if (!existingCompany) {
      return next(new AppError("Company not found!", 404));
    }
    query.company = companyID
  }

  const employees = await Employee.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'company'
      },
      {
        path: 'department'
      },
      {
        path: 'roleID'
      }
    ])
    .exec();

  let employeeLeaves = await EmployeeLeave.find({ status: 'Granted', isActive: true })
    .populate([
      {
        path: 'employeeID'
      }
    ])
    .exec();

  if (companyID && employeeLeaves.length > 0) {
    employeeLeaves = employeeLeaves.filter((leave) => {
      return leave.employeeID.company.toString() === companyID
    });
  }

  const docsCount = await Employee.countDocuments(query);

  sendSuccessResponse(res, 200, logger, {
    message: "List of employees retrieved successfully.",
    docs: employees,
    docsCount: docsCount,
    employeeLeaves
  });

});

exports.getAllOfCompany = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  //Checking if company exists
  const company = await Company.findOne({ _id: req.params.id, isActive: true });
  if (!company) {
    return next(new AppError("Company not found!", 404));
  }
  const employees = await Employee.find({ company: req.params.id, isActive: true });
  const docsCount = await Employee.countDocuments({ company: req.params.id, isActive: true });
  sendSuccessResponse(res, 200, logger, {
    message: "List of employees retrieved successfully.",
    docs: employees,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employee = await Employee.findOne({ _id: req.params.id, isActive: true })
    .populate([{ path: 'company' }, { path: 'department' }])
    .exec();
  if (!employee) {
    return next(new AppError("Employee not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee found!",
    doc: employee
  });
});

exports.profile = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employee = await Employee.findOne({ _id: req.params.id, isActive: true })
    .populate(
      [
        { path: 'company' },
        { path: 'department' },
        { path: 'roleID' },
        { path: 'workingShift' }
      ]
    )
    .exec();

  if (!employee) {
    return next(new AppError("Employee not found!", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Employee found!",
    doc: employee
  });
});
exports.create = catchAsync(async (req, res, next) => {
  const { error } = employeeValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  //Checking if employee with the given email already exists
  //Email of a deleted employee can't be reused
  const existingEmployee = await Employee.findOne({ email: req.body.email });
  if (existingEmployee) {
    return next(new AppError("Email address not available. Please choose some other email address.", 422));
  }

  //Checking if user with the given email already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError("Email address not available. Please choose some other email address.", 422));
  }

  //Checking if company ID exists
  const existingCompany = await Company.findOne({ _id: req.body.company, isActive: true });
  if (!existingCompany) {
    return next(new AppError("Company not found!", 422));
  }
  //Checking if department ID exists and belongs to the company given above
  const existingDepartment = await Department.findOne({ _id: req.body.department, isActive: true });
  if (!existingDepartment) {
    return next(new AppError("Department not found!", 422));
  }
  if (existingDepartment.company_id.toString() !== existingCompany._id.toString()) {
    return next(new AppError("Company has no such department!", 422));
  }

  //Checking if a role with the given role slug exists
  let newUser;
  const role = await Role.findOne({ slug: req.body.role_slug });
  if (role) {
    newUser = await User.create({
      email: req.body.email,
      password: req.body.mobile_phone_number,
      role_slug: req.body.role_slug,
      role: role._id
    });
  }
  else {
    //Role not found
    return next(new AppError("Role not found!", 422));
  }
  let imagesNames = ['picture', 'cnic_front', 'cnic_back', 'police_certificate'];
  for (let imageName of imagesNames) {
    if (req.body[imageName]) {
      const { fileName } = uploadImage(req.body[imageName], 'employees');
      req.body[imageName] = fileName;
    }
  }

  //Checking if resume is a PDF file
  if (req.body.resume) {
    let headerBytes = req.body.resume.split(',')[1].slice(0, 5); //first five characters
    if (headerBytes !== 'JVBER') {
      return next(new AppError("Resume is not a valid PDF file.", 422));
    }
    else {
      let fileData = req.body.resume.split(',')[1];
      const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      let file = path.join(__dirname, `../uploads/employees/${fileName}.pdf`);
      const promise = writeFile(file, fileData, 'base64');
      try {
        await promise;
        req.body.resume = fileName + '.pdf';
      }
      catch (error) {
        throw new Error("Error while saving the file to disk");
      }
    }
  }

  //Generating custom employee ID
  const newIDNumber = await getNextInSequence("employees");
  const custom_id = "TP-" + newIDNumber;
  const newEmployee = await Employee.create({ ...req.body, custom_id, employeeID: newIDNumber });
  //Giving employee ID to user
  newUser.employee_id = newEmployee._id;
  await newUser.save();
  sendSuccessResponse(res, 200, logger, {
    message: "Employee created successfully",
    doc: newEmployee,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const { error } = employeeValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422));
  }

  //Checking if employee exists
  const existingEmployee = await Employee.findOne({ _id: req.params.id, isActive: true });
  if (!existingEmployee) {
    return next(new AppError("Employee with the given ID not found!", 422));
  }

  //Ignoring email in request JSON data
  req.body.email = existingEmployee.email;

  //Checking if company ID exists
  const existingCompany = await Company.findOne({ _id: req.body.company, isActive: true });
  if (!existingCompany) {
    return next(new AppError("Company not found!", 422));
  }

  //Checking if department ID exists and belongs to the company given above
  const existingDepartment = await Department.findOne({ _id: req.body.department, isActive: true });
  if (!existingDepartment) {
    return next(new AppError("Department not found!", 422));
  }
  if (existingDepartment.company_id.toString() !== existingCompany._id.toString()) {
    return next(new AppError("Company has no such department!", 422));
  }

  //Checking if a role with the given role slug exists
  const role = await Role.findOne({ slug: req.body.role_slug });
  if (!role) {
    return next(new AppError("Role not found!", 422));
  }

  //TODO: What to do with the old profile picture etc? Delete them?
  let imagesNames = ['picture', 'cnic_front', 'cnic_back', 'police_certificate'];
  for (let imageName of imagesNames) {
    if (req.body[imageName]) {
      const { fileName } = uploadImage(req.body[imageName], 'employees');
      req.body[imageName] = fileName;
    }
    //if there was a cnic_front file name in DB and then update request had
    //no cnic_front, then we will keep old filename in DB intact.
  }

  //Checking if resume is a PDF file
  if (req.body.resume) {
    let headerBytes = req.body.resume.split(',')[1].slice(0, 5); //first five characters
    if (headerBytes !== 'JVBER') {
      return next(new AppError("Resume is not a valid PDF file.", 422));
    }
    else {
      let fileData = req.body.resume.split(',')[1];
      const fileName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      let file = path.join(__dirname, `../uploads/employees/${fileName}.pdf`);
      const promise = writeFile(file, fileData, 'base64');
      try {
        await promise;
        req.body.resume = fileName + '.pdf';
      }
      catch (error) {
        throw new Error("Error while saving the file to disk");
      }
    }
  }

  //If an employee resigns or is terminated, then mark his document in Users collection as isActive false. Then Employee wouldn't be able to login.
  const existingUser = await User.findOne({ email: existingEmployee.email }); //not using isActive: true. It is possible that earlier status was set as resigned then later as terminated
  existingUser.role_slug = req.body.role_slug; //updating in case it has changed
  existingUser.role = role._id;
  if (req.body.employment_status === 2 || req.body.employment_status === 3) {
    existingUser.isActive = false;
  }
  else {
    existingUser.isActive = true;
  }

  await existingUser.save();
  const updatedEmployee = await Employee.findOneAndUpdate(
    { _id: existingEmployee._id, isActive: true },
    req.body,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Employee updated successfully",
    doc: updatedEmployee,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  //WhatIf: If an employee is deleted, what to do with his open tasks?
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422));
  }
  const employee = await Employee.findOne({ _id: req.params.id, isActive: true });
  if (!employee) {
    return next(new AppError("Employee not found!", 404));
  }

  await User.findOneAndUpdate({ email: employee.email }, { isActive: false });
  await Employee.findOneAndUpdate({ _id: req.params.id, isActive: true }, { isActive: false });

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee deleted successfully.',
    doc: null
  });
});