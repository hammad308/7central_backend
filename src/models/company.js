"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const AppError = require("../utils/appError.js");
const companySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
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

module.exports = mongoose.model("Company", companySchema);