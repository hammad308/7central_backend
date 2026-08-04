const Joi = require('joi');

const degreeValidationSchema = Joi.object({
  yearsOfEducation: Joi.number().valid(10, 12, 16, 18).required().messages({
    'any.required': 'Years of education is required',
  }),
  degreeTitle: Joi.string().required().messages({
    'any.required': 'Degree title is required',
  }),
  awardingOrg: Joi.string().required().messages({
    'any.required': 'Degree awarding organization is required',
  }),
  passingYear: Joi.number().integer().min(1910).max(2224).required().messages({
    'any.required': 'Passing year is required',
  }),
  obtainedMarks: Joi.number().required().messages({
    'any.required': 'Obtained marks is required',
  }),
  totalMarks: Joi.number().required().messages({
    'any.required': 'Total marks is required',
  }),
});

const createEmployeeValidationSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'Username cannot be empty',
    'any.required': 'Username is required',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username Cannot exceed 50 characters'
  }),
  fullName: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name Cannot exceed 50 characters'
  }),
  fatherName: Joi.string().trim().min(3).max(50).required().messages({
    'string.empty': 'Father Name cannot be empty',
    'any.required': 'Father name is required',
    'string.min': 'Father Name must be at least 3 characters',
    'string.max': 'Father Name Cannot exceed 50 characters'
  }),
  email: Joi.string().email().trim().lowercase().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please provide a valid email'
  }),
  cnic: Joi.string().pattern(/^\d{13}$/).required().messages({
    'any.required': 'CNIC is required',
    'string.pattern.base': 'Invalid CNIC format'
  }),
  phoneNumber: Joi.string().pattern(/^03\d{9}$/).required().messages({
    'string.pattern.base': 'Invalid Phone Number format',
    'any.required': 'Phone number is required'
  }),
  image: Joi.string().dataUri().allow(null, '').optional().messages({
    'string.dataUri': 'Invalid image format. Must be a valid Data URI.',
  }),
  employmentStatus: Joi.string()
    .valid('active', 'on_leave', 'terminated', 'resigned')
    .required()
    .messages({
      'any.required': 'Employment status is required',
    }),
  gender: Joi.string().valid('male', 'female', 'other').required().messages({
    'any.required': 'Gender is required',
  }),
  role: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Role ID is required',
      'string.pattern.base': 'Invalid role ID',
    }),
  roleSlug: Joi.string().lowercase().required().messages({
    'any.required': 'Role slug is required',
  }),
  workingShift: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Working shift is required',
      'string.pattern.base': 'Invalid working shift ID',
    }),
  birthDate: Joi.date().iso().required().messages({
    'any.required': 'Birth date is required',
  }),
  joiningDate: Joi.date().iso().required().messages({
    'any.required': 'Joining date is required',
  }),
  referredBy: Joi.string().allow(null, '').optional(),
  permanentAddress: Joi.string().required().messages({
    'any.required': 'Permanent address is required',
  }),
  mailingAddress: Joi.string().allow(null, '').optional(),
  salary: Joi.number().min(0).required().messages({
    'any.required': 'Salary is required',
  }),
  company: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Company ID is required',
      'string.pattern.base': 'Invalid company ID',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Department ID is required',
      'string.pattern.base': 'Invalid department ID',
    }),
  degrees: Joi.array().items(degreeValidationSchema).min(1).required().messages({
    'any.required': 'At least one degree is required',
  }),
  cnicFront: Joi.string().dataUri().allow(null, '').optional().messages({
    'string.dataUri': 'Invalid image format for CNIC front',
  }),
  cnicBack: Joi.string().dataUri().allow(null, '').optional().messages({
    'string.dataUri': 'Invalid image format for CNIC back',
  }),
  resume: Joi.string().allow(null, '').optional(),
  policeCertificate: Joi.string().dataUri().allow(null, '').optional().messages({
    'string.dataUri': 'Invalid image format for police certificate',
  }),
  status: Joi.string().optional().valid('active', 'inactive', 'deleted').messages({
    'any.only': 'Status should be one of the following: {#valids}'
  })
});

const updateEmployeeValidationSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).messages({
    'string.empty': 'Username cannot be empty',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username Cannot exceed 50 characters'
  }),
  fullName: Joi.string().trim().min(3).max(50).messages({
    'string.empty': 'Name cannot be empty',
    'string.min': 'Name must be at least 3 characters',
    'string.max': 'Name Cannot exceed 50 characters'
  }),
  fatherName: Joi.string().trim().min(3).max(50).messages({
    'string.empty': 'Father Name cannot be empty',
    'string.min': 'Father Name must be at least 3 characters',
    'string.max': 'Father Name Cannot exceed 50 characters'
  }),
  email: Joi.string().email().trim().lowercase().messages({
    'string.email': 'Please provide a valid email'
  }),
  cnic: Joi.string().pattern(/^\d{13}$/).messages({
    'string.pattern.base': 'Invalid CNIC format'
  }),
  phoneNumber: Joi.string().pattern(/^03\d{9}$/).messages({
    'string.pattern.base': 'Invalid Phone Number format'
  }),
  image: Joi.string().dataUri().allow(null, '').messages({
    'string.dataUri': 'Invalid image format. Must be a valid Data URI.',
  }),
  employmentStatus: Joi.string()
    .valid('active', 'on_leave', 'terminated', 'resigned')
    .messages({}),
  gender: Joi.string().valid('male', 'female', 'other').messages({}),
  role: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid role ID',
    }),
  roleSlug: Joi.string().lowercase().messages({}),
  workingShift: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid working shift ID',
    }),
  birthDate: Joi.date().iso().messages({}),
  joiningDate: Joi.date().iso().messages({}),
  referredBy: Joi.string().allow(null, '').optional(),
  permanentAddress: Joi.string().messages({}),
  mailingAddress: Joi.string().allow(null, '').optional(),
  salary: Joi.number().min(0).messages({}),
  company: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid company ID',
    }),
  department: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid department ID',
    }),
  degrees: Joi.array().items(degreeValidationSchema).min(1).messages({}),
  cnicFront: Joi.string().dataUri().allow(null, '').messages({
    'string.dataUri': 'Invalid image format for CNIC front',
  }),
  cnicBack: Joi.string().dataUri().allow(null, '').messages({
    'string.dataUri': 'Invalid image format for CNIC back',
  }),
  resume: Joi.string().allow(null, '').optional(),
  policeCertificate: Joi.string().dataUri().allow(null, '').messages({
    'string.dataUri': 'Invalid image format for police certificate',
  }),
  status: Joi.string().valid('active', 'inactive', 'deleted').messages({
    'any.only': 'Status should be one of the following: {#valids}'
  })
});

module.exports = {
  createEmployeeValidationSchema,
  updateEmployeeValidationSchema
};