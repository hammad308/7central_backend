const Joi = require('joi');

const employeeLeaveValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  title: Joi.string().required().messages({
    'any.required': 'Leave title is required',
    'string.empty': 'Title cannot be empty',
  }),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().required().messages({
    'any.required': 'End date is required',
  }),
  type: Joi.string().valid('Casual', 'Medical').required().messages({
    'any.required': 'Leave type is required',
    'any.only': 'Leave type must be Casual or Medical',
  }),
  leaveStatus: Joi.string()
    .valid('Pending', 'Granted', 'Declined')
    .optional()
    .messages({ 'any.only': 'Invalid leave status' }),
  description: Joi.string().allow('', null).optional(),
});

module.exports = employeeLeaveValidationSchema;