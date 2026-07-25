
const { createSale, createPaymentPlan, getPaymentPlan, getAllInstallments, changeInventoryOwnershipSale, getSingleInventoryAllOwnerShips, getSingleInstallment, updatePaymentPlan, approvePurchasePlan } = require("../controllers/saleController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const menus = require("../constants/menus.constants");
const router = require("express").Router();
const { printRequest } = require("../logger")("SALE_CONTROLLER");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const IMG_DIR = require("../constants/imgDir.constants");

router.route("/assign-inventory")
    .post(printRequest, protect, checkActionAccess(menus.sale, "create"), setUploadDirectory(IMG_DIR.sale), createSale);
router.route("/inventory-ownership-transfer")
    .post(printRequest, protect, checkActionAccess(menus.sale, "update"), changeInventoryOwnershipSale);
router.route("/create-purchase-plan")
    .post(printRequest, protect, checkActionAccess(menus.sale, "create"), createPaymentPlan);
router.route("/update-purchase-plan")
    .post(printRequest, protect, checkActionAccess(menus.sale, "update"), updatePaymentPlan);
router.route("/get-purchase-plan")
    .get(printRequest, protect, checkActionAccess(menus.sale, "read"), getPaymentPlan);
router.route("/get-all-installments")
    .get(printRequest, protect, checkActionAccess(menus.sale, "list"), getAllInstallments);
router.route("/get-all-installments/:id")
    .get(printRequest, protect, checkActionAccess(menus.sale, "read"), getSingleInstallment);
router.route("/get-inventory-all-ownership-history")
    .get(printRequest, protect, checkActionAccess(menus.sale, "read"), getSingleInventoryAllOwnerShips);
router.route("/approve-purchase-plan/")
    .post(printRequest, protect, checkActionAccess(menus.sale, "create"), approvePurchasePlan)

module.exports = router;