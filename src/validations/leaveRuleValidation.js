const Joi = require('joi');

const leaveRuleValidationSchema = Joi.object({
  role: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Role is required',
      'string.pattern.base': 'Invalid role ID',
    }),
  casualLeaves: Joi.number().integer().min(0).required().messages({
    'any.required': 'Casual leaves is required',
  }),
  medicalLeaves: Joi.number().integer().min(0).required().messages({
    'any.required': 'Medical leaves is required',
  }),
  halfDayDeduction: Joi.number().min(0).required().messages({
    'any.required': 'Half day deduction is required',
  }),
  offDayDeduction: Joi.number().min(0).required().messages({
    'any.required': 'Off day deduction is required',
  }),
  absentDayDeduction: Joi.number().min(0).required().messages({
    'any.required': 'Absent day deduction is required',
  }),
});

module.exports = leaveRuleValidationSchema;