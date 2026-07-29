const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    createDealer,
    getDealer,
    getAllDealers,
    updateDealer,
    deleteDealer
} = require("../controllers/dealerController");

const { printRequest } = require("../logger")("DEALER_CONTROLLER");

const { protect, checkActionAccess } = require("../middlewares/protect");

router.route("/")
    .post(printRequest, protect, checkActionAccess(menus.dealer, 'create'), createDealer)
    .get(printRequest, protect, checkActionAccess(menus.dealer, 'list'), getAllDealers)

router.route("/:id")
    .get(printRequest, protect, checkActionAccess(menus.dealer, 'read'), getDealer)
    .put(printRequest, protect, checkActionAccess(menus.dealer, 'update'), updateDealer)
    .delete(printRequest, protect, checkActionAccess(menus.dealer, 'delete'), deleteDealer)

module.exports = router;
