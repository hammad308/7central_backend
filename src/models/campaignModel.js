const mongoose = require("mongoose");
const { CAMPAIGN_TYPES, CAMPAIGN_PERIOD } = require("../constants/app.constants")


const campaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    campaignType: {
        type: String,
        enum: CAMPAIGN_TYPES,
        required: true
    },
    campaignPeriod: {
        type: String,
        enum: CAMPAIGN_PERIOD,
        required: true
    },
    frequencyStatus: {
        type: Number,
        required: true,
        min: [1, 'Frequency cannot be less than 1']
    },
    targetAudience: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    attachments: [
        {
            type: String,
            required: true
        }
    ],
    status: {
        type: String,
        enum: ['active', 'ended','deleted'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},
    {
        timestamps: true
    });

module.exports = mongoose.model('Campaign', campaignSchema);