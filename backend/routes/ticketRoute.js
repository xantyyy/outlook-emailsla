/**
 * routes/ticketRoute.js
 *
 * REST endpoints for ticket data.
 * Mount in server.js:
 *   app.use('/api/tickets', require('./routes/ticketRoute'));
 */

const express       = require('express');
const router        = express.Router();
const { z }         = require('zod');
const { auth }      = require('../middleware/auth');
const Ticket        = require('../models/ticket.model');
const ticketService = require('../services/ticketService');

/* ── Zod validation schemas ── */
const StatusUpdateSchema = z.object({
  status: z.enum(['new', 'open', 'pending', 'on_hold', 'solved']),
  reason: z.string().max(200).optional().default('manual'),
});

/* ══════════════════════════════════════════════════════════════
   GET /api/tickets
   Returns paginated list with optional status filter
══════════════════════════════════════════════════════════════ */
router.get('/', auth, async (req, res) => {
  try {
    const page   = Math.max(1,  parseInt(req.query.page  ?? '1',  10));
    const limit  = Math.min(100, parseInt(req.query.limit ?? '50', 10));
    const skip   = (page - 1) * limit;
    const filter = {};

    if (req.query.status) {
      const validStatuses = ['new', 'open', 'pending'];
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }

    const [tickets, total] = await Promise.all([
      Ticket.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Ticket.countDocuments(filter),
    ]);

    res.json({ tickets, total, page, limit });
  } catch (err) {
    console.error('[GET /tickets]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/tickets/ensure
   Upserts a ticket for a conversationId — called when agent opens an email.
   Safe to call multiple times (idempotent).
══════════════════════════════════════════════════════════════ */
router.post('/ensure', auth, async (req, res) => {
  try {
    const { conversationId, messageId, subject, customerEmail, customerName } = req.body;
    if (!conversationId) return res.status(400).json({ message: 'conversationId is required' });

    const ticket = await ticketService.createOrGetTicket(conversationId, {
      latestMessageId: messageId || '',
      subject:         subject   || '(no subject)',
      customerEmail:   customerEmail || '',
      customerName:    customerName  || '',
      agentUserId:     req.admin._id,
      initialStatus:   'new',
    });

    res.json({ ticket });
  } catch (err) {
    console.error('[POST /tickets/ensure]', err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   PATCH /api/tickets/by-conversation/:conversationId/status
   Update ticket status by conversationId (used after agent reply in ReplyBox)
══════════════════════════════════════════════════════════════ */
router.patch('/by-conversation/:conversationId/status', auth, async (req, res) => {
  const parsed = StatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
  }
  try {
    const ticket = await ticketService.getTicketByConversationId(req.params.conversationId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { status: newStatus, reason } = parsed.data;
    const updated = await ticketService.updateTicketStatus(ticket._id, newStatus, reason);
    res.json({ ticket: updated });
  } catch (err) {
    console.error('[PATCH /tickets/by-conversation/:id/status]', err.message);
    res.status(500).json({ message: err.message });
  }
});


router.get('/by-conversation/:conversationId', auth, async (req, res) => {
  try {
    const ticket = await ticketService.getTicketByConversationId(req.params.conversationId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   GET /api/tickets/:id
   Returns single ticket by MongoDB _id
══════════════════════════════════════════════════════════════ */
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   PATCH /api/tickets/:id/status
   Manual status update (for agent UI controls)
   Validated via Zod, then delegated to ticketService.
══════════════════════════════════════════════════════════════ */
router.patch('/:id/status', auth, async (req, res) => {
  // ── Validate body with Zod ──
  const parsed = StatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors:  parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { status: newStatus, reason } = parsed.data;
    const updated = await ticketService.updateTicketStatus(req.params.id, newStatus, reason);
    res.json({ ticket: updated });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    console.error('[PATCH /tickets/:id/status]', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;