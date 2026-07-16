const joi = require('joi');

const leaveRuleValidationSchema = joi.object().keys({
  roleID: joi.string().required(),
  casualLeaves: joi.number().integer().min(0).required(),
  medicalLeaves: joi.number().integer().min(0).required(),
  halfDayDeduction: joi.number().min(0).required(),
  offDayDeduction: joi.number().min(0).required(),
  absentDayDeduction: joi.number().min(0).required(),
});

module.exports = leaveRuleValidationSchema;