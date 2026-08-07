const mongoose = require('mongoose');
const Joi = require('joi');
const Employee = require('../models/employeeModel');
const EmployeeTask = require('../models/employeeTaskModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const { uploadDataFile, deleteDataFile } = require('../utils/uploadFiles');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require('../utils/db');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  createEmployeeTaskValidationSchema,
  updateEmployeeTaskValidationSchema,
  fileAttachmentValidationSchema,
} = require('../validations/employeeTaskValidation');
const { PREFIX_EMPLOYEE_TASK_AUTOINCREMENTID } = require('../constants/app.constants');

const logger = require('../logger')('EMPLOYEE_TASK_CONTROLLER');

const popObj = [
  { path: 'supervisor', select: 'fullName customId department company' },
  { path: 'employeeIDs', select: 'fullName customId department company' },
  { path: 'subtasks.employeeID', select: 'fullName customId' },
  { path: 'comments.employeeID', select: 'fullName customId' },
  { path: 'createdBy', select: 'username image email -_id' },
];

// Helper: validate all employee IDs and supervisor exist and are active
const validateEmployees = async (employeeIDs, supervisorId) => {
  const allIds = [...employeeIDs];
  if (supervisorId) allIds.push(supervisorId);

  const employees = await Employee.find({
    _id: { $in: allIds },
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] },
  });

  const foundIds = employees.map((e) => e._id.toString());

  for (const id of employeeIDs) {
    if (!foundIds.includes(id.toString())) {
      throw new AppError(`Employee ${id} not found or inactive`, 404);
    }
  }

  if (supervisorId && !foundIds.includes(supervisorId.toString())) {
    throw new AppError('Supervisor not found or inactive', 404);
  }

  return employees;
};

// ==================== CREATE ====================
exports.create = catchAsync(async (req, res, next) => {
  const { error } = createEmployeeTaskValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  await validateEmployees(req.body.employeeIDs, req.body.supervisor);

  // Validate subtask employees
  if (req.body.subtasks && req.body.subtasks.length > 0) {
    const subtaskEmployeeIds = req.body.subtasks.map(st => st.employeeID);
    await validateEmployees(subtaskEmployeeIds);

    const mainEmployeeIdStrings = req.body.employeeIDs.map(id => id.toString());
    for (const subtaskEmpId of subtaskEmployeeIds) {
      if (!mainEmployeeIdStrings.includes(subtaskEmpId.toString())) {
        return next(new AppError(
          `Subtask employee ${subtaskEmpId} must be part of the main task assignees`,
          403
        ));
      }
    }
  }

  // HYBRID DUPLICATE CHECK
  // Step 1: Exact match within 24 hours (accidental double-submit)
  const recentExactDuplicate = await EmployeeTask.findOne({
    taskTitle: req.body.taskTitle,
    supervisor: req.body.supervisor,
    status: 'active',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    taskStartByDate: req.body.taskStartByDate,
    taskFinishByDate: req.body.taskFinishByDate,
  });

  if (recentExactDuplicate) {
    return next(new AppError(
      'A task with the same title, supervisor, and dates was created recently. Please check and try again.',
      409
    ));
  }

  // Step 2: Same title + supervisor + overlapping date range (any time)
  const overlappingTask = await EmployeeTask.findOne({
    taskTitle: req.body.taskTitle,
    supervisor: req.body.supervisor,
    status: 'active',
    $or: [
      // New task starts during existing task
      { taskStartByDate: { $lte: req.body.taskStartByDate }, taskFinishByDate: { $gte: req.body.taskStartByDate } },
      // New task ends during existing task
      { taskStartByDate: { $lte: req.body.taskFinishByDate }, taskFinishByDate: { $gte: req.body.taskFinishByDate } },
      // New task completely covers existing task
      { taskStartByDate: { $gte: req.body.taskStartByDate }, taskFinishByDate: { $lte: req.body.taskFinishByDate } },
    ],
  });

  if (overlappingTask) {
    return next(new AppError(
      'A task with the same title and supervisor already exists in this date range.',
      409
    ));
  }

  // Generate IDs
  const newIDNumber = await getNextInSequence('employeeTasks');
  const longAutoIncrementId = getLongAutoIncrementId(
    PREFIX_EMPLOYEE_TASK_AUTOINCREMENTID || 'ETSK',
    newIDNumber
  );

  const task = await EmployeeTask.create({
    ...req.body,
    autoIncrementId: newIDNumber,
    longAutoIncrementId,
    createdBy: req.user._id,
  });

  // Notifications...
  const populatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 201, logger, {
    message: 'Employee task created successfully.',
    doc: populatedTask,
  });
});

