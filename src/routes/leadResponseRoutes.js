const menus = require("../constants/menus.constants");
const {
    markResponse
} = require("../controllers/leadResponseController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const { printRequest } = require("../logger")("LEAD_RESPONSE_CONTROLLER");
const router = require("express").Router();

router.post("/", printRequest, protect, checkActionAccess(menus.lead, "update"), markResponse);

module.exports = router;