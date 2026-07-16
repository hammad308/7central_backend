const joi = require('joi');

const employeeLeaveValidationSchema = joi.object().keys({
  employeeID: joi.string().optional(), //optional for leave requester, required for HR manager
  title: joi.string().required().messages({
    'string.empty': `Leave application title cannot be empty`,
    'any.required': `Leave application title is required`
  }),
  startDate: joi.date().iso().required(),
  endDate: joi.date().iso().required(),
  status: joi.string().valid('Pending', 'Granted', 'Declined').optional(), //optional for leave requester, required for HR manager
  type: joi.string().valid('Casual', 'Medical').required(),
  description: joi.string().allow("").optional()
});

module.exports = employeeLeaveValidationSchema;