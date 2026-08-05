"use strict";

const router = require("express").Router();
const projectsController = require("../controllers/projectsController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.put("/update/:id", authorize('projects', 'update'), projectsController.update);
router.delete("/delete/:id", authorize('projects', 'delete'), projectsController.delete);
router.post("/create", authorize('projects', 'create'), projectsController.create);
router.get("/overview/:id", authorize('projects', 'read'), projectsController.overview);
router.get("/:id", authorize('projects', 'read'), projectsController.getOne);
router.get("/", authorize('projects', 'read'), projectsController.getAll);

module.exports = router;