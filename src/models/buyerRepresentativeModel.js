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
        required: false,
        default: ""
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
        required: true
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

const BuyerRepresentative = mongoose.model('BuyerRepresentative', BuyerRepresentativeSchema);
module.exports = BuyerRepresentative;