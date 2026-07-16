const joi = require('joi');

const companyValidationSchema = joi.object().keys({
  department_name: joi.string().min(3).required(),
  company_id: joi.string().min(24).required(), //24 characters hex value
});

module.exports = companyValidationSchema;