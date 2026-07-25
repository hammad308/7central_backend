const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  myLeaves,
  getOne,
  getMyLeave,
  update,
  updateMyLeave,
  delete: deleteLeave,
} = require('../controllers/employeeLeaveController');
const { printRequest } = require('../logger')('EMPLOYEE_LEAVE_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// Admin / HR routes
router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeeleaves, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeeleaves, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeeleaves, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employeeleaves, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employeeleaves, 'delete'), deleteLeave);

// Employee self‑service routes
router.post(
  '/my-leaves',
  printRequest,
  protect,
  create // same create, auto-assigns employee from token
);
router.get(
  '/my-leaves',
  printRequest,
  protect,
  myLeaves
);
router.get(
  '/my-leaves/:id',
  printRequest,
  protect,
  getMyLeave
);
router.put(
  '/my-leaves/:id',
  printRequest,
  protect,
  updateMyLeave
);

module.exports = router;