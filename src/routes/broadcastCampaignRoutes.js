const express = require("express");
const router = express.Router();

const controller = require("../controllers/broadcastCampaignController");
const menus = require("../constants/menus.constants");
const { protect, checkActionAccess } = require("../middlewares/protect");

// add your admin auth middleware if needed
router.post("/", protect, checkActionAccess(menus.admin, "create"), controller.create);
router.get("/", protect, checkActionAccess(menus.admin, "list"), controller.getAll);
router.get("/:id", protect, checkActionAccess(menus.admin, "read"), controller.getOne);
router.patch("/:id", protect, checkActionAccess(menus.admin, "update"), controller.update);
router.post("/:id/send", protect, checkActionAccess(menus.admin, "create"), controller.send);
router.delete("/:id", protect, checkActionAccess(menus.admin, "delete"), controller.delete);

module.exports = router;