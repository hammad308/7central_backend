const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeAttendanceSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    attendanceStatus: {
      type: String,
      enum: ['On Time', 'Late', 'Half Day', 'Off Day'],
      required: [true, 'Attendance status is required'],
    },
    checkInTime: {
      type: Date,
      required: [true, 'Check-in time is required'],
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeAttendance', employeeAttendanceSchema);