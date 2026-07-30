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

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employees, 'create'), create)
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

router.get("/dashboardAttendance", printRequest, protect, checkActionAccess(menus.employeeattendances, "list"), getDashboardAttendance);

module.exports = router;