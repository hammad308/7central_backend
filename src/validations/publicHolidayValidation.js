const Joi = require('joi');

const publicHolidayValidationSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Title is required',
    'string.empty': 'Title cannot be empty',
  }),
  date: Joi.date().iso().required().messages({
    'any.required': 'Date is required',
  }),
  type: Joi.string().valid('Public', 'Company').required().messages({
    'any.required': 'Type is required',
    'any.only': 'Type must be Public or Company',
  }),
  description: Joi.string().allow('', null).optional(),
});

module.exports = publicHolidayValidationSchema;