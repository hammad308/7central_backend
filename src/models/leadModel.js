const mongoose = require("mongoose");
const { LEAD_SOURCE } = require("../constants/app.constants");
const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        required: true
    },
    whatsAppNumber: {
        type: String,
        unique: true,
        required: true
    },
    leadSource: {
        type: String,
        enum: LEAD_SOURCE,
        required: true,
    },
    note: {
        type: String,
        default: ""
    },
    heardVia: {
        type: String,
        enum: ['google_search', 'meta_ads', 'words_of_mouth', 'referral', 'newspaper', 'bill_board', 'not_selected'],
        default: 'not_selected'
    },
    dealerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () {
            return this.leadSource === 'dealer'
        }
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () {
            return this.leadSource === 'campaign'
        }
    },
    status: {
        type: String,
        enum: ['new', 'not_contacted', 'follow_up', 'visit_plan', 'future_plan', 'dead', 'successfull'],
        default: 'new'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

leadSchema.index({ createdAt: -1 });
leadSchema.index({ phoneNumber: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, phoneNumber: 1, createdAt: -1 });
leadSchema.index({ leadSource: 1, name: 1, createdAt: -1 });
leadSchema.index({ name: 1, createdAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);