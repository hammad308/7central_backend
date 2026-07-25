const Joi = require('joi');

const employeeIncrementValidationSchema = Joi.object({
  employee: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Employee ID is required',
      'string.pattern.base': 'Invalid employee ID',
    }),
  incrementAmount: Joi.number().integer().min(1).required().messages({
    'any.required': 'Increment amount is required',
    'number.min': 'Increment amount must be at least 1',
  }),
  incrementType: Joi.string()
    .valid('costOfLiving', 'performance', 'promotion')
    .required()
    .messages({
      'any.required': 'Increment type is required',
      'any.only': 'Invalid increment type',
    }),
});

module.exports = employeeIncrementValidationSchema;