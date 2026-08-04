const Joi = require('joi');

const createEmployeeComplaintValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  subject: Joi.string().required().min(3).messages({
    'string.min': 'Subject must be at least 3 characters',
    'any.required': 'Subject is required',
    'string.empty': 'Subject cannot be empty',
  }),
  type: Joi.string().valid('complaint', 'suggestion').required().messages({
    'any.required': 'Type is required',
    'any.only': 'Type must be complaint or suggestion',
  }),
  complaintStatus: Joi.string()
    .valid('pending', 'solved', 'unsolvable')
    .optional()
    .messages({ 'any.only': 'Invalid complaint status' }),
  description: Joi.string().required().min(3).messages({
    'string.min': 'Description must be at least 3 characters',
    'string.empty': 'Description cannot be empty',
    'any.required': 'Description is Required'
  }),
});

const updateEmployeeComplaintValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  subject: Joi.string().optional().min(3).messages({
    'string.min': 'Subject must be at least 3 characters',
    'any.required': 'Subject is required',
    'string.empty': 'Subject cannot be empty',
  }),
  type: Joi.string().valid('complaint', 'suggestion').optional().messages({
    'any.only': 'Type must be complaint or suggestion',
  }),
  complaintStatus: Joi.string()
    .valid('pending', 'solved', 'unsolvable')
    .optional()
    .messages({ 'any.only': 'Invalid complaint status' }),
  description: Joi.string().optional().min(3).messages({
    'string.min': 'Description must be at least 3 characters',
    'string.empty': 'Description cannot be empty',
    'any.required': 'Description is Required'
  })
});

module.exports = {
  createEmployeeComplaintValidationSchema,
  updateEmployeeComplaintValidationSchema
};