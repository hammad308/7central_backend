const Company = require('../models/companyModel');
const Department = require('../models/departmentModel');
const logger = require('../logger')('COMPANY_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const companyValidationSchema = require('../validations/companyValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_COMPANY_AUTOINCREMENTID } = require('../constants/app.constants'); // you'll need to add this constant

const popObj = [
  {
    path: 'createdBy',
    select: 'username image email -_id',
  },
];

// Create a new company
exports.create = catchAsync(async (req, res, next) => {
  // Validate
  const { error } = companyValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  // Check duplicate name (including soft‑deleted)
  const duplicate = await Company.findOne({ name: req.body.name });
  if (duplicate) {
    return next(new AppError('Company name already exists.', 422));
  }

  // Prepare document
  req.body.createdBy = req.user._id;

  const company = await Company.create(req.body);

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('companies');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_COMPANY_AUTOINCREMENTID,
    newIDNumber
  );
  company.autoIncrementId = newIDNumber;
  company.longAutoIncrementId = longAutoIncrementId;
  await company.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Company created successfully.',
    doc: company,
  });
});

// Get all companies (using factory)
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: { $ne: 'deleted' } }; // hide soft‑deleted
  handlerFactory.getAll(Company, popObj, logger, query)(req, res, next);
});

// Get single company
exports.getOne = handlerFactory.getOne(Company, popObj, logger);

// Update a company
exports.update = catchAsync(async (req, res, next) => {
  // Validate
  const { error } = companyValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 400));
  }

  const company = await Company.findOne({
    _id: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (!company) {
    return next(new AppError('Company not found.', 404));
  }

  // Check duplicate name (excluding itself)
  if (req.body.name && req.body.name !== company.name) {
    const duplicate = await Company.findOne({
      name: req.body.name,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return next(new AppError('Company name already taken.', 422));
    }
  }

  const updatedCompany = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 200, logger, {
    message: 'Company updated successfully.',
    doc: updatedCompany,
  });
});

// Delete (soft) – with dependency check
exports.delete = catchAsync(async (req, res, next) => {
  const company = await Company.findOne({
    _id: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (!company) {
    return next(new AppError('Company not found.', 404));
  }

  // Block deletion if active departments exist
  const departments = await Department.countDocuments({
    company: req.params.id,
    status: { $ne: 'deleted' },
  });
  if (departments > 0) {
    return next(
      new AppError(
        'Cannot delete company with active departments. Delete departments first.',
        403
      )
    );
  }

  company.status = 'deleted';
  await company.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Company deleted successfully.',
    doc: company,
  });
});