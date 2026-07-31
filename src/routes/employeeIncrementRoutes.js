const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  delete: deleteIncrement,
  myIncrements,
  getMyIncrement
} = require('../controllers/employeeIncrementController');
const { printRequest } = require('../logger')('EMPLOYEE_INCREMENT_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router.get("/my", printRequest, protect, myIncrements);
router.get("/my/:id", printRequest, protect, getMyIncrement);

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeeincrements, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeeincrements, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeeincrements, 'read'), getOne)
  .delete(printRequest, protect, checkActionAccess(menus.employeeincrements, 'delete'), deleteIncrement);

module.exports = router;