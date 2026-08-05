const joi = require('joi');

const projectCategoryValidationSchema = joi.object().keys({
  projectCategoryName: joi.string().min(3).required(),
});

module.exports = projectCategoryValidationSchema;