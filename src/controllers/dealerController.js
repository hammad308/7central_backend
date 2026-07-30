const catchAsync = require("../utils/catchAsync");
const Dealer = require("../models/dealerModel");
const logger = require("../logger")("DEALER_CONTROLLER");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const handlerFactory = require("./factories/handlerFactory");
const { updateDealerValidationSchema, createDealerValidationSchema } = require("../validations/dealerValidation");
const { getNextInSequence } = require("../utils/db");
const { sendSuccessResponse, getLongAutoIncrementId } = require("../utils/helpers");
const { PREFIX_DEALER_AUTOINCREMENTID } = require("../constants/app.constants");
const mongoose = require("mongoose");

const popObj = [
    { path: "createdBy", select: "username image gender" }
]


exports.createDealer = catchAsync(async (req, res, next) => {
    const { error } = createDealerValidationSchema.validate(req.body);
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
    if (!mongoose.isValidObjectId(req.params.id)) {
        return next(new AppError("Invalid Dealer ID", 404));
    }
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) {
        return next(new AppError("Dealer Not Found", 404));
    }
    sendSuccessResponse(res, 200, logger, {
        message: "Dealer Found Successfully",
        doc: dealer
    })
});

exports.getAllDealers = catchAsync(async (req, res, next) => {
    handlerFactory.getAll(Dealer, popObj, logger)(req, res, next);
});

exports.updateDealer = catchAsync(async (req, res, next) => {
    const isDealerExist = await Dealer.findById(req.params.id);
    if (!isDealerExist) {
        return next(new AppError("Dealer Not Found", 404));
    }
    const { error } = await updateDealerValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400))
    }
    const duplicate = await Dealer.findOne({
        $or: [
            { cnic: req.body?.cnic },
            { email: req.body?.email }
        ],
        _id: { $ne: req.params.id }
    });
    if (duplicate) {
        return next(new AppError("Dealer With These Credentials Exist Before", 422));
    }
    handlerFactory.updateOne(Dealer, logger)(req, res, next);
});

exports.deleteDealer = catchAsync(async (req, res, next) => {
    handlerFactory.deleteOne(Dealer, logger)(req, res, next);
});