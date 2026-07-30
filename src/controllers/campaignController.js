const catchAsync = require("../utils/catchAsync");
const Campaign = require("../models/campaignModel");
const Lead = require("../models/leadModel");
const AppError = require("../utils/appError");
const logger = require("../logger")("CAMPAIGN_CONTROLLER");
const { sendSuccessResponse } = require("../utils/helpers");
const { createCampaignValidationSchema, updateCampaignValidationSchema } = require("../validations/campaignValidation");
const handlerFactory = require("./factories/handlerFactory");
const APIFeatures = require("../utils/APIFeatures");

const popObj = [
    { path: "createdBy", select: "username image gender -_id" }
]

exports.createCampaign = catchAsync(async (req, res, next) => {
    if (req.body.name) {
        const existingCompaign = await Campaign.findOne({ name: req.body.name });
        if (existingCompaign) {
            return next(new AppError("Campaign with this name already exists", 422));
        }
    }
    handlerFactory.createOne(Campaign, createCampaignValidationSchema, logger, {
        fieldToAddInRequestBody: "createdBy",
    })(req, res, next);
});

exports.getCampaign = handlerFactory.getOne(Campaign, popObj, logger);

exports.updateCampaign = catchAsync(async (req, res, next) => {
    const isCampaignExist = await Campaign.findById(req.params.id);
    if (!isCampaignExist) {
        return next(new AppError("Campaign Not Found to Update", 404));
    }
    const { error } = updateCampaignValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    if (Object.keys(req.body).length < 1) {
        return next(new AppError("Nothing Found to update", 422));
    }
    const duplicate = await Campaign.findOne({
        name: req.body?.name,
        _id: { $ne: req.params.id }
    });
    if (duplicate) {
        return next(new AppError('Campaign with this name exist before. Please Change the name to continue', 422));
    }
    handlerFactory.updateOne(Campaign, logger)(req, res, next);
});

exports.getAllCampaigns = catchAsync(async (req, res, next) => {
    const query = {};
    const features = new APIFeatures(Campaign.find(query), req.query)
        .filter()
        .limitFields()
        .sort()
        .paginate();
    const campaigns = await features.query.populate(popObj);
    const docsCount = await Campaign.countDocuments({ ...query, ...features.queryObj });
    const pages = Math.ceil(docsCount / features.pageSize);

    const getCamapignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
            const leads = await Lead.aggregate([
                { $match: { campaignId: campaign._id } },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]);
            const progress = {
                total: 0,
                new: 0,
                not_contacted: 0,
                follow_up: 0,
                visit_plan: 0,
                dead: 0,
                future_plan: 0,
                successfull: 0
            };
            leads.forEach(item => {
                progress[item._id] = item.count;
                progress.total += item.count;
            });
            return ({ ...campaign.toObject(), progress });
        })
    )
    sendSuccessResponse(res, 200, logger,
        {
            message: "All Campaigns Fetched Successfully",
            doc: getCamapignsWithProgress,
            pages,
            docsCount,
            page: features.page
        }
    )
});



exports.deleteCampaign = handlerFactory.deleteOne(Campaign, logger);