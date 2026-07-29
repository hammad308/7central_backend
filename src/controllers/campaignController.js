const catchAsync = require("../utils/catchAsync");
const Campaign = require("../models/campaignModel");
const AppError = require("../utils/appError");
const logger = require("../logger")("CAMPAIGN_CONTROLLER");
const { sendSuccessResponse } = require("../utils/helpers");
const campaignValidationSchema = require("../validations/campaignValidation");
const handlerFactory = require("./factories/handlerFactory");
const APIFeatures = require("../utils/APIFeatures");

exports.createCampaign = catchAsync(async (req, res, next) => {
    if (req.body.name) {
        const existingCompaign = await Campaign.findOne({name: req.body.name});
        if(existingCompaign){
            return next(new AppError("Campaign with this name already exists",422));
        }
    }
    handlerFactory.createOne(Campaign, campaignValidationSchema, logger, {
        fieldToAddInRequestBody: "createdBy",
    })(req, res, next);
});

exports.getCampaign = catchAsync(async (req, res, next) => {

});

exports.updateCampaign = catchAsync(async (req, res, next) => {

});

exports.getAllCampaigns = catchAsync(async (req, res, next) => {

});

exports.deleteCampaign = catchAsync(async (req, res, next) => {

});
