const joi = require('joi');

const stockCategoryValidationSchema = joi.object().keys({
  stockCategoryName: joi.string().min(3).required(),
});

module.exports = stockCategoryValidationSchema;