const Joi = require("joi");
const { LEAD_SOURCE } = require("../constants/app.constants")

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/);

const createLeadValidationSchema = Joi.object({
    name: Joi.string().required().min(3).messages({
        'string.min': 'Name Field should contain at least 3 characters',
        'any.required': 'Name is required',
        'string.base': 'Name must be a string'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Please provide Email',
        'string.email': 'please provide a valid Email',
        'string.base': 'Email must be a string'
    }),
    phoneNumber: Joi.string().required().messages({
        'any.required': 'Phone Number is required',
        'string.base': 'Phone Number must be a string'
    }),
    whatsAppNumber: Joi.string().required().messages({
        'any.required': 'WhatsApp Number is required',
        'string.base': 'WhatsApp Number must be a string'
    }),
    leadSource: Joi.string().valid(...LEAD_SOURCE).required().messages({
        'any.required': 'Lead Source is required',
        'string.base': 'Lead Source must be a string',
        'any.only': 'Lead Source must be one of the following: {#valids}'
    }),
    note: Joi.string().optional().min(3).messages({
        'string.base': 'Note must be String',
        'string.min': 'Note Field should contain at least 3 characters'
    }),
    heardVia: Joi.string().valid('google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board').optional().messages({
        'string.base': 'Heard Via Field must be a string',
        'any.only': 'Heard Via Field must be one of the following: {#valids}'
    }),
    dealerId: objectId.when('leadSource', {
        is: Joi.valid('dealer'),
        then: Joi.required().messages({ 'any.required': 'Dealer ID is required when Lead Source is Dealer' }),
        otherwise: Joi.optional()
    }).messages({
        'string.pattern.base': 'Invalid Dealer ID',
    }),
    campaignId: objectId.when('leadSource', {
        is: Joi.valid('campaign'),
        then: Joi.required().messages({ 'any.required': 'Campaign ID is required when Lead Source is Campaign' }),
        otherwise: Joi.optional()
    }).messages({
        'string.pattern.base': 'Invalid Campaign ID'
    }),
    status: Joi.string().valid('new', 'not_contacted', 'follow_up', 'visit_plan', 'future_plan', 'dead', 'successfull').optional(),
    assignedTo: objectId.optional().messages({
        'string.pattern.base': 'Invalid "Assigned To" ID'
    })
});

const updateLeadValidationSchema = Joi.object({
    name: Joi.string().optional().min(3).messages({
        'string.min': 'Name Field should contain at least 3 characters',
        'string.base': 'Name must be a string'
    }),
    email: Joi.string().email().optional().messages({
        'string.email': 'please provide a valid Email',
        'string.base': 'Email must be a string'
    }),
    phoneNumber: Joi.string().optional().pattern(/^03\d{9}$/).messages({
        'string.base': 'Phone Number must be a string',
        'string.pattern.base': 'Invalid Phone Number Format'
    }),
    whatsAppNumber: Joi.string().optional().pattern(/^03\d{9}$/).messages({
        'string.base': 'WhatsApp Number must be a string',
        'string.pattern.base': 'Invalid WhatsApp Number Format'
    }),
    leadSource: Joi.string().valid(...LEAD_SOURCE).optional().messages({
        'string.base': 'Lead Source must be a string',
        'string.empty': 'Lead Source Field is optional but it cannot be empty',
        'any.only': 'Lead Source must be one of the following: {#valids}'
    }),
    note: Joi.string().optional().min(3).messages({
        'string.base': 'Note Field must be String',
        'string.min': 'Note Field should contain at least 3 characters'
    }),
    heardVia: Joi.string().valid('google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board').optional().messages({
        'string.base': 'Heard Via Field must be a string',
        'string.empty': 'Heard Via Field is optional but it cannot be empty',
        'any.only': 'Heard Via Field must be one of the following: {#valids}'
    }),
    dealerId: objectId.when('leadSource', {
        is: Joi.exist().valid('dealer'),
        then: Joi.required().messages({ 'any.required': 'Dealer ID is optional when Lead Source is Dealer' }),
        otherwise: Joi.optional()
    }).messages({
        'string.pattern.base': 'Invalid Dealer ID',
    }),
    campaignId: objectId.when('leadSource', {
        is: Joi.exist().valid('campaign'),
        then: Joi.required().messages({ 'any.required': 'Campaign ID is optional when Lead Source is Campaign' }),
        otherwise: Joi.optional()
    }).messages({
        'string.pattern.base': 'Invalid Campaign ID',
    }),
    status: Joi.string().valid('new', 'not_contacted', 'follow_up', 'visit_plan', 'future_plan', 'dead', 'successfull').optional(),
    assignedTo: objectId.optional().messages({
        'string.pattern.base': 'Invalid "Assigned To" ID'
    })
});



module.exports = {
    createLeadValidationSchema,
    updateLeadValidationSchema
};