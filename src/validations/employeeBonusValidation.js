const Joi = require('joi');

const employeeBonusValidationSchema = Joi.object({
  employees: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({ 'string.pattern.base': 'Invalid employee ID' })
    )
    .min(1)
    .required()
    .messages({
      'any.required': 'At least one employee is required',
    }),
  amount: Joi.number().integer().min(1).required().messages({
    'any.required': 'Bonus amount is required',
    'number.min': 'Bonus amount must be at least 1',
  }),
  bonusType: Joi.string()
    .valid('yearEnd', 'eidAlFitr', 'eidAlAdha', 'other')
    .required()
    .messages({
      'any.required': 'Bonus type is required',
      'any.only': 'Invalid bonus type',
    }),
  bonusMonth: Joi.date().iso().required().messages({
    'any.required': 'Bonus month is required',
  }),
});

module.exports = employeeBonusValidationSchema;