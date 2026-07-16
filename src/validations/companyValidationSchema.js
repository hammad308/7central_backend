const joi = require('joi');

const companyValidationSchema = joi.object({
  company_name: joi.string().min(3).max(50).required().messages({
    'any.required':'Company Name is required',
    'string.base':'Comapany Name must be a string',
    'string.min':'Company Name must be at least 3 characters long',
    'string.max':'Comapany Name cannot exceed 50 characters'
  }),
});

module.exports = companyValidationSchema;