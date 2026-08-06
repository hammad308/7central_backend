const mongoose = require("mongoose");

const potentialBuyerSchema = new mongoose.Schema({
    potentialCustomers: {
        type: [
            {
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
            message: "Potential Buyers cannot exceed 3 members"
        }
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
})

module.exports = mongoose.model("PotentialBuyer", potentialBuyerSchema);