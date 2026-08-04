const Joi = require('joi');

const createEmployeeLeaveValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  title: Joi.string().required().messages({
    'any.required': 'Leave title is required',
    'string.empty': 'Title cannot be empty',
  }),
  startDate: Joi.date().iso().required().messages({
    'date.empty': 'Starting date cannot be empty',
    'date.base': 'Invalid Starting date',
    'any.required': 'Start date is required'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'any.required': 'End date is required',
    'date.empty': 'Ending date cannot be empty',
    'date.base': 'Invalid Ending date',
    'date.min': 'End date must be greater than or equal to start date'
  }),
  type: Joi.string().valid('Casual', 'Medical').required().messages({
    'string.empty': 'Leave Type cannot be empty',
    'any.required': 'Leave type is required',
    'any.only': 'Leave type must be Casual or Medical',
  }),
  leaveStatus: Joi.string()
    .valid('Pending', 'Granted', 'Declined')
    .optional()
    .messages({ 'any.only': 'Invalid leave status', 'string.empty': 'leave Status cannot be empty' }),
  description: Joi.string().allow('', null).optional().messages({
    'string.empty': 'Description cannot be empty'
  }),
});

const updateEmployeeLeaveValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  title: Joi.string().optional().messages({
    'string.empty': 'Title cannot be empty',
  }),
  startDate: Joi.date().iso().optional().messages({
    'date.empty': 'Starting date cannot be empty',
    'date.base': 'Invalid Starting date'
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.empty': 'Ending date cannot be empty',
    'date.base': 'Invalid Ending date',
    'date.min': 'End date must be greater than or equal to start date'
  }),
  type: Joi.string().valid('Casual', 'Medical').optional().messages({
    'string.empty': 'Leave Type cannot be empty',
    'any.only': 'Leave type must be Casual or Medical',
  }),
  leaveStatus: Joi.string()
    .valid('Pending', 'Granted', 'Declined')
    .optional()
    .messages({
      'any.only': 'Invalid leave status',
      'string.empty': 'leave Status cannot be empty'
    }),
  description: Joi.string().allow('', null).optional().messages({
    'string.empty': 'Description cannot be empty'
  }),
});

module.exports = {
  createEmployeeLeaveValidationSchema,
  updateEmployeeLeaveValidationSchema
};