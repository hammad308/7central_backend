"use strict";

const router = require("express").Router();
const employeesTasksController = require("../controllers/employeesTasksController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.post("/create", authorize('employeetasks', 'create'), employeesTasksController.create);
router.delete("/delete/:id", authorize('employeetasks', 'delete'), employeesTasksController.delete);
router.delete("/delete-attachment", authorize('employeetasks', 'update'), employeesTasksController.deleteAttachment);
router.delete("/delete-subtask", authorize('employeetasks', 'update'), employeesTasksController.deleteSubtask);
router.patch("/add-attachment/:id", authorize('employeetasks', 'update'), employeesTasksController.addAttachment);
router.patch("/update-details/:id", authorize('employeetasks', 'update'), employeesTasksController.updateDetails);
router.patch("/update-subtasks/:id", authorize('employeetasks', 'update'), employeesTasksController.updateSubtasks);
router.patch("/add-comment/:id", authorize('mytasks', 'update'), employeesTasksController.addComment);
router.patch("/add-new-subtask/:id", authorize('employeetasks', 'update'), employeesTasksController.addNewSubtask);
router.patch("/update-subtask-status", employeesTasksController.updateSubtaskStatus);
router.get("/of-employee/:id", authorize('employeetasks', 'read'), employeesTasksController.getAllOfEmployee);

router.get("/my-tasks", authorize('mytasks', 'read'), employeesTasksController.myTasks);
router.get("/my-tasks/:id", authorize('mytasks', 'read'), employeesTasksController.getOne);

router.get("/:id", authorize('employeetasks', 'read'), employeesTasksController.getOne);
router.get("/", authorize('employeetasks', 'read'), employeesTasksController.getAll);

module.exports = router;