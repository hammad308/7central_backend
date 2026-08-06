const mongoose = require('mongoose');
const Joi = require('joi');
const Employee = require('../models/employeeModel');
const EmployeeTask = require('../models/employeeTaskModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const { uploadDataFile, deleteDataFile } = require('../utils/uploadImage');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require('../utils/db');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  createEmployeeTaskValidationSchema,
  updateEmployeeTaskValidationSchema,
} = require('../validations/employeeTaskValidation');
const { PREFIX_EMPLOYEE_TASK_AUTOINCREMENTID } = require('../constants/app.constants'); // add this constant if missing, or use a default string

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
  // Check all employee IDs
  const employees = await Employee.find({
    _id: { $in: [...employeeIDs, supervisorId] },
    status: { $nin: ['deleted', 'inactive'] },
    employmentStatus: { $nin: ['terminated', 'resigned'] },
  });

  const foundIds = employees.map((e) => e._id.toString());

  for (const id of employeeIDs) {
    if (!foundIds.includes(id.toString())) {
      throw new AppError(`Employee ${id} not found or inactive`, 404);
    }
  }

  if (!foundIds.includes(supervisorId.toString())) {
    throw new AppError('Supervisor not found or inactive', 404);
  }

  return employees;
};

// CREATE – admin creates a task
exports.create = catchAsync(async (req, res, next) => {
  const { error } = createEmployeeTaskValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  await validateEmployees(req.body.employeeIDs, req.body.supervisor);

  // Duplicate check: same title + supervisor + overlapping date range within 24 hours
  const recentDuplicate = await EmployeeTask.findOne({
    taskTitle: req.body.taskTitle,
    supervisor: req.body.supervisor,
    status: 'active',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    taskStartByDate: req.body.taskStartByDate,
    taskFinishByDate: req.body.taskFinishByDate,
  });

  if (recentDuplicate) {
    return next(new AppError('A similar task already exists. Please check and try again.', 409));
  }

  // Generate IDs before create (single write)
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

  // Notify supervisor
  try {
    await EmployeeNotification.create({
      employee: task.supervisor,
      redirectPage: `employee-tasks/${task._id}`,
      message: `You have been made supervisor of the new task "${task.taskTitle}".`,
    });
  } catch (err) {
    logger.error('Failed to send supervisor notification', err);
  }

  // Notify assignees
  for (const empId of task.employeeIDs) {
    try {
      await EmployeeNotification.create({
        employee: empId,
        redirectPage: `employee-tasks/${task._id}`,
        message: `You have been assigned a new task "${task.taskTitle}".`,
      });
    } catch (err) {
      logger.error('Failed to send employee notification', err);
    }
  }

  const populatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 201, logger, {
    message: 'Employee task created successfully.',
    doc: populatedTask,
  });
});

// ADMIN: Get all tasks
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

// ADMIN: Get all tasks of a specific employee
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
  const pendingTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 0 });
  const finishedTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 1 });
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

// EMPLOYEE: My tasks
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
  const pendingTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 0 });
  const finishedTasksCount = await EmployeeTask.countDocuments({ ...query, taskStatus: 1 });
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

// Get single task (admin & employee both use this – ownership check if needed)
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

// ADMIN: Update task details
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

  // If employees/supervisor provided, validate they exist
  if (req.body.employeeIDs || req.body.supervisor) {
    await validateEmployees(
      req.body.employeeIDs || existingTask.employeeIDs,
      req.body.supervisor || existingTask.supervisor
    );
  }

  const updatedTask = await EmployeeTask.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate(popObj);

  // Notify if supervisor changed
  if (req.body.supervisor && req.body.supervisor !== existingTask.supervisor.toString()) {
    try {
      await EmployeeNotification.create({
        employee: updatedTask.supervisor._id,
        redirectPage: `employee-tasks/${updatedTask._id}`,
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
        redirectPage: `employee-tasks/${updatedTask._id}`,
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

// ADMIN: Update subtasks (bulk replace)
exports.updateSubtasks = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const subtaskValidationSchema = Joi.object({
    subtaskTitle: Joi.string().required(),
    subtaskDescription: Joi.string().allow('').required(),
    subtaskStatus: Joi.number().valid(0, 1).required(),
    employeeID: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  });

  const requestValidationSchema = Joi.object({
    subtasks: Joi.array().items(subtaskValidationSchema).required(),
  });

  const { error, value } = requestValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const existingTask = await EmployeeTask.findOne({
    _id: req.params.id,
    status: 'active',
  });
  if (!existingTask) return next(new AppError('Task not found', 404));

  // Ensure all subtask assignees are part of the task
  for (const subtask of value.subtasks) {
    if (!existingTask.employeeIDs.some((eid) => eid.toString() === subtask.employeeID)) {
      return next(new AppError('All subtask assignees must be part of the main task', 403));
    }
  }

  const updatedTask = await EmployeeTask.findByIdAndUpdate(req.params.id, { subtasks: value.subtasks }, {
    new: true,
    runValidators: true,
  }).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtasks updated successfully',
    doc: updatedTask,
  });
});

