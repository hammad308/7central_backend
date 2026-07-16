const router = require("express").Router();
const employeesComplaintsController = require("../controllers/employeesComplaintsController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("EMPLOYEECOMPLAINT_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.put("/update/:id", printRequest, protect, checkActionAccess(menus.employeecomplaints, 'update'), employeesComplaintsController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.employeecomplaints, 'delete'), employeesComplaintsController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.employeecomplaints, 'create'), employeesComplaintsController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.employeecomplaints, 'read'), employeesComplaintsController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.employeecomplaints, 'list'), employeesComplaintsController.getAll);

router.post("/my-complaints/create", printRequest, protect, checkActionAccess('mycomplaints', 'create'), employeesComplaintsController.create);
router.get("/my-complaints/", printRequest, protect, checkActionAccess('mycomplaints', 'list'), employeesComplaintsController.myComplaints);
router.get("/my-complaints/:id", printRequest, protect, checkActionAccess('mycomplaints', 'read'), employeesComplaintsController.getMyComplaint);
router.put("/my-complaints/:id", printRequest, protect, checkActionAccess('mycomplaints', 'update'), employeesComplaintsController.updateMyComplaint);

module.exports = router;