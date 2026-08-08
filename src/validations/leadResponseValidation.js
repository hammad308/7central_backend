const Joi = require('joi');
const { LEAD_RESPONSE_TYPES } = require('../constants/app.constants');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const leadResponseValidationSchema = Joi.object({
    leadId: objectId
        .required()
        .messages({
            'string.pattern.base': 'Invalid lead ID format',
            'any.required': 'Lead ID is required',
        }),
    responseType: Joi.string()
        .valid(...LEAD_RESPONSE_TYPES)
        .required()
        .messages({
            'any.required': 'Response type is required',
            'any.only': 'Response type must be one of: {#valids}',
            'string.empty': 'Response type cannot be empty',
            'string.base': 'Response type must be a string',
        }),
    note: Joi.string()
        .max(2000)
        .optional()
        .messages({
            'string.max': 'Note cannot exceed 2000 characters',
            'string.base': 'Note must be a string',
        }),
    nextAction: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Next action cannot exceed 500 characters',
            'string.base': 'Next action must be a string',
        }),
    result: Joi.string()
        .max(1000)
        .optional()
        .messages({
            'string.max': 'Result cannot exceed 1000 characters',
            'string.base': 'Result must be a string',
        }),
    nextActionDate: Joi.date()
        .iso()
        .optional()
        .messages({
            'date.format': 'Next action date must be a valid ISO date',
            'date.base': 'Next action date must be a valid date',
        }),
});

module.exports = leadResponseValidationSchema;