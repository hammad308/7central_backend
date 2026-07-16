const router = require("express").Router();
const employeesBonusesController = require("../controllers/employeesBonusesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEEBONUS_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

//router.put("/update/:id", authorize('employeebonus', 'update'), employeesBonusesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employeebonus, 'delete'), employeesBonusesController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.employeebonus, 'create'), employeesBonusesController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employeebonus, 'read'), employeesBonusesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employeebonus, 'list'), employeesBonusesController.getAll);

module.exports = router;