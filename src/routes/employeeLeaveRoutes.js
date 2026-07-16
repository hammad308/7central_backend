const router = require("express").Router();
const employeesLeavesController = require("../controllers/employeesLeavesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEELEAVE_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.put("/update/:id", printRequest, protect, checkActionAccess(menus.employeeleaves, 'update'), employeesLeavesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employeeleaves, 'delete'), employeesLeavesController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.employeeleaves, 'create'), employeesLeavesController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employeeleaves, 'read'), employeesLeavesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employeeleaves, 'list'), employeesLeavesController.getAll);

router.post("/my-leaves/create", printRequest, protect, checkActionAccess('myleaves', 'create'), employeesLeavesController.create);
router.get("/my-leaves", printRequest, protect, checkActionAccess('myleaves', 'list'), employeesLeavesController.myLeaves);
router.get("/my-leaves/:id", printRequest, protect, checkActionAccess('myleaves', 'read'), employeesLeavesController.getMyLeave);
router.put("/update-my-leave/:id", printRequest, protect, checkActionAccess('myleaves', 'update'), employeesLeavesController.updateMyLeave);

module.exports = router;