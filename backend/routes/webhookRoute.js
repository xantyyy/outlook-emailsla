/**
 * routes/webhookRoute.js
 *
 * Handles Microsoft Graph Change Notifications (webhook).
 *
 * Mount in server.js:
 *   app.use('/api/webhooks', require('./routes/webhookRoute'));
 *
 * TWO ENDPOINTS
 * ─────────────
 *  GET  /api/webhooks/graph   — initial validation handshake from Graph
 *  POST /api/webhooks/graph   — incoming change notifications
 *                               (Graph also sends validationToken via POST
 *                                when lifecycleNotificationUrl is set — handled below)
 *
 * NOTIFICATION FLOW
 * ─────────────────
 *  1. Graph sends a POST for each mailbox change (new message / isRead update).
 *  2. We MUST respond 202 Accepted within 3 seconds (before processing).
 *  3. Process async: fetch the full message, classify the event, update ticket.
 *
 * EVENT CLASSIFICATION
 * ─────────────────────
 *  changeType = "created"  →  new message arrived in inbox → could be customer reply
 *  changeType = "updated"  →  message updated (e.g. isRead=true) → customer opened
 *
 * SECURITY
 * ────────
 *  Graph sends a `clientState` header that must match your GRAPH_WEBHOOK_SECRET.
 *  Any notification with a wrong or missing clientState is silently dropped.
 */

const express       = require('express');
const router        = express.Router();
const axios         = require('axios');
const OutlookToken  = require('../models/outlookToken.model');
const ticketService = require('../services/ticketService');
const { getValidAccessToken } = require('../services/outlookService');

const GRAPH          = 'https://graph.microsoft.com/v1.0';
const WEBHOOK_SECRET = process.env.GRAPH_WEBHOOK_SECRET || 'ticketsystem-secret';

/* ══════════════════════════════════════════════════════════════
   STEP 1 — Validation handshake (GET)
   Graph hits this GET once when creating a subscription.
   We echo back validationToken as plain text.
══════════════════════════════════════════════════════════════ */
router.get('/graph', (req, res) => {
  const { validationToken } = req.query;
  if (validationToken) {
    console.log('[webhook] GET validation handshake — echoing back');
    return res
      .status(200)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(decodeURIComponent(validationToken));
  }
  res.sendStatus(400);
});

/* ══════════════════════════════════════════════════════════════
   STEP 2 — Incoming change notifications (POST)
   Graph also sends validationToken via POST query string when
   creating subscriptions with lifecycleNotificationUrl.
   Must be handled BEFORE the 202 response.
══════════════════════════════════════════════════════════════ */
router.post('/graph', async (req, res) => {
  // ── Handle POST-based validation handshake ──
  // Graph sends ?validationToken=... via POST during subscription setup.
  // Must echo back immediately as text/plain with 200.
  const validationToken = req.query?.validationToken;
  if (validationToken) {
    console.log('[webhook] POST validation handshake — echoing back');
    return res
      .status(200)
      .set('Content-Type', 'text/plain; charset=utf-8')
      .send(decodeURIComponent(validationToken));
  }

  // ── MUST respond 202 within 3 seconds for real notifications ──
  // Graph will retry if it doesn't get this fast enough.
  res.sendStatus(202);

  const { value: notifications } = req.body;
  if (!Array.isArray(notifications) || notifications.length === 0) return;

  // Process all notifications in parallel (fire-and-forget, errors logged)
  await Promise.allSettled(notifications.map(processNotification));
});

