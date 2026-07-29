const catchAsync = require("../utils/catchAsync");
const Lead = require('../models/leadModel');
const Dealer = require("../models/dealerModel");
const Campaign = require("../models/campaignModel");
const { sendSuccessResponse } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require("../logger")("LEAD_CONTROLLER");
const handlerFactory = require("./factories/handlerFactory");
const APIFeatures = require("../utils/APIFeatures");
const leadValidationSchema = require("../validations/leadValidation");
const mongoose = require("mongoose");

const popObj = [
    { path: 'dealerId', select: "name dealerType" },
    { path: "campaignId", select: "name campaignType" },
    { path: "assignedTo", select: "username -_id" }
]

exports.createLead = catchAsync(async (req, res, next) => {
    const { error } = leadValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 422))
    }
    if (req.body.leadSource === "dealer") {
        const isDealerExist = await Dealer.findById(req.body.dealerId);
        if (!isDealerExist) {
            return next(new AppError("No Dealer Found with provided Dealer ID", 404));
        }
    }
    if (req.body.leadSource === "campaign") {
        const isCampaignExist = await Campaign.findById(req.body.campaignId);
        if (!isCampaignExist) {
            return next(new AppError("No Campaign Found with provided Campaign ID", 404));
        }
    }
    const isLeadExist = await Lead.findOne({
        $or: [
            { whatsAppNumber: req.body.whatsAppNumber },
            { email: req.body.email },
            { phoneNumber: req.body.phoneNumber }
        ]
    });
    if (isLeadExist) {
        return next(new AppError("Lead with this Email, Phone Number Or WhatsApp Number already exists", 422));
    }
    req.body.createdBy = req.user._id;
    const lead = await Lead.create(req.body);
    sendSuccessResponse(res, 201, logger, {
        message: "Lead Created Successfully",
        doc: lead
    })
});

exports.getLead = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid Lead ID Format", 400));
    }
    handlerFactory.getOne(Lead, popObj, logger)(req, res, next);
});

exports.getAllLeads = catchAsync(async (req, res, next) => {
    const query = {};
    const { status } = req.query;
    if (status) {
        query.status = status
    }
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

exports.updateLead = catchAsync(async (req, res, next) => {

});

exports.deleteLead = catchAsync(async (req, res, next) => {

});

