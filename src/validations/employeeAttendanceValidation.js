const Joi = require('joi');

const employeeAttendanceValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'any.required': 'Employee ID is required',
      'string.pattern.base': 'Invalid employee ID',
    }),
  checkInTime: Joi.date().iso().required().messages({
    'any.required': 'Check‑in time is required',
  }),
  checkOutTime: Joi.date().iso().optional().allow(null),
});

module.exports = employeeAttendanceValidationSchema;