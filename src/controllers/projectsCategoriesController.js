"use strict";

const mongoose = require("mongoose");
const projectCategoryValidationSchema = require("../validations/projectCategoryValidationSchema.js");
const ProjectCategory = require("../models/projectCategory.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const AppError = require("../utils/appError.js");

module.exports = {
  create: async (req, res, next) => {
    let validData = null;
    try {
      validData = await projectCategoryValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    try {
      //Checking if category name already exists
      const existingProjectCategory = await ProjectCategory.findOne({
        projectCategoryName: validData.projectCategoryName,
        isActive: true
      });
      if (existingProjectCategory) {
        sendErrorResponse(res, 422, {
          message: "Project Category name already taken. Please choose some other name.",
          doc: existingProjectCategory
        });
      }
      else {
        const newProjectCategory = await ProjectCategory.create({ ...validData });
        sendSuccessResponse(res, 200, {
          message: "Project Category created successfully!",
          doc: newProjectCategory,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database create operation failed', 500));
    }
  },
  getAll: async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      let projectcategories;

      if (req.query.skip === "no") {
        projectcategories = await ProjectCategory.find({ isActive: true });
      }
      else {
        projectcategories = await ProjectCategory.find({ isActive: true })
          .limit(pageSize)
          .skip(pageSize * (page - 1))
          .exec();
      }
      const docsCount = await ProjectCategory.countDocuments({ isActive: true });
      sendSuccessResponse(res, 200, {
        docs: projectcategories,
        docsCount: docsCount
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  getOne: async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        sendErrorResponse(res, 422, {
          message: "Invalid ID!",
          doc: null
        });
        return; //early return
      }
      const projectCategory = await ProjectCategory.findOne({ _id: req.params.id, isActive: true });
      if (projectCategory) {
        sendSuccessResponse(res, 200, {
          message: "Project Category found!",
          doc: projectCategory,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "Project Category not found!",
          doc: null
        });
      }
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  update: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    let validData = null;
    try {
      validData = await projectCategoryValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }
    try {
      const projectCategory = await ProjectCategory.findOne({ _id: req.params.id, isActive: true });
      if (!projectCategory) {
        sendErrorResponse(res, 404, {
          message: "Project Category not found!",
          doc: null
        });
        return; //early return
      }
      else {
        const updatedProjectCategory = await ProjectCategory.findOneAndUpdate(
          { _id: req.params.id, isActive: true },
          { ...validData },
          { new: true, runValidators: true }
        );
        sendSuccessResponse(res, 200, {
          message: "Project Category updated successfully.",
          doc: updatedProjectCategory,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  delete: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    try {
      const projectCategory = await ProjectCategory.findOne({ _id: req.params.id, isActive: true });
      if (!projectCategory) {
        sendErrorResponse(res, 404, {
          message: "Project Category not found!",
          doc: null
        });
      }
      //TODO: Checking if at least one project belongs to this category.
      //Don't delete if category has at least one project.
      /*const projects = await Project.find({ projectCategory: req.params.id, isActive: true });
      if ( projects.length > 0 ) {
        sendErrorResponse(res, 403, {
          message: "Project Category has at least one project. Delete projects first!",
          doc: null
        });
      }*/
      await ProjectCategory.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false },
        { new: true, runValidators: true }
      );
      sendSuccessResponse(res, 200, {
        message: 'Project Category deleted successfully.',
        doc: null
      });
    }
    catch (error) {
      console.log(error);
      next(error);
    }
  },
}