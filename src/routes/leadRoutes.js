const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    createLead,
    getLead,
    getAllLeads,
    updateLead,
    deleteLead,
    getLeadTimeline,
    getLeadReports,
    createProspect,
    assignProspect,
    getAllProspects,
    getAllLeadsAndProspects
} = require("../controllers/leadController");

const {
    verifyWebhook,
    handleMetaWebhook
} = require("../controllers/metaWebhookController");

const { printRequest } = require("../logger")("LEAD_CONTROLLER");

const { protect, checkActionAccess } = require("../middlewares/protect");

router.get("/webhook/meta", verifyWebhook);
router.post("/webhook/meta", handleMetaWebhook);

router.get("/report", printRequest, protect, checkActionAccess(menus.lead, "list"), getLeadReports);
router.get("/all", printRequest, protect, checkActionAccess(menus.lead, "list"), getAllLeadsAndProspects);

// Prospects
router.get("/prospects", printRequest, protect, checkActionAccess(menus.lead, "list"), getAllProspects);
router.post("/prospects", printRequest, protect, checkActionAccess(menus.lead, "create"), createProspect);
router.patch("/prospects/:id/assign", printRequest, protect, checkActionAccess(menus.lead, "update"), assignProspect);


router.get("/:id/timeline", printRequest, protect, checkActionAccess(menus.lead, 'read'), getLeadTimeline);

router.route("/")
    .post(printRequest, protect, checkActionAccess(menus.lead, 'create'), createLead)
    .get(printRequest, protect, checkActionAccess(menus.lead, 'list'), getAllLeads);

router.route("/:id")
    .get(printRequest, protect, checkActionAccess(menus.lead, 'read'), getLead)
    .put(printRequest, protect, checkActionAccess(menus.lead, 'update'), updateLead)
    .delete(printRequest, protect, checkActionAccess(menus.lead, 'delete'), deleteLead);

module.exports = router;
