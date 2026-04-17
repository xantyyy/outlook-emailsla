const express   = require('express');
const router    = express.Router();
const { auth }  = require('../middleware/auth');
const emailCtrl = require('../controllers/emailController');

// GET  /api/email/auth-url   — generate Microsoft OAuth URL for logged-in user
router.get('/auth-url', auth, emailCtrl.getAuthUrl);

// GET  /api/email/callback   — Microsoft redirects here (public, no auth middleware)
router.get('/callback', emailCtrl.handleCallback);

// GET  /api/email/status     — check if current user has Outlook connected
router.get('/status', auth, emailCtrl.getStatus);

// POST /api/email/sync       — fetch inbox emails for current user
router.post('/sync', auth, emailCtrl.syncEmails);

// POST /api/email/disconnect — remove stored tokens for current user
router.post('/disconnect', auth, emailCtrl.disconnect);

// ── REPLY ROUTES ──────────────────────────────────────────────────────────────
// POST /api/email/reply/:msId    — reply to a specific Outlook message
// POST /api/email/replyAll/:msId — reply all to a specific Outlook message
router.post('/reply/:msId', auth, emailCtrl.replyEmail);
router.post('/replyAll/:msId', auth, (req, res, next) => {
  req.body.replyAll = true;
  emailCtrl.replyEmail(req, res, next);
});

// ⚠ module.exports MUST be at the end — routes defined after this are dead code
module.exports = router;