const router = require("express").Router();
const IMG_DIR = require("../constants/imgDir.constants");
const menus = require("../constants/menus.constants");
const {
    createInventory,
    getAllInventories,
    getSingle,
    update,
    deleteInventory,
    inventoryPaymentStats,
    createCSVUploadOfInventory
} = require("../controllers/inventoryController");
const upload = require("../middlewares/multer");
const { printRequest } = require("../logger")("INVENTORY_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");
router.route('/')
    .post(
        printRequest,
        protect,
        checkActionAccess(menus.inventories, "create"),
        createInventory
    )
    .get(printRequest, protect, checkActionAccess(menus.inventories, "list"), getAllInventories);
router.get('/payment-stats', printRequest, protect, inventoryPaymentStats);
router.post('/upload-by-csv', printRequest, protect, createCSVUploadOfInventory);
router.route('/:id')
    .get(printRequest, protect,checkActionAccess(menus.inventories, "read") , getSingle)
    .put(
        printRequest,
        protect,
        checkActionAccess(menus.inventories,"update"),
        update
    )
    .delete(printRequest, protect, checkActionAccess(menus.inventories,"delete"), deleteInventory);

module.exports = router;