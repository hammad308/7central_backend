const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BuyerRepresentativeSchema = new Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "Customer is required."],
        index: true,
    },
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        index: true,
        required: [true, 'Email is required.']
    },
    cnic: {
        type: String,
        required: false,
        default:""
    },
    phoneNumber: {
        type: String,
        required: true
    },
    whatsappNumber: {
        type: String,
        required: true
    },
    houseFlatNumber: {
        type: String,
        default: null,
    },
    address: {
        type: String,
        default: null,
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
    }
}, { timestamps: true });

const BuyerRepresentative= mongoose.model('BuyerRepresentative', BuyerRepresentativeSchema);
module.exports = BuyerRepresentative;