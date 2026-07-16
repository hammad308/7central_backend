"use strict";

const router = require("express").Router();
const publicHolidaysController = require("../controllers/publicHolidaysController.js");
const { authorize } = require("../middlewares/accessControlMiddlewares.js");

router.put("/update/:id", authorize('publicholidays', 'update'), publicHolidaysController.update);
router.delete("/delete/:id", authorize('publicholidays', 'delete'), publicHolidaysController.delete);
router.post("/create", authorize('publicholidays', 'create'), publicHolidaysController.create);

router.get("/:id", authorize('publicholidays', 'read'), publicHolidaysController.getOne);
router.get("/", authorize('publicholidays', 'read'), publicHolidaysController.getAll);

module.exports = router;