/* ══════════════════════════════════════════════════════════════
   CORE: process a single Graph notification
══════════════════════════════════════════════════════════════ */
async function processNotification(notification) {
  const {
    clientState,
    changeType,
    resourceData,
    subscriptionId,
    tenantId,
  } = notification;

  // ── Validate clientState secret ──
  if (clientState !== WEBHOOK_SECRET) {
    console.warn('[webhook] Rejected notification: wrong clientState');
    return;
  }

  const messageId = resourceData?.id;
  if (!messageId) {
    console.warn('[webhook] Notification missing resourceData.id, skipping');
    return;
  }

  // ── Find which user owns this subscription ──
  const tokenDoc = await OutlookToken.findOne({ graphSubscriptionId: subscriptionId });
  if (!tokenDoc) {
    // Could be a subscription we no longer track — ignore
    console.warn(`[webhook] No token doc for subscriptionId=${subscriptionId}`);
    return;
  }

  const userId = tokenDoc.userId;

  try {
    // ── Fetch the full message from Graph ──
    const accessToken = await getValidAccessToken(userId);

    let message;
    try {
      const { data } = await axios.get(
        `${GRAPH}/me/messages/${messageId}?$select=id,subject,conversationId,from,toRecipients,isRead,isDraft,sentDateTime,receivedDateTime,parentFolderId`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message = data;
    } catch (fetchErr) {
      const code = fetchErr.response?.data?.error?.code;
      if (code === 'ErrorItemNotFound') {
        // Message was deleted/moved before we could fetch it — safely skip
        console.warn(`[webhook] Message not found (likely deleted/moved), skipping msgId=${messageId}`);
        return;
      }
      throw fetchErr;
    }

    if (message.isDraft) return; // ignore drafts

    const conversationId = message.conversationId;
    if (!conversationId) return;

    // ── Determine if this message is inbound (customer) or outbound (agent) ──
    const agentEmail   = tokenDoc.microsoftEmail?.toLowerCase();
    const senderEmail  = message.from?.emailAddress?.address?.toLowerCase();
    const isFromAgent  = senderEmail === agentEmail;

    const customerEmail = isFromAgent
      ? (message.toRecipients?.[0]?.emailAddress?.address || '')
      : senderEmail;
    const customerName  = isFromAgent
      ? (message.toRecipients?.[0]?.emailAddress?.name || '')
      : (message.from?.emailAddress?.name || '');

    // ── Find or create the ticket ──
    const ticket = await ticketService.createOrGetTicket(conversationId, {
      latestMessageId: messageId,
      subject:         message.subject || '(no subject)',
      customerEmail,
      customerName,
      agentUserId:     userId,
      initialStatus:   'new',
    });

    // ── Classify the event and apply the correct status rules ──
    //
    //  RULE 1 — Agent sends message:
    //    Agent side   → set by the ReplyBox choice (already patched via /tickets/by-conversation/:id/status)
    //    Customer side → New  (they haven't seen it yet)
    //
    //  RULE 2 — Customer replies:
    //    Agent side   → Open  (agent needs to respond)
    //    Customer side → Pending  (customer is waiting for agent)
    //
    //  RULE 3 — Customer opens/reads the email:
    //    Customer side → Open  (they've seen it)
    //    Agent side   → no change
    //
    let agentNewStatus    = null;
    let customerNewStatus = null;
    let reason            = '';

    if (changeType === 'created') {
      if (isFromAgent) {
        // RULE 1: Agent sent → customer becomes New
        customerNewStatus = 'new';
        reason            = 'agent_reply';
        // Note: agent status is already handled by the ReplyBox PATCH call
      } else {
        // RULE 2: Customer replied → agent becomes Open, customer becomes Pending
        agentNewStatus    = 'open';
        customerNewStatus = 'pending';
        reason            = 'customer_reply';
      }
    }

    if (changeType === 'updated') {
      // RULE 3: Customer opened the email (isRead flipped to true on an inbound message)
      if (message.isRead && !isFromAgent) {
        customerNewStatus = 'open';
        // Agent side does NOT change on read — only customer status updates
        reason = 'email_opened';
      }
    }

    // ── Apply status updates ──
    if (agentNewStatus) {
      const updateOptions = {};
      if (agentNewStatus === 'open' && !isFromAgent && changeType === 'created') {
        updateOptions.resetSla = true;
      }
      await ticketService.updateTicketStatus(ticket._id, agentNewStatus, reason, updateOptions);
    }
    if (customerNewStatus && ticket.customerStatus !== customerNewStatus) {
      await ticketService.updateTicketStatus(ticket._id, customerNewStatus, reason, { forCustomer: true });
    }

    // Update latestMessageId
    await ticket.updateOne({ latestMessageId: messageId });

  } catch (err) {
    console.error(
      `[webhook] Error processing notification for userId=${userId}, msgId=${messageId}:`,
      err.response?.data || err.message
    );
  }
}

module.exports = router;