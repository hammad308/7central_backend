"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeComplaintSchema = new Schema(
  {
    employeeComplaintID: {
      type: Number,
      default: null
    },
    employeeID: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "Employee ID is required."]
    },
    type: {
      type: String,
      enum: [
        'complaint',
        'suggestion',
      ],
      required: [true, 'Complaint type is required.'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'solved',
        'unsolvable',
      ],
      default: 'pending'
    },
    subject: {
      type: String,
      required: [true, "Complaint subject is required."]
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

module.exports = mongoose.model("EmployeeComplaint", employeeComplaintSchema);