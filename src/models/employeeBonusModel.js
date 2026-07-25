const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeBonusSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
      },
    ],
    amount: {
      type: Number,
      required: [true, 'Bonus amount is required'],
    },
    bonusType: {
      type: String,
      enum: ['yearEnd', 'eidAlFitr', 'eidAlAdha', 'other'],
      required: [true, 'Bonus type is required'],
    },
    bonusMonth: {
      type: Date,
      required: [true, 'Bonus month is required'],
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

module.exports = mongoose.model('EmployeeBonus', employeeBonusSchema);