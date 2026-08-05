const joi = require('joi');

const fileAttachmentValidationSchema = joi.object().keys({
  clientFileName: joi.string().required(),
  fileAsBase64: joi.string().optional(),
  fileNameOnServerDisk: joi.string().optional(), //for edit screen
  _id: joi.optional(),
});

const subtaskValidationSchema = joi.object().keys({
  subtaskTitle: joi.string().required(),
  subtaskDescription: joi.string().allow("").required(), //allow empty
  subtaskStatus: joi.number().valid(0,1).required(),
  employeeID: joi.string().required(),
});

const employeeTaskValidationSchema = joi.object().keys({
  employeeIDs: joi.array().min(1).required(), //minimum 1 employee ID is needed
  supervisor: joi.string().min(24).required(), //24 characters hex value
  taskTitle: joi.string().required(),
  taskDescription: joi.string().allow("").required(), //allow empty
  taskStartByDate: joi.date().iso().required(),
  taskFinishByDate: joi.date().iso().required(),
  taskActualFinishDate: joi.date().iso().allow("").optional(),
  taskStatus: joi.number().valid(0,1).required(),
  taskPriority: joi.number().valid(0,1,2,3).required(),
  subtasks: joi.array().items(subtaskValidationSchema).optional(),
  attachments: joi.array().items(fileAttachmentValidationSchema).optional(), //empty array passes the validation
});

module.exports = employeeTaskValidationSchema;