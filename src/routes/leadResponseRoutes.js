const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
    markResponse,
    getLeadResponses,
    deleteResponse,
} = require('../controllers/leadResponseController');
const { protect, checkActionAccess } = require('../middlewares/protect');
const { printRequest } = require('../logger')('LEAD_RESPONSE_CONTROLLER');

// Specific routes before parameterized
router.get('/lead/:leadId', printRequest, protect, checkActionAccess(menus.lead, 'read'), getLeadResponses);

// CRUD
router
    .route('/')
    .post(printRequest, protect, checkActionAccess(menus.lead, 'update'), markResponse);

router
    .route('/:id')
    .delete(printRequest, protect, checkActionAccess(menus.lead, 'delete'), deleteResponse);

module.exports = router;