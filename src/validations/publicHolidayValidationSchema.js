const joi = require('joi');

const publicHolidayValidationSchema = joi.object().keys({
  title: joi.string().required().messages({
    'string.empty': `Title cannot be empty`,
    'any.required': `Title is required`
  }),
  date: joi.date().iso().required(),
  type: joi.string().valid('Public', 'Company').required(),
  description: joi.string().allow("").optional()
});

module.exports = publicHolidayValidationSchema;