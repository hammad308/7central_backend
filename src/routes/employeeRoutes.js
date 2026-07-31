const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getAllOfCompany,
  getOne,
  profile,
  update,
  delete: deleteEmployee,
  getDashboardAttendance
} = require('../controllers/employeeController');
const { printRequest } = require('../logger')('EMPLOYEE_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');
const setUploadDirectory = require("../middlewares/setUploadDirectory");
const IMG_DIR= require("../constants/imgDir.constants")

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employees, 'create'),setUploadDirectory(IMG_DIR.employee), create)
  .get(printRequest, protect, checkActionAccess(menus.employees, 'list'), getAll);

router.get(
  '/company/:companyId',
  printRequest,
  protect,
  checkActionAccess(menus.employees, 'list'),
  getAllOfCompany
);

router.get(
  '/profile/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employees, 'read'),
  profile
);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employees, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employees, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employees, 'delete'), deleteEmployee);

router.get("/attendance/dashboard", printRequest, protect, checkActionAccess(menus.employeeattendances, "list"), getDashboardAttendance);

module.exports = router;