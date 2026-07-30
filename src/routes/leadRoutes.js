const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    createLead,
    getLead,
    getAllLeads,
    updateLead,
    deleteLead,
    getLeadTimeline,
    getLeadReports
} = require("../controllers/leadController");

const { printRequest } = require("../logger")("LEAD_CONTROLLER");

const { protect, checkActionAccess } = require("../middlewares/protect");

router.route("/")
    .post(printRequest, protect, checkActionAccess(menus.lead, 'create'), createLead)
    .get(printRequest, protect, checkActionAccess(menus.lead, 'list'), getAllLeads)

router.get("/:id/timeline", printRequest, protect, checkActionAccess(menus.lead, 'read'), getLeadTimeline);

router.route("/:id")
    .get(printRequest, protect, checkActionAccess(menus.lead, 'read'), getLead)
    .put(printRequest, protect, checkActionAccess(menus.lead, 'update'), updateLead)
    .delete(printRequest, protect, checkActionAccess(menus.lead, 'delete'), deleteLead);

router.get("/report", printRequest, protect, checkActionAccess(menus.lead, "list", getLeadReports))

module.exports = router;
