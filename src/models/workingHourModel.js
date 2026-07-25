const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hourAndMinuteSchema = new Schema(
  {
    hour: {
      type: Number,
      required: [true, 'Hour is required'],
      min: 0,
      max: 23,
    },
    minute: {
      type: Number,
      required: [true, 'Minute is required'],
      min: 0,
      max: 59,
    },
  },
  { _id: false }
);

const workingHourSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    shiftTitle: {
      type: String,
      required: [true, 'Shift title is required'],
    },
    shiftStart: {
      type: hourAndMinuteSchema,
      required: [true, 'Shift start time is required'],
    },
    shiftEnd: {
      type: hourAndMinuteSchema,
      required: [true, 'Shift end time is required'],
    },
    isLatePolicy: {
      type: Boolean,
      required: [true, 'Late policy flag is required'],
    },
    onTime: {
      type: hourAndMinuteSchema,
      default: null,
    },
    halfDay: {
      type: hourAndMinuteSchema,
      default: null,
    },
    offDay: {
      type: hourAndMinuteSchema,
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

module.exports = mongoose.model('WorkingHour', workingHourSchema);