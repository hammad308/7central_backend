const router = require("express").Router();
const employeesIncrementsController = require("../controllers/employeesIncrementsController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEEINCREMENT_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employeeincrements, 'delete'), employeesIncrementsController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.employeeincrements, 'create'), employeesIncrementsController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employeeincrements, 'read'), employeesIncrementsController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employeeincrements, 'list'), employeesIncrementsController.getAll);

module.exports = router;