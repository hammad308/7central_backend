const mongoose = require('mongoose');

const employeeNotificationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  redirectPage: {
    type: String,  
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('EmployeeNotification', employeeNotificationSchema);