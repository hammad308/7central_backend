const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  delete: deleteBonus,
  myBonuses,
  getMyBonus
} = require('../controllers/employeeBonusController');
const { printRequest } = require('../logger')('EMPLOYEE_BONUS_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router.get("/my", printRequest, protect, myBonuses);
router.get("/my/:id", printRequest, protect, getMyBonus);

router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeebonus, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeebonus, 'list'), getAll);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeebonus, 'read'), getOne)
  .delete(printRequest, protect, checkActionAccess(menus.employeebonus, 'delete'), deleteBonus);

module.exports = router;