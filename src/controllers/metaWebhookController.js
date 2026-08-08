const catchAsync = require('../utils/catchAsync');
const Lead = require('../models/leadModel');
const logger = require('../logger')('META_WEBHOOK');
const crypto = require('crypto');

// ==================== SIGNATURE VERIFICATION ====================
const verifyMetaSignature = (req) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        logger.warn('Missing x-hub-signature-256 header');
        return false;
    }

    if (!req.rawBody) {
        logger.warn('Missing raw body for signature verification');
        return false;
    }

    try {
        const expected = 'sha256=' + crypto
            .createHmac('sha256', process.env.META_APP_SECRET)
            .update(req.rawBody)
            .digest('hex');

        // Use timingSafeEqual to prevent timing attacks
        if (signature.length !== expected.length) return false;

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected)
        );
    } catch (err) {
        logger.error('Signature verification error:', err.message);
        return false;
    }
};

// ==================== FETCH LEAD DATA FROM GRAPH API ====================
const fetchLeadData = async (leadgenId) => {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Graph API error ${response.status}: ${errorText}`);
        }

        return response.json();
    } catch (err) {
        logger.error(`Failed to fetch lead data for ${leadgenId}:`, err.message);
        throw err;
    }
};

// ==================== PARSE FIELD DATA ====================
const parseFieldData = (fieldData = []) => {
    const fields = {};
    for (const { name, values } of fieldData) {
        fields[name] = values?.[0] ?? null;
    }
    return fields;
};

// ==================== VERIFICATION ENDPOINT ====================
exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (!mode || !token || !challenge) {
        logger.warn('Missing webhook verification parameters');
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (mode !== 'subscribe') {
        logger.warn(`Invalid hub.mode: ${mode}`);
        return res.status(400).json({ error: 'Invalid hub.mode' });
    }

    if (token !== process.env.META_VERIFY_TOKEN) {
        logger.warn('Webhook verification token mismatch');
        return res.status(403).json({ error: 'Verification failed — token mismatch' });
    }

    logger.info('Meta webhook verified successfully');
    return res.status(200).send(challenge);
};

// ==================== MAIN WEBHOOK HANDLER ====================
exports.handleMetaWebhook = catchAsync(async (req, res) => {
    // Verify signature
    if (!verifyMetaSignature(req)) {
        logger.warn('Invalid Meta webhook signature');
        return res.status(403).json({ error: 'Invalid signature' });
    }

    // Respond immediately to Meta (Meta retries if no 200 within 20s)
    res.status(200).json({ received: true });

    // Process async — don't block response
    processWebhookAsync(req.body).catch(err => {
        logger.error('Webhook async processing failed:', err.message);
    });
});

// ==================== ASYNC WEBHOOK PROCESSING ====================
const processWebhookAsync = async (body) => {
    const entries = body?.entry ?? [];

    for (const entry of entries) {
        const changes = entry?.changes ?? [];

        for (const change of changes) {
            if (change.field !== 'leadgen') {
                logger.debug(`Skipping non-leadgen change: ${change.field}`);
                continue;
            }

            const { leadgen_id, page_id, form_id, ad_id } = change.value;

            if (!leadgen_id) {
                logger.warn('Missing leadgen_id in webhook payload');
                continue;
            }

            try {
                // Fetch lead data from Graph API
                const leadData = await fetchLeadData(leadgen_id);
                const fields = parseFieldData(leadData.field_data);

                const name = fields.full_name || fields.name;
                const email = fields.email;
                const phone = fields.phone_number || fields.phone;
                const whatsApp = fields.whatsapp_number;

                // Validate required fields
                if (!name || !phone || !email || !whatsApp) {
                    logger.warn(`Incomplete lead data for leadgen_id: ${leadgen_id}`, {
                        hasName: !!name,
                        hasEmail: !!email,
                        hasPhone: !!phone,
                        hasWhatsApp: !!whatsApp,
                    });
                    continue;
                }

                // Duplicate check — leadgen_id, email, phone, whatsApp
                const isExist = await Lead.findOne({
                    $or: [
                        { metaLeadgenId: leadgen_id.toString() },
                        ...(email ? [{ email }] : []),
                        { phoneNumber: phone },
                        { whatsAppNumber: whatsApp },
                    ],
                });

                if (isExist) {
                    logger.info(`Duplicate lead skipped for leadgen_id: ${leadgen_id} (existing: ${isExist._id})`);
                    continue;
                }

                // Create lead
                await Lead.create({
                    name,
                    email: email,
                    phoneNumber: phone,
                    whatsAppNumber: whatsApp,
                    leadSource: 'meta_ads',
                    heardVia: 'meta_ads',
                    metaLeadgenId: leadgen_id.toString(),
                    assignedTo: null,
                    assignedBy: null,
                    assignedAt: null,
                    createdBy: process.env.SYSTEM_USER_ID,
                    status: 'new',
                    note: `Meta Ad ID: ${ad_id || 'N/A'} | Form ID: ${form_id || 'N/A'} | Page ID: ${page_id || 'N/A'}`,
                });

                logger.info(`Lead created from Meta webhook: ${leadgen_id} — ${name}`);

            } catch (err) {
                logger.error(`Failed to process leadgen_id ${leadgen_id}:`, err.message);
                // Continue — don't let one failure stop others
            }
        }
    }
};