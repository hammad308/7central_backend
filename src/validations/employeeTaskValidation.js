const Joi = require('joi');

const fileAttachmentValidationSchema = Joi.object({
  clientFileName: Joi.string().required(),
  fileAsBase64: Joi.string().optional(),
  fileNameOnServerDisk: Joi.string().optional(),
  _id: Joi.string().optional(),
});

const subtaskValidationSchema = Joi.object({
  subtaskTitle: Joi.string().required(),
  subtaskDescription: Joi.string().allow('').required(),
  subtaskStatus: Joi.number().valid(0, 1).required(),
  employeeID: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid employee ID in subtask' }),
});

const createEmployeeTaskValidationSchema = Joi.object({
  employeeIDs: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .required()
    .messages({
      'array.min': 'Task should be assigned to at least one employee',
      'any.required': 'Employee IDs are required',
    }),
  supervisor: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Supervisor ID is required',
      'string.pattern.base': 'Invalid supervisor ID',
    }),
  taskTitle: Joi.string().required().messages({
    'any.required': 'Task title is required',
    'string.empty': 'Task title cannot be empty',
  }),
  taskDescription: Joi.string().allow('').optional(),
  taskStartByDate: Joi.date().iso().required().messages({
    'any.required': 'Task start by date is required',
  }),
  taskFinishByDate: Joi.date().iso().min(Joi.ref('taskStartByDate')).required().messages({
    'any.required': 'Task finish by date is required',
    'date.min': 'Finish date must be after start date',
  }),
  taskActualFinishDate: Joi.date().iso().allow(null, '').optional(),
  taskStatus: Joi.number().valid(0, 1).required().messages({
    'any.required': 'Task status is required',
  }),
  taskPriority: Joi.number().valid(0, 1, 2, 3).required().messages({
    'any.required': 'Task priority is required',
  }),
  subtasks: Joi.array().items(subtaskValidationSchema).optional(),
  attachments: Joi.array().items(fileAttachmentValidationSchema).optional(),
});

const updateEmployeeTaskValidationSchema = Joi.object({
  employeeIDs: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .optional()
    .messages({ 'array.min': 'Task should be assigned to at least one employee' }),
  supervisor: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid supervisor ID' }),
  taskTitle: Joi.string().optional().messages({
    'string.empty': 'Task title cannot be empty',
  }),
  taskDescription: Joi.string().allow('').optional(),
  taskStartByDate: Joi.date().iso().optional(),
  taskFinishByDate: Joi.date().iso().min(Joi.ref('taskStartByDate')).optional().messages({
    'date.min': 'Finish date must be after start date',
  }),
  taskActualFinishDate: Joi.date().iso().allow(null, '').optional(),
  taskStatus: Joi.number().valid(0, 1).optional(),
  taskPriority: Joi.number().valid(0, 1, 2, 3).optional(),
  subtasks: Joi.array().items(subtaskValidationSchema).optional(),
  attachments: Joi.array().items(fileAttachmentValidationSchema).optional(),
});

module.exports = {
  createEmployeeTaskValidationSchema,
  updateEmployeeTaskValidationSchema,
};