const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAllByCompany,
  getAll,
  getOne,
  update,
  delete: deleteDepartment,
} = require('../controllers/departmentController');
const { printRequest } = require('../logger')('DEPARTMENT_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// CRUD for a single department
router
  .route('/')
  .post(
    printRequest,
    protect,
    checkActionAccess(menus.departments, 'create'),
    create
  )
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.departments, 'list'),
    getAll
  );

// List departments for a specific company
router.get(
  '/company/:companyId',
  printRequest,
  protect,
  checkActionAccess(menus.departments, 'list'),
  getAllByCompany
);

router
  .route('/:id')
  .get(
    printRequest,
    protect,
    checkActionAccess(menus.departments, 'read'),
    getOne
  )
  .put(
    printRequest,
    protect,
    checkActionAccess(menus.departments, 'update'),
    update
  )
  .delete(
    printRequest,
    protect,
    checkActionAccess(menus.departments, 'delete'),
    deleteDepartment
  );

module.exports = router;