const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const Lead = require('../models/leadModel');
const Dealer = require('../models/dealerModel');
const Campaign = require('../models/campaignModel');
const LeadResponse = require('../models/leadResponseModel');
const User = require('../models/userModel');
const EmployeeNotification = require('../models/employeeNotificationModel');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const { getNextInSequence } = require('../utils/db');
const AppError = require('../utils/appError');
const logger = require('../logger')('LEAD_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const APIFeatures = require('../utils/APIFeatures');
const {
    createLeadValidationSchema,
    updateLeadValidationSchema,
    assignProspectValidationSchema,
} = require('../validations/leadValidation');
const { PREFIX_LEAD_AUTOINCREMENTID } = require('../constants/app.constants');

const popObj = [
    { path: 'dealerId', select: 'name dealerType' },
    { path: 'campaignId', select: 'name campaignType' },
    { path: 'assignedTo', select: 'username image email' },
    { path: 'assignedBy', select: 'username image email' },
    { path: 'createdBy', select: 'username image email' },
];

// ==================== HELPER: Check duplicate lead ====================
const checkDuplicateLead = async (email, phoneNumber, whatsAppNumber, excludeId = null) => {
    const filter = {
        $or: [
            { email },
            { phoneNumber },
            { whatsAppNumber },
        ],
        recordStatus: 'active',
    };

    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    const existing = await Lead.findOne(filter);
    if (existing) {
        if (existing.email === email) throw new AppError('A lead with this email already exists', 409);
        if (existing.phoneNumber === phoneNumber) throw new AppError('A lead with this phone number already exists', 409);
        if (existing.whatsAppNumber === whatsAppNumber) throw new AppError('A lead with this WhatsApp number already exists', 409);
    }
};

// ==================== HELPER: Validate dealer/campaign exist ====================
const validateLeadSource = async (leadSource, dealerId, campaignId) => {
    if (leadSource === 'dealer') {
        if (!dealerId) throw new AppError('Dealer ID is required when lead source is dealer', 400);
        const dealer = await Dealer.findOne({ _id: dealerId, status: { $ne: 'deleted' } });
        if (!dealer) throw new AppError('Dealer not found', 404);
    }

    if (leadSource === 'campaign') {
        if (!campaignId) throw new AppError('Campaign ID is required when lead source is campaign', 400);
        const campaign = await Campaign.findOne({ _id: campaignId, status: { $ne: 'deleted' } });
        if (!campaign) throw new AppError('Campaign not found', 404);
    }
};

// ==================== HELPER: Validate user exists and is active ====================
const validateUser = async (userId) => {
    const user = await User.findOne({ _id: userId, status: 'active' });
    if (!user) throw new AppError('Assigned user not found or inactive', 404);
    return user;
};

// ==================== CREATE LEAD ====================
exports.createLead = catchAsync(async (req, res, next) => {
    const { error } = createLeadValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    // Check duplicate
    await checkDuplicateLead(req.body.email, req.body.phoneNumber, req.body.whatsAppNumber);

    // Validate lead source references
    await validateLeadSource(req.body.leadSource, req.body.dealerId, req.body.campaignId);

    // Validate assigned user exists and is active
    await validateUser(req.body.assignedTo);

    // Generate IDs
    const newIDNumber = await getNextInSequence('leads');
    const longAutoIncrementId = getLongAutoIncrementId(
        PREFIX_LEAD_AUTOINCREMENTID || 'LEAD',
        newIDNumber
    );

    const lead = await Lead.create({
        ...req.body,
        autoIncrementId: newIDNumber,
        longAutoIncrementId,
        createdBy: req.user._id,
        assignedBy: req.user._id,
        assignedAt: new Date(),
    });

    // Notify assignee
    try {
        await EmployeeNotification.create({
            employee: lead.assignedTo,
            redirectPage: `leads/${lead._id}`,
            message: `A new lead "${lead.name}" has been assigned to you.`,
        });
    } catch (err) {
        logger.error('Lead assignment notification failed', err);
    }

    const populatedLead = await Lead.findById(lead._id).populate(popObj);

    sendSuccessResponse(res, 201, logger, {
        message: 'Lead created successfully',
        doc: populatedLead,
    });
});

// ==================== GET SINGLE LEAD ====================
exports.getLead = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid lead ID format', 400));
    }
    handlerFactory.getOne(Lead, popObj, logger, 'id', '_id', { recordStatus: 'active' })(req, res, next);
});

