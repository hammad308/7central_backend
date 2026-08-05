"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockItemSchema = new Schema(
  {
    stockItemID: { //custom ID
      type: Number,
      required: [true, "Stock item custom ID is required."]
    },
    stockItemSKU: {
      type: String,
      unique: true,
      required: [true, "Stock item SKU is required."]
    },
    stockItemCreator: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Stock item creator is required."]
    },
    stockItemCategoryObjectId: {
      type: Schema.Types.ObjectId,
      ref: "StockCategory",
      required: [true, "Stock item category is required."]
    },
    stockItemName: {
      type: String,
      required: [true, "Stock item name is required."]
    },
    currentQuantity: {
      type: Number,
      required: [true, "Stock item current quantity is required."]
    },
    currentPrice: {
      type: Number,
      required: [true, "Stock item current price is required."]
    },
    stockItemUnitOfMeasure: {
      type: String,
      required: [true, "Stock item unit of measure is required."]
    },
    builtin: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StockItem", stockItemSchema);