const joi = require('joi');

const employeeIncrementValidationSchema = joi.object().keys({
  employeeID: joi.string().required(),
  incrementAmount: joi.number().min(1).required(),
  incrementType: joi.string().valid('costOfLiving', 'performance', 'promotion').required().messages({
    'string.base': `"Increment Type" should be text string`,
    'string.empty': `"Increment Type" cannot be empty`,
    'any.required': `"Increment Type" is required`
  }),
});

module.exports = employeeIncrementValidationSchema;