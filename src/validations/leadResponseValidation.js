const Joi = require("joi");
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);
const { LEAD_RESPONSE_TYPES } = require("../constants/app.constants");

const leadResponseValidationSchema = Joi.object({
    leadId: objectId.required().messages({
        'string.pattern.base': 'Invalid Lead ID',
        'any.required': 'Lead ID is required',
    }),
    responseType: Joi.string().required().valid(...LEAD_RESPONSE_TYPES).messages({
        'string.base': 'Response Type must be a String',
        'any.only': 'Reponse Type could be one of the following: {#valids}',
        'any.required': 'Response Type is required'
    }),
    note: Joi.string().optional().messages({
        'string.base': 'Note must be a string',
    }),
    nextAction: Joi.string().optional().messages({
        'string.base': 'Note must be a string'
    }),
    result: Joi.string().optional().messages({
        'string.base': 'Result must be a string'
    }),
    nextActionDate: Joi.date().optional().messages({
        'date.base': 'Next Action Date must be a valid Date'
    })
});

module.exports = leadResponseValidationSchema;