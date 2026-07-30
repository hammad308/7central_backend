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

const employeeValidationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'any.required': 'Full name is required',
    'string.min': 'Name must be at least 3 characters',
  }),
  fatherName: Joi.string().min(3).max(100).required().messages({
    'any.required': 'Father name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please provide a valid email',
  }),
  cnic: Joi.string().required().messages({
    'any.required': 'CNIC is required',
  }),
  phoneNumber: Joi.string().required().messages({
    'any.required': 'Phone number is required',
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
});

module.exports = employeeValidationSchema;