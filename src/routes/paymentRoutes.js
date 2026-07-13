const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createPayment, createInventoryPayment, verifyPayment,
    getAllPayments,
    getSinglePayment,
    mergePayment,
    mergePendingPayment
} = require("../controllers/paymentController");
const { protect, checkActionAccess, isSuperAdmin } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("PAYMENT_CONTROLLER");
const upload = require("../middlewares/multer");


router.get("/", printRequest, protect, checkActionAccess(menus.payment, "list"), getAllPayments);
router.post("/merge", printRequest, protect, checkActionAccess(menus.payment, "create"), mergePayment);
router.post("/merge-pending", printRequest, protect, checkActionAccess(menus.payment, "create"), mergePendingPayment);
router.post("/submit-pay-installment", printRequest, protect, checkActionAccess(menus.payment, "create"), setUploadDirectory(IMG_DIR.payment), upload.single("receipt"), createPayment);
router.post("/submit-inventory-payment", printRequest, protect, checkActionAccess(menus.payment, "create"), setUploadDirectory(IMG_DIR.payment), upload.single("receipt"), createInventoryPayment);
router.put("/verify-payment-from-admin", printRequest, protect, isSuperAdmin, verifyPayment);
router.get("/:id", printRequest, protect, checkActionAccess(menus.payment, "read"), getSinglePayment);

module.exports = router;