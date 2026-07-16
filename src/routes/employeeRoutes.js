const router = require("express").Router();
const employeesController = require("../controllers/employeesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEE_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.post("/create", printRequest, protect, checkActionAccess(menus.employees, 'create'), employeesController.create);
router.put("/update/:id", printRequest, protect, checkActionAccess(menus.employees, 'update'), employeesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employees, 'delete'), employeesController.delete);
router.get("/of-company/:id", printRequest, protect, checkActionAccess(menus.employees, 'list'), employeesController.getAllOfCompany);
router.get("/profile/:id", printRequest, protect, checkActionAccess(menus.employees, 'read'), employeesController.profile);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employees, 'read'), employeesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employees, 'list'), employeesController.getAll);

module.exports = router;