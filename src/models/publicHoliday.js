"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const publicHolidaySchema = new Schema(
  {
    publicHolidayID: {
      type: Number,
      default: null
    },
    title: {
      type: String,
      required: [true, "Public holiday title is required"],
    },
    date: {
      type: Date,
      required: [true, "Public holiday date is required"],
    },
    type: {
      type: String,
      enum: ['Public', 'Company'],
      required: [true, "Public holiday type is required"],
    },
    description: {
      type: String,
      default: ""
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

module.exports = mongoose.model("PublicHoliday", publicHolidaySchema);