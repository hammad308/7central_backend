const logger = require('../logger')('CUSTOMER_CONTROLLER');
const mongoose = require("mongoose");
const companyValidationSchema = require("../validations/companyValidationSchema.js");
const Company = require("../models/company.js");
const catchAsync = require('../utils/catchAsync');
const Department = require("../models/department.js");
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const AppError = require("../utils/appError.js");

exports.create = catchAsync(async (req, res, next) => {
  const { error } = companyValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  // Also Handling Deleted Company Entity by searching through whole collection irrespective of isActive true or false
  const existingCompany = await Company.findOne({ name: req.body.company_name });
  if (existingCompany) {
    return next(new AppError("Company Name Already Taken. Please Choose Another Name", 422));
  }
  const newCompany = await Company.create({
    name: req.body.company_name,
  });
  sendSuccessResponse(res, 201, logger, {
    message: "Company created successfully!",
    doc: newCompany
  })
});

exports.getAll = catchAsync(async (req, res, next) => {
  //Assumption: companies are less than 25. We don't need pagination.
  try {
    const companies = await Company.find({ isActive: true });
    const docsCount = await Company.countDocuments({ isActive: true });
    sendSuccessResponse(res, 200, {
      docs: companies,
      docsCount: docsCount
    });
  }
  catch (error) {
    console.log(error);
    next(new AppError("Database read operation failed!", 500));
  }
});
exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID", 400))
  }
  const company = await Company.findOne({ _id: req.params.id, isActive: true });
  if (!company) {
    return next(new AppError("Company Not Found", 404));
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Company found!",
    doc: company,
  });
}
);

exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID", 400));
  }
  const { error } = companyValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }
  const company = await Company.findOne({ _id: req.params.id, isActive: true });
  if (!company) {
    return next(new AppError("Company Not Found", 404));
  }
  // const existingCompany = await Company.findOne({ name: req.body.company_name, _id:{
  //   $ne:req.params._id
  // } });
  // if (existingCompany) {
  //   return next(new AppError("Company Name Already Taken. Please Choose Another Name", 422));
  // }
  const updatedCompany = await Company.findOneAndUpdate({ _id: req.params.id, isActive: true }, { name: req.body.company_name }, { new: true, runValidators: true });
  sendSuccessResponse(res, 200, logger, {
    message: "Company updated successfully",
    doc: updatedCompany,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    sendErrorResponse(res, 422, {
      message: "Invalid ID!",
      doc: null
    });
    return; //early return
  }
  try {
    const company = await Company.findOne({ _id: req.params.id, isActive: true });
    if (!company) {
      sendErrorResponse(res, 404, {
        message: "Company not found!",
        doc: null
      });
    }
    //Checking if at least one department exists for this company
    //Don't delete if company has at least one department.
    const departments = await Department.find({ company_id: req.params.id, isActive: true });
    if (departments.length > 0) {
      sendErrorResponse(res, 403, {
        message: "Company has at least one department. Delete departments first!",
        doc: null
      });
    }
    await Company.findOneAndUpdate({ _id: req.params.id, isActive: true }, { isActive: false }, { new: true, runValidators: true });
    sendSuccessResponse(res, 200, {
      message: 'Company deleted successfully.',
      doc: null
    });
  }
  catch (error) {
    console.log(error);
    next(error);
  }
});
