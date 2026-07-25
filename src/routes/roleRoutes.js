const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteRole,
} = require('../controllers/roleController');
const { printRequest } = require('../logger')('ROLE_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router
  .route('/')
  .post(
    printRequest,
    protect,
    checkActionAccess(menus.roles, 'create'), // you'll add 'roles' to menus.constants
    create
  )
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.roles, 'list'),
    getAll
  );

router
  .route('/:id')
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.roles, 'read'),
    getOne
  )
  .put(
    printRequest,
    protect,
    checkActionAccess(menus.roles, 'update'),
    update
  )
  .delete(
    printRequest,
    protect,
    checkActionAccess(menus.roles, 'delete'),
    deleteRole
  );

module.exports = router;