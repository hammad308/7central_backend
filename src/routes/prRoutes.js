const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createProvisionalReceipt, updatePRBounce, updatePRApproved, getAllPRs
} = require("../controllers/prController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("PAYMENT_CONTROLLER");
const upload = require("../middlewares/multer");

router.route("/")
    .get(printRequest, protect, checkActionAccess(menus.payment, "list"), getAllPRs)
    .post(printRequest, protect, checkActionAccess(menus.payment, "create"), setUploadDirectory(IMG_DIR.payment), upload.single("payment"), createProvisionalReceipt);
router.route("/:id/cheque-bounced")
    .put(printRequest, protect, checkActionAccess(menus.payment, "update"), setUploadDirectory(IMG_DIR.payment), upload.single("payment"), updatePRBounce);
router.route("/:id/cheque-cleared")
    .put(printRequest, protect, checkActionAccess(menus.payment, "update"), setUploadDirectory(IMG_DIR.payment), upload.single("payment"), updatePRApproved);

module.exports = router;