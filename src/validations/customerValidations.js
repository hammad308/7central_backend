const Joi = require('joi');
const { CUSTOMER_RELATION_TYPES } = require('../constants/app.constants');
const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const customerValidationSchema = Joi.object({
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
  passportName: Joi.string().allow(null, '').optional().messages({
    'string.base': 'Passport name must be a string.',
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
  customerType: Joi.string().valid('Original Buyer', 'Referal').label("Customer Type").optional().messages({
    'any.only': '{#label} must be one of the following: {#valids}',
    'string.base': '{#label} must be a String'
  }),
  filerType: Joi.string()
    .valid('filer', 'non_filer')
    .label('Filer Type')
    .when('customerType', {
      is: Joi.exist().valid('Original Buyer'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.base': 'Filer Type must be a string',
      'any.only': '{#label} must be one of the following: {#valids}',
      'any.required': 'filer Type is required, When you select Customer Type [Original Buyer]'
    }),
  nttNumber: Joi.string().when('filerType', {
    is: Joi.exist().valid('filer'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'string.base': 'NTT Number must be a string',
    'any.required': 'NTT Number is required, when Filer Type is selected as Filer'
  }),
  image: Joi.string()
    .dataUri()
    .allow(null, "")   // allow empty or null
    .optional()
    .messages({
      'string.dataUri': 'Invalid image format. Must be a valid Data URI.'
    }),
});

const partnerValidationSchema = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),
  name: Joi.string().required().messages({
    'any.required': 'Name is required.',
    'string.base': 'Name must be a string.',
  }),
  fatherName: Joi.string().required().messages({
    'any.required': 'Father/Husband name is required.',
    'string.base': 'Father/Husband name must be a string.',
  }),
  cnic: Joi.string().required().messages({
    'any.required': 'CNIC/NICOP number is required.',
    'string.base': 'CNIC must be a string.',
  }),
  dateOfBirth: Joi.date().allow('', null).less("now").iso().optional().messages({
    'date.base': 'Please enter a valid date',
    'date.format': 'Please enter a valid Format of Date YYYY-MM-DD',
    'date.less': 'Date of Birth Cant be in future'
  }),
  relationType: Joi.string()
    .valid(...CUSTOMER_RELATION_TYPES).optional()
    .allow(null)
    .messages({
      'any.only': `Relation type must be one of: ${CUSTOMER_RELATION_TYPES.join(', ')}.`,
    }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please enter a valid email.',
    'string.base': 'Email must be a string'
  }),
  passportNumber: Joi.string().allow(null, '').messages({
    'string.base': 'Passport name must be a string.',
  }),
  phoneNumber: Joi.string().required().messages({
    'any.required': 'Phone number is required',
    'string.base': 'Phone number must be a string.',
  }),
  houseFlatNumber: Joi.string().allow(null, '').messages({
    'string.base': 'House/Flat number must be a string.',
  }),
  address: Joi.string().required().messages({
    'string.base': 'Address must be a string.',
    'any.required': 'Address is required'
  }),
  address2: Joi.string().allow(null, '').messages({
    'string.base': 'Address 2 must be a string.',
  }),
  city: Joi.string().allow(null, '').messages({
    'string.base': 'City must be a string.',
  }),
  province: Joi.string().allow(null, '').messages({
    'string.base': 'Province must be a string.',
  }),
  countryCode: Joi.string().allow(null, '').messages({
    'string.base': 'Country code must be a string.',
  }),
  countryName: Joi.string().allow(null, '').messages({
    'string.base': 'Country name must be a string.',
  }),
  country: Joi.string().allow(null, '').messages({
    'string.base': 'Country name must be a string.',
  }),
  // image: Joi.string().allow(null,'').messages({
  //   'string.base': 'Image must be a string.',
  // }),

});

const buyerRepresentativeValidationScehma = Joi.object({
  customer: objectId.required().messages({
    'any.required': 'Customer ID is required.',
    'string.base': 'Customer ID must be a string.',
  }),
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
  cnic: Joi.string().optional().allow(null,"").messages({
    'string.base': 'CNIC must be a string.',
  }),
  phoneNumber: Joi.string().required().messages({
    'any.required': 'Primary phone number is required.',
    'string.base': 'Phone number must be a string.',
  }),
  whatsappNumber: Joi.string().required().messages({
    'any.required': 'Primary WhatsApp number is required.',
    'string.base': 'WhatsApp number must be a string.',
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
  })
});


module.exports = { customerValidationSchema, partnerValidationSchema, buyerRepresentativeValidationScehma };