// ==================== ADMIN: Get all tasks ====================
exports.getAll = catchAsync(async (req, res, next) => {
  const query = { status: 'active' };
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const tasks = await EmployeeTask.find(query)
    .limit(req.query.skip === 'no' ? 0 : pageSize)
    .skip(req.query.skip === 'no' ? 0 : pageSize * (page - 1))
    .populate(popObj)
    .sort({ createdAt: -1 });

  const docsCount = await EmployeeTask.countDocuments(query);

  sendSuccessResponse(res, 200, logger, {
    message: 'Tasks fetched successfully',
    docs: tasks,
    page,
    pages: Math.ceil(docsCount / pageSize),
    docsCount,
  });
});

// ==================== ADMIN: Get all tasks of a specific employee ====================
exports.getAllOfEmployee = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid employee ID', 422));
  }

  const employee = await Employee.findOne({
    _id: req.params.id,
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] },
  });
  if (!employee) return next(new AppError('Employee not found', 404));

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const query = { employeeIDs: req.params.id, status: 'active' };

  const tasks = await EmployeeTask.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate(popObj)
    .sort({ createdAt: -1 });

  const docsCount = await EmployeeTask.countDocuments(query);
  const pendingTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 'pending' });
  const finishedTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 'completed' });
  const percentTasksFinished = docsCount > 0 ? (finishedTasksCount / docsCount) * 100 : 0;

  sendSuccessResponse(res, 200, logger, {
    message: 'Employee tasks fetched',
    docs: tasks,
    page,
    pages: Math.ceil(docsCount / pageSize),
    docsCount,
    pendingTasksCount,
    finishedTasksCount,
    percentTasksFinished,
  });
});

// ==================== EMPLOYEE: My tasks ====================
exports.myTasks = catchAsync(async (req, res, next) => {
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked to your account', 403));
  }

  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const query = { employeeIDs: req.user.employee_id, status: 'active' };

  const tasks = await EmployeeTask.find(query)
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .populate(popObj)
    .sort({ createdAt: -1 });

  const docsCount = await EmployeeTask.countDocuments(query);
  const pendingTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 'pending' });
  const finishedTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 'completed' });
  const percentTasksFinished = docsCount > 0 ? (finishedTasksCount / docsCount) * 100 : 0;

  sendSuccessResponse(res, 200, logger, {
    message: 'Your tasks fetched successfully',
    docs: tasks,
    page,
    pages: Math.ceil(docsCount / pageSize),
    docsCount,
    pendingTasksCount,
    finishedTasksCount,
    percentTasksFinished,
  });
});

// ==================== Get single task ====================
exports.getOne = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const task = await EmployeeTask.findOne({
    _id: req.params.id,
    status: 'active',
  }).populate(popObj);

  if (!task) return next(new AppError('Task not found', 404));

  sendSuccessResponse(res, 200, logger, {
    message: 'Task found',
    doc: task,
  });
});

