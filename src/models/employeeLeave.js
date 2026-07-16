"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const employeeLeaveSchema = new Schema(
  {
    employeeLeaveID: {
      type: Number,
      default: null
    },
    employeeID: { //leave of which employee
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "Employee ID is required"],
    },
    title: {
      type: String,
      required: [true, "Leave title is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Leave start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "Leave end date is required"],
    },
    type: {
      type: String,
      enum: ['Casual', 'Medical'],
      required: [true, "Leave type is required"],
    },
    status: {
      type: String,
      enum: ['Pending', 'Granted', 'Declined'],
      default: "Pending"
    },
    description: {
      type: String,
      default: null
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

module.exports = mongoose.model("EmployeeLeave", employeeLeaveSchema);