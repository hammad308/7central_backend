const router = require("express").Router();
const workingHoursController = require("../controllers/workingHoursController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("WORKINGHOUR_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.put("/update/:id", printRequest, protect, checkActionAccess(menus.workinghours, 'update'), workingHoursController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.workinghours, 'delete'), workingHoursController.delete);
router.post("/create", printRequest, protect, checkActionAccess(menus.workinghours, 'create'), workingHoursController.create);
router.get("/:id", printRequest, protect, checkActionAccess(menus.workinghours, 'read'), workingHoursController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.workinghours, 'list'), workingHoursController.getAll);

module.exports = router;