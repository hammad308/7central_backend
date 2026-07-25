const mongoose = require("mongoose");

const potentialBuyerSchema = new mongoose.Schema({
    potentialCustomers: {
        type: [
            {
                name: {
                    type: String,
                    required: true
                },
                phoneNumber: {
                    type: String,
                    required: true
                },
                whatsAppNumber: {
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
                }
            }
        ],
        validate: {
            validator: function (value) {
                return value.length <= 3;
            },
            message:"Potential Buyers cannot exceed 3 members"
        }
    },
    customer:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

module.exports = mongoose.model("PotentialBuyer", potentialBuyerSchema);