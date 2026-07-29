const Joi = require("joi");

const dealerValidationSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Name is required.',
        'string.base': 'Name must be a string.',
    }),
    fatherName: Joi.string().required().messages({
        'any.required': 'Father name is required.',
        'string.base': 'Father name must be a string.',
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required.',
        'string.email': 'Please provide a valid email address.',
        'string.base': 'Email must be a string.',
    }),
    cnic: Joi.string().required().messages({
        'any.required': 'CNIC is required.',
        'string.base': 'CNIC must be a string.',
    }),
    phoneNumber: Joi.string().required().messages({
        'any.required': 'Primary phone number is required.',
        'string.base': 'Phone number must be a string.',
    }),
    phoneNumber2: Joi.string().allow(null, '').optional().messages({
        'string.base': 'Secondary phone number must be a string.',
    }),
    whatsappNumber: Joi.string().required().messages({
        'any.required': 'Primary WhatsApp number is required.',
        'string.base': 'WhatsApp number must be a string.',
    }),
    whatsappNumber2: Joi.string().allow(null, '').optional().messages({
        'string.base': 'Secondary WhatsApp number must be a string.',
    }),
    houseFlatNumber: Joi.string().allow(null, '').optional().messages({
        'string.base': 'House/Flat number must be a string.',
    }),
    address: Joi.string().required().messages({
        'any.required': 'Address is required.',
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
    }),
    image: Joi.string()
        .dataUri()
        .allow(null, "")   // allow empty or null
        .optional()
        .messages({
            'string.dataUri': 'Invalid image format. Must be a valid Data URI.'
        }),
    dateOfBirth: Joi.date().allow(null, '').optional().less("now").iso().messages({
        'date.base': 'Please enter a valid date',
        'date.format': 'Date must be in YYYY-MM-DD format',
        'date.less': 'Date of birth cannot be in future'
    }),
    profession: Joi.string().allow(null, '').optional().messages({
        'string.base': 'Profession must be a string'
    }),
    education: Joi.string().allow(null, '').optional().messages({
        'string.base': 'Education must be string'
    }),
    dhaRegistrationNumber: Joi.string().optional().messages({
        'string.base': 'DHA Registration Number must be String'
    }),
    SevenCentralRegistrationNumber: Joi.string().optional().messages({
        'string.base': 'Seven Central Registration Number must be String'
    }),
    passportName: Joi.string().allow(null, '').optional().messages({
        'string.base': 'Passport name must be a string.',
    }),
});

module.exports= dealerValidationSchema;