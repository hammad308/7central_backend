const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deletePublicHoliday
} = require('../controllers/publicHolidayController');
const { printRequest } = require('../logger')('PUBLIC_HOLIDAY_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.publicholidays, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.publicholidays, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.publicholidays, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.publicholidays, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.publicholidays, 'delete'), deletePublicHoliday);

module.exports = router;