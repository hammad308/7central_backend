const Role = require('../models/roleModel');
const logger = require('../logger')('ROLE_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const roleValidationSchema = require('../validations/roleValidation');

const popObj = [];

// Helper to generate slug from name
const slugify = (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = roleValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // If no slug provided, generate from name
  if (!req.body.slug) {
    req.body.slug = slugify(req.body.name);
  }

  // Check duplicate name or slug
  const duplicate = await Role.findOne({
    $or: [{ name: req.body.name }, { slug: req.body.slug }],
  });
  if (duplicate) {
    return next(new AppError('Role name or slug already exists.', 422));
  }

  const role = await Role.create(req.body);

  sendSuccessResponse(res, 201, logger, {
    message: 'Role created successfully.',
    doc: role,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  handlerFactory.getAll(Role, popObj, logger, {})(req, res, next);
});

exports.getOne = handlerFactory.getOne(Role, popObj, logger);

exports.update = catchAsync(async (req, res, next) => {
  const { error } = roleValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const role = await Role.findById(req.params.id);
  if (!role) return next(new AppError('Role not found.', 404));

  if (req.body.name && req.body.name !== role.name) {
    const duplicateName = await Role.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
    if (duplicateName) return next(new AppError('Role name already exists.', 422));
  }

  if (req.body.slug) {
    const duplicateSlug = await Role.findOne({ slug: req.body.slug, _id: { $ne: req.params.id } });
    if (duplicateSlug) return next(new AppError('Role slug already exists.', 422));
  } else if (req.body.name && req.body.name !== role.name) {
    // Auto‑generate slug from new name if slug not provided
    req.body.slug = slugify(req.body.name);
  }

  const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendSuccessResponse(res, 200, logger, {
    message: 'Role updated successfully.',
    doc: updatedRole,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  const role = await Role.findById(req.params.id);
  if (!role) return next(new AppError('Role not found.', 404));

  // prevent deletion if any employee has this role
  const Employee = require('../models/employeeModel');
  const count = await Employee.countDocuments({ role: role._id, status: { $ne: 'deleted' } })
  if (count > 0) return next(new AppError('Cannot delete role assigned to employees.', 403));

  await Role.findByIdAndDelete(req.params.id);

  sendSuccessResponse(res, 200, logger, {
    message: 'Role deleted successfully.',
    doc: null,
  });
});