// ==================== ADMIN: Update task details ====================
exports.update = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const { error } = updateEmployeeTaskValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const existingTask = await EmployeeTask.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!existingTask) return next(new AppError('Task not found', 404));

  // Determine final employee IDs and supervisor
  const finalEmployeeIDs = req.body.employeeIDs || existingTask.employeeIDs;
  const finalSupervisor = req.body.supervisor || existingTask.supervisor;

  // Validate main employees and supervisor if changed
  if (req.body.employeeIDs || req.body.supervisor) {
    await validateEmployees(finalEmployeeIDs, finalSupervisor);
  }

  // Validate subtask employees if subtasks provided
  if (req.body.subtasks && req.body.subtasks.length > 0) {
    const subtaskEmployeeIds = req.body.subtasks.map(st => st.employeeID);

    // Check all subtask employees exist and are active
    await validateEmployees(subtaskEmployeeIds);

    // Check all subtask employees are in the main employeeIDs array
    const mainEmployeeIdStrings = finalEmployeeIDs.map(id => id.toString());
    for (const subtaskEmpId of subtaskEmployeeIds) {
      if (!mainEmployeeIdStrings.includes(subtaskEmpId.toString())) {
        return next(new AppError(
          `Subtask employee ${subtaskEmpId} must be part of the main task assignees`,
          403
        ));
      }
    }
  }

  // DUPLICATE CHECK FOR UPDATE
  if (req.body.taskTitle || req.body.supervisor || req.body.taskStartByDate || req.body.taskFinishByDate) {
    const finalTitle = req.body.taskTitle || existingTask.taskTitle;
    const finalSupervisor = req.body.supervisor || existingTask.supervisor;
    const finalStartDate = req.body.taskStartByDate || existingTask.taskStartByDate;
    const finalFinishDate = req.body.taskFinishByDate || existingTask.taskFinishByDate;

    const overlappingTask = await EmployeeTask.findOne({
      _id: { $ne: req.params.id }, // Exclude current task
      taskTitle: finalTitle,
      supervisor: finalSupervisor,
      status: 'active',
      $or: [
        { taskStartByDate: { $lte: finalStartDate }, taskFinishByDate: { $gte: finalStartDate } },
        { taskStartByDate: { $lte: finalFinishDate }, taskFinishByDate: { $gte: finalFinishDate } },
        { taskStartByDate: { $gte: finalStartDate }, taskFinishByDate: { $lte: finalFinishDate } },
      ],
    });

    if (overlappingTask) {
      return next(new AppError(
        'Another task with the same title and supervisor already exists in this date range.',
        409
      ));
    }
  }

  const updatedTask = await EmployeeTask.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate(popObj);

  // Notify if supervisor changed
  if (req.body.supervisor && req.body.supervisor !== existingTask.supervisor.toString()) {
    try {
      await EmployeeNotification.create({
        employee: updatedTask.supervisor._id,
        redirectPage: `employee-task/${updatedTask._id}`,
        message: `You have been made supervisor of the task "${updatedTask.taskTitle}".`,
      });
    } catch (err) {
      logger.error('Supervisor notification failed', err);
    }
  }

  // Notify assignees of update
  for (const emp of updatedTask.employeeIDs) {
    try {
      await EmployeeNotification.create({
        employee: emp._id || emp,
        redirectPage: `employee-task/${updatedTask._id}`,
        message: `Task "${updatedTask.taskTitle}" has been updated.`,
      });
    } catch (err) {
      logger.error('Employee notification failed', err);
    }
  }

  sendSuccessResponse(res, 200, logger, {
    message: 'Task updated successfully',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Update subtasks (bulk replace) ====================
exports.updateSubtasks = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const subtaskValidationSchema = Joi.object({
    subtaskTitle: Joi.string().required().messages({
      'any.required': 'Subtask title is required',
      'string.empty': 'Subtask title cannot be empty',
    }),
    subtaskDescription: Joi.string().optional().messages({
      'string.base': 'Subtask description must be a string',
    }),
    subtaskStatus: Joi.string().valid('pending', 'completed').required().messages({
      'any.required': 'Subtask status is required',
      'any.only': 'Subtask status must be either "pending" or "completed"',
    }),
    employeeID: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'any.required': 'Employee ID is required for subtask',
        'string.pattern.base': 'Invalid employee ID format',
      }),
  });

  const requestValidationSchema = Joi.object({
    subtasks: Joi.array().items(subtaskValidationSchema).min(1).required().messages({
      'array.min': 'At least one subtask is required',
      'any.required': 'Subtasks array is required',
    }),
  });

  const { error, value } = requestValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const existingTask = await EmployeeTask.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!existingTask) return next(new AppError('Task not found', 404));

  // Validate subtask employees exist and are part of main task
  const subtaskEmployeeIds = value.subtasks.map(st => st.employeeID);
  await validateEmployees(subtaskEmployeeIds);

  for (const subtask of value.subtasks) {
    if (!existingTask.employeeIDs.some((eid) => eid.toString() === subtask.employeeID)) {
      return next(new AppError('All subtask assignees must be part of the main task', 403));
    }
  }

  const updatedTask = await EmployeeTask.findByIdAndUpdate(
    req.params.id,
    { subtasks: value.subtasks },
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtasks updated successfully',
    doc: updatedTask,
  });
});

