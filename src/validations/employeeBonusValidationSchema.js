const joi = require('joi');

const employeeBonusValidationSchema = joi.object().keys({
  employeeIDs: joi.array().min(1).required(), //minimum 1 employee is needed
  bonusAmount: joi.number().min(1).required(),
  bonusType: joi.string().valid(
    'yearEnd', 
    'eidAlFitr', 
    'eidAlAdha',
    'other'
  ).required().messages({
    'string.base': `"Bonus Type" should be text string`,
    'string.empty': `"Bonus Type" cannot be empty`,
    'any.required': `"Bonus Type" is required`
  }),
  bonusMonth: joi.date().iso().required(),
});

module.exports = employeeBonusValidationSchema;