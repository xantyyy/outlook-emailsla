/**
 * outlookRoute.js
 *
 * Mount in server.js:
 *   app.use('/api/outlook', require('./routes/outlookRoute'));
 */

const express        = require('express');
const mongoose       = require('mongoose');
const router         = express.Router();
const OutlookToken   = require('../models/outlookToken.model');
const outlookService = require('../services/outlookService');
const { auth }       = require('../middleware/auth');

/* ══════════════════════════════════════════════════════════════
   AUTH FLOW
══════════════════════════════════════════════════════════════ */

/**
 * GET /api/outlook/auth/start
 *
 * CHANGED: buildAuthUrl is now async — it creates a one-time nonce
 * in the DB and embeds it into the OAuth state parameter.
 * The nonce expires in 10 minutes and is deleted after first use.
 */
router.get('/auth/start', auth, async (req, res) => {
  try {
    const userId = req.admin._id;
    const url    = await outlookService.buildAuthUrl(userId); // ← now async
    res.json({ redirectUrl: url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/outlook/auth/callback
 *
 * CHANGED: state is now validated via consumeAuthState().
 * - If state is already used     → redirect with error
 * - If state is expired          → redirect with error
 * - If state nonce doesn't exist → redirect with error
 * Only a fresh, unused, non-expired nonce passes through.
 */
router.get('/auth/callback', async (req, res) => {
  const { code, state: stateParam, error, error_description } = req.query;
  const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

  console.log(`[Outlook callback] FRONTEND_URL = "${FRONTEND_URL}"`);

  if (error) {
    console.error('[Outlook OAuth error]', error, error_description);
    return res.redirect(
      `${FRONTEND_URL}/admin/settings?outlook_error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (!code || !stateParam) {
    return res.redirect(`${FRONTEND_URL}/admin/settings?outlook_error=missing_params`);
  }

  // ── Validate & consume the one-time state nonce ──────────────
  let userIdStr;
  try {
    userIdStr = await outlookService.consumeAuthState(stateParam);
  } catch (err) {
    console.error('[Outlook callback] State validation failed:', err.message);

    // Give a clear, user-friendly error depending on the reason
    const reason = err.message === 'STATE_EXPIRED_OR_INVALID'
      ? 'This authorization link has already been used or has expired. Please start again from Settings.'
      : 'Invalid authorization state. Please try connecting again.';

    return res.redirect(
      `${FRONTEND_URL}/admin/settings?outlook_error=${encodeURIComponent(reason)}`
    );
  }
  // ─────────────────────────────────────────────────────────────

  try {
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(userIdStr);
    } catch {
      console.error('[Outlook callback] Invalid userId in state:', userIdStr);
      return res.redirect(`${FRONTEND_URL}/admin/settings?outlook_error=invalid_state`);
    }

    const tokens  = await outlookService.exchangeCodeForTokens(code);
    const profile = await outlookService.getUserProfile(tokens.accessToken);

    await OutlookToken.findOneAndUpdate(
      { userId },
      {
        userId,
        accountType:    req.decoded?.accountType || 'admin',
        microsoftEmail: profile.mail || profile.userPrincipalName,
        microsoftName:  profile.displayName,
        accessToken:    tokens.accessToken,
        refreshToken:   tokens.refreshToken,
        expiresAt:      tokens.expiresAt,
        connectedAt:    new Date(),
        lastSyncAt:     null,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Outlook connected for userId=${userId} (${profile.mail})`);
    res.redirect(`${FRONTEND_URL}/admin/settings?outlook_connected=1`);
  } catch (err) {
    console.error('[Outlook callback]', err.response?.data || err.message);
    res.redirect(
      `${FRONTEND_URL}/admin/settings?outlook_error=${encodeURIComponent(err.message)}`
    );
  }
});

/* ══════════════════════════════════════════════════════════════
   SYSTEM OUTLOOK STATUS
   Returns the fixed system inbox email (ADMIN_EMAIL) used for
   bug report syncing via graphService. Separate from per-user OAuth.
══════════════════════════════════════════════════════════════ */

router.get('/system-status', auth, (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(500).json({ configured: false, message: 'ADMIN_EMAIL not set in environment' });
  }
  res.json({ configured: true, email: adminEmail });
});

/* ══════════════════════════════════════════════════════════════
   CONNECTION STATUS
══════════════════════════════════════════════════════════════ */

router.get('/status', auth, async (req, res) => {
  try {
    console.log(`[outlook/status] userId=${req.admin._id} accountType=${req.admin.accountType}`);
    const tokenDoc = await OutlookToken.findOne({ userId: req.admin._id })
      .select('-accessToken -refreshToken');

    if (!tokenDoc) return res.json({ connected: false });

    res.json({
      connected:   true,
      email:       tokenDoc.microsoftEmail,
      displayName: tokenDoc.microsoftName,
      connectedAt: tokenDoc.connectedAt,
      lastSyncAt:  tokenDoc.lastSyncAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/disconnect', auth, async (req, res) => {
  try {
    await OutlookToken.deleteOne({ userId: req.admin._id });
    res.json({ success: true, message: 'Outlook disconnected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   EMAILS — LIST
══════════════════════════════════════════════════════════════ */

router.get('/emails', auth, async (req, res) => {
  try {
    const { top = 25, skip = 0, search = '', folder = 'inbox' } = req.query;
    const emails = await outlookService.fetchEmails(req.admin._id, {
      top: parseInt(top),
      skip: parseInt(skip),
      search,
      folder,
    });
    res.json({ emails });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected' });
    console.error('[fetchEmails]', err.response?.data || err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/emails/:id', auth, async (req, res) => {
  try {
    const email = await outlookService.fetchEmailById(req.admin._id, req.params.id);
    res.json({ email });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected' });
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   EMAILS — ACTIONS
══════════════════════════════════════════════════════════════ */

router.patch('/emails/:id/read', auth, async (req, res) => {
  try {
    const { isRead = true } = req.body;
    await outlookService.markAsRead(req.admin._id, req.params.id, isRead);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/emails/:id/reply', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'Reply body is required' });

    await outlookService.replyToMessage(req.admin._id, req.params.id, body, false);
    console.log(`✉ Reply sent — msgId=${req.params.id} by userId=${req.admin._id}`);
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (err) {
    console.error('[reply]', err.response?.data || err.message);
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected. Please reconnect your account.' });
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
});

router.post('/emails/:id/replyAll', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'Reply body is required' });

    await outlookService.replyToMessage(req.admin._id, req.params.id, body, true);
    console.log(`✉ Reply All sent — msgId=${req.params.id} by userId=${req.admin._id}`);
    res.json({ success: true, message: 'Reply all sent successfully' });
  } catch (err) {
    console.error('[replyAll]', err.response?.data || err.message);
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected. Please reconnect your account.' });
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
});

router.post('/emails/:id/move', auth, async (req, res) => {
  try {
    const { destinationFolderId } = req.body;
    const result = await outlookService.moveMessage(req.admin._id, req.params.id, destinationFolderId);
    res.json({ success: true, message: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/emails/:id', auth, async (req, res) => {
  try {
    await outlookService.deleteMessage(req.admin._id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   CONVERSATION THREAD
══════════════════════════════════════════════════════════════ */

router.get('/emails/:id/thread', auth, async (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) return res.status(400).json({ message: 'conversationId is required' });

    const thread = await outlookService.fetchConversationThread(
      req.admin._id,
      conversationId,
      req.params.id
    );

    res.json({ thread });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected' });
    const graphErr = err.response?.data?.error;
    console.error('[thread] Graph error:', graphErr ? `${graphErr.code}: ${graphErr.message}` : err.message);
    res.status(500).json({ message: graphErr?.message || err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   SEND / COMPOSE
══════════════════════════════════════════════════════════════ */

router.post('/send', auth, async (req, res) => {
  try {
    console.log(`[outlook/send] userId=${req.admin._id} to=${JSON.stringify(req.body.toRecipients)}`);
    await outlookService.sendEmail(req.admin._id, req.body);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected' });
    console.error('[sendEmail]', err.response?.data || err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   FOLDERS
══════════════════════════════════════════════════════════════ */

router.get('/folders', auth, async (req, res) => {
  try {
    const folders = await outlookService.listFolders(req.admin._id);
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;