const router = require("express").Router();
const menus = require("../constants/menus.constants");
const {
    create,
    getAll,
    getSingle,
    update,
    deleteProject
} = require("../controllers/projectController");
const { printRequest } = require("../logger")("PROJECT_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.route('/')
    .post(
        printRequest,
        protect,
        checkActionAccess(menus.projects, "create"),
        create
    )
    .get(printRequest, protect, checkActionAccess(menus.projects, "list"), getAll);

router.route('/:id')
    .get(printRequest, protect, checkActionAccess(menus.projects, "read"), getSingle)
    .put(
        printRequest,
        protect,
        checkActionAccess(menus.projects, "update"),
        update
    )
    .delete(printRequest, protect, checkActionAccess(menus.projects, "delete"), deleteProject);

module.exports = router;