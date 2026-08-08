const router = require('express').Router();
const menus = require('../constants/menus.constants');
const {
    createLead,
    getLead,
    getAllLeads,
    updateLead,
    deleteLead,
    getLeadTimeline,
    getLeadReports,
    createProspect,
    assignProspect,
    getAllProspects,
    getAllLeadsAndProspects,
    getMyLeads,         
} = require('../controllers/leadController');
const { verifyWebhook, handleMetaWebhook } = require('../controllers/metaWebhookController');
const { printRequest } = require('../logger')('LEAD_CONTROLLER');
const { protect, checkActionAccess } = require('../middlewares/protect');

// Webhook routes (no auth)
router.get('/webhook/meta', verifyWebhook);
router.post('/webhook/meta', handleMetaWebhook);

// Employee self-service — specific before parameterized
router.get('/my-leads', printRequest, protect, getMyLeads);

// Report route
router.get('/report', printRequest, protect, checkActionAccess(menus.lead, 'list'), getLeadReports);
router.get('/all', printRequest, protect, checkActionAccess(menus.lead, 'list'), getAllLeadsAndProspects);

// Prospect routes
router.get('/prospects', printRequest, protect, checkActionAccess(menus.lead, 'list'), getAllProspects);
router.post('/prospects', printRequest, protect, checkActionAccess(menus.lead, 'create'), createProspect);
router.patch('/prospects/:id/assign', printRequest, protect, checkActionAccess(menus.lead, 'update'), assignProspect);

// Timeline route
router.get('/:id/timeline', printRequest, protect, checkActionAccess(menus.lead, 'read'), getLeadTimeline);

// CRUD routes
router
    .route('/')
    .post(printRequest, protect, checkActionAccess(menus.lead, 'create'), createLead)
    .get(printRequest, protect, checkActionAccess(menus.lead, 'list'), getAllLeads);

router
    .route('/:id')
    .get(printRequest, protect, checkActionAccess(menus.lead, 'read'), getLead)
    .put(printRequest, protect, checkActionAccess(menus.lead, 'update'), updateLead)
    .delete(printRequest, protect, checkActionAccess(menus.lead, 'delete'), deleteLead);

module.exports = router;