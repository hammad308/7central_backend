const joi = require('joi');

const fileValidationSchema = joi.object({
  clientFileName: joi.string().optional(),
  fileAsBase64: joi.string().optional(),
  fileNameOnServerDisk: joi.string().optional(), //for edit screen
  _id: joi.optional(),
});

const projectValidationSchema = joi.object().keys({
  projectName: joi.string().min(2).required(),
  projectCreator: joi.string().optional(),
  projectCategory: joi.string().required(),
  projectOwnerCompany: joi.string().optional(),
  projectOwnerEmployee: joi.string().optional(),
  projectManager: joi.string().required(),
  siteEngineers: joi.array().min(1).required(), //minimum 1 site engineer is needed
  staffMembers: joi.array().min(1).required(), //minimum 1 staff member is needed
  coveredArea: joi.number().min(0).required(),
  plotArea: joi.number().min(0).required(),
  numberOfUnits: joi.number().min(0).optional(),
  projectPictures: joi.array().optional(),
  projectSoilReport: fileValidationSchema.optional(),
  projectBOQDocument: fileValidationSchema.optional()
});

module.exports = projectValidationSchema;