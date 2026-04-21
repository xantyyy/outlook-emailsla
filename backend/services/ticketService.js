/**
 * services/ticketService.js
 *
 * Central service for all ticket status transitions + SLA timer management.
 *
 * PUBLIC API
 * ──────────
 *  createOrGetTicket(conversationId, payload)  – upsert ticket on first email
 *  updateTicketStatus(ticketId, newStatus, reason, options)  – THE main function
 *  expireSlaForTicket(ticketId)                – called by SLA watchdog cron
 *  getTicketByConversationId(conversationId)   – lookup helper
 *
 * STATUS TRANSITION RULES (from the spec image)
 * ──────────────────────────────────────────────
 *  Event                      Agent status   Customer status   SLA
 *  Agent sends email        → Pending        New               Timer starts (customer side)
 *  Customer opens email     → Open           Open              Continues
 *  Customer replies         → Open           Pending           Pauses on agent side
 *  Agent replies again      → Pending        Open              Restarts on customer side
 *
 * For simplicity this service tracks ONE status per ticket (the "agent side" view).
 * Extend with a customerStatus field if you need dual-side tracking later.
 */

const mongoose = require('mongoose');
const Ticket   = require('../models/ticket.model');

// ─── Constants ────────────────────────────────────────────────────────────────
const SLA_DURATION_MS = 5 * 60 * 1000; // 5 minutes (testing)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Emit a socket event to all connected clients in a room.
 * Uses global.io if available (set up in socketService.js).
 */
function emitTicketUpdate(ticketId, payload) {
  if (global.io) {
    global.io.to(`ticket:${ticketId}`).emit('ticket:statusUpdated', payload);
    // Only broadcast globally for customer-initiated events.
    // Agent-reply status changes are handled optimistically on the frontend —
    // a global broadcast would race against the optimistic update and flip
    // the status back to 'open' before the lock in useTicketSocketSync fires.
    if (payload.reason !== 'agent_reply') {
      global.io.emit('ticket:statusUpdated', payload);
    }
  }
}

// ─── Core status updater ──────────────────────────────────────────────────────

/**
 * updateTicketStatus(ticketId, newStatus, reason, options)
 *
 * Updates the ticket status and handles all SLA timer side-effects.
 *
 * @param {string|ObjectId} ticketId  - Mongo _id of the ticket
 * @param {'new'|'open'|'pending'|'on_hold'|'solved'} newStatus
 * @param {string} reason             - e.g. 'agent_reply', 'customer_reply', 'email_opened'
 * @param {{ skipEmit?: boolean }}    - options
 *
 * @returns {Promise<Ticket>} updated ticket document
 */
async function updateTicketStatus(ticketId, newStatus, reason = '', options = {}) {
  const { forCustomer = false, forceUpdate = false, resetSla = false } = options;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error(`Ticket not found: ${ticketId}`);

  const statusField = forCustomer ? 'customerStatus' : 'status';
  const previousStatus = ticket[statusField];
  if (previousStatus === newStatus && !forceUpdate && !resetSla) return ticket;

  const now = new Date();

  /* ── SLA TIMER STATE MACHINE ──────────────────────────────────────────────
   *
   *  SLA runs only when status is 'new' or 'open'.
   *  Pauses when 'pending' or 'on_hold'.
   *  Stops permanently when 'solved'.
   *
   *  Start: status becomes 'new' or 'open' and no timer yet.
   *  Pause: status becomes 'pending' or 'on_hold'.
   *  Resume: status becomes 'new' or 'open' again.
   *  Stop: status becomes 'solved'.
   *
   * ────────────────────────────────────────────────────────────────────────── */

  const update = {
    [statusField]: newStatus,
    updatedAt: now,
    lastSentBy: reason.includes('agent') ? 'agent' : reason.includes('customer') ? 'customer' : null,
    $push: {
      statusHistory: {
        status:    newStatus,
        changedAt: now,
        reason,
      },
    },
  };

  // SLA based on agent status
  if (!forCustomer) {
    // ── Start timer on FIRST transition to 'new' or 'open' (never started before) ──
    if ((newStatus === 'new' || newStatus === 'open') && !ticket.slaStartedAt) {
      const deadline = new Date(now.getTime() + SLA_DURATION_MS);
      update.slaStartedAt = now;
      update.slaDeadline = deadline;
      update.slaTotalPausedMs = 0;
      update.slaPausedAt = null;
      update.slaExpired = false;
      console.log(`[SLA] Ticket ${ticketId}: timer STARTED, deadline=${deadline.toISOString()}`);
    }

    // ── Reset timer to a fresh 5-minute window when explicitly requested ──
    if (resetSla && (newStatus === 'new' || newStatus === 'open')) {
      const deadline = new Date(now.getTime() + SLA_DURATION_MS);
      update.slaStartedAt = ticket.slaStartedAt || now;
      update.slaDeadline = deadline;
      update.slaTotalPausedMs = 0;
      update.slaPausedAt = null;
      update.slaExpired = false;
      console.log(`[SLA] Ticket ${ticketId}: timer RESET, deadline=${deadline.toISOString()}`);
    }

    // ── Stop timer permanently on 'solved' ──
    if (newStatus === 'solved') {
      update.slaPausedAt = null;
      update.slaExpired = false;
      console.log(`[SLA] Ticket ${ticketId}: timer STOPPED (solved)`);
    }

    // ── Pause: status becoming 'pending' or 'on_hold' ──
    if ((newStatus === 'pending' || newStatus === 'on_hold') && ticket.slaDeadline && !ticket.slaPausedAt) {
      update.slaPausedAt = now;
      console.log(`[SLA] Ticket ${ticketId}: timer PAUSED at ${now.toISOString()}`);
    }

    // ── Resume: status leaving 'pending'/'on_hold' back to 'new'/'open' ──
    // This handles: customer replies → agent status flips Open → resume/restart SLA
    if (!resetSla && (previousStatus === 'pending' || previousStatus === 'on_hold') && (newStatus === 'new' || newStatus === 'open')) {
      if (ticket.slaPausedAt) {
        // Timer was paused — resume it by extending the deadline by how long it was paused
        const pausedDurationMs = now.getTime() - new Date(ticket.slaPausedAt).getTime();
        const newTotalPaused   = (ticket.slaTotalPausedMs || 0) + pausedDurationMs;
        const newDeadline      = new Date(new Date(ticket.slaDeadline).getTime() + pausedDurationMs);
        update.slaPausedAt        = null;
        update.slaTotalPausedMs   = newTotalPaused;
        update.slaDeadline        = newDeadline;
        update.slaExpired         = false; // reset expired flag on resume
        console.log(`[SLA] Ticket ${ticketId}: timer RESUMED. Paused for ${pausedDurationMs}ms. New deadline=${newDeadline.toISOString()}`);
      } else if (ticket.slaExpired || !ticket.slaDeadline) {
        // Timer already expired or never started — restart fresh for this new response cycle
        const deadline = new Date(now.getTime() + SLA_DURATION_MS);
        update.slaDeadline      = deadline;
        update.slaTotalPausedMs = 0;
        update.slaPausedAt      = null;
        update.slaExpired       = false;
        if (!ticket.slaStartedAt) update.slaStartedAt = now;
        console.log(`[SLA] Ticket ${ticketId}: timer RESTARTED (was expired/missing), new deadline=${deadline.toISOString()}`);
      }
    }
  }
  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    update,
    { new: true, runValidators: true }
  );

  // ── Broadcast via Socket.io ──
  if (!options.skipEmit) {
    emitTicketUpdate(ticketId.toString(), {
      ticketId:         ticketId.toString(),
      conversationId:   updated.conversationId,
      previousStatus:   previousStatus,
      status:           updated.status,
      customerStatus:   updated.customerStatus,
      reason,
      slaDeadline:      updated.slaDeadline,
      slaPausedAt:      updated.slaPausedAt,
      slaTotalPausedMs: updated.slaTotalPausedMs,
      slaExpired:       updated.slaExpired,
      updatedAt:        updated.updatedAt,
    });
  }

  return updated;
}

