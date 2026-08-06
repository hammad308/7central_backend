const mongoose = require('mongoose');
const { Schema } = mongoose;

const fileAttachmentSchema = new Schema({
  clientFileName: {
    type: String,
    required: [true, 'Attached file name is required.'],
  },
  fileNameOnServerDisk: {
    type: String,
    required: [true, "Name of file stored on server's disk is required."],
  },
});

const subTaskSchema = new Schema({
  subtaskTitle: {
    type: String,
    required: [true, 'Subtask title is required.'],
  },
  subtaskDescription: {
    type: String,
    default: null,
  },
  subtaskStatus: {
    type: Number,
    enum: [0, 1], // 0 - pending, 1 - finished
    required: [true, 'Subtask status is required'],
  },
  employeeID: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Subtask should be assigned to at least one employee!'],
  },
});

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required.'],
    },
    employeeID: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
  },
  { timestamps: true }
);

const employeeTaskSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    employeeIDs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Task should be assigned to at least one employee!'],
      },
    ],
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Task should have exactly one supervisor!'],
    },
    taskTitle: {
      type: String,
      required: [true, 'Task title is required'],
    },
    taskDescription: {
      type: String,
      default: null,
    },
    taskStartByDate: {
      type: Date,
      required: [true, 'Task start by date is required'],
    },
    taskFinishByDate: {
      type: Date,
      required: [true, 'Task finish by date is required'],
    },
    taskActualFinishDate: {
      type: Date,
      default: null,
    },
    taskStatus: {
      type: Number,
      enum: [0, 1], // 0 - pending, 1 - finished
      required: [true, 'Task status is required'],
    },
    taskPriority: {
      type: Number,
      enum: [0, 1, 2, 3], // 0 - low, 1 - normal, 2 - high, 3 - urgent
      required: [true, 'Task priority is required'],
    },
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active',
      index: true,
    },
    subtasks: [subTaskSchema],
    attachments: [fileAttachmentSchema],
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeTask', employeeTaskSchema);