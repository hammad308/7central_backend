const {
    createNotification,
    getAllNotifications,
    getMyNotifications,
    deleteNotification
} = require("../controllers/notificationController");
const menus = require("../constants/menus.constants");
const { protect, checkActionAccess } = require("../middlewares/protect");
const router = require("express").Router();
const { printRequest } = require("../logger")("NOTIFICATION_CONTROLLER");


router.route("/")
    .post(printRequest, protect, checkActionAccess(menus.notification, "create"), createNotification)
    .get(printRequest, protect, checkActionAccess(menus.notification, "list"), getAllNotifications)

router.get('/my', printRequest, protect, getMyNotifications);

router.delete("/:id", printRequest, protect, checkActionAccess(menus.notification, "delete"), deleteNotification)

module.exports = router;