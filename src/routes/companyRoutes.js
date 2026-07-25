const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getOne,
  update,
  delete: deleteCompany,
} = require('../controllers/companyController');
const { printRequest } = require('../logger')('COMPANY_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

router
  .route('/')
  .post(
    printRequest,
    protect,
    checkActionAccess(menus.companies, 'create'),
    create
  )
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.companies, 'list'),
    getAll
  );

router
  .route('/:id')
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.companies, 'read'),
    getOne
  )
  .put(
    printRequest,
    protect,
    checkActionAccess(menus.companies, 'update'),
    update
  )
  .delete(
    printRequest,
    protect,
    checkActionAccess(menus.companies, 'delete'),
    deleteCompany
  );

module.exports = router;