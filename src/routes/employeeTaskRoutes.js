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
} = require('../controllers/employeeTaskController');
const { printRequest } = require('../logger')('EMPLOYEE_TASK_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// 1. Static Routes (Must be defined first)

// Employee self-service
router.get('/my-tasks', printRequest, protect, myTasks);

// Root admin endpoints
router
  .route('/')
  .post(printRequest, protect, checkActionAccess(menus.employeetasks, 'create'), create)
  .get(printRequest, protect, checkActionAccess(menus.employeetasks, 'list'), getAll);

// 2. Specialized Dynamic Routes

// Employee specific tasks
router.get(
  '/of-employee/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'read'),
  getAllOfEmployee
);

// Self-service task details (placed before the general /:id route)
router.get('/my-tasks/:id', printRequest, protect, getOne);

// Subtask management
router.patch(
  '/update-subtasks/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  updateSubtasks
);
router.post( // Changed to POST for resource creation
  '/add-new-subtask/:id',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  addNewSubtask
);
router.patch(
  '/update-subtask-status',
  printRequest,
  protect,
  updateSubtaskStatus
);
router.delete(
  '/delete-subtask',
  printRequest,
  protect,
  checkActionAccess(menus.employeetasks, 'update'),
  deleteSubtask
);

// Comment management
router.post( // Changed to POST for resource creation
  '/add-comment/:id',
  printRequest,
  protect,
  addComment
);

// Attachment management
router.post( // Changed to POST for resource creation
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

// 3. Generic Dynamic Routes (Must be last)
router
  .route('/:id')
  .get(printRequest, protect, checkActionAccess(menus.employeetasks, 'read'), getOne)
  .put(printRequest, protect, checkActionAccess(menus.employeetasks, 'update'), update)
  .delete(printRequest, protect, checkActionAccess(menus.employeetasks, 'delete'), deleteTask);

module.exports = router;
