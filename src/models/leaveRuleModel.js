const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaveRuleSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role is required'],
      unique: true, // One leave rule per role
    },
    casualLeaves: {
      type: Number,
      required: [true, 'Casual leaves count is required'],
    },
    medicalLeaves: {
      type: Number,
      required: [true, 'Medical leaves count is required'],
    },
    halfDayDeduction: {
      type: Number,
      required: [true, 'Half day deduction is required'],
    },
    offDayDeduction: {
      type: Number,
      required: [true, 'Off day deduction is required'],
    },
    absentDayDeduction: {
      type: Number,
      required: [true, 'Absent day deduction is required'],
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

module.exports = mongoose.model('LeaveRule', leaveRuleSchema);