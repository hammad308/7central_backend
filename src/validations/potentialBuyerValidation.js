const Joi = require("joi");

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const potentialBuyerValidation = Joi.object({
    potentialCustomers: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required().messages({
                    'string.base': 'Name must be a string',
                    'any.required': 'Name is required'
                }),
                phoneNumber: Joi.string().required().messages({
                    'string.base': 'Phone Number must be a string',
                    'any.required': 'Phone Number is required'
                }),
                whatsAppNumber: Joi.string().required().messages({
                    'string.base': 'WhatsApp Number must be a string',
                    'any.required': 'WhatsApp Number is required'
                }),
                houseFlatNumber: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'House/Flat number must be a string.',
                }),
                address: Joi.string().optional().allow(null,'').messages({
                    'string.base': 'Address must be a string.',
                }),
                address2: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'Address 2 must be a string.',
                }),
                city: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'City must be a string.',
                }),
                province: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'Province must be a string.',
                }),
                countryCode: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'Country code must be a string.',
                }),
                countryName: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'Country name must be a string.',
                })
            })
        )
        .max(3)
        .required()
        .messages({
            'array.max': 'Potential Customers can be maximum of 3',
            'any.required': 'Potential Customers are required'
        }),
    customer: objectId.required().messages({
        'string.pattern.base': 'Invalid Customer ID',
        'any.required': 'Customer ID is required'
    }),
    createdBy: objectId.required().messages({
        'string.pattern.base': 'Invalid User ID',
        'any.required': 'User ID is required'
    })
});

module.exports= potentialBuyerValidation;