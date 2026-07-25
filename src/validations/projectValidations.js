const Joi = require('joi');

const projectValidationSchema = Joi.object({
    title: Joi.string()
        .required()
        .messages({
            'any.required': 'Project title is required.',
            'string.base': 'Project title be a string.',
        })
});

module.exports = projectValidationSchema;
