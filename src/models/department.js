"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const departmentSchema = new Schema(
  {
    department_name: {
      type: String,
      required: [true, "Department name is required"],
    },
    company_id: { //A department can't exist on its own
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, "Company ID is required"]
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

module.exports = mongoose.model("Department", departmentSchema);