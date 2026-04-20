/**
 * emailRoute.js  — updated to include new TanStack Query endpoints
 *
 * Mount in server.js (unchanged):
 *   app.use('/api/email', require('./routes/emailRoute'));
 */

const express   = require('express');
const router    = express.Router();
const { auth }  = require('../middleware/auth');
const emailCtrl = require('../controllers/emailController');

// ── Existing routes (UNCHANGED) ───────────────────────────────────────────────
// GET  /api/email/auth-url   — generate Microsoft OAuth URL for logged-in user
router.get('/auth-url', auth, emailCtrl.getAuthUrl);

// GET  /api/email/callback   — Microsoft redirects here (public, no auth middleware)
router.get('/callback', emailCtrl.handleCallback);

// GET  /api/email/status     — check if current user has Outlook connected
router.get('/status', auth, emailCtrl.getStatus);

// POST /api/email/sync       — fetch inbox emails for current user (legacy — prefer /folders/:folderId/messages)
router.post('/sync', auth, emailCtrl.syncEmails);

// POST /api/email/disconnect — remove stored tokens for current user
router.post('/disconnect', auth, emailCtrl.disconnect);

// POST /api/email/reply/:msId    — reply to a specific Outlook message
// POST /api/email/replyAll/:msId — reply all to a specific Outlook message
router.post('/reply/:msId', auth, emailCtrl.replyEmail);
router.post('/replyAll/:msId', auth, (req, res, next) => {
  req.body.replyAll = true;
  emailCtrl.replyEmail(req, res, next);
});

// ── NEW: TanStack Query endpoints ─────────────────────────────────────────────

/**
 * GET /api/email/folders/:folderId/messages
 *
 * Powers useFolderMessages() hook.
 * folderId is a Graph well-known folder name: inbox, sentitems, drafts, etc.
 *
 * Query params:
 *   ?top=50   (default 50)
 *   ?skip=0   (default 0, for pagination)
 *
 * Returns: { emails: [...] }  — raw Graph messages (bodyPreview only, no body)
 */
router.get('/folders/:folderId/messages', auth, emailCtrl.getFolderMessages);

/**
 * GET /api/email/messages/:msgId/thread?conversationId=...
 *
 * Powers useThread() hook — step 2 (full thread fetch).
 * Thin wrapper around outlookService.fetchConversationThread().
 *
 * Required query param: conversationId
 *
 * Returns: { thread: [...] }  — sorted oldest→newest, excludes selected message
 *
 * NOTE: This duplicates the endpoint already at:
 *   GET /api/outlook/emails/:id/thread
 * Both work identically. The /api/email namespace is preferred going forward.
 * The hook (useThread.js) currently calls /api/outlook — update its api.get()
 * call to /email/messages/:id/thread if you want to centralize under /api/email.
 */
router.get('/messages/:msgId/thread', auth, emailCtrl.getThreadByMessageId);

/**
 * POST /api/email/threads/batch
 *
 * Fetches up to 20 conversation threads in parallel.
 * Powers useBatchThreads() hook.
 *
 * Body: { requests: [{ conversationId, excludeId }, ...] }
 * Returns: { threads: { [conversationId]: [...messages] } }
 */
router.post('/threads/batch', auth, emailCtrl.getBatchThreads);

// ⚠ module.exports MUST be at the end
module.exports = router;