const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createCustomerDocument, createInventoryDocument, updateDocument, deleteOne,
    getAllDocuments
} = require("../controllers/documentController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_SETTING_CONTROLLER");
const upload = require("../middlewares/multer");

router.get("/", printRequest, protect, checkActionAccess(menus.document, "list"), getAllDocuments);
router.route("/create-customer-document")
    .post(printRequest, protect, checkActionAccess(menus.document, "create"),
        setUploadDirectory(IMG_DIR.document),
        // upload.array('files', 5),
        createCustomerDocument);

router.post("/create-inventory-document", printRequest, protect, checkActionAccess(menus.document, "create"),
    setUploadDirectory(IMG_DIR.document),
    upload.array('files', 5), createInventoryDocument)

//router.put("/:id",)

router.route('/:id')
    .put(printRequest, protect, checkActionAccess(menus.document, "update"),
        setUploadDirectory(IMG_DIR.document),
        upload.array('files', 5), updateDocument)
    .delete(printRequest, protect, checkActionAccess(menus.document, "delete"), deleteOne)


module.exports = router;