const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const publicHolidaySchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    type: {
      type: String,
      enum: ['Public', 'Company'],
      required: [true, 'Holiday type is required'],
    },
    description: {
      type: String,
      default: '',
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

module.exports = mongoose.model('PublicHoliday', publicHolidaySchema);