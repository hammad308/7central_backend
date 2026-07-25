const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const departmentSchema = new Schema(
  {
    autoIncrementId: {
      type: Number,
      default: null,
    },
    longAutoIncrementId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent exact duplicate names within the same company (across all statuses)
departmentSchema.index({ name: 1, company: 1 }, { unique: false }); // we handle uniqueness manually

module.exports = mongoose.model('Department', departmentSchema);