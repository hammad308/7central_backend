"use strict";

const router = require("express").Router();
const stockItemsController = require("../controllers/stockItemsController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.put("/update/:id", authorize('stockitems', 'update'), stockItemsController.update);
router.delete("/delete/:id", authorize('stockitems', 'delete'), stockItemsController.delete);
router.post("/create", authorize('stockitems', 'create'), stockItemsController.create);
router.get("/of-category/:id", authorize('stockitems', 'read'), stockItemsController.getAllOfCategory);
router.get("/:id", authorize('stockitems', 'read'), stockItemsController.getOne);
router.get("/", authorize('stockitems', 'read'), stockItemsController.getAll);

module.exports = router;