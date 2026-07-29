const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema({
    codeId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    cnic: {
        type: String,
        required: true,
        unique: true
    },
    dealerType: {
        type: String,
        enum: ['7central_registered', 'dha_registered', 'freelance_regsitered'],
        default: 'freelance_registered',
        index: true
    },
    dhaRegistrationNumber: {
        type: String,
        default: ""
    },
    sevenCentralRegistrationNumber: {
        type: String,
        default: ""
    },
    passportName: {
        type: String,
        default: ""
    },
    profession: {
        type: String,
        default: ""
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'not_selected'],
        default: 'not_selected'
    },
    education: {
        type: String,
        enum: ['matric', 'intermediate', 'undergraduate', 'graduate', 'masters', 'mphil', 'phd', 'not_selected'],
        default: 'not_selected'
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    phoneNumber2: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    whatsappNumber: {
        type: String,
        required: [true, 'WhatsApp number is required']
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
        required: true,
    },
    address2: {
        type: String,
        default: null,
    },
    city: {
        type: String,
        default: null,
        index: true
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
    image: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'resigned', 'terminated'],
        default: 'active',
        index: true
    }
}, {
    timestamps: true
});

dealerSchema.index({ createdAt: -1 });
dealerSchema.index({ city: 1, name: 1 });
dealerSchema.index({ city: 1, createdAt: -1 });
dealerSchema.index({ city: 1, phoneNumber: 1 });
dealerSchema.index({ phoneNumber: 1, createdAt: -1 });
dealerSchema.index({ name: 1, createdAt: -1 });
dealerSchema.index({ dealerType: 1, createdAt: -1 });

module.exports = mongoose.model('Dealer', dealerSchema)