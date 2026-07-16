const joi = require('joi');

const degreeValidationSchema = joi.object().keys({
  degree_title: joi.string().required(),
  awarding_org: joi.string().required(),
  passing_year: joi.number().min(1910).max(2224).required(),
  obtained_marks: joi.number().required(),
  total_marks: joi.number().required(),
  years_of_education: joi.number().valid(10,12,16,18).required(),
});

const employeeValidationSchema = joi.object().keys({
  full_name: joi.string().min(3).required(),
  father_name: joi.string().min(3).required(),
  picture: joi.string().optional(),
  email: joi.string().email().lowercase().required(),
  employment_status: joi.number().valid(0,1,2,3).required(),
  gender: joi.number().valid(0,1,2).required(),
  birthdate: joi.date().iso().required(),
  joining_date: joi.date().iso().required(),
  cnic_number: joi.string().required(),
  mobile_phone_number: joi.string().required(),
  referred_by: joi.string().allow("").optional(), //allow empty string
  permanent_address: joi.string().required(),
  mailing_address: joi.string().allow("").optional(), //allow empty string
  salary: joi.number().min(0).required(),
  company: joi.string().required(),
  department: joi.string().required(),
  role_slug: joi.string().lowercase().required(),
  roleID: joi.string().required(),
  workingShift: joi.string().required(),
  cnic_front: joi.string().optional(),
  cnic_back: joi.string().optional(),
  resume: joi.string().optional(),
  police_certificate: joi.string().optional(),
  degrees: joi.array().items(degreeValidationSchema).required(),
});

module.exports = employeeValidationSchema;


/*
string().optional()
  { cnic_number: undefined } passes, { } passes, { cnic_number: null } fails,
  { cnic_number: '' } fails
string().required()
  { cnic_number: undefined } fails, { } fails, { cnic_number: null } fails, 
  { cnic_number: '' } fails
array().required() 
  { degrees: undefined } fails, { } fails, { degrees: null } fails, 
  { degrees: [] } passes
array().optional() 
  { degrees: undefined } passes, { } passes, { degrees: null } fails, 
  { degrees: [] } passes
array().min(1).required() {[]} fails
*/