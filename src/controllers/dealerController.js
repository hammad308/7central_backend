const catchAsync = require("../utils/catchAsync");
const Dealer = require("../models/dealerModel");
const logger = require("../logger")("DEALER_CONTROLLER");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const handlerFactory = require("./factories/handlerFactory");
const dealerValidationSchema = require("../validations/dealerValidation");
const { getNextInSequence } = require("../utils/db");
const { sendSuccessResponse, getLongAutoIncrementId } = require("../utils/helpers");
const { PREFIX_DEALER_AUTOINCREMENTID } = require("../constants/app.constants");


exports.createDealer = catchAsync(async (req, res, next) => {
    const { error } = dealerValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }
    const isDealerExist = await Dealer.findOne({
        $or: [
            { cnic: req.body.cnic },
            { email: req.body.email }
        ]
    });
    if (isDealerExist) {
        return next(new AppError("Dealer With These Credentials Exist Before", 422));
    }
    req.body.createdBy = req.user._id;
    const dealer = await Dealer.create(req.body);
    const newIDNumber = await getNextInSequence("dealers");
    const longAutoIncrementId = getLongAutoIncrementId(
        PREFIX_DEALER_AUTOINCREMENTID,
        newIDNumber
    );
    dealer.autoIncrementId = newIDNumber;
    dealer.longAutoIncrementId = longAutoIncrementId;
    await dealer.save();
    sendSuccessResponse(res, 201, logger, {
        message: "Dealer Created Successfully",
        doc: dealer
    })
});

exports.getDealer = catchAsync(async (req, res, next) => {
    
});

exports.getAllDealers = catchAsync(async (req, res, next) => {

});

exports.updateDealer = catchAsync(async (req, res, next) => {

});

exports.deleteDealer = catchAsync(async (req, res, next) => {

});