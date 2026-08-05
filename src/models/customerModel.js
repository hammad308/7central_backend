const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const customerSchema = new Schema({
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
  email: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Email is required.']
  },
  cnic: {
    type: String,
    required: true
  },
  passportName: {
    type: String,
    default: ""
  },
  phoneNumber: {
    type: String,
    required: true
  },
  phoneNumber2: {
    type: String,
    default: ""
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  whatsappNumber2: {
    type: String,
    default: ""
  },
  houseFlatNumber: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    required: true
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
  filerType: {
    type: String,
    enum: ['filer', 'non_filer'],
    required: false
  },
  nttNumber: {
    type: String,
    required: false
  },
  image: {
    type: String,
    default: null,
  },
  isOriginalBuyer: {
    type: Boolean,
    required: true
  },
  profession: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: false,
    validate: {
      validator: function (value) {
        return !value || value <= new Date();
      },
      message: "Date of birth cannot be in the future"
    },
    default: null
  },
  gender: {
    type: String,
    default: null
  },
  education: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ['not_assigned', 'one_go_payment', 'full_paid', 'default', 'blocked', 'deleted', 'overdue', 'in_installment'],
    default: 'not_assigned',
    index: true
  },
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;