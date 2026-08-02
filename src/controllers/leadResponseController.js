const catchAsync = require("../utils/catchAsync");
const { sendSuccessResponse } = require("../utils/helpers");
const LeadResponse = require("../models/leadResponseModel");
const leadResponseValidationSchema = require('../validations/leadResponseValidation');
const AppError = require("../utils/appError");
const Lead = require("../models/leadModel");
const logger = require("../logger")("LEAD_RESPONSE_CONTROLLER");


exports.markResponse = catchAsync(async (req, res, next) => {
    const { error } = leadResponseValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 422));
    }
    const lead = await Lead.findById(req.body.leadId);
    if (!lead) {
        return next(new AppError("Lead Not Found To Mark Response", 404));
    };
    const lastResponse=await LeadResponse.findOne({leadId:lead._id}).sort({createdAt:-1});
    if(lastResponse){
        req.body.lastResponseType= lastResponse.responseType;
    } 
    switch (req.body.responseType) {
        case 'not_contacted':
            lead.status = "not_contacted";
            await lead.save();
            break;
        case 'follow_up':
            lead.status = "follow_up";
            await lead.save();
            break;
        case 'future_plan':
            lead.status = "future_plan";
            await lead.save();
            break;
        case 'schedule_visit':
            lead.status = "visit_plan";
            await lead.save();
            break;
        case 'successfull':
            lead.status = "successfull";
            await lead.save();
            break;
        case 'irrelevant':
        case 'not_interested':
            lead.status = "dead";
            await lead.save();
            break;
        default:
            break;
    }
    req.body.createdBy = req.user._id;
    const leadResponse = await LeadResponse.create(req.body);
    sendSuccessResponse(res, 201, logger, {
        message: "Lead Response Created Successfully",
        doc: leadResponse
    })

})