// EMPLOYEE/ADMIN: Add comment
exports.addComment = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }
  if (!req.user.employee_id) {
    return next(new AppError('No employee profile linked', 403));
  }

  const schema = Joi.object({ content: Joi.string().required() });
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

// ADMIN: Add single subtask
exports.addNewSubtask = catchAsync(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError('Invalid task ID', 422));
  }

  const subtaskValidationSchema = Joi.object({
    subtaskTitle: Joi.string().required(),
    subtaskDescription: Joi.string().allow('').optional(),
    subtaskStatus: Joi.number().valid(0, 1).required(),
    employeeID: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  });

  const { error, value } = subtaskValidationSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  task.subtasks.push(value);
  await task.save();

  const updatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask added successfully',
    doc: updatedTask,
  });
});

// ADMIN: Add attachment
exports.addAttachment = catchAsync(async (req, res, next) => {
  const task = await EmployeeTask.findOne({ _id: req.params.id, status: 'active' });
  if (!task) return next(new AppError('Task not found', 404));

  const clientFileName = req.body.attachedFile.clientFileName;
  const fileBytes = req.body.attachedFile.fileAsDataURL.split(',')[1];
  const fileNameOnServerDisk = await uploadDataFile(fileBytes, 'employees', clientFileName);

  task.attachments.push({ clientFileName, fileNameOnServerDisk });
  await task.save();

  const updatedTask = await EmployeeTask.findById(task._id).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Attachment added successfully',
    doc: updatedTask,
  });
});

// ADMIN: Delete attachment
exports.deleteAttachment = catchAsync(async (req, res, next) => {
  const task = await EmployeeTask.findOne({
    _id: req.body.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));

  await EmployeeTask.findOneAndUpdate(
    { 'attachments._id': req.body.fileObjectId },
    { $pull: { attachments: { _id: req.body.fileObjectId } } },
    { new: true }
  );

  await deleteDataFile('employees', req.body.fileNameOnServerDisk);

  const updatedTask = await EmployeeTask.findById(req.body.employeeTaskObjectId).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Attachment deleted successfully',
    doc: updatedTask,
  });
});

// ADMIN: Delete subtask
exports.deleteSubtask = catchAsync(async (req, res, next) => {
  const task = await EmployeeTask.findOne({
    _id: req.body.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));

  await EmployeeTask.findOneAndUpdate(
    { 'subtasks._id': req.body.subTaskObjectId },
    { $pull: { subtasks: { _id: req.body.subTaskObjectId } } },
    { new: true }
  );

  const updatedTask = await EmployeeTask.findById(req.body.employeeTaskObjectId).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask deleted successfully',
    doc: updatedTask,
  });
});

// EMPLOYEE/ADMIN: Mark subtask as complete
exports.updateSubtaskStatus = catchAsync(async (req, res, next) => {
  const task = await EmployeeTask.findOne({
    _id: req.body.employeeTaskObjectId,
    status: 'active',
  });
  if (!task) return next(new AppError('Task not found', 404));

  // Check ownership
  let isOwner = false;
  if (req.user.employee_id) {
    for (const subtask of task.subtasks) {
      if (
        subtask._id.toString() === req.body.subtaskObjectID &&
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
    { _id: req.body.employeeTaskObjectId, 'subtasks._id': req.body.subtaskObjectID },
    { $set: { 'subtasks.$.subtaskStatus': 1 } },
    { new: true, runValidators: true }
  ).populate(popObj);

  sendSuccessResponse(res, 200, logger, {
    message: 'Subtask marked as completed',
    doc: updatedTask,
  });
});

// ADMIN: Soft delete
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