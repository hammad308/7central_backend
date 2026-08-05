"use strict";

const mongoose = require("mongoose");
const projectValidationSchema = require("../validations/projectValidationSchema.js");
const Project = require("../models/project.js");
const Employee = require("../models/employee.js");
const Demand = require("../models/demand.js");
const Quotation = require("../models/quotation.js");
const PurchaseOrder = require("../models/purchaseOrder.js");
const PaymentVoucher = require("../models/paymentVoucher.js");
const MaterialReceiptSlip = require("../models/materialReceiptSlip.js");
const MaterialIssue = require("../models/materialIssue.js");
const Notification = require("../models/notification.js");
const { getNextInSequence } = require("../utils/db.js");
const { uploadImage, uploadDataFile, deleteDataFile } = require("../utils/uploadImage.js");
const { findOneDocument } = require("../utils/findDocuments.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const AppError = require("../utils/appError.js");

module.exports = {
  create: async (req, res, next) => {
    let validData = null;
    try {
      validData = await projectValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    try {
      //Checking if project name already exists
      const existingProject = await Project.findOne({
        projectName: validData.projectName,
        isActive: true
      });
      if (existingProject) {
        sendErrorResponse(res, 422, {
          message: "Project name not available. Please choose some other name.",
          doc: existingProject
        });
        return; //early return
      }
      let fileInputsNames = ["projectSoilReport", "projectBOQDocument"];
      for (let fileInputName of fileInputsNames) {
        if (validData[fileInputName]) {
          let clientFileName = validData[fileInputName].clientFileName;
          let fileBytes = validData[fileInputName].fileAsBase64.split(',')[1];
          const fileNameOnServerDisk = await uploadDataFile(fileBytes, "projects", clientFileName);
          delete validData[fileInputName];
          validData[fileInputName] = { clientFileName, fileNameOnServerDisk };
        }
      }
      if (!validData.projectCreator) { //not sent from front-end
        validData.projectCreator = req.user.employee_id;
      }
      else { //sent from front-end
        const employee = await findOneDocument(Employee, validData.projectCreator);
        if (!employee) {
          sendErrorResponse(res, 422, {
            message: "Invalid employee Object ID!",
            doc: null
          });
          return; //early return
        }
      }
      if (validData.projectPictures) {
        let projectPictures = []
        for (let i = 0; i < validData.projectPictures.length; i++) {
          let fileBytes = validData.projectPictures[i];
          const { fileName } = await uploadImage(fileBytes, "projects");
          projectPictures.push(fileName);
        }
        delete validData.projectPictures;
        validData["projectPictures"] = projectPictures;
      }
      const newProject = await Project.create({ ...validData });
      const newIDNumber = await getNextInSequence("projects");
      newProject.projectID = newIDNumber;
      await newProject.save();

      const message = `You have been made project manager of the new project: ${newProject.projectName}.`;
      const redirectPage = `projects/${newProject._id}`;
      await Notification.create({
        employeeID: newProject.projectManager,
        redirectPage,
        message,
      });

      for (let i = 0; i < newProject.siteEngineers.length; ++i) {
        const message = `You have been made part of the team of site engineers of new project: ${newProject.projectName}.`;
        const redirectPage = `projects/${newProject._id}`;
        await Notification.create({
          employeeID: newProject.siteEngineers[i],
          redirectPage,
          message,
        });
      }

      for (let i = 0; i < newProject.staffMembers.length; ++i) {
        const message = `You have been made part of the team of staff members of new project: ${newProject.projectName}.`;
        const redirectPage = `projects/${newProject._id}`;
        await Notification.create({
          employeeID: newProject.staffMembers[i],
          redirectPage,
          message,
        });
      }

      sendSuccessResponse(res, 200, {
        message: "Project created successfully!",
        doc: newProject,
      });
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
      let projects;

      if (req.query.skip === "no") {
        projects = await Project.find({ isActive: true })
          .populate([
            {
              path: 'projectOwnerCompany'
            },
            {
              path: 'projectOwnerEmployee'
            },
            {
              path: 'projectManager'
            },
            {
              path: 'projectCategory'
            },
            {
              path: 'projectCreator'
            },
          ])
          .exec();
      }
      else {
        projects = await Project.find({ isActive: true })
          .limit(pageSize)
          .skip(pageSize * (page - 1))
          .populate([
            {
              path: 'projectOwnerCompany'
            },
            {
              path: 'projectOwnerEmployee'
            },
            {
              path: 'projectManager'
            },
            {
              path: 'projectCategory'
            },
            {
              path: 'projectCreator'
            },
          ])
          .exec();
      }

      const docsCount = await Project.countDocuments({ isActive: true });

      sendSuccessResponse(res, 200, {
        message: "List of projects retrieved successfully",
        docs: projects,
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
      const project = await Project.findOne({ _id: req.params.id, isActive: true })
        .populate([
          {
            path: 'projectOwnerCompany'
          },
          {
            path: 'projectOwnerEmployee'
          },
          {
            path: 'projectManager'
          },
          {
            path: 'projectCategory'
          },
          {
            path: 'projectCreator'
          },
        ])
        .exec();
      if (project) {
        sendSuccessResponse(res, 200, {
          message: "Project found!",
          doc: project,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "Project not found!",
          doc: null
        });
      }
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  overview: async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        sendErrorResponse(res, 422, {
          message: "Invalid ID!",
          doc: null
        });
        return; //early return
      }
      const project = await Project.findOne({ _id: req.params.id, isActive: true })
        .populate([
          {
            path: 'siteEngineers'
          },
          {
            path: 'staffMembers'
          },
          {
            path: 'projectOwnerCompany'
          },
          {
            path: 'projectOwnerEmployee'
          },
          {
            path: 'projectManager'
          },
          {
            path: 'projectCategory'
          },
          {
            path: 'projectCreator'
          },
        ])
        .exec();
      if (project) {
        const demands = await Demand.find({ projectObjectId: req.params.id, isActive: true });
        const quotations = await Quotation.find({ projectID: req.params.id, isActive: true });
        const purchaseOrders = await PurchaseOrder.find({ projectID: req.params.id, isActive: true })
          .populate([
            {
              path: 'vendorID'
            }
          ])
          .exec();
        const paymentVouchers = await PaymentVoucher.find({ projectID: req.params.id, isActive: true })
          .populate([
            {
              path: 'vendorID'
            }
          ])
          .exec();
        const materialReceiptSlips = await MaterialReceiptSlip.find({ projectID: req.params.id, isActive: true })
          .populate([
            {
              path: 'vendorID'
            }
          ])
          .exec();
        const materialIssueSlips = await MaterialIssue.find({ projectObjectId: req.params.id, isActive: true })
          .populate([
            {
              path: 'stockItemObjectId'
            }
          ])
          .exec();
        let payload = {
          project,
          demands,
          quotations,
          purchaseOrders,
          paymentVouchers,
          materialReceiptSlips,
          materialIssueSlips
        }
        sendSuccessResponse(res, 200, {
          message: "Project found!",
          doc: payload,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "Project not found!",
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
    let validData = null;
    try {
      validData = await projectValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    try {
      const existingProject = await Project.findOne({
        _id: req.params.id,
        isActive: true
      });
      if (!existingProject) {
        sendErrorResponse(res, 422, {
          message: "Project not found!",
          doc: null
        });
        return; //early return
      }

      let fileInputsNames = ["projectSoilReport", "projectBOQDocument"];
      for (let fileInputName of fileInputsNames) {

        if (!validData[fileInputName]) {
          //if no file was sent delete the possibly existing file
          if (existingProject[fileInputName]) {
            await deleteDataFile('projects', existingProject[fileInputName].fileNameOnServerDisk);
            validData[fileInputName] = null; //this null will replace the existing sub document.
          }
        }
        else { //file was sent. Now two possibilities.
          if (validData[fileInputName].fileNameOnServerDisk) {
            delete validData[fileInputName]; //let's not touch that is already stored in DB
          }
          else {
            //Delete the possibly existing file
            if (existingProject[fileInputName]) {
              await deleteDataFile('projects', existingProject[fileInputName].fileNameOnServerDisk);
            }
            let clientFileName = validData[fileInputName].clientFileName;
            let fileBytes = validData[fileInputName].fileAsBase64.split(',')[1];
            const fileNameOnServerDisk = await uploadDataFile(fileBytes, "projects", clientFileName);
            delete validData[fileInputName];
            validData[fileInputName] = { clientFileName, fileNameOnServerDisk };
          }
        }

      }

      if (validData.projectPictures) { //empty array is truthy
        //delete all existing images
        for (let i = 0; i < existingProject.projectPictures.length; i++) {
          await deleteDataFile('projects', existingProject.projectPictures[i]);
        }
        let projectPictures = []
        for (let i = 0; i < validData.projectPictures.length; i++) {
          let fileBytes = validData.projectPictures[i];
          const { fileName } = await uploadImage(fileBytes, "projects");
          projectPictures.push(fileName);
        }
        delete validData.projectPictures;
        validData["projectPictures"] = projectPictures;
      }

      const updatedProject = await Project.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { ...validData },
        { new: true }
      );

      if (existingProject.projectManager.toString() !== updatedProject.projectManager.toString()) {
        const message = `You have been made project manager of the project: ${updatedProject.projectName}.`;
        const redirectPage = `projects/${updatedProject._id}`;
        await Notification.create({
          employeeID: updatedProject.projectManager,
          redirectPage,
          message,
        });
      }

      for (let i = 0; i < updatedProject.siteEngineers.length; ++i) {
        const message = `The project: ${existingProject.projectName} details just got updated.`;
        const redirectPage = `projects/${existingProject._id}`;
        await Notification.create({
          employeeID: updatedProject.siteEngineers[i],
          redirectPage,
          message,
        });
      }

      for (let i = 0; i < updatedProject.staffMembers.length; ++i) {
        const message = `The project: ${existingProject.projectName} details just got updated.`;
        const redirectPage = `projects/${existingProject._id}`;
        await Notification.create({
          employeeID: updatedProject.staffMembers[i],
          redirectPage,
          message,
        });
      }

      sendSuccessResponse(res, 200, {
        message: "Project updated successfully!",
        doc: updatedProject,
      });
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed', 500));
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
      const project = await Project.findOne({ _id: req.params.id, isActive: true });
      if (!project) {
        sendErrorResponse(res, 404, {
          message: "Project not found!",
          doc: null
        });
      }
      await Project.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false }
      );
      sendSuccessResponse(res, 200, {
        message: 'Project deleted successfully.',
        doc: null
      });
    }
    catch (error) {
      console.log(error);
      next(error);
    }
  },
}