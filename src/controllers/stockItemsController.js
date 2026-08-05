"use strict";

const mongoose = require("mongoose");
const stockItemValidationSchema = require("../validations/stockItemValidationSchema.js");
const StockItem = require("../models/stockItem.js");
const Employee = require("../models/employee.js");
const StockCategory = require("../models/stockCategory.js");
const { getNextInSequence } = require("../utils/db.js");
const { findOneDocument } = require("../utils/findDocuments.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const AppError = require("../utils/appError.js");

module.exports = {
  create: async (req, res, next) => {
    let validData = null;
    try {
      validData = await stockItemValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    try {
      //Checking if stockItemSKU already exists
      const existingStockItem = await StockItem.findOne({ stockItemSKU: validData.stockItemSKU, isActive: true });
      if (existingStockItem) {
        sendErrorResponse(res, 422, {
          message: "Stock item's SKU already exists. Please choose some other SKU name.",
          doc: null
        });
        return; //early return
      }

      if (!validData.stockItemCreator) { //not sent from front-end
        validData.stockItemCreator = req.user.employee_id;
      }
      else { //sent from front-end
        const employee = await findOneDocument(Employee, validData.stockItemCreator);
        if (!employee) {
          sendErrorResponse(res, 422, {
            message: "Invalid employee Object ID!",
            doc: null
          });
          return; //early return
        }
      }

      const stockCategory = await findOneDocument(StockCategory, validData.stockItemCategoryObjectId);
      if (!stockCategory) {
        sendErrorResponse(res, 422, {
          message: "Invalid stock category Object ID!",
          doc: null
        });
        return; //early return
      }

      const newIDNumber = await getNextInSequence("stockitems");
      const newStockItem = await StockItem.create({ ...validData, stockItemID: newIDNumber });
      sendSuccessResponse(res, 200, {
        message: "Stock Item created successfully!",
        doc: newStockItem,
      });
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
      let stockItems;

      if (req.query.skip === "no") {
        stockItems = await StockItem.find({ isActive: true });
      }
      else {
        stockItems = await StockItem.find({ isActive: true })
          .limit(pageSize)
          .skip(pageSize * (page - 1))
          .populate([
            {
              path: 'stockItemCategoryObjectId'
            },
          ])
          .exec();
      }

      const docsCount = await StockItem.countDocuments({ isActive: true });

      sendSuccessResponse(res, 200, {
        docs: stockItems,
        docsCount: docsCount
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  getAllOfCategory: async (req, res, next) => {
    //TODO: Pagination
    try {
      const stockItems = await StockItem.find({ stockItemCategoryObjectId: req.params.id, isActive: true })
        .populate([
          { path: 'stockItemCategoryObjectId' },
        ])
        .exec();
      const docsCount = await StockItem.countDocuments({ isActive: true });
      sendSuccessResponse(res, 200, {
        docs: stockItems,
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
      const stockItem = await StockItem.findOne({ _id: req.params.id, isActive: true })
        .populate([
          { path: 'stockItemCategoryObjectId' },
        ])
        .exec();
      if (stockItem) {
        sendSuccessResponse(res, 200, {
          message: "StockItem found!",
          doc: stockItem,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "StockItem not found!",
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

    const existingStockItem = await findOneDocument(StockItem, req.params.id);
    if (!existingStockItem) {
      sendErrorResponse(res, 422, {
        message: "Stock item not found!",
        doc: null
      });
      return; //early return
    }

    let validData = null;
    try {
      validData = await stockItemValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }

    try {
      //Checking if stockItemSKU already exists
      const existingStockItem = await StockItem.findOne({
        stockItemSKU: validData.stockItemSKU,
        isActive: true
      });
      //and doesn't belongs to the current MongoDB document being edited
      if (existingStockItem && existingStockItem._id.toString() !== req.params.id) {
        sendErrorResponse(res, 422, {
          message: "Stock item's SKU already exists. Please choose some other SKU name.",
          doc: existingStockItem
        });
        return; //early return
      }

      if (!validData.stockItemCreator) { //not sent from front-end
        validData.stockItemCreator = req.user.employee_id;
      }
      else { //sent from front-end
        const employee = await findOneDocument(Employee, validData.stockItemCreator);
        if (!employee) {
          sendErrorResponse(res, 422, {
            message: "Invalid employee Object ID!",
            doc: null
          });
          return; //early return
        }
      }

      const stockCategory = await findOneDocument(StockCategory, validData.stockItemCategoryObjectId);
      if (!stockCategory) {
        sendErrorResponse(res, 422, {
          message: "Invalid stock category Object ID!",
          doc: null
        });
        return; //early return
      }

      const updatedStockItem = await StockItem.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { ...validData }
      );
      sendSuccessResponse(res, 200, {
        message: "Stock item updated successfully!",
        doc: updatedStockItem,
      });
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed', 500));
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
      const stockItem = await StockItem.findOne({ _id: req.params.id, isActive: true });
      if (!stockItem) {
        sendErrorResponse(res, 404, {
          message: "StockItem not found!",
          doc: null
        });
      }
      //if ()
      await StockItem.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false }
      );
      sendSuccessResponse(res, 200, {
        message: 'Stock item deleted successfully.',
        doc: null
      });
    }
    catch (error) {
      console.log(error);
      next(error);
    }
  },
}