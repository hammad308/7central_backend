const menus = require("../constants/menus.constants");
const {
    createOrUpdate, getByCustomer
} = require("../controllers/notificationSettingController");
const { protect, checkActionAccess } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_SETTING_CONTROLLER");


router.post("/create-or-update", printRequest, protect, checkActionAccess(menus.customers, "create"), createOrUpdate)


router.get('/customer/:customerId', printRequest, protect, checkActionAccess(menus.customers, "read"), getByCustomer);


module.exports = router;