// ==================== GET ALL LEADS (ASSIGNED ONLY) ====================
exports.getAllLeads = catchAsync(async (req, res, next) => {
    const query = { assignedTo: { $ne: null }, recordStatus: 'active' };
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

// ==================== GET MY LEADS (Employee sees only their assigned leads) ====================
exports.getMyLeads = catchAsync(async (req, res, next) => {
    if (!req.user.employee_id) {
        return next(new AppError('No employee profile linked to your account', 403));
    }

    const query = {
        assignedTo: req.user._id,
        recordStatus: 'active'
    };

    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

// ==================== GET ALL LEADS & PROSPECTS ====================
exports.getAllLeadsAndProspects = catchAsync(async (req, res, next) => {
    const query = { recordStatus: 'active' };
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

// ==================== UPDATE LEAD ====================
exports.updateLead = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid lead ID format', 400));
    }

    const { error } = updateLeadValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    if (Object.keys(req.body).length === 0) {
        return next(new AppError('No data provided to update', 422));
    }

    const existingLead = await Lead.findOne({
        _id: req.params.id,
        recordStatus: 'active',
    });
    if (!existingLead) return next(new AppError('Lead not found', 404));

    // Check duplicate if contact fields changed
    const email = req.body.email || existingLead.email;
    const phone = req.body.phoneNumber || existingLead.phoneNumber;
    const whatsapp = req.body.whatsAppNumber || existingLead.whatsAppNumber;

    if (req.body.email || req.body.phoneNumber || req.body.whatsAppNumber) {
        await checkDuplicateLead(email, phone, whatsapp, req.params.id);
    }

    // Validate lead source references if changed
    const leadSource = req.body.leadSource || existingLead.leadSource;
    const dealerId = req.body.dealerId !== undefined ? req.body.dealerId : existingLead.dealerId;
    const campaignId = req.body.campaignId !== undefined ? req.body.campaignId : existingLead.campaignId;

    await validateLeadSource(leadSource, dealerId, campaignId);

    // Validate user if assignedTo is being changed
    if (req.body.assignedTo && req.body.assignedTo !== existingLead.assignedTo?.toString()) {
        await validateUser(req.body.assignedTo);
        req.body.assignedBy = req.user._id;
        req.body.assignedAt = new Date();
    }

    const updatedLead = await Lead.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    ).populate(popObj);

    sendSuccessResponse(res, 200, logger, {
        message: 'Lead updated successfully',
        doc: updatedLead,
    });
});

// ==================== GET LEAD TIMELINE ====================
exports.getLeadTimeline = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid lead ID format', 400));
    }

    const lead = await Lead.findOne({
        _id: req.params.id,
        recordStatus: 'active',
        assignedTo: { $ne: null }
    });
    if (!lead) return next(new AppError('Lead not found', 404));

    const leadResponses = await LeadResponse.find({ leadId: lead._id })
        .populate({ path: 'createdBy', select: 'username image' })
        .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, logger, {
        message: leadResponses.length === 0 ? 'No responses recorded for this lead' : 'Lead timeline fetched successfully',
        docs: leadResponses,
    });
});

