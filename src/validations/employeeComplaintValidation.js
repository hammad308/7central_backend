const Joi = require('joi');

const employeeComplaintValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid employee ID' }),
  subject: Joi.string().required().messages({
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
  description: Joi.string().required().messages({
    'string.empty':'Description cannot be empty',
    'any.required':'Description is Required'
  }),
});

module.exports = employeeComplaintValidationSchema;