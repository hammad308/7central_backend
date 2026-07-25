const mongoose = require('mongoose');
const Role = require('../models/roleModel');
const LeaveRule = require('../models/leaveRuleModel');
const logger = require('../logger')('LEAVE_RULE_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const leaveRuleValidationSchema = require('../validations/leaveRuleValidation');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_LEAVERULE_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
  { path: 'role', select: 'name slug' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Create a new leave rule for a role
exports.create = catchAsync(async (req, res, next) => {
  const { error } = leaveRuleValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  // Check role exists
  const role = await Role.findById(req.body.role);
  if (!role) return next(new AppError('Role not found', 404));

  // Ensure one leave rule per role (including soft-deleted)
  const existing = await LeaveRule.findOne({ role: req.body.role });
  if (existing) {
    return next(new AppError('Leave rules for this role already exist', 422));
  }

  const rule = await LeaveRule.create({
    ...req.body,
    createdBy: req.user._id,
  });

  // Generate auto‑increment IDs
  const newIDNumber = await getNextInSequence('leaveRules');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_LEAVERULE_AUTOINCREMENTID,
    newIDNumber
  );
  rule.autoIncrementId = newIDNumber;
  rule.longAutoIncrementId = longAutoIncrementId;
  await rule.save();

  sendSuccessResponse(res, 201, logger, {
    message: 'Leave rules created successfully',
    doc: rule,
  });
});

// Get all leave rules
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  handlerFactory.getAll(LeaveRule, popObj, logger, query)(req, res, next);
});

// Get single leave rule
exports.getOne = handlerFactory.getOne(LeaveRule, popObj, logger);

// Update leave rule
exports.update = catchAsync(async (req, res, next) => {
  const { error } = leaveRuleValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const rule = await LeaveRule.findOne({ _id: req.params.id, status: 'active' });
  if (!rule) return next(new AppError('Leave rule not found', 404));

  // If role is changed, check duplication
  if (req.body.role && req.body.role !== rule.role.toString()) {
    const duplicate = await LeaveRule.findOne({ role: req.body.role });
    if (duplicate) return next(new AppError('Leave rules for the new role already exist', 422));
  }

  const updatedRule = await LeaveRule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave rules updated successfully',
    doc: updatedRule,
  });
});

// Soft delete
exports.delete = catchAsync(async (req, res, next) => {
  const rule = await LeaveRule.findOne({ _id: req.params.id, status: 'active' });
  if (!rule) return next(new AppError('Leave rule not found', 404));

  rule.status = 'deleted';
  await rule.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave rule deleted successfully',
    doc: rule,
  });
});