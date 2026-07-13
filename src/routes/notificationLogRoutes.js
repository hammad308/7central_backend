const express = require("express");
const router = express.Router();

const controller = require("../controllers/notificationLogController");
const menus = require("../constants/menus.constants");
const { protect, checkActionAccess } = require("../middlewares/protect");

router.get("/", protect, checkActionAccess(menus.admin, "list"), controller.getAll);

module.exports = router;