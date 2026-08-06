const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
  create,
  getAll,
  getAllOfEmployee,
  myTasks,
  getOne,
  update,
  updateSubtasks,
  addComment,
  addNewSubtask,
  addAttachment,
  deleteAttachment,
  deleteSubtask,
  updateSubtaskStatus,
  delete: deleteTask,
} = require('../controllers/employeesTaskController');
const { printRequest } = require('../logger')('EMPLOYEE_TASK_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// Employee self-service routes (my tasks)
router.get('/my-tasks', printRequest, protect, myTasks);
router.get('/my-tasks/:id', printRequest, protect, getOne);

// Admin routes
router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeetasks, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeetasks, 'list'), getAll);

router.get(
  '/of-employee/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'read'),
  getAllOfEmployee
);

router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeetasks, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employeetasks, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employeetasks, 'delete'), deleteTask);

// Subtask & attachment routes
router.patch(
  '/update-subtasks/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  updateSubtasks
);
router.patch(
  '/add-comment/:id',
  printRequest,
  protect,
  addComment
);
router.patch(
  '/add-new-subtask/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  addNewSubtask
);
router.patch(
  '/add-attachment/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  addAttachment
);
router.delete(
  '/delete-attachment',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  deleteAttachment
);
router.delete(
  '/delete-subtask',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  deleteSubtask
);
router.patch(
  '/update-subtask-status',
  printRequest,
  protect,
  updateSubtaskStatus
);

module.exports = router;