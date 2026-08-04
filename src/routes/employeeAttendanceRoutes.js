const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  checkOut,
  getAll,
  myAttendances,
  getOne,
  update,
  delete: deleteAttendance,
} = require('../controllers/employeeAttendanceController');
const { printRequest } = require('../logger')('EMPLOYEE_ATTENDANCE_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router.post(
  '/check-in',
  printRequest,
  protect,
  create  
);

router.patch(
  '/check-out',
  printRequest,
  protect,
  checkOut
);

router.get(
  '/my-attendances',
  printRequest,
  protect,
  myAttendances
);
// Admin (HR) Routes
router
  .route('/')
  .get(printRequest, protect, checkActionAccess(menus.employeeattendances, 'list'), getAll)
  .post(printRequest, protect, checkActionAccess(menus.employeeattendances, 'create'), create); 

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeeattendances, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employeeattendances, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employeeattendances, 'delete'), deleteAttendance);

module.exports = router;