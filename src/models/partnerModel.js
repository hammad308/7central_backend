const mongoose = require('mongoose');
const { CUSTOMER_PARTNER_TYPES, CUSTOMER_RELATION_TYPES } = require('../constants/app.constants');
const Schema = mongoose.Schema;

const partnerSchema = new Schema({
  autoIncrementId: {
    type: Number,
    default: null,
  },
  longAutoIncrementId: {
    type: String,
    default: null,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: [true, "Customer is required."],
    index: true,
  },
  type: {
    type: String,
    enum: [...CUSTOMER_PARTNER_TYPES],
    required: [true, "Partner  type is required."],
    index: true,
  },
  name: {
    type: String,
    required: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name must not exceed 50 characters']
  },
  fatherName: {
    type: String,
    required: true,
    minlength: [3, 'Father Name must be at least 3 characters'],
    maxlength: [50, 'Father Name must not exceed 50 characters']
  },
  cnic: {
    type: String,
    required: true
  },
  relationType: {
    type: String,
    enum: [...CUSTOMER_RELATION_TYPES]
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
    required: false,
    validate: {
      validator: function (value) {
        return !value || value <= new Date();
      },
      message: "Date of birth cannot be in the future"
    }
  },
  passportNumber: {
    type: String,
    default: ""
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  houseFlatNumber: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    required: true,
  },
  address2: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  province: {
    type: String,
    default: null,
  },
  countryCode: {
    type: String,
    default: null,
  },
  countryName: {
    type: String,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ['not_assigned', 'assigned', 'blocked', 'deleted'],
    default: 'assigned',
    index: true
  },

}, { timestamps: true });

const Partner = mongoose.model('Partner', partnerSchema);
module.exports = Partner;