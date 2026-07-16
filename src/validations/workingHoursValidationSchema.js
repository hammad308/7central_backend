const joi = require('joi');

const hourAndMinuteValidationSchema = joi.object().keys({
  hour: joi.number().min(0).max(23).required(),
  minute: joi.number().min(0).max(59).required(),
});

const workingHoursValidationSchema = joi.object().keys({
  shiftTitle: joi.string().required(),
  isLatePolicy: joi.boolean().required(),
  shiftStart: hourAndMinuteValidationSchema.required(),
  shiftEnd: hourAndMinuteValidationSchema.required(),
  onTime: hourAndMinuteValidationSchema.optional(),
  halfDay: hourAndMinuteValidationSchema.optional(),
  offDay: hourAndMinuteValidationSchema.optional(),
});

module.exports = workingHoursValidationSchema;