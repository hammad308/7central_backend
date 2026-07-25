const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteLeaveRule,
} = require('../controllers/leaveRuleController');
const { printRequest } = require('../logger')('LEAVE_RULE_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.leaverules, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.leaverules, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.leaverules, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.leaverules, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.leaverules, 'delete'), deleteLeaveRule);

module.exports = router;