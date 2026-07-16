const mongoose = require("mongoose");
const Role = require("../models/role.js");
const LeaveRule = require("../models/leaveRule.js");
const leaveRuleValidationSchema = require("../validations/leaveRuleValidationSchema.js");
const { findOneDocument } = require("../utils/findDocuments.js");
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const catchAsync = require('../utils/catchAsync');
const logger = require('../logger')('LEAVERULE_CONTROLLER');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');

exports.create = catchAsync(async (req, res, next) => {
  const { error } = leaveRuleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const role = await Role.findOne({ _id: req.body.roleID, isActive: true });
  if (!role) {
    return next(new AppError("Invalid role ID!", 422)); //early return
  }

  //Checking if leave rule for the given role ID already exists

  const existingLeaveRule = await LeaveRule.findOne(
    { roleID: req.body.roleID, isActive: true }
  );

  if (existingLeaveRule) {
    return next(new AppError("Leave rules for the given role already exist.", 403)); //early return
  }

  const newLeaveRule = await LeaveRule.create({ ...req.body });
  const newIDNumber = await getNextInSequence("leaverules");
  newLeaveRule.leaveRuleID = newIDNumber;
  await newLeaveRule.save();

  sendSuccessResponse(res, 200, logger, {
    message: "New leave rules created successfully",
    doc: newLeaveRule,
  });
});

exports.getAll = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const leaveRules = await LeaveRule.find({ isActive: true })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate([
      {
        path: 'roleID'
      }
    ])
    .exec();
  const docsCount = await LeaveRule.countDocuments({ isActive: true });

  sendSuccessResponse(res, 200, logger, {
    message: "List of leave rules retrieved successfully.",
    docs: leaveRules,
    docsCount: docsCount
  });
});

exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return

  }

  const leaveRule = await LeaveRule.findOne({ _id: req.params.id, isActive: true })
    .populate([
      {
        path: 'roleID'
      }
    ])
    .exec();

  if (!leaveRule) {
    return next(new AppError("Leave Rule not found!", 404))
  }
  sendSuccessResponse(res, 200, logger, {
    message: "Leave Rule found!",
    doc: leaveRule,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  const { error } = leaveRuleValidationSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, 422)); // early return 
  }

  const existingLeaveRule = await LeaveRule.findOne({ _id: req.params.id, isActive: true });
  if (!existingLeaveRule) {
    return next(new AppError("Invalid ID!", 422)); //early return

  }

  if (existingLeaveRule.roleID.toString() !== req.body.roleID) {
    // User changed the role
    const duplicateLeaveRule = await LeaveRule.findOne({ roleID: req.body.roleID, isActive: true });
    if (duplicateLeaveRule) {
      return next(new AppError("Leave rules for the given role already exists", 403)); //early return
    }
  }

  const role = await findOneDocument(Role, req.body.roleID);
  if (!role) {
    return next(new AppError("Invalid role ID!", 422)); //early return

  }

  const updatedLeaveRule = await LeaveRule.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    { ...req.body },
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, 200, logger, {
    message: "Leave rules updated successfully",
    doc: updatedLeaveRule,
  });
});

exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid ID!", 422)); //early return
  }

  const leaveRule = await LeaveRule.findOne({ _id: req.params.id, isActive: true });
  if (!leaveRule) {
    return next(new AppError("Leave Rule not found!", 404))
  }

  leaveRule.isActive = false;
  await leaveRule.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Leave rule deleted successfully.',
    doc: null
  });
});
