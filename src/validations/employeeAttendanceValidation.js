const Joi = require('joi');

const createEmployeeAttendanceValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'any.required': 'Employee ID is required',
      'string.pattern.base': 'Invalid employee ID',
    }),
  checkInTime: Joi.date().iso().required().messages({
    'date.base': 'Invalid check-in Time Format',
    'any.required': 'Check‑in time is required'
  }),
  checkOutTime: Joi.date().iso().optional().messages({
    'date.base': 'Invalid check-out Time Format'
  }),
});

const updateEmployeeAttendanceValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'any.required': 'Employee ID is required',
      'string.pattern.base': 'Invalid employee ID',
    }),
  checkInTime: Joi.date().iso().optional().messages({
    'date.base': 'Invalid check-in Time Format'
  }),
  checkOutTime: Joi.date().iso().optional().messages({
    'date.base': 'Invalid check-out Time Format'
  }),
});

module.exports = {
  createEmployeeAttendanceValidationSchema,
  updateEmployeeAttendanceValidationSchema
};