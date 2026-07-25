const Joi = require('joi');

const departmentValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'any.required': 'Department name is required.',
    'string.base': 'Department name must be a string.',
    'string.min': 'Department name must be at least 3 characters long.',
    'string.max': 'Department name cannot exceed 100 characters.',
  }),
  company: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Company ID is required.',
      'string.pattern.base': 'Invalid company ID.',
    }),
  status: Joi.string().valid('active', 'inactive', 'deleted').optional(),
});

module.exports = departmentValidationSchema;