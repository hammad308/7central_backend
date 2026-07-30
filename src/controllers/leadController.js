const catchAsync = require("../utils/catchAsync");
const Lead = require('../models/leadModel');
const Dealer = require("../models/dealerModel");
const Campaign = require("../models/campaignModel");
const LeadResponse = require("../models/leadResponseModel");
const { sendSuccessResponse } = require("../utils/helpers");
const AppError = require("../utils/appError");
const logger = require("../logger")("LEAD_CONTROLLER");
const handlerFactory = require("./factories/handlerFactory");
const APIFeatures = require("../utils/APIFeatures");
const { createLeadValidationSchema, updateLeadValidationSchema } = require("../validations/leadValidation");
const mongoose = require("mongoose");

const popObj = [
    { path: 'dealerId', select: "name dealerType" },
    { path: "campaignId", select: "name campaignType" },
    { path: "assignedTo", select: "username -_id" }
];

exports.createLead = catchAsync(async (req, res, next) => {
    const { error } = createLeadValidationSchema.validate(req.body);
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
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

exports.updateLead = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid Lead ID Format", 400));
    }
    const { error } = updateLeadValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 422));
    }
    const isLeadExist = await Lead.findById(req.params.id);
    if (!isLeadExist) {
        return next(new AppError("Lead Not Found to Update", 404));
    }
    if (Object.keys(req.body).length < 1) {
        return next(new AppError("Nothing Found to update", 422));
    }
    const duplicate = await Lead.findOne({
        $or: [
            { email: req.body?.email },
            { phoneNumber: req.body?.phoneNumber },
            { whatsAppNumber: req.body?.whatsAppNumber }
        ],
        _id: { $ne: req.params.id }
    });
    if (duplicate) {
        return next(new AppError('Lead with these credentials exists before. Please change the credentials to continue', 422));
    }
    handlerFactory.updateOne(Lead, logger)(req, res, next);
});

exports.getLeadTimeline = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid Lead ID Format", 400));
    }
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
        return next(new AppError("Lead Not Found", 404));
    }
    const leadResponses = await LeadResponse.find({ leadId: lead._id })
        .populate({ path: "createdBy", select: "username image -_id" })
        .sort({ createdAt: -1 });
    if (!leadResponses) {
        sendSuccessResponse(res, 200, logger, {
            message: "There is no response marked on this lead"
        });
    }
    sendSuccessResponse(res, 200, logger, {
        message: "Lead Response are fetched successfully",
        doc: leadResponses
    })
});

exports.getLeadReports = catchAsync(async (req, res, next) => {
    const query = {};
    const features = new APIFeatures(Lead.find(query), req.query)
        .filter()
        .limitFields()
        .sort()
        .paginate();
    const leads = await features.query.populate(popObj);
    const docsCount = await Campaign.countDocuments({ ...query, ...features.queryObj });
    const pages = Math.ceil(docsCount / features.pageSize);

    const leadsWithActivity = await Promise.all(
        leads.map(async (lead) => {
            const lastResponse = await LeadResponse.findOne({ leadId: lead._id }).sort({ createdAt: -1 }).populate({ path: "createdBy", select: "username -_id" });
            return (
                {
                    ...lead.toObject(),
                    lastActivity: lastResponse ? lastResponse?.lastResponseType : null,
                    currentStage: lastResponse ? lastResponse?.responseType : null,
                    nextAction: lastResponse ? lastResponse?.nextAction : null,
                    lastActivityDate: lastResponse ? lastResponse?.createdAt : null,
                    result: lastResponse ? lastResponse?.result : null
                }
            )
        })
    )
    sendSuccessResponse(res, 200, logger, {
        message: "Lead Reports fetched Successfully",
        doc: leadsWithActivity
    })

})
exports.deleteLead = catchAsync(async (req, res, next) => {
    handlerFactory.deleteOne(Lead, logger)(req, res, next);
});

