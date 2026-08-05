"use strict";

const router = require("express").Router();
const projectsCategoriesController = require("../controllers/projectsCategoriesController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.put("/update/:id", authorize('projectcategories', 'update'), projectsCategoriesController.update);
router.delete("/delete/:id", authorize('projectcategories', 'delete'), projectsCategoriesController.delete);
router.post("/create", authorize('projectcategories', 'create'), projectsCategoriesController.create);
router.get("/:id", authorize('projectcategories', 'read'), projectsCategoriesController.getOne);
router.get("/", authorize('projectcategories', 'read'), projectsCategoriesController.getAll);

module.exports = router;