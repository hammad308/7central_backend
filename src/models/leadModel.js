const mongoose = require('mongoose');
const { LEAD_SOURCE } = require('../constants/app.constants');

const leadSchema = new mongoose.Schema(
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
            required: [true, 'Name is required'],
            trim: true,
            minlength: [3, 'Name must be at least 3 characters'],
            maxlength: [50, 'Name must not exceed 50 characters'],
        },
        email: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
            required: [true, 'Email is required'],
        },
        phoneNumber: {
            type: String,
            unique: true,
            required: [true, 'Phone number is required'],
        },
        whatsAppNumber: {
            type: String,
            unique: true,
            required: [true, 'WhatsApp number is required'],
        },
        leadSource: {
            type: String,
            enum: LEAD_SOURCE,
            required: [true, 'Lead source is required'],
        },
        note: {
            type: String,
            default: null,
            maxlength: [2000, 'Note cannot exceed 2000 characters'],
        },
        heardVia: {
            type: String,
            enum: ['google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board'],
            default: null,
        },
        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dealer',
            default: null,
            required: function () {
                return this.leadSource === 'dealer';
            },
        },
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            default: null,
            required: function () {
                return this.leadSource === 'campaign';
            },
        },
        status: {
            type: String,
            enum: ['new', 'not_contacted', 'follow_up', 'visit_plan', 'future_plan', 'dead', 'successfull'],
            default: 'new',
        },
        metaLeadgenId: {
            type: String,
            default: undefined,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedAt: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
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

// Indexes
leadSchema.index({ createdAt: -1 });
leadSchema.index({ phoneNumber: 1, createdAt: -1 });
leadSchema.index({ whatsAppNumber: 1, createdAt: -1 });
leadSchema.index({ email: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ assignedTo: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, phoneNumber: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, name: 1, createdAt: -1 });
leadSchema.index({ name: 1, createdAt: -1 });
leadSchema.index(
    { metaLeadgenId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            metaLeadgenId: { $type: 'string' }
        }
    }
);

module.exports = mongoose.model('Lead', leadSchema);