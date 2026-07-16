const joi = require('joi');

const employeeComplaintValidationSchema = joi.object().keys({
  employeeID: joi.string().optional(), //optional for complainant, required for HR manager
  subject: joi.string().required().messages({
    'string.empty': `Complaint subject cannot be empty`,
    'any.required': `Complaint subject is required`
  }),
  type: joi.string().valid('complaint', 'suggestion').required(),
  status: joi.string().valid('pending', 'solved', 'unsolvable').optional(), //optional for complainant, required for HR manager
  description: joi.string().allow("").optional()
});

module.exports = employeeComplaintValidationSchema;