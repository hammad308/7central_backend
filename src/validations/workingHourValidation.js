const Joi = require('joi');

const hourAndMinuteValidationSchema = Joi.object({
  hour: Joi.number().integer().min(0).max(23).required(),
  minute: Joi.number().integer().min(0).max(59).required(),
});

const workingHourValidationSchema = Joi.object({
  shiftTitle: Joi.string().required().messages({
    'any.required': 'Shift title is required',
  }),
  isLatePolicy: Joi.boolean().required().messages({
    'any.required': 'Late policy flag is required',
  }),
  shiftStart: hourAndMinuteValidationSchema.required().messages({
    'any.required': 'Shift start is required',
  }),
  shiftEnd: hourAndMinuteValidationSchema.required().messages({
    'any.required': 'Shift end is required',
  }),
  onTime: hourAndMinuteValidationSchema.optional().allow(null),
  halfDay: hourAndMinuteValidationSchema.optional().allow(null),
  offDay: hourAndMinuteValidationSchema.optional().allow(null),
});

module.exports = workingHourValidationSchema;