const router = require("express").Router();
const employeesAttendancesController = require("../controllers/employeesAttendancesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEEATTENDENCE_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.put("/update/:id", printRequest, protect, checkActionAccess(menus.employeeattendances, 'update'), employeesAttendancesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employeeattendances, 'delete'), employeesAttendancesController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.employeeattendances, 'create'), employeesAttendancesController.create);
router.get("/my-attendances", printRequest, protect, checkActionAccess('myattendances', 'read'), employeesAttendancesController.myAttendances);
router.patch("/check-out", printRequest, protect, checkActionAccess('myattendances', 'update'), employeesAttendancesController.checkOut);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employeeattendances, 'read'), employeesAttendancesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employeeattendances, 'read'), employeesAttendancesController.getAll);

module.exports = router;