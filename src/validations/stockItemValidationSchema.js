const joi = require('joi');

const stockItemValidationSchema = joi.object().keys({
  stockItemSKU: joi.string().min(3).required(),
  stockItemCreator: joi.string().optional(), //ObjectId
  stockItemCategoryObjectId: joi.string().required(), //ObjectId
  stockItemName: joi.string().required(),
  currentQuantity: joi.number().min(0).required(),
  currentPrice: joi.number().min(0).required(),
  stockItemUnitOfMeasure: joi.string().required(),
});

module.exports = stockItemValidationSchema;