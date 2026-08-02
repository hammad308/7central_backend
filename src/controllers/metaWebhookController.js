const catchAsync = require("../utils/catchAsync");
const Lead = require("../models/leadModel");
const logger = require("../logger")("META_WEBHOOK");
const crypto = require("crypto");

// Signature Verification 
const verifyMetaSignature = (req) => {
    const signature = req.headers["x-hub-signature-256"];
    if (!signature) return false;

    const expected = "sha256=" + crypto
        .createHmac("sha256", process.env.META_APP_SECRET)
        .update(req.rawBody)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
    );
};

// lead data fetch from Graph API 
const fetchLeadData = async (leadgenId) => {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${process.env.META_PAGE_ACCESS_TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Graph API error: ${response.status}`);
    }
    return response.json();
};

// field_data array ko object mein convert karo
const parseFieldData = (fieldData = []) => {
    const fields = {};
    fieldData.forEach(({ name, values }) => {
        fields[name] = values?.[0] ?? null;
    });
    return fields;
};

// Verification Endpoint
exports.verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
        logger.info("Meta webhook verified successfully");
        return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Verification failed" });
};

// Main Webhook Handler
exports.handleMetaWebhook = (req, res) => {
    // Signature verify
    if (!verifyMetaSignature(req)) {
        logger.warn("Invalid Meta webhook signature");
        return res.status(403).json({ error: "Invalid signature" });
    }

    // Giving instantly response to meta, otherwise it will try again
    res.status(200).json({ received: true });

    // Processing in async — not blocking response
    processWebhookAsync(req.body).catch(err => {
        logger.error("Webhook async processing failed", err);
    });
};

// Async Processing 
const processWebhookAsync = async (body) => {
    const entries = body?.entry ?? [];

    for (const entry of entries) {
        const changes = entry?.changes ?? [];

        for (const change of changes) {
            if (change.field !== "leadgen") continue;

            const { leadgen_id, page_id, form_id, ad_id } = change.value;

            try {
                // Graph API call
                const leadData = await fetchLeadData(leadgen_id);
                const fields = parseFieldData(leadData.field_data);

                const name = fields.full_name || fields.name;
                const email = fields.email;
                const phone = fields.phone_number || fields.phone;
                const whatsApp = fields.whatsapp_number;

                if (!name || !phone || !email || !whatsApp) {
                    logger.warn(`Incomplete lead data for leadgen_id: ${leadgen_id}`);
                    continue;
                }

                // Duplicate check — leadgen_id, email, phone on all three
                const isExist = await Lead.findOne({
                    $or: [
                        { metaLeadgenId: leadgen_id.toString() },
                        ...(email ? [{ email }] : []),
                        { phoneNumber: phone },
                        { whatsAppNumber: whatsApp }
                    ]
                });

                if (isExist) {
                    logger.info(`Duplicate lead skipped: ${leadgen_id}`);
                    continue;
                }

                await Lead.create({
                    name,
                    email: email,
                    phoneNumber: phone,
                    whatsAppNumber: whatsApp,
                    leadSource: "meta_ads",
                    heardVia: "meta_ads",
                    metaLeadgenId: leadgen_id.toString(),
                    assignedTo: null,
                    createdBy: process.env.SYSTEM_USER_ID,
                    status: "new",
                    note: `Meta Ad ID: ${ad_id} | Form ID: ${form_id} | Page ID: ${page_id}`
                });

                logger.info(`Prospect created from Meta webhook: ${leadgen_id}`);

            } catch (err) {
                logger.error(`Failed to process leadgen_id ${leadgen_id}:`, err.message);
                // continue — if one fails then others should continue
            }
        }
    }
};