const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse } = require('../utils/helpers');
const LeadResponse = require('../models/leadResponseModel');
const Lead = require('../models/leadModel');
const leadResponseValidationSchema = require('../validations/leadResponseValidation');
const AppError = require('../utils/appError');
const logger = require('../logger')('LEAD_RESPONSE_CONTROLLER');

// ==================== STATUS MAPPING ====================
const STATUS_MAP = {
    not_contacted: 'not_contacted',
    follow_up: 'follow_up',
    future_plan: 'future_plan',
    schedule_visit: 'visit_plan',
    successfull: 'successfull',
    irrelevant: 'dead',
    not_interested: 'dead',
};

// ==================== MARK RESPONSE ====================
exports.markResponse = catchAsync(async (req, res, next) => {
    // Validate request body
    const { error } = leadResponseValidationSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 422));

    // Check lead exists and is active
    const lead = await Lead.findOne({
        _id: req.body.leadId,
        recordStatus: 'active',
        assignedTo: { $ne: null }
    });
    if (!lead) return next(new AppError('Lead not found', 404));

    // Find last response for this lead
    const lastResponse = await LeadResponse.findOne({ leadId: lead._id, recordStatus: 'active' })
        .sort({ createdAt: -1 });

    // Determine new lead status based on response type
    const newStatus = STATUS_MAP[req.body.responseType];
    if (newStatus) {
        lead.status = newStatus;
        await lead.save();
    }

    // Create response record
    const response = await LeadResponse.create({
        leadId: req.body.leadId,
        responseType: req.body.responseType,
        lastResponseType: lastResponse ? lastResponse.responseType : '',
        note: req.body.note || null,
        nextAction: req.body.nextAction || null,
        nextActionDate: req.body.nextActionDate || null,
        result: req.body.result || null,
        createdBy: req.user._id,
    });

    const populatedResponse = await LeadResponse.findById(response._id)
        .populate({ path: 'createdBy', select: 'username image' });

    sendSuccessResponse(res, 201, logger, {
        message: 'Lead response recorded successfully',
        doc: populatedResponse,
    });
});

// ==================== GET RESPONSES FOR A LEAD ====================
exports.getLeadResponses = catchAsync(async (req, res, next) => {
    const { leadId } = req.params;

    const lead = await Lead.findOne({
        _id: leadId,
        recordStatus: 'active',
    });
    if (!lead) return next(new AppError('Lead not found', 404));

    const responses = await LeadResponse.find({
        leadId,
        recordStatus: 'active',
    })
        .populate({ path: 'createdBy', select: 'username image' })
        .sort({ createdAt: -1 });

    sendSuccessResponse(res, 200, logger, {
        message: responses.length === 0 ? 'No responses recorded for this lead' : 'Lead responses fetched successfully',
        docs: responses,
        docsCount: responses.length,
    });
});

// ==================== SOFT DELETE RESPONSE ====================
exports.deleteResponse = catchAsync(async (req, res, next) => {
    const response = await LeadResponse.findOne({
        _id: req.params.id,
        recordStatus: 'active',
    });
    if (!response) return next(new AppError('Response not found', 404));

    response.recordStatus = 'deleted';
    await response.save();

    sendSuccessResponse(res, 200, logger, {
        message: 'Response deleted successfully',
        doc: null,
    });
});