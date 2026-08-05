"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const projectCategorySchema = new Schema(
  {
    projectCategoryName: {
      type: String,
      required: [true, "Project Category name is required."],
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

module.exports = mongoose.model("ProjectCategory", projectCategorySchema);