const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    create,
    getAll,
    getSingle,
    update,
    deleteBlockOrFloor
} = require("../controllers/blockOrFloorController");
const { printRequest } = require("../logger")("BLOCKORFLOOR_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.route('/')
    .post(
        printRequest,
        protect,
        checkActionAccess(menus.blockOrFloor, "create"),
        create
    )
    .get(printRequest, protect, checkActionAccess(menus.blockOrFloor, "list"), getAll);


router.route('/:id')
    .get(printRequest, protect, checkActionAccess(menus.blockOrFloor, "read"), getSingle)
    .put(
        printRequest,
        protect,
        checkActionAccess(menus.blockOrFloor, "update"),
        update
    )
    .delete(printRequest, protect, checkActionAccess(menus.blockOrFloor, "delete"), deleteBlockOrFloor);


module.exports = router;