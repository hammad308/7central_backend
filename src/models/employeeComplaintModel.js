const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeComplaintSchema = new Schema(
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
    type: {
      type: String,
      enum: ['complaint', 'suggestion'],
      required: [true, 'Complaint type is required'],
    },
    complaintStatus: {
      // renamed to avoid conflict with record `status`
      type: String,
      enum: ['pending', 'solved', 'unsolvable'],
      default: 'pending',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
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

module.exports = mongoose.model('EmployeeComplaint', employeeComplaintSchema);