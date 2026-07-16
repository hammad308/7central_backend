"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const employeeBonusSchema = new Schema(
  {
    employeeBonusID: {
      type: Number,
      default: null
    },
    employeeIDs: [ {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    } ],
    bonusAmount: {
      type: Number,
      required: [true, "Bonus amount is required."]
    },
    bonusType: {
      type: String,
      enum: [
        'yearEnd', 
        'eidAlFitr', 
        'eidAlAdha',
        'other'
      ],
      required: [true, 'Bonus type is required.'],
    },
    bonusMonth: {
      type: Date, 
      required: [true, 'Bonus month is required.'],
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

module.exports = mongoose.model("EmployeeBonus", employeeBonusSchema);