"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const employeeAttendanceSchema = new Schema(
  {
    employeeAttendanceID: {
      type: Number,
      default: null
    },
    employeeID: { //Attendance for which employee?
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "Employee ID is required."]
    },
    status: {
      type: String,
      enum: ['On Time', 'Late', 'Half Day', 'Off Day'],
      required: [true, "Status is required"]
    },
    checkInTime: {
      type: Date,
      required: [true, "Check in time is required"]
    },
    checkOutTime: {
      type: Date,
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

module.exports = mongoose.model("EmployeeAttendance", employeeAttendanceSchema);