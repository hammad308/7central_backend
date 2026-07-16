const router = require("express").Router();
const companiesController = require("../controllers/companiesController.js");
const menus = require("../constants/menus.constants");
const { printRequest } = require("../logger")("COMPANY_CONTROLLER");
const { protect, checkActionAccess } = require('../middlewares/protect');

router.post("/create", printRequest, protect, checkActionAccess(menus.companies, 'create'), companiesController.create);
router.put("/update/:id", printRequest, protect, checkActionAccess(menus.companies, 'update'), companiesController.update);
router.delete("/delete/:id", printRequest, protect, checkActionAccess(menus.companies, 'delete'), companiesController.delete);
router.get("/:id", printRequest, protect, checkActionAccess(menus.companies, 'read'), companiesController.getOne);
router.get("/", printRequest, protect, checkActionAccess(menus.companies, 'list'), companiesController.getAll);

module.exports = router;