const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  meetingsToday,
  getOne,
  update,
  delete: deleteEvent,
} = require('../controllers/eventController');
const { printRequest } = require('../logger')('EVENT_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// Employee self-service routes (my meetings)
router.get('/my-meetings', printRequest, protect, getAll);  

// Special routes
router.get('/meetings-today', printRequest, protect, meetingsToday);

// Admin routes
router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.events, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.events, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.events, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.events, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.events, 'delete'), deleteEvent);

module.exports = router;