const catchAsync = require("../utils/catchAsync");
const Dealer = require("../models/dealerModel");
const logger = require("../logger")("DEALER_CONTROLLER");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");
const handlerFactory = require("./factories/handlerFactory");
const dealerValidationSchema = require("../validations/dealerValidation");


exports.createDealer = catchAsync(async (req, res, next) => {
    const {error}= dealerValidationSchema.validate(req.body);
    if(error){
        return next(new AppError(error.details[0].message,400));
    }
    
});

exports.getDealer = catchAsync(async (req, res, next) => {

});

exports.getAllDealers = catchAsync(async (req, res, next) => {

});

exports.updateDealer = catchAsync(async (req, res, next) => {

});

exports.deleteDealer = catchAsync(async (req, res, next) => {

});