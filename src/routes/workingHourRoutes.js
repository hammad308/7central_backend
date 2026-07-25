const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteWorkingHour,
} = require('../controllers/workingHourController');
const { printRequest } = require('../logger')('WORKING_HOUR_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.workinghours, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.workinghours, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.workinghours, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.workinghours, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.workinghours, 'delete'), deleteWorkingHour);

module.exports = router;