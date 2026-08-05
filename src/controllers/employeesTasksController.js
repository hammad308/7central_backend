"use strict";

const mongoose = require("mongoose");
const employeeTaskValidationSchema = require("../validations/employeeTaskValidationSchema.js");
const Employee = require("../models/employee.js");
const EmployeeTask = require("../models/employeeTask.js");
const Notification = require("../models/notification.js");
const { uploadDataFile, deleteDataFile } = require("../utils/uploadImage.js");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/sendJSONResponse.js");
const { getNextInSequence } = require("../utils/db.js");
const AppError = require("../utils/appError.js");
const joi = require('joi');

module.exports = {
  create: async (req, res, next) => {
    let validData = null;
    try {
      validData = await employeeTaskValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      });
      return; //early return
    }
    if (!mongoose.isValidObjectId(validData.supervisor)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    try {
      //Checking if all the employee IDs exist
      let employeeNotFound = false;
      for (let i = 0; i < validData.employeeIDs.length; i++) {
        const employeeID = validData.employeeIDs[i];
        if (!mongoose.isValidObjectId(employeeID)) {
          employeeNotFound = true;
          break; //invalid ObjectId was provided
        }
        const existingEmployee = await Employee.findOne({ _id: employeeID, isActive: true });
        if (!existingEmployee) {
          employeeNotFound = true; //ObjectId was valid but no corresponding document found
        }
      }
      if (employeeNotFound) {
        sendErrorResponse(res, 422, {
          message: "Employee not found!",
          doc: null
        });
        return; //early return
      }
      //Checking if supervisor ID exists
      const supervisor = Employee.findOne({ _id: validData.supervisor, isActive: true });
      if (!supervisor) {
        sendErrorResponse(res, 422, {
          message: "Supervisor not found!",
          doc: null
        });
        return; //early return
      }

      const newEmployeeTask = await EmployeeTask.create(validData);
      const newIDNumber = await getNextInSequence("employeetasks");
      newEmployeeTask.employeeTaskID = newIDNumber;
      await newEmployeeTask.save();

      const message = `You have been made supervisor of the new task "${newEmployeeTask.taskTitle}"`;
      const redirectPage = `employeestasks/${newEmployeeTask._id}`;
      await Notification.create({
        employeeID: newEmployeeTask.supervisor,
        redirectPage,
        message,
      });

      for (let i = 0; i < newEmployeeTask.employeeIDs.length; ++i) {
        const message = `You have been assigned a new task "${newEmployeeTask.taskTitle}"`;
        const redirectPage = `employeestasks/${newEmployeeTask._id}`;
        await Notification.create({
          employeeID: newEmployeeTask.employeeIDs[i],
          redirectPage,
          message,
        });
      }

      sendSuccessResponse(res, 200, {
        message: "Employee task created successfully.",
        doc: newEmployeeTask
      });
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database create operation failed', 500));
    }
  },
  getAll: async (req, res, next) => { //get all tasks of all employees
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      let employeesTasks;

      if (req.query.skip === "no") {
        employeesTasks = await EmployeeTask.find({ isActive: true })
          .populate([
            { path: 'supervisor' },
            { path: 'employeeIDs' }
          ])
          .exec();
      }
      else {
        employeesTasks = await EmployeeTask.find({ isActive: true })
          .limit(pageSize)
          .skip(pageSize * (page - 1))
          .populate([
            { path: 'supervisor' },
            { path: 'employeeIDs' }
          ])

          .exec();
      }

      const docsCount = await EmployeeTask.countDocuments({ isActive: true });
      sendSuccessResponse(res, 200, {
        docs: employeesTasks,
        docsCount: docsCount
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  getAllOfEmployee: async (req, res, next) => { //get all tasks of an employee
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        sendErrorResponse(res, 422, {
          message: "Invalid ID!",
          doc: null
        });
        return; //early return
      }

      const employee = await Employee.findOne({ _id: req.params.id, isActive: true });
      if (!employee) {
        sendErrorResponse(res, 404, {
          message: "Employee not found!",
          doc: null
        });
        return; //early return
      }

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const singleEmployeeTasks = await EmployeeTask.find({ employeeIDs: req.params.id, isActive: true })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' }
        ])
        .exec();

      const docsCount = await EmployeeTask.countDocuments({ employeeIDs: req.params.id, isActive: true });

      const pendingTasksCount = await EmployeeTask.countDocuments({
        employeeIDs: req.params.id,
        taskStatus: 0,
        isActive: true
      });

      const finishedTasksCount = await EmployeeTask.countDocuments({
        employeeIDs: req.params.id,
        taskStatus: 1,
        isActive: true
      });

      const percentTasksFinished = (finishedTasksCount / docsCount) * 100;

      sendSuccessResponse(res, 200, {
        docs: singleEmployeeTasks,
        docsCount: docsCount,
        pendingTasksCount,
        finishedTasksCount,
        percentTasksFinished
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  myTasks: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        sendErrorResponse(res, 422, {
          message: "Invalid Employee ID!",
          docs: null
        });
        return; //early return
      }
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const employeeTasks = await EmployeeTask.find({ employeeIDs: req.user.employee_id, isActive: true })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate([
          {
            path: 'supervisor'
          },
          {
            path: 'employeeIDs'
          }
        ])
        .exec();

      const docsCount = await EmployeeTask.countDocuments({ employeeIDs: req.user.employee_id, isActive: true });

      const pendingTasksCount = await EmployeeTask.countDocuments({
        employeeIDs: req.user.employee_id,
        taskStatus: 0,
        isActive: true
      });

      const finishedTasksCount = await EmployeeTask.countDocuments({
        employeeIDs: req.user.employee_id,
        taskStatus: 1,
        isActive: true
      });

      const percentTasksFinished = (finishedTasksCount / docsCount) * 100;

      sendSuccessResponse(res, 200, {
        docs: employeeTasks,
        docsCount: docsCount,
        pendingTasksCount,
        finishedTasksCount,
        percentTasksFinished
      });
    }
    catch (error) {
      console.log(error);
      next(new AppError('Database read operation failed', 500));
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
      const task = await EmployeeTask.findOne({ _id: req.params.id, isActive: true })
        .populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' },
        ])
        .exec();
      if (task) {
        sendSuccessResponse(res, 200, {
          message: "Task found!",
          doc: task,
        });
      }
      else {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
      }
    }
    catch (error) {
      console.log(error);
      next(new AppError("Database read operation failed!", 500));
    }
  },
  updateDetails: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }
    let validData = null;
    try {
      validData = await employeeTaskValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }
    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        const updatedDoc = await EmployeeTask.findOneAndUpdate(
          { _id: req.params.id, isActive: true },
          validData,
          { new: true, runValidators: true }
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' }
        ])
          .exec();

        if (existingEmployeeTask.supervisor.toString() !== updatedDoc.supervisor._id.toString()) {
          const message = `You have been made supervisor of the task "${updatedDoc.taskTitle}"`;
          const redirectPage = `employeestasks/${updatedDoc._id}`;
          await Notification.create({
            employeeID: updatedDoc.supervisor._id,
            redirectPage,
            message,
          });
        }

        for (let i = 0; i < updatedDoc.employeeIDs.length; ++i) {
          const message = `Task: ${updatedDoc.taskTitle} just got updated with new details.`;
          const redirectPage = `employeestasks/${updatedDoc._id}`;
          await Notification.create({
            employeeID: updatedDoc.employeeIDs[i]._id,
            redirectPage,
            message,
          });
        }

        sendSuccessResponse(res, 200, {
          message: "Task updated successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  updateSubtasks: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }

    const subtaskValidationSchema = joi.object().keys({
      subtaskTitle: joi.string().required(),
      subtaskDescription: joi.string().allow("").required(), //allow empty
      subtaskStatus: joi.number().valid(0, 1).required(),
      employeeID: joi.string().required(),
    });

    const requestValidationSchema = joi.object().keys({
      subtasks: joi.array().items(subtaskValidationSchema).required(),
    });

    let validData = null;
    try {
      validData = await requestValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }

    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {

        for (let subtask of validData.subtasks) {
          if (!existingEmployeeTask.employeeIDs.includes(subtask.employeeID)) {
            sendErrorResponse(res, 403, {
              message: "All assignees should also be selected in edit tab",
              doc: null
            });
            return; //early return
          }
        }

        const updatedDoc = await EmployeeTask.findOneAndUpdate(
          { _id: req.params.id, isActive: true },
          validData,
          { new: true, runValidators: true }
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' }
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "Task updated successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  addComment: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }

    const requestValidationSchema = joi.object().keys({
      content: joi.string().required()
    });

    let validData = null;
    try {
      validData = await requestValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }

    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        if (!req.user.employee_id) {
          sendErrorResponse(res, 422, {
            message: "Invalid Employee ID!",
            doc: null
          });
          return; //early return
        }

        existingEmployeeTask.comments.push(
          {
            content: validData.content,
            employeeID: req.user.employee_id
          }
        )

        await existingEmployeeTask.save();

        const updatedDoc = await EmployeeTask.findOne(
          { _id: req.params.id, isActive: true },
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' },
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "Task updated successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  addNewSubtask: async (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      sendErrorResponse(res, 422, {
        message: "Invalid ID!",
        doc: null
      });
      return; //early return
    }

    const subtaskValidationSchema = joi.object().keys({
      subtaskTitle: joi.string().required(),
      subtaskDescription: joi.string().allow("").optional(), //allow empty
      subtaskStatus: joi.number().valid(0, 1).required(),
      employeeID: joi.string().required(),
    });

    let validData = null;
    try {
      validData = await subtaskValidationSchema.validateAsync(req.body);
    }
    catch (error) {
      sendErrorResponse(res, 422, {
        message: error.details[0].message,
        doc: null
      })
      return; //early return
    }

    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {

        existingEmployeeTask.subtasks.push(validData);

        await existingEmployeeTask.save();

        const updatedDoc = await EmployeeTask.findOne(
          { _id: req.params.id, isActive: true },
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' }
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "Task updated successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  addAttachment: async (req, res, next) => {
    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        let clientFileName = req.body.attachedFile.clientFileName;
        let fileBytes = req.body.attachedFile.fileAsDataURL.split(',')[1];
        const fileNameOnServerDisk = await uploadDataFile(fileBytes, "employees", clientFileName);

        existingEmployeeTask.attachments.push({
          clientFileName,
          fileNameOnServerDisk
        });

        await existingEmployeeTask.save();

        const updatedDoc = await EmployeeTask.findOne(
          { _id: req.params.id, isActive: true },
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' },
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "Task updated successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  deleteAttachment: async (req, res, next) => {
    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.body.employeeTaskObjectId, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        let updatedDoc = await EmployeeTask.findOneAndUpdate(
          { "attachments._id": req.body.fileObjectId },
          { $pull: { attachments: { _id: req.body.fileObjectId } } },
          { new: true, runValidators: true }
        );
        await deleteDataFile("employees", req.body.fileNameOnServerDisk);

        updatedDoc = await EmployeeTask.findOne(
          { _id: req.body.employeeTaskObjectId, isActive: true },
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' },
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "File deleted successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  deleteSubtask: async (req, res, next) => {
    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.body.employeeTaskObjectId, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        let updatedDoc = await EmployeeTask.findOneAndUpdate(
          { "subtasks._id": req.body.subTaskObjectId },
          { $pull: { subtasks: { _id: req.body.subTaskObjectId } } },
          { new: true, runValidators: true }
        );

        updatedDoc = await EmployeeTask.findOne(
          { _id: req.body.employeeTaskObjectId, isActive: true },
        ).populate([
          { path: 'supervisor' },
          { path: 'employeeIDs' },
          { path: 'subtasks.employeeID' },
          { path: 'comments.employeeID' },
        ])
          .exec();

        sendSuccessResponse(res, 200, {
          message: "Subtask deleted successfully",
          doc: updatedDoc,
        });
      }
    } //end try block
    catch (error) {
      console.log(error);
      next(new AppError('Database update operation failed!', 500));
    }
  },
  updateSubtaskStatus: async (req, res, next) => {
    try {
      let existingEmployeeTask = await EmployeeTask.findOne({ _id: req.body.employeeTaskObjectId, isActive: true });
      if (!existingEmployeeTask) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
        return; //early return
      }
      else {
        //Checking if request sender owns subtask
        let owner = false;
        if (req.user.employee_id) {
          for (let i = 0; i < existingEmployeeTask.subtasks.length; i++) {
            if (
              (existingEmployeeTask.subtasks[i]._id.toString() === req.body.subtaskObjectID) &&
              (existingEmployeeTask.subtasks[i].employeeID.toString() === req.user.employee_id.toString())
            ) {
              owner = true;
            }
          }
        }
        if (owner || (req.user.isSuperAdmin || req.user.isAdmin)) {
          const updatedDoc = await EmployeeTask.findOneAndUpdate(
            { _id: req.body.employeeTaskObjectId, 'subtasks._id': req.body.subtaskObjectID },
            { $set: { 'subtasks.$.subtaskStatus': 1 } },
            { new: true, runValidators: true }
          )
            .populate([
              { path: 'supervisor' },
              { path: 'employeeIDs' },
              { path: 'subtasks.employeeID' },
              { path: 'comments.employeeID' }
            ])
            .exec();

          sendSuccessResponse(res, 200, {
            message: "Subtask marked as completed successfully",
            doc: updatedDoc,
          });
        }
        else {
          sendErrorResponse(res, 403, {
            message: "Forbidden. You are not allowed to perform this action",
            doc: null
          });
          return; //early return
        }
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
      const doc = await EmployeeTask.findOne({ _id: req.params.id, isActive: true });
      if (!doc) {
        sendErrorResponse(res, 404, {
          message: "Task not found!",
          doc: null
        });
      }
      await EmployeeTask.findOneAndUpdate(
        { _id: req.params.id, isActive: true },
        { isActive: false },
        { new: true, runValidators: true }
      );
      sendSuccessResponse(res, 200, {
        message: 'Task deleted successfully.',
        doc: null
      });
    }
    catch (error) {
      console.log(error);
      next(error);
    }
  },
}