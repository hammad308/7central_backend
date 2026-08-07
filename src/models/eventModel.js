const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    people: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Event must have at least one attendee'],
      },
    ],
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [1, 'Event title cannot be empty'],
      maxlength: [200, 'Event title cannot exceed 200 characters'],
    },
    allDay: {
      type: Boolean,
      required: [true, 'All day status is required'],
      default: false,
    },
    startDate: {
      type: Date,
      required: [true, 'Event start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Event end date is required'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      required: [true, 'Event status is required'],
    },
    description: {
      type: String,
      default: null,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    recordStatus: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);