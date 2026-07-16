"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const leaveRuleSchema = new Schema(
  {
    leaveRuleID: {
      type: Number,
      default: null
    },
    roleID: { 
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, "Role ID is required"],
    },
    casualLeaves: {
      type: Number,
      required: [true, "Casual leaves is required"],
    },
    medicalLeaves: {
      type: Number,
      required: [true, "Medical leaves is required"],
    },
    halfDayDeduction: {
      type: Number,
      required: [true, "Half day deduction is required"],
    },
    offDayDeduction: {
      type: Number,
      required: [true, "Off day deduction is required"],
    },
    absentDayDeduction: {
      type: Number,
      required: [true, "Absent day deduction is required"],
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

module.exports = mongoose.model("LeaveRule", leaveRuleSchema);