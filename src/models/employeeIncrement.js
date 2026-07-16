"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeIncrementSchema = new Schema(
  {
    employeeIncrementID: {
      type: Number,
      default: null
    },
    employeeID: { //increment for which employee?
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "Employee ID is required."]
    },
    incrementAmount: {
      type: Number,
      required: [true, "Increment amount is required."]
    },
    incrementType: {
      type: String,
      enum: ['costOfLiving', 'performance', 'promotion'],
      required: [true, 'Increment type is required.'],
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

module.exports = mongoose.model("EmployeeIncrement", employeeIncrementSchema);