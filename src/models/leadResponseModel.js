const mongoose = require('mongoose');
const { LEAD_RESPONSE_TYPES } = require('../constants/app.constants');

const leadResponseSchema = new mongoose.Schema(
    {
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
            required: [true, 'Lead ID is required'],
            index: true,
        },
        responseType: {
            type: String,
            enum: LEAD_RESPONSE_TYPES,
            required: [true, 'Response type is required'],
        },
        lastResponseType: {
            type: String,
            enum: [...LEAD_RESPONSE_TYPES, ''],
            default: '',
        },
        note: {
            type: String,
            default: null,
            maxlength: [2000, 'Note cannot exceed 2000 characters'],
        },
        nextAction: {
            type: String,
            default: null,
            maxlength: [500, 'Next action cannot exceed 500 characters'],
        },
        nextActionDate: {
            type: Date,
            default: null,
        },
        result: {
            type: String,
            default: null,
            maxlength: [1000, 'Result cannot exceed 1000 characters'],
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

// Compound index for faster timeline queries
leadResponseSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('LeadResponse', leadResponseSchema);