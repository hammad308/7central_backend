const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeIncrementSchema = new Schema(
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
    incrementAmount: {
      type: Number,
      required: [true, 'Increment amount is required'],
    },
    incrementType: {
      type: String,
      enum: ['costOfLiving', 'performance', 'promotion'],
      required: [true, 'Increment type is required'],
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

module.exports = mongoose.model('EmployeeIncrement', employeeIncrementSchema);