// ─── Create or get ticket from a conversationId ───────────────────────────────

/**
 * createOrGetTicket(conversationId, payload)
 *
 * Upserts a ticket for the given conversationId.
 * Called when a new email arrives via Graph webhook.
 *
 * @param {string} conversationId
 * @param {{
 *   latestMessageId: string,
 *   subject:         string,
 *   customerEmail:   string,
 *   customerName:    string,
 *   agentUserId:     ObjectId,
 *   initialStatus:   'new'|'open'|'pending'
 * }} payload
 */
async function createOrGetTicket(conversationId, payload) {
  const {
    latestMessageId,
    subject,
    customerEmail,
    customerName = '',
    agentUserId,
    initialStatus = 'new',
  } = payload;

  // Upsert — if ticket exists, update latest message; if not, create fresh
  const ticket = await Ticket.findOneAndUpdate(
    { conversationId },
    {
      $setOnInsert: {
        conversationId,
        customerEmail,
        customerName,
        agentUserId,
        subject,
        status:        initialStatus,
        statusHistory: [{ status: initialStatus, changedAt: new Date(), reason: 'created' }],
        slaDurationMs: SLA_DURATION_MS,
      },
      $set: {
        latestMessageId,
        updatedAt: new Date(),
        // Only update subject/name if ticket was brand new (setOnInsert handles it above)
      },
    },
    { upsert: true, new: true }
  );

  return ticket;
}

// ─── Mark SLA as expired ──────────────────────────────────────────────────────

/**
 * expireSlaForTicket(ticketId)
 *
 * Called by the SLA watchdog cron when deadline passes.
 * Marks slaExpired = true and broadcasts the update.
 */
async function expireSlaForTicket(ticketId) {
  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      slaExpired: true,
      $push: {
        statusHistory: {
          status:    'open',  // keep current status, just flag as expired
          changedAt: new Date(),
          reason:    'sla_expired',
        },
      },
    },
    { new: true }
  );

  if (!updated) return;

  emitTicketUpdate(ticketId.toString(), {
    ticketId:       ticketId.toString(),
    conversationId: updated.conversationId,
    status:         updated.status,
    slaExpired:     true,
    slaDeadline:    updated.slaDeadline,
    reason:         'sla_expired',
    updatedAt:      updated.updatedAt,
  });

  return updated;
}

// ─── Simple lookups ───────────────────────────────────────────────────────────

async function getTicketByConversationId(conversationId) {
  return Ticket.findOne({ conversationId });
}

async function getTicketById(ticketId) {
  return Ticket.findById(ticketId);
}

module.exports = {
  createOrGetTicket,
  updateTicketStatus,
  expireSlaForTicket,
  getTicketByConversationId,
  getTicketById,
  SLA_DURATION_MS,
};