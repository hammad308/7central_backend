const Joi = require('joi');
const { LEAD_SOURCE } = require('../constants/app.constants');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

// ========== CREATE LEAD VALIDATION ==========
// Lead = Assigned prospect → assignedTo REQUIRED
// status NOT included — auto-set to 'new' by model default
const createLeadValidationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'any.required': 'Name is required',
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 3 characters',
            'string.max': 'Name cannot exceed 50 characters',
            'string.base': 'Name must be a string',
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'any.required': 'Email is required',
            'string.email': 'Please provide a valid email',
            'string.empty': 'Email cannot be empty',
            'string.base': 'Email must be a string',
        }),
    phoneNumber: Joi.string()
        .pattern(/^03\d{9}$/)
        .required()
        .messages({
            'any.required': 'Phone number is required',
            'string.empty': 'Phone number cannot be empty',
            'string.pattern.base': 'Phone number must be a valid Pakistani number (03XXXXXXXXX)',
            'string.base': 'Phone number must be a string',
        }),
    whatsAppNumber: Joi.string()
        .pattern(/^03\d{9}$/)
        .required()
        .messages({
            'any.required': 'WhatsApp number is required',
            'string.empty': 'WhatsApp number cannot be empty',
            'string.pattern.base': 'WhatsApp number must be a valid Pakistani number (03XXXXXXXXX)',
            'string.base': 'WhatsApp number must be a string',
        }),
    leadSource: Joi.string()
        .valid(...LEAD_SOURCE)
        .required()
        .messages({
            'any.required': 'Lead source is required',
            'string.empty': 'Lead source cannot be empty',
            'any.only': 'Lead source must be one of: {#valids}',
            'string.base': 'Lead source must be a string',
        }),
    note: Joi.string()
        .max(2000)
        .optional()
        .messages({
            'string.max': 'Note cannot exceed 2000 characters',
            'string.base': 'Note must be a string',
        }),
    heardVia: Joi.string()
        .valid('google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board')
        .optional()
        .messages({
            'any.only': 'Heard via must be one of: {#valids}',
            'string.base': 'Heard via must be a string',
        }),
    dealerId: objectId
        .when('leadSource', {
            is: 'dealer',
            then: Joi.required().messages({
                'any.required': 'Dealer ID is required when lead source is dealer',
            }),
            otherwise: Joi.optional().allow(null),
        })
        .messages({
            'string.pattern.base': 'Invalid dealer ID format',
        }),
    campaignId: objectId
        .when('leadSource', {
            is: 'campaign',
            then: Joi.required().messages({
                'any.required': 'Campaign ID is required when lead source is campaign',
            }),
            otherwise: Joi.optional().allow(null),
        })
        .messages({
            'string.pattern.base': 'Invalid campaign ID format',
        }),
    assignedTo: objectId
        .required()
        .messages({
            'any.required': 'Assigned user ID is required — a lead must be assigned to a user',
            'string.pattern.base': 'Invalid assigned user ID format',
            'string.empty': 'Assigned user ID cannot be empty',
        }),
});

// ========== UPDATE LEAD VALIDATION ==========
// status IS allowed in update — admin can change it
const updateLeadValidationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .optional()
        .messages({
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 3 characters',
            'string.max': 'Name cannot exceed 50 characters',
            'string.base': 'Name must be a string',
        }),
    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Please provide a valid email',
            'string.empty': 'Email cannot be empty',
            'string.base': 'Email must be a string',
        }),
    phoneNumber: Joi.string()
        .pattern(/^03\d{9}$/)
        .optional()
        .messages({
            'string.empty': 'Phone number cannot be empty',
            'string.pattern.base': 'Phone number must be a valid Pakistani number (03XXXXXXXXX)',
            'string.base': 'Phone number must be a string',
        }),
    whatsAppNumber: Joi.string()
        .pattern(/^03\d{9}$/)
        .optional()
        .messages({
            'string.empty': 'WhatsApp number cannot be empty',
            'string.pattern.base': 'WhatsApp number must be a valid Pakistani number (03XXXXXXXXX)',
            'string.base': 'WhatsApp number must be a string',
        }),
    leadSource: Joi.string()
        .valid(...LEAD_SOURCE)
        .optional()
        .messages({
            'string.empty': 'Lead source cannot be empty',
            'any.only': 'Lead source must be one of: {#valids}',
            'string.base': 'Lead source must be a string',
        }),
    note: Joi.string()
        .max(2000)
        .optional()
        .messages({
            'string.max': 'Note cannot exceed 2000 characters',
            'string.base': 'Note must be a string',
        }),
    heardVia: Joi.string()
        .valid('google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board')
        .optional()
        .messages({
            'any.only': 'Heard via must be one of: {#valids}',
            'string.base': 'Heard via must be a string',
        }),
    dealerId: objectId
        .when('leadSource', {
            is: 'dealer',
            then: Joi.required().messages({
                'any.required': 'Dealer ID is required when lead source is dealer',
            }),
            otherwise: Joi.optional().allow(null),
        })
        .messages({
            'string.pattern.base': 'Invalid dealer ID format',
        }),
    campaignId: objectId
        .when('leadSource', {
            is: 'campaign',
            then: Joi.required().messages({
                'any.required': 'Campaign ID is required when lead source is campaign',
            }),
            otherwise: Joi.optional().allow(null),
        })
        .messages({
            'string.pattern.base': 'Invalid campaign ID format',
        }),
    status: Joi.string()
        .valid('new', 'not_contacted', 'follow_up', 'visit_plan', 'future_plan', 'dead', 'successfull')
        .optional()
        .messages({
            'any.only': 'Status must be one of: {#valids}',
            'string.base': 'Status must be a string',
        }),
    assignedTo: objectId
        .optional()
        .messages({
            'string.pattern.base': 'Invalid assigned user ID format',
        }),
});

// ========== ASSIGN PROSPECT VALIDATION ==========
const assignProspectValidationSchema = Joi.object({
    assignedTo: objectId
        .required()
        .messages({
            'any.required': 'Assigned user ID is required',
            'string.pattern.base': 'Invalid user ID format',
        }),
});

module.exports = {
    createLeadValidationSchema,
    updateLeadValidationSchema,
    assignProspectValidationSchema,
};