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
    const query = { assignedTo: { $ne: null } };
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

exports.getAllLeadsAndProspects = catchAsync(async (req, res, next) => {
    handlerFactory.getAll(Lead, popObj, logger, {})(req, res, next);
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
    if (!leadResponses || leadResponses.length === 0) {
        return sendSuccessResponse(res, 200, logger, {
            message: "There is no response marked on this lead",
            doc:[]
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
    const docsCount = await Lead.countDocuments({ ...query, ...features.queryObj });
    const pages = Math.ceil(docsCount / features.pageSize);
    const lastResponses = await LeadResponse.aggregate([
        {
            $match: { leadId: { $in: leads.map(l => l._id) } }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: { _id: "$leadId", doc: { $first: "$$ROOT" } }
        }
    ]);
    const responsemap = {};
    lastResponses.forEach(item => {
        responsemap[item._id.toString()] = item.doc;
    });
    const leadsWithActivity = leads.map(lead => {
        const latestResponse = responsemap[lead._id.toString()]
        return (
            {
                ...lead.toObject(),
                lastActivity: latestResponse ? latestResponse?.lastResponseType : null,
                currentStage: latestResponse ? latestResponse?.responseType : null,
                nextAction: latestResponse ? latestResponse?.nextAction : null,
                lastActivityDate: latestResponse ? latestResponse?.createdAt : null,
                result: latestResponse ? latestResponse?.result : null
            }
        )
    })
    sendSuccessResponse(res, 200, logger, {
        message: "Lead Reports fetched Successfully",
        doc: leadsWithActivity,
        pages,
        docsCount,
        page: features.page
    });
});

exports.deleteLead = catchAsync(async (req, res, next) => {
    handlerFactory.deleteOne(Lead, logger)(req, res, next);
});

exports.createProspect = catchAsync(async (req, res, next) => {
    const { error } = createLeadValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    const isExist = await Lead.findOne({
        $or: [
            { email: req.body.email },
            { phoneNumber: req.body.phoneNumber },
            { whatsAppNumber: req.body.whatsAppNumber }
        ]
    });
    if (isExist) return next(new AppError("Prospect with these credentials already exists", 422));

    req.body.createdBy = req.user._id;
    req.body.assignedTo = null; // force — prospect hamesha unassigned

    const prospect = await Lead.create(req.body);
    sendSuccessResponse(res, 201, logger, {
        message: "Prospect Created Successfully",
        doc: prospect
    });
});

exports.getAllProspects = catchAsync(async (req, res, next) => {
    // Sirf unassigned — prospects
    handlerFactory.getAll(Lead, popObj, logger, { assignedTo: null })(req, res, next);
});

exports.assignProspect = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid ID Format", 400));
    }

    const { assignedTo } = req.body;
    if (!assignedTo) return next(new AppError("assignedTo is required", 422));
    if (!mongoose.isValidObjectId(assignedTo)) {
        return next(new AppError("Invalid User ID", 400));
    }

    const prospect = await Lead.findById(req.params.id);
    if (!prospect) return next(new AppError("Prospect Not Found", 404));
    if (prospect.assignedTo) {
        return next(new AppError("Already assigned as a lead", 422));
    }

    prospect.assignedTo = assignedTo;
    await prospect.save();

    sendSuccessResponse(res, 200, logger, {
        message: "Prospect assigned as Lead successfully",
        doc: prospect
    });
});
