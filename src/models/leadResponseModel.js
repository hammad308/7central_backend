const mongoose = require("mongoose");
const { LEAD_RESPONSE_TYPES } = require("../constants/app.constants");

const leadResponseSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        required: true,
        index: true
    },
    responseType: {
        type: String,
        enum: LEAD_RESPONSE_TYPES,
        required: true
    },
    lastResponseType: {
        type: String,
        enum: LEAD_RESPONSE_TYPES,
        required: false,
        default: ""
    },
    note: {
        type: String,
        default: ""
    },
    nextAction: {
        type: String,
        default: ""
    },
    nextActionDate: {
        type: Date,
        default: null;
    },
    result: {
        type: String,
        default: ""
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeadResponse', leadResponseSchema);