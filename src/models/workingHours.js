"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const hourAndMinuteSchema = new Schema(
  {
    hour: {
      type: Number,
      required: [true, "Hour is required."]
    },
    minute: {
      type: Number,
      required: [true, "Minute is required."]
    },
  }
);

const workingHoursSchema = new Schema(
  {
    workingHoursID: {
      type: Number,
      default: null
    },
    shiftTitle: {
      type: String,
      required: [true, "Working shift title is required"]
    },
    shiftStart: {
      type: hourAndMinuteSchema,
      required: [true, "Working shift start time is required"]
    },
    shiftEnd: {
      type: hourAndMinuteSchema,
      required: [true, "Working shift start time is required"]
    },
    isLatePolicy: {
      type: Boolean,
      required: [true, "Is late coming policy being implemented?"]
    },
    onTime: {
      type: hourAndMinuteSchema,
      default: null
    },
    halfDay: {
      type: hourAndMinuteSchema,
      default: null
    },
    offDay: {
      type: hourAndMinuteSchema,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("WorkingHour", workingHoursSchema);