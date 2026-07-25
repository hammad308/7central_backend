const Joi = require('joi');

const companyValidationSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    'any.required': 'Company name is required.',
    'string.base': 'Company name must be a string.',
    'string.min': 'Company name must be at least 3 characters long.',
    'string.max': 'Company name cannot exceed 50 characters.',
  }),
  // status can be updated via update route
  status: Joi.string().valid('active', 'inactive', 'deleted').optional(),
});

module.exports = companyValidationSchema;