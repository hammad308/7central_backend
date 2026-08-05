const Joi = require("joi");

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const potentialBuyerValidation = Joi.object({
    potentialCustomers: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required().min(3).max(50).messages({
                    'any.required': 'Name is required.',
                    'string.base': 'Name must be a string.',
                    'string.min': 'Name must be at least of 3 characters',
                    'string.max': 'Name cannot exceed 50 characters'
                }),
                fatherName: Joi.string().required().min(3).max(50).messages({
                    'any.required': 'Father name is required.',
                    'string.base': 'Father name must be a string.',
                    'string.min': 'Father Name must be at least of 3 characters',
                    'string.max': 'Father Name cannot exceed 50 characters'
                }),
                cnic: Joi.string().pattern(/^\d{13}$/).optional().messages({
                    'string.base': 'CNIC must be a string.',
                    'string.pattern.base': 'Invalid CNIC Format'
                }),
                phoneNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
                    'any.required': 'Primary phone number is required.',
                    'string.base': 'Phone number must be a string.',
                    'string.pattern.base': 'Invalid Phone Number Format'
                }),
                whatsappNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
                    'any.required': 'Primary WhatsApp number is required.',
                    'string.base': 'WhatsApp number must be a string.',
                    'string.pattern.base': 'Invalid WhatsApp Number Format'
                }),
                houseFlatNumber: Joi.string().allow(null, '').optional().messages({
                    'string.base': 'House/Flat number must be a string.',
                }),
                address: Joi.string().optional().allow(null, '').messages({
                    'string.base': 'Address must be a string.',
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

module.exports = potentialBuyerValidation;