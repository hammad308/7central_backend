const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    create, createJoint,
    getProgress,
    createNextOfKin,
    getSingle,
    update,
    deleteOne,
    getAll,
    updateNextOfKin,
    getCustomerInventories,
    getCustomerInstallments,
    getCustomerPayments,
    getCustomerPR
} = require("../controllers/customerController");
const upload = require("../middlewares/multer");
const { printRequest } = require("../logger")("CUSTOMER_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");

router.route('/')
    .post(
        printRequest,
        protect,
        checkActionAccess(menus.customers, "create"),
        setUploadDirectory(IMG_DIR.customer),
        // upload.single('image') , 
        create
    )
    .get(printRequest, protect, checkActionAccess(menus.customers, "list"), getAll);

router.post('/joint-members', printRequest,
    protect,
    checkActionAccess(menus.customers, "create"),
    setUploadDirectory(IMG_DIR.customer),
    upload.single('image'),
    createJoint);
router.post('/next-of-kin', printRequest,
    protect,
    checkActionAccess(menus.customers, "create"),
    setUploadDirectory(IMG_DIR.customer),
    // upload.single('image') , 
    createNextOfKin);

router.put('/update-next-of-kin/:id', printRequest,
    protect,
    checkActionAccess(menus.customers, "update"),
    setUploadDirectory(IMG_DIR.customer),
    // upload.single('image') , 
    updateNextOfKin);
router.post('/progress/:id', printRequest, protect, checkActionAccess(menus.customers, "read"), getProgress);
router.get('/:id/inventories', printRequest, protect, checkActionAccess(menus.customers, "read"), getCustomerInventories);
router.get('/:id/installments', printRequest, protect, checkActionAccess(menus.customers, "read"), getCustomerInstallments);
router.get('/:id/payments', printRequest, protect, checkActionAccess(menus.customers, "read"), getCustomerPayments);
router.get('/:id/prs', printRequest, protect, checkActionAccess(menus.customers, "read"), getCustomerPR);

router.route('/:id')
    .get(printRequest, protect, checkActionAccess(menus.customers, "read"), getSingle)
    .put(
        printRequest,
        protect,
        checkActionAccess(menus.customers, "update"),
        setUploadDirectory(IMG_DIR.customer),
        // upload.single('image') , 
        update
    )
    .delete(printRequest, protect, checkActionAccess(menus.customers, "delete"), deleteOne)

module.exports = router;