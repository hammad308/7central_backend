const Joi = require('joi');

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const blockOrFloorValidationSchema = Joi.object({
    title: Joi.string()
        .required()
        .messages({
            'any.required': 'Block/Floor title is required.',
            'string.base': 'Block/Floor must be a string.',
        }),
    project: objectId
        .required()
        .messages({
            'any.required': 'Project ID is required',
            'string.pattern.base': 'Invalid Project ID format'
        })
});

module.exports = blockOrFloorValidationSchema;
