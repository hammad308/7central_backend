const Joi = require('joi');
const { CUSTOMER_RELATION_TYPES } = require('../constants/app.constants');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const customerValidationSchema = Joi.object({
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
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Please provide a valid email address.',
    'string.base': 'Email must be a string.',
  }),
  cnic: Joi.string().pattern(/^\d{13}$/).required().messages({
    'any.required': 'CNIC is required.',
    'string.base': 'CNIC must be a string.',
    'string.pattern.base': 'Invalid CNIC Format'
  }),
  passportName: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Passport name must be a string.',
  }),
  phoneNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'any.required': 'Primary phone number is required.',
    'string.base': 'Phone number must be a string.',
    'string.pattern.base': 'Invalid Phone Number Format'
  }),
  phoneNumber2: Joi.string().pattern(/^03\d{9}$/).optional().messages({
    'string.base': 'Secondary phone number must be a string.',
    'string.pattern.base': 'Invalid Secondary Phone Number Format'
  }),
  whatsappNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'any.required': 'Primary WhatsApp number is required.',
    'string.base': 'WhatsApp number must be a string.',
    'string.pattern.base': 'Invalid WhatsApp Number Format'
  }),
  whatsappNumber2: Joi.string().pattern(/^03\d{9}$/).optional().messages({
    'string.base': 'Secondary WhatsApp number must be a string.',
    'string.pattern.base': 'Invalid Secondary WhatsApp Number Format'
  }),
  gender:Joi.string().valid('male','female','other').optional().messages({
    '*':'gender can be male, female or other and cannot be empty'
  }),
  houseFlatNumber: Joi.string().optional().messages({
    'string.base': 'House/Flat number must be a string.',
    "string.empty": "House/Flat number is optional but cannot be empty"
  }),
  address: Joi.string().required().messages({
    'any.required': 'Address is required.',
    'string.base': 'Address must be a string.',
    "string.empty": "Date of Birth is optional but cannot be empty"
  }),
  address2: Joi.string().optional().messages({
    'string.base': 'Address 2 must be a string.',
    "string.empty": "Address 2 is optional but cannot be empty"
  }),
  city: Joi.string().optional().messages({
    'string.base': 'City must be a string.',
    "string.empty": "City is optional but cannot be empty"
  }),
  province: Joi.string().optional().messages({
    'string.base': 'Province must be a string.',
    "string.empty": "Province is optional but cannot be empty"
  }),
  countryCode: Joi.string().optional().messages({
    'string.base': 'Country code must be a string.',
    "string.empty": "Country code is optional but cannot be empty"
  }),
  countryName: Joi.string().optional().messages({
    'string.base': 'Country name must be a string.',
    "string.empty": "Country name is optional but cannot be empty"
  }),
  dateOfBirth: Joi.date().optional().less("now").iso().messages({
    'date.base': 'Please enter a valid date',
    'date.format': 'Date must be in YYYY-MM-DD format',
    'date.less': 'Date of birth cannot be in future',
    "string.empty": "Date of Birth is optional but cannot be empty"
  }),
  profession: Joi.string().optional().messages({
    'string.base': 'Profession must be a string',
    "string.empty": "Profession is optional but cannot be empty"
  }),
  education: Joi.string().optional().messages({
    'string.base': 'Education must be string',
    "string.empty": "Education is optional but cannot be empty"
  }),
  isOriginalBuyer: Joi.boolean().required().messages({
    '*': 'is Original Buyer Field must be true or false and cannot be left blank and is required'
  }),
  filerType: Joi.string()
    .valid('filer', 'non_filer')
    .optional()
    .messages({
      'string.base': 'Filer Type must be a string',
      'any.only': 'Filer Type must be one of the following: {#valids}',
      "string.empty": "Filer Type is optional but cannot be empty"
    }),
  nttNumber: Joi.string().optional().messages({
    'string.base': 'NTT Number must be a string',
    "string.empty": "NTT Number is optional but cannot be empty"
  }),
  image: Joi.string()
    .dataUri()
    .optional()
    .messages({
      'string.dataUri': 'Invalid image format. Must be a valid Data URI.',
      "string.empty": "Image field is optional but cannot be empty"
    }),
});

const partnerValidationSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Customer ID format.'
  }),
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
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Please provide a valid email address.',
    'string.base': 'Email must be a string.',
  }),
  cnic: Joi.string().pattern(/^\d{13}$/).required().messages({
    'any.required': 'CNIC is required.',
    'string.base': 'CNIC must be a string.',
    'string.pattern.base': 'Invalid CNIC Format'
  }),
  relationType: Joi.string()
    .valid(...CUSTOMER_RELATION_TYPES).optional()
    .messages({
      'any.only': `Relation type must be one of: ${CUSTOMER_RELATION_TYPES.join(', ')}.`
    }),
  passportNumber: Joi.string().optional().messages({
    'string.base': 'Passport Number must be a string.',
    "string.empty": "Passport Number is optional but cannot be empty"
  }),
  phoneNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'any.required': 'Phone number is required.',
    'string.base': 'Phone number must be a string.',
    'string.pattern.base': 'Invalid Phone Number Format'
  }),
  houseFlatNumber: Joi.string().optional().messages({
    'string.base': 'House/Flat number must be a string.',
    "string.empty": "House/Flat number is optional but cannot be empty"
  }),
  address: Joi.string().required().messages({
    'any.required': 'Address is required.',
    'string.base': 'Address must be a string.',
    "string.empty": "Date of Birth is optional but cannot be empty"
  }),
  address2: Joi.string().optional().messages({
    'string.base': 'Address 2 must be a string.',
    "string.empty": "Address 2 is optional but cannot be empty"
  }),
  city: Joi.string().optional().messages({
    'string.base': 'City must be a string.',
    "string.empty": "City is optional but cannot be empty"
  }),
  province: Joi.string().optional().messages({
    'string.base': 'Province must be a string.',
    "string.empty": "Province is optional but cannot be empty"
  }),
  countryCode: Joi.string().optional().messages({
    'string.base': 'Country code must be a string.',
    "string.empty": "Country code is optional but cannot be empty"
  }),
  countryName: Joi.string().optional().messages({
    'string.base': 'Country name must be a string.',
    "string.empty": "Country name is optional but cannot be empty"
  }),
  dateOfBirth: Joi.date().optional().less("now").iso().messages({
    'date.base': 'Please enter a valid date',
    'date.format': 'Date must be in YYYY-MM-DD format',
    'date.less': 'Date of birth cannot be in future',
    "string.empty": "Date of Birth is optional but cannot be empty"
  })
});

const buyerRepresentativeValidationScehma = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
    'string.pattern.base': 'Invalid Customer ID format.'
  }),
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
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Please provide a valid email address.',
    'string.base': 'Email must be a string.'
  }),
  cnic: Joi.string().pattern(/^\d{13}$/).optional().messages({
    'string.base': 'CNIC must be a string.',
    'string.pattern.base': 'Invalid CNIC Format',
    "string.empty": "CNIC is optional but it cannot be empty"
  }),
  phoneNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'any.required': 'Phone number is required.',
    'string.base': 'Phone number must be a string.',
    'string.pattern.base': 'Invalid Phone Number Format'
  }),
  whatsappNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'any.required': 'WhatsApp number is required.',
    'string.base': 'WhatsApp number must be a string.',
    'string.pattern.base': 'Invalid WhatsApp Number Format'
  }),
  houseFlatNumber: Joi.string().optional().messages({
    'string.base': 'House/Flat number must be a string.',
    "string.empty": "House/Flat number is optional but cannot be empty"
  }),
  address: Joi.string().required().messages({
    'any.required': 'Address is required.',
    'string.base': 'Address must be a string.',
    "string.empty": "Date of Birth is optional but cannot be empty"
  }),
  city: Joi.string().optional().messages({
    'string.base': 'City must be a string.',
    "string.empty": "City is optional but cannot be empty"
  }),
  province: Joi.string().optional().messages({
    'string.base': 'Province must be a string.',
    "string.empty": "Province is optional but cannot be empty"
  }),
  countryCode: Joi.string().optional().messages({
    'string.base': 'Country code must be a string.',
    "string.empty": "Country code is optional but cannot be empty"
  }),
  countryName: Joi.string().optional().messages({
    'string.base': 'Country name must be a string.',
    "string.empty": "Country name is optional but cannot be empty"
  }),
});


module.exports = { customerValidationSchema, partnerValidationSchema, buyerRepresentativeValidationScehma };
