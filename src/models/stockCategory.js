"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const stockCategorySchema = new Schema(
  {
    stockCategoryName: {
      type: String,
      required: [true, "Stock Category name is required."],
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

module.exports = mongoose.model("StockCategory", stockCategorySchema);