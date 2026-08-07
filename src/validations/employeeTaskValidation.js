const Joi = require('joi');

// ========== FILE ATTACHMENT VALIDATION ==========
const fileAttachmentValidationSchema = Joi.object({
  clientFileName: Joi.string()
    .required()
    .messages({
      'any.required': 'Client file name is required',
      'string.empty': 'Client file name cannot be empty',
    }),
  fileAsDataURL: Joi.string()
    .dataUri()
    .required()
    .messages({
      'any.required': 'File data is required',
      'string.dataUri': 'File must be a valid Data URL (e.g., data:application/pdf;base64,...)',
      'string.empty': 'File data cannot be empty',
    }),
});

// ========== SUBTASK VALIDATION ==========
const createSubtaskValidationSchema = Joi.object({
  subtaskTitle: Joi.string()
    .required()
    .messages({
      'any.required': 'Subtask title is required',
      'string.empty': 'Subtask title cannot be empty',
    }),
  subtaskDescription: Joi.string()
    .optional()
    .messages({
      'string.base': 'Subtask description must be a string',
    }),
  employeeID: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Employee ID is required for subtask',
      'string.pattern.base': 'Invalid employee ID format (must be 24 hex characters)',
      'string.empty': 'Employee ID cannot be empty',
    }),
});

const updateSubtaskValidationSchema = Joi.object({
  subtaskTitle: Joi.string()
    .required()
    .messages({
      'any.required': 'Subtask title is required',
      'string.empty': 'Subtask title cannot be empty',
    }),
  subtaskDescription: Joi.string()
    .optional()
    .messages({
      'string.base': 'Subtask description must be a string',
    }),
  employeeID: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Employee ID is required for subtask',
      'string.pattern.base': 'Invalid employee ID format (must be 24 hex characters)',
      'string.empty': 'Employee ID cannot be empty',
    }),
  subtaskStatus: Joi.string()
    .valid('pending', 'completed')
    .optional()
    .messages({
      'any.only': 'SubTask status must be either "pending" or "completed"',
    }),
});

// ========== CREATE EMPLOYEE TASK VALIDATION ==========
const createEmployeeTaskValidationSchema = Joi.object({
  employeeIDs: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Each employee ID must be a valid 24-character hex string',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Task must be assigned to at least one employee',
      'any.required': 'Employee IDs are required',
      'array.base': 'Employee IDs must be an array',
    }),
  supervisor: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Supervisor ID is required',
      'string.pattern.base': 'Invalid supervisor ID format (must be 24 hex characters)',
      'string.empty': 'Supervisor ID cannot be empty',
    }),
  taskTitle: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'any.required': 'Task title is required',
      'string.empty': 'Task title cannot be empty',
      'string.min': 'Task title must be at least 1 character',
      'string.max': 'Task title cannot exceed 200 characters',
    }),
  taskDescription: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.base': 'Task description must be a string',
      'string.max': 'Task description cannot exceed 2000 characters',
    }),
  taskStartByDate: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'Task start date is required',
      'date.format': 'Task start date must be a valid ISO date',
      'date.base': 'Task start date must be a valid date',
    }),
  taskFinishByDate: Joi.date()
    .iso()
    .min(Joi.ref('taskStartByDate'))
    .required()
    .messages({
      'any.required': 'Task finish date is required',
      'date.format': 'Task finish date must be a valid ISO date',
      'date.base': 'Task finish date must be a valid date',
      'date.min': 'Finish date must be after or equal to start date',
    }),
  taskActualFinishDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Task actual finish date must be a valid ISO date',
      'date.base': 'Task actual finish date must be a valid date',
    }),
  taskPriority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .required()
    .messages({
      'any.required': 'Task priority is required',
      'any.only': 'Task priority must be one of: low, normal, high, urgent',
    }),
  subtasks: Joi.array()
    .items(createSubtaskValidationSchema)
    .optional()
    .messages({
      'array.base': 'Subtasks must be an array',
    }),
});

// ========== UPDATE EMPLOYEE TASK VALIDATION ==========
const updateEmployeeTaskValidationSchema = Joi.object({
  employeeIDs: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Each employee ID must be a valid 24-character hex string',
        })
    )
    .min(1)
    .optional()
    .messages({
      'array.min': 'Task must be assigned to at least one employee',
      'array.base': 'Employee IDs must be an array',
    }),
  supervisor: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid supervisor ID format (must be 24 hex characters)',
    }),
  taskTitle: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Task title cannot be empty',
      'string.min': 'Task title must be at least 1 character',
      'string.max': 'Task title cannot exceed 200 characters',
    }),
  taskDescription: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.base': 'Task description must be a string',
      'string.max': 'Task description cannot exceed 2000 characters',
    }),
  taskStartByDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Task start date must be a valid ISO date',
      'date.base': 'Task start date must be a valid date',
    }),
  taskFinishByDate: Joi.date()
    .iso()
    .min(Joi.ref('taskStartByDate'))
    .optional()
    .messages({
      'date.format': 'Task finish date must be a valid ISO date',
      'date.base': 'Task finish date must be a valid date',
      'date.min': 'Finish date must be after or equal to start date',
    }),
  taskActualFinishDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Task actual finish date must be a valid ISO date',
      'date.base': 'Task actual finish date must be a valid date',
    }),
  taskStatus: Joi.string()
    .valid('pending', 'completed')
    .optional()
    .messages({
      'any.only': 'Task status must be either "pending" or "completed"',
    }),
  taskPriority: Joi.string()
    .valid('low', 'normal', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Task priority must be one of: low, normal, high, urgent',
    }),
  subtasks: Joi.array()
    .items(updateSubtaskValidationSchema)
    .optional()
    .messages({
      'array.base': 'Subtasks must be an array',
    }),
});

module.exports = {
  fileAttachmentValidationSchema,
  createEmployeeTaskValidationSchema,
  updateEmployeeTaskValidationSchema,
};