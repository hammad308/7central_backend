const router = require("express").Router();
const departmentsController = require("../controllers/departmentsController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("DEPARTMENT_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.post("/create", printRequest, protect, checkActionAccess(menus.departments, 'create'), departmentsController.create);
router.put("/update/:id", printRequest, protect, checkActionAccess(menus.departments, 'update'), departmentsController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.departments, 'delete'), departmentsController.delete);
router.get("/:id", printRequest, protect, checkActionAccess(menus.departments, 'read'), departmentsController.getOne);
router.get("/of-company/:id", printRequest, protect, checkActionAccess(menus.departments, 'list'), departmentsController.getAll);

module.exports = router;