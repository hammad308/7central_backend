const router = require("express").Router();
const leaveRulesController = require("../controllers/leaveRulesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("LEAVERULE_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.put("/update/:id", printRequest, protect, checkActionAccess(menus.leaverules, 'update'), leaveRulesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.leaverules, 'delete'), leaveRulesController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.leaverules, 'create'), leaveRulesController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.leaverules, 'read'), leaveRulesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.leaverules, 'list'), leaveRulesController.getAll);

module.exports = router;