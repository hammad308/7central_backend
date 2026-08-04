const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteComplaint,
  myComplaints,
  getMyComplaint,
  updateMyComplaint,
  createMyComplaint
} = require('../controllers/employeeComplaintController');
const { printRequest } = require('../logger')('EMPLOYEE_COMPLAINT_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// Employee self‑service routes (my complaints)
router.post(
  '/my/complaints',
  printRequest,
  protect,
  createMyComplaint
);
router.get(
  '/my/complaints',
  printRequest,
  protect,
  myComplaints
);
router.get(
  '/my/complaints/:id',
  printRequest,
  protect,
  getMyComplaint
);
router.put(
  '/my/complaints/:id',
  printRequest,
  protect,
  updateMyComplaint
);

// Admin / HR routes
router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeecomplaints, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeecomplaints, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeecomplaints, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employeecomplaints, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employeecomplaints, 'delete'), deleteComplaint);

module.exports = router;