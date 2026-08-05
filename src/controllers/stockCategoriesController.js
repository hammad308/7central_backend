"use strict";

const mongoose = require("mongoose");
const stockCategoryValidationSchema = require("../validations/stockCategoryValidationSchema.js");
const StockCategory = require("../models/stockCategory.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const AppError = require("../utils/appError.js");

module.exports = {
  create: async (req, res, next) => {
    let validData = null;
    try {
      validData = await stockCategoryValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    try {
      //Checking if category name already exists
      const existingStockCategory = await StockCategory.findOne({
        stockCategoryName: validData.stockCategoryName,
        isActive: true
      });
      if (existingStockCategory) {
        sendErrorResponse(res, 422, {
          message: "Stock Category name already taken. Please choose some other name.",
          doc: existingStockCategory
        });
      }
      else {
        const newStockCategory = await StockCategory.create({ ...validData });
        sendSuccessResponse(res, 200, {
          message: "Stock Category created successfully!",
          doc: newStockCategory,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database create operation failed', 500));
    }
  },
  getAll: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      let stockcategories;

      if (req.query.skip === "no") {
        stockcategories = await StockCategory.find({ isActive: true });
      }
      else {
        stockcategories = await StockCategory.find({ isActive: true })
          .limit(pageSize)
          .skip(pageSize * (page - 1))
          .exec();
      }
      const docsCount = await StockCategory.countDocuments({ isActive: true });
      sendSuccessResponse(res, 200, {
        docs: stockcategories,
        docsCount: docsCount
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  getOne: async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        sendErrorResponse(res, 422, {
          message: "Invalid ID!",
          doc: null
        });
        return; //early return
      }
      const stockCategory = await StockCategory.findOne({ _id: req.params.id, isActive: true });
      if (stockCategory) {
        sendSuccessResponse(res, 200, {
          message: "Stock Category found!",
          doc: stockCategory,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "Stock Category not found!",
          doc: null
        });
      }
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  update: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    let validData = null;
    try {
      validData = await stockCategoryValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }
    try {
      const stockCategory = await StockCategory.findOne({ _id: req.params.id, isActive: true });
      if (!stockCategory) {
        sendErrorResponse(res, 404, {
          message: "Stock Category not found!",
          doc: null
        });
        return; //early return
      }
      else {
        const updatedStockCategory = await StockCategory.findOneAndUpdate(
          { _id: req.params.id, isActive: true },
          { ...validData },
          { new: true, runValidators: true }
        );
        sendSuccessResponse(res, 200, {
          message: "Stock Category updated successfully.",
          doc: updatedStockCategory,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  delete: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    try {
      const stockCategory = await StockCategory.findOne({ _id: req.params.id, isActive: true });
      if (!stockCategory) {
        sendErrorResponse(res, 404, {
          message: "Stock Category not found!",
          doc: null
        });
      }
      //TODO: Checking if at least one stock item belongs to this category.
      //Don't delete if category has at least one stock item.
      /*const stocks = await Stock.find({ stockCategory: req.params.id, isActive: true });
      if ( stocks.length > 0 ) {
        sendErrorResponse(res, 403, {
          message: "Stock Category has at least one stock. Delete stocks first!",
          doc: null
        });
      }*/
      await StockCategory.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false },
        { new: true, runValidators: true }
      );
      sendSuccessResponse(res, 200, {
        message: 'Stock Category deleted successfully.',
        doc: null
      });
    }
    catch (error) {
      console.log(error);
      next(error);
    }
  },
}