// ==================== GET LEAD REPORTS ====================
exports.getLeadReports = catchAsync(async (req, res, next) => {
    const query = { recordStatus: 'active', assignedTo: { $ne: null } };
    const features = new APIFeatures(Lead.find(query), req.query)
        .filter()
        .limitFields()
        .sort()
        .paginate();

    const leads = await features.query.populate(popObj);
    const docsCount = await Lead.countDocuments({ ...query, ...features.queryObj });
    const pages = features.pageSize ? Math.ceil(docsCount / features.pageSize) : 1;

    const lastResponses = await LeadResponse.aggregate([
        { $match: { leadId: { $in: leads.map(l => l._id) } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$leadId', doc: { $first: '$$ROOT' } } },
    ]);

    const responsemap = {};
    lastResponses.forEach(item => {
        responsemap[item._id.toString()] = item.doc;
    });

    const leadsWithActivity = leads.map(lead => {
        const latestResponse = responsemap[lead._id.toString()];
        return {
            ...lead.toObject(),
            lastActivity: latestResponse?.lastResponseType || null,
            currentStage: latestResponse?.responseType || null,
            nextAction: latestResponse?.nextAction || null,
            lastActivityDate: latestResponse?.createdAt || null,
            result: latestResponse?.result || null,
        };
    });

    sendSuccessResponse(res, 200, logger, {
        message: 'Lead reports fetched successfully',
        docs: leadsWithActivity,
        pages,
        docsCount,
        page: features.page,
    });
});

// ==================== SOFT DELETE LEAD ====================
exports.deleteLead = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid lead ID format', 400));
    }

    const lead = await Lead.findOne({
        _id: req.params.id,
        recordStatus: 'active',
    });
    if (!lead) return next(new AppError('Lead not found', 404));

    lead.recordStatus = 'deleted';
    await lead.save();

    sendSuccessResponse(res, 200, logger, {
        message: 'Lead deleted successfully',
        doc: null,
    });
});

// ==================== CREATE PROSPECT (Unassigned) ====================
exports.createProspect = catchAsync(async (req, res, next) => {
    // Prospect validation = same as lead BUT without assignedTo requirement
    // We reuse createLeadValidationSchema but make assignedTo forbidden
    const prospectValidationSchema = createLeadValidationSchema.fork(
        ['assignedTo'],
        (field) => field.forbidden().messages({
            'any.unknown': 'Prospect cannot be assigned during creation — use assign endpoint',
        })
    );

    const { error } = prospectValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    await checkDuplicateLead(req.body.email, req.body.phoneNumber, req.body.whatsAppNumber);

    await validateLeadSource(req.body.leadSource, req.body.dealerId, req.body.campaignId);

    const newIDNumber = await getNextInSequence('leads');
    const longAutoIncrementId = getLongAutoIncrementId(
        PREFIX_LEAD_AUTOINCREMENTID || 'LEAD',
        newIDNumber
    );

    const prospect = await Lead.create({
        ...req.body,
        autoIncrementId: newIDNumber,
        longAutoIncrementId,
        assignedTo: null,
        assignedBy: null,
        assignedAt: null,
        createdBy: req.user._id,
    });

    sendSuccessResponse(res, 201, logger, {
        message: 'Prospect created successfully',
        doc: prospect,
    });
});

// ==================== GET ALL PROSPECTS (Unassigned Only) ====================
exports.getAllProspects = catchAsync(async (req, res, next) => {
    const query = { assignedTo: null, recordStatus: 'active' };
    handlerFactory.getAll(Lead, popObj, logger, query)(req, res, next);
});

// ==================== ASSIGN PROSPECT (Prospect → Lead) ====================
exports.assignProspect = catchAsync(async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError('Invalid ID format', 400));
    }

    const { error } = assignProspectValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    // Validate user exists and is active
    await validateUser(req.body.assignedTo);

    const prospect = await Lead.findOne({
        _id: req.params.id,
        recordStatus: 'active',
    });
    if (!prospect) return next(new AppError('Prospect not found', 404));
    if (prospect.assignedTo) {
        return next(new AppError('This prospect is already assigned as a lead', 422));
    }

    prospect.assignedTo = req.body.assignedTo;
    prospect.assignedBy = req.user._id;
    prospect.assignedAt = new Date();
    await prospect.save();

    const populatedProspect = await Lead.findById(prospect._id).populate(popObj);

    // Notify assignee
    try {
        await EmployeeNotification.create({
            employee: prospect.assignedTo,
            redirectPage: `leads/${prospect._id}`,
            message: `A new lead "${prospect.name}" has been assigned to you.`,
        });
    } catch (err) {
        logger.error('Assignment notification failed', err);
    }

    sendSuccessResponse(res, 200, logger, {
        message: 'Prospect assigned as lead successfully',
        doc: populatedProspect,
    });
});