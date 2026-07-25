const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeLeaveSchema = new Schema(
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
    title: {
      type: String,
      required: [true, 'Leave title is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    type: {
      type: String,
      enum: ['Casual', 'Medical'],
      required: [true, 'Leave type is required'],
    },
    leaveStatus: {
      // renamed to avoid conflict with record `status`
      type: String,
      enum: ['Pending', 'Granted', 'Declined'],
      default: 'Pending',
    },
    description: {
      type: String,
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

module.exports = mongoose.model('EmployeeLeave', employeeLeaveSchema);