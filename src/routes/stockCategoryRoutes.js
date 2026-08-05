"use strict";

const router = require("express").Router();
const stockCategoriesController = require("../controllers/stockCategoriesController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.put("/update/:id", authorize('stockcategories', 'update'), stockCategoriesController.update);
router.delete("/delete/:id", authorize('stockcategories', 'delete'), stockCategoriesController.delete);
router.post("/create", authorize('stockcategories', 'create'), stockCategoriesController.create);
router.get("/:id", authorize('stockcategories', 'read'), stockCategoriesController.getOne);
router.get("/", authorize('stockcategories', 'read'), stockCategoriesController.getAll);

module.exports = router;