// ==================== EMPLOYEE/ADMIN: Add comment ====================
exports.addComment = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }

  const schema = Joi.object({
    content: Joi.string().required().messages({
      'any.required': 'Comment content is required',
      'string.empty': 'Comment content cannot be empty',
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  task.comments.push({ content: value.content, employeeID: req.user.employee_id });
  await task.save();

  const updatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Comment added successfully',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Add single subtask ====================
exports.addNewSubtask = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const subtaskValidationSchema = Joi.object({
    subtaskTitle: Joi.string().required().messages({
      'any.required': 'Subtask title is required',
      'string.empty': 'Subtask title cannot be empty',
    }),
    subtaskDescription: Joi.string().optional().messages({
      'string.base': 'Subtask description must be a string',
    }),
    employeeID: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'any.required': 'Employee ID is required for subtask',
        'string.pattern.base': 'Invalid employee ID format',
      }),
  });

  const { error, value } = subtaskValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  // Validate employee exists and is part of main task
  await validateEmployees([value.employeeID]);

  if (!task.employeeIDs.some((eid) => eid.toString() === value.employeeID)) {
    return next(new AppError('Subtask employee must be part of the main task assignees', 403));
  }

  task.subtasks.push(value);
  await task.save();

  const updatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask added successfully',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Add attachment ====================
exports.addAttachment = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const { error, value } = fileAttachmentValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  const fileBytes = value.fileAsDataURL.split(',')[1];
  const fileNameOnServerDisk = await uploadDataFile(fileBytes, 'employees', value.clientFileName);

  task.attachments.push({
    clientFileName: value.clientFileName,
    fileNameOnServerDisk,
  });
  await task.save();

  const updatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Attachment added successfully',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Delete attachment ====================
exports.deleteAttachment = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    employeeTaskObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    fileObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    fileNameOnServerDisk: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);

  if (error) return next(new AppError(error.details[0].message, 400));
  const task = await EmployeeTask.findOne({
    _id: value.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));

  await EmployeeTask.findOneAndUpdate(
    { 'attachments._id': value.fileObjectId },
    { $pull: { attachments: { _id: value.fileObjectId } } },
    { new: true }
  );

  await deleteDataFile('employees', value.fileNameOnServerDisk);

  const updatedTask = await EmployeeTask.findById(value.employeeTaskObjectId).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Attachment deleted successfully',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Delete subtask ====================
exports.deleteSubtask = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    employeeTaskObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'any.required': 'Task ID is required',
      'string.pattern.base': 'Invalid task ID format',
    }),
    subTaskObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'any.required': 'Subtask ID is required',
      'string.pattern.base': 'Invalid subtask ID format',
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({
    _id: value.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));

  // Check if subtask exists before deleting
  const subtaskExists = task.subtasks.some(
    (sub) => sub._id.toString() === value.subTaskObjectId
  );
  if (!subtaskExists) {
    return next(new AppError('Subtask not found in this task', 404));
  }

  const updatedTask = await EmployeeTask.findOneAndUpdate(
    { _id: value.employeeTaskObjectId, 'subtasks._id': value.subTaskObjectId },
    { $pull: { subtasks: { _id: value.subTaskObjectId } } },
    { new: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask deleted successfully',
    doc: updatedTask,
  });
});

// ==================== EMPLOYEE/ADMIN: Mark subtask as complete ====================
exports.updateSubtaskStatus = catchAsync(async (req, res, next) => {
  const schema = Joi.object({
    employeeTaskObjectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    subtaskObjectID: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({
    _id: value.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));
  console.log(value);
  console.log(task);

  // check subtask exist before updating
  const subtaskExists = task.subtasks.some(
    (sub) => sub._id.toString() === value.subtaskObjectID
  );
  if (!subtaskExists) {
    return next(new AppError('Subtask not found in this task', 404));
  }

  // Check ownership
  let isOwner = false;
  if (req.user.employee_id) {
    for (const subtask of task.subtasks) {
      if (
        subtask._id.toString() === value.subtaskObjectID &&
        subtask.employeeID.toString() === req.user.employee_id.toString()
      ) {
        isOwner = true;
        break;
      }
    }
  }

  if (!isOwner && !(req.user.isSuperAdmin || req.user.isAdmin)) {
    return next(new AppError('You are not allowed to perform this action', 403));
  }

  const updatedTask = await EmployeeTask.findOneAndUpdate(
    { _id: value.employeeTaskObjectId, 'subtasks._id': value.subtaskObjectID },
    { $set: { 'subtasks.$.subtaskStatus': 'completed' } },
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask marked as completed',
    doc: updatedTask,
  });
});

// ==================== ADMIN: Soft delete ====================
exports.delete = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  task.status = 'deleted';
  await task.save();

  sendSuccessResponse(res, 200, logger, {
    message: 'Task deleted successfully',
    doc: null,
  });
});