const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    createCampaign,
    getCampaign,
    deleteCampaign,
    updateCampaign,
    getAllCampaigns
} = require("../controllers/campaignController");
const { printRequest } = require("../logger")("CAMPAIGN_CONTROLLER");
const { protect, checkActionAccess } = require("../middlewares/protect");

router.route("/")
    .post(printRequest, protect, checkActionAccess(menus.campaign, "create"), createCampaign)
    .get(printRequest, protect, checkActionAccess(menus.campaign, "list"), getAllCampaigns)

router.route("/:id")
    .put(printRequest, protect, checkActionAccess(menus.campaign, "update"), updateCampaign)
    .delete(printRequest, protect, checkActionAccess(menus.campaign, "delete"), deleteCampaign)
    .get(printRequest, protect, checkActionAccess(menus.campaign, "read"), getCampaign)

module.exports = router;