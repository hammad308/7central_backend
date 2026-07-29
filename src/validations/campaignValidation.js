const Joi = require("joi");

const { CAMPAIGN_PERIOD, CAMPAIGN_TYPES } = require("../constants/app.constants");

const campaignValidationSchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty":"Campaign Name is not allowed to be empty",
        'any.required': 'Campaign Name is required',
        'string.base': 'Campaign Name must be a string'
    }),
    campaignType: Joi.string().required().valid(...CAMPAIGN_TYPES).messages({
        "string.empty":"Campaign Type is not allowed to be empty",
        'any.required': 'Campaign Type is required',
        'any.only': 'Campaign Type must be only of the following: {#valids}'
    }),
    campaignPeriod: Joi.string().required().valid(...CAMPAIGN_PERIOD).messages({
        "string.empty":"Campaign Period is not allowed to be empty",
        'any.required': 'Campaign Period is required',
        'any.only': 'Campign Period must be one of the following: {#valids}'
    }),
    frequencyStatus: Joi.number().required().min(1).messages({
        'number.min': 'frequency status must be equal to or greater than 1',
        'any.required': 'Frequency Status is required'
    }),
    targetAudience: Joi.string().required().messages({
        "string.empty":"Target Audience is not allowed to be empty",
        'any.required': 'Target Audience is required',
        'string.base': 'Target Audience must be in string format'
    }),
    description: Joi.string().optional().messages({
        "string.empty":"Description is not allowed to be empty",
        'string.base': 'Description must be in string format'
    }),
    attachments: Joi.array().items(
        Joi.string().dataUri().required().messages({
            'string.dataUri': 'Attachment must be in valid format'
            
        })).optional()
});

module.exports = campaignValidationSchema;