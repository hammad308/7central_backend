const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccessResponse, getLongAutoIncrementId } = require('../utils/helpers');
const logger = require('../logger')('BLOCKORFLOOR_CONTROLLER');
const handlerFactory = require('./factories/handlerFactory');
const { getNextInSequence } = require('../utils/db');
const { PREFIX_BLOCKORFLOOR_AUTOINCREMENTID } = require('../constants/app.constants');
const blockOrFloorValidationSchema = require('../validations/blockOrFloorValidations');
const BlockOrFloor = require('../models/blockOrFloorModel');
const Project = require('../models/projectModel');

const popObj = [
    {
        path: 'project',
        select: 'title -_id longAutoIncrementId'
    },
    {
        path: 'createdBy',
        select: 'username image email -_id'
    }
]

exports.create = catchAsync(async (req, res, next) => {
    const { error } = blockOrFloorValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400))
    }
    const createdBy = req.user._id;
    req.body.createdBy = createdBy;

    const checkBlockOrFloor = await BlockOrFloor.findOne({ title: req.body.title, project: req.body.project });
    if (checkBlockOrFloor) {
        return next(new AppError('This Block/Floor already exists in this project.', 400));
    }
    const existingProject = await Project.findById(req.body.project);
    if (!existingProject) {
        return next(new AppError("Project Not Found", 404));
    }
    const blockOrFloor = await BlockOrFloor.create(req.body);
    const newIDNumber = await getNextInSequence("blockOrFloors");
    const longAutoIncrementId = getLongAutoIncrementId(
        PREFIX_BLOCKORFLOOR_AUTOINCREMENTID,
        newIDNumber,
    );
    blockOrFloor.autoIncrementId = newIDNumber;
    blockOrFloor.longAutoIncrementId = longAutoIncrementId;
    blockOrFloor.save();

    sendSuccessResponse(res, 200, logger, {
        message: 'BlockOrFloor created successfully.',
        doc: blockOrFloor
    });
});

exports.getAll = catchAsync(async (req, res, next) => {
    const { project } = req.query;
    const query = {};
    if (project) {
        query.project = project;
    }
    handlerFactory.getAll(BlockOrFloor, popObj, logger, query)(req, res, next)
});

exports.getSingle = handlerFactory.getOne(BlockOrFloor, popObj, logger);
exports.update = handlerFactory.updateOne(BlockOrFloor, logger);
exports.deleteBlockOrFloor = handlerFactory.deleteOne(BlockOrFloor, logger);

