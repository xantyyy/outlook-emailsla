const axios = require('axios');
const User  = require('../models/user');
const outlookService = require('../services/outlookService');

const MS_AUTH_URL  = 'https://login.microsoftonline.com/consumers/oauth2/v2.0';
const MS_GRAPH_URL = 'https://graph.microsoft.com/v1.0';
const SCOPES       = 'openid profile email Mail.Read offline_access';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Silently refresh an expired access token using stored refresh token.
// Updates DB automatically. Returns new accessToken string.
// ─────────────────────────────────────────────────────────────────────────────
async function refreshAccessToken(user) {
  const { refreshToken } = user.outlookTokens;
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  try {
    const res = await axios.post(
      `${MS_AUTH_URL}/token`,
      new URLSearchParams({
        client_id:     process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        grant_type:    'refresh_token',
        refresh_token: refreshToken,
        scope:         SCOPES,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token: newRefresh, expires_in } = res.data;
    const expiry = new Date(Date.now() + expires_in * 1000);

    await User.findByIdAndUpdate(user._id, {
      'outlookTokens.accessToken':  access_token,
      'outlookTokens.refreshToken': newRefresh || refreshToken,
      'outlookTokens.tokenExpiry':  expiry,
    });

    return access_token;
  } catch (err) {
    // Refresh token revoked — clear stored tokens so user knows to reconnect
    if (err.response?.data?.error === 'invalid_grant') {
      await User.findByIdAndUpdate(user._id, {
        'outlookTokens.accessToken':  null,
        'outlookTokens.refreshToken': null,
        'outlookTokens.tokenExpiry':  null,
        'outlookTokens.outlookEmail': null,
        'outlookTokens.connectedAt':  null,
      });
    }
    throw new Error('REFRESH_FAILED');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Return a valid access token for userId, refreshing if needed.
// ─────────────────────────────────────────────────────────────────────────────
async function getValidToken(userId) {
  const user = await User.findById(userId)
    .select('+outlookTokens.accessToken +outlookTokens.refreshToken outlookTokens.tokenExpiry');

  if (!user)                          throw new Error('USER_NOT_FOUND');
  if (!user.outlookTokens?.accessToken) throw new Error('NOT_CONNECTED');

  // Refresh if expires within next 5 minutes
  const fiveMin  = 5 * 60 * 1000;
  const expiring = !user.outlookTokens.tokenExpiry ||
                   new Date(user.outlookTokens.tokenExpiry) - Date.now() < fiveMin;

  return expiring ? await refreshAccessToken(user) : user.outlookTokens.accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/auth-url
// Generates the Microsoft OAuth URL.  Encodes the logged-in user's _id in the
// `state` param so the callback knows whose DB record to update.
// ─────────────────────────────────────────────────────────────────────────────
exports.getAuthUrl = (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    // base64-encode so it's URL-safe (not a security secret — just routing info)
    const state  = Buffer.from(userId.toString()).toString('base64');
    const params = new URLSearchParams({
      client_id:     process.env.MS_CLIENT_ID,
      response_type: 'code',
      redirect_uri:  process.env.MS_REDIRECT_URI,
      response_mode: 'query',
      scope:         SCOPES,
      state,
      prompt:        'select_account', // lets user choose which account each time
    });

    res.json({ url: `${MS_AUTH_URL}/authorize?${params.toString()}` });
  } catch (err) {
    console.error('getAuthUrl error:', err);
    res.status(500).json({ message: 'Failed to generate auth URL' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/callback  (public — no auth middleware)
// Microsoft redirects here after user approves.
// Exchange code → tokens, save to the user's DB record, redirect to frontend.
// ─────────────────────────────────────────────────────────────────────────────
exports.handleCallback = async (req, res) => {
  const { code, state, error } = req.query;
  const base = `${process.env.FRONTEND_URL}/admin/messaging`;

  if (error) return res.redirect(`${base}?sync=error&reason=${encodeURIComponent(error)}`);
  if (!code || !state) return res.redirect(`${base}?sync=error&reason=missing_params`);

  let userId;
  try {
    userId = Buffer.from(state, 'base64').toString('utf8');
  } catch {
    return res.redirect(`${base}?sync=error&reason=invalid_state`);
  }

  try {
    // 1. Exchange authorization code for access + refresh tokens
    const tokenRes = await axios.post(
      `${MS_AUTH_URL}/token`,
      new URLSearchParams({
        client_id:     process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        code,
        redirect_uri:  process.env.MS_REDIRECT_URI,
        grant_type:    'authorization_code',
        scope:         SCOPES,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // 2. Fetch the connected Outlook email address (cosmetic — for display)
    let outlookEmail = null;
    try {
      const meRes  = await axios.get(`${MS_GRAPH_URL}/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
        params:  { $select: 'mail,userPrincipalName' },
      });
      outlookEmail = meRes.data.mail || meRes.data.userPrincipalName || null;
    } catch { /* non-fatal */ }

    // 3. Store tokens in this user's DB record
    const expiry = new Date(Date.now() + (expires_in || 3600) * 1000);
    await User.findByIdAndUpdate(userId, {
      'outlookTokens.accessToken':  access_token,
      'outlookTokens.refreshToken': refresh_token || null,
      'outlookTokens.tokenExpiry':  expiry,
      'outlookTokens.outlookEmail': outlookEmail,
      'outlookTokens.connectedAt':  new Date(),
    });

    // 4. Redirect to frontend — tokens stay in DB, not in the URL
    res.redirect(`${base}?sync=success&email=${encodeURIComponent(outlookEmail || '')}`);
  } catch (err) {
    console.error('handleCallback error:', err.response?.data || err.message);
    res.redirect(`${base}?sync=error&reason=token_exchange_failed`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/status
// Returns connection status for the current user. Never exposes token values.
// ─────────────────────────────────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;
    const user   = await User.findById(userId)
      .select('outlookTokens.outlookEmail outlookTokens.connectedAt outlookTokens.tokenExpiry');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const t = user.outlookTokens;
    // "Connected" means they have an email + a refresh token path still viable
    // (token may be expired but auto-refreshes on next sync — that's fine)
    const isConnected = !!(t?.outlookEmail && t?.connectedAt);

    res.json({
      isConnected,
      outlookEmail: t?.outlookEmail || null,
      connectedAt:  t?.connectedAt  || null,
    });
  } catch (err) {
    console.error('getStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/sync
// Fetches the logged-in user's Outlook inbox.
// No token in request body — retrieved from DB and auto-refreshed.
// ─────────────────────────────────────────────────────────────────────────────
exports.syncEmails = async (req, res) => {
  const userId    = req.user?._id || req.admin?._id;
  const maxEmails = Math.min(parseInt(req.body?.maxEmails) || 20, 50);

  try {
    const accessToken = await getValidToken(userId);

    const response = await axios.get(
      `${MS_GRAPH_URL}/me/mailFolders/inbox/messages`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          $top:     maxEmails,
          $orderby: 'receivedDateTime desc',
          $select:  'id,subject,bodyPreview,from,toRecipients,ccRecipients,receivedDateTime,isRead,importance,hasAttachments,body',
        },
      }
    );

    const COLORS = ['#f97316','#8b5cf6','#10b981','#3b82f6','#ec4899','#f59e0b','#6366f1','#14b8a6'];
    const emails = (response.data.value || []).map((msg) => {
      const sender     = msg.from?.emailAddress;
      const senderName = sender?.name || sender?.address || 'Unknown';
      const initials   = senderName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

      const date    = new Date(msg.receivedDateTime);
      const now     = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isYest  = new Date(now - 86400000).toDateString() === date.toDateString();
      const timeStr = isToday
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        : isYest ? 'Yesterday'
        : date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });

      return {
        id:          `ms_${msg.id}`,
        msId:        msg.id,
        sender:      senderName,
        senderEmail: sender?.address || '',
        subject:     msg.subject   || '(No subject)',
        preview:     msg.bodyPreview || '',
        body:        msg.body?.content || msg.bodyPreview || '',
        bodyType:    msg.body?.contentType || 'text',
        time:        timeStr,
        read:        msg.isRead,
        starred:     false,
        status:      'open',
        avatar:      initials,
        avatarColor: COLORS[senderName.charCodeAt(0) % COLORS.length],
        to:          (msg.toRecipients  || []).map(r => r.emailAddress?.name || r.emailAddress?.address || ''),
        cc:          (msg.ccRecipients  || []).map(r => r.emailAddress?.name || r.emailAddress?.address || ''),
        thread:      [],
        source:      'outlook',
        receivedAt:  msg.receivedDateTime,
        ownerId:     userId.toString(),
      };
    });

    res.json({ success: true, count: emails.length, emails });

  } catch (err) {
    if (err.message === 'NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook account not connected.', code: 'NOT_CONNECTED' });
    if (err.message === 'REFRESH_FAILED')
      return res.status(401).json({ message: 'Outlook session expired. Please reconnect.', code: 'RECONNECT_REQUIRED' });
    if (err.response?.status === 401)
      return res.status(401).json({ message: 'Outlook session expired. Please reconnect.', code: 'RECONNECT_REQUIRED' });

    console.error('syncEmails error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to fetch emails from Outlook.', code: 'GRAPH_ERROR' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/folders/:folderId/messages
// Returns raw Graph messages for the requested folder.
// ─────────────────────────────────────────────────────────────────────────────
exports.getFolderMessages = async (req, res) => {
  try {
    const { folderId } = req.params;
    const top  = parseInt(req.query.top,  10) || 50;
    const skip = parseInt(req.query.skip, 10) || 0;

    if (!folderId) {
      return res.status(400).json({ message: 'folderId is required' });
    }

    const emails = await outlookService.fetchEmails(req.user?._id || req.admin?._id, {
      folder: folderId,
      top,
      skip,
    });

    return res.json({ emails });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED' || err.message === 'NOT_CONNECTED') {
      return res.status(403).json({ message: 'Outlook not connected' });
    }
    console.error('[getFolderMessages]', err.response?.data || err.message);
    return res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/messages/:msgId/thread?conversationId=...
// Returns a conversation thread excluding the selected message.
// ─────────────────────────────────────────────────────────────────────────────
exports.getThreadByMessageId = async (req, res) => {
  try {
    const { msgId } = req.params;
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId query param is required' });
    }

    const thread = await outlookService.fetchConversationThread(
      req.user?._id || req.admin?._id,
      conversationId,
      msgId,
    );

    return res.json({ thread });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED' || err.message === 'NOT_CONNECTED') {
      return res.status(403).json({ message: 'Outlook not connected' });
    }
    const graphErr = err.response?.data?.error;
    console.error('[getThreadByMessageId]', graphErr ? `${graphErr.code}: ${graphErr.message}` : err.message);
    return res.status(500).json({ message: graphErr?.message || err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/threads/batch
//
// Fetches up to 20 conversation threads in parallel.
// Body: { requests: [{ conversationId, excludeId }, ...] }
// Returns: { threads: { [conversationId]: [...messages] } }
// ─────────────────────────────────────────────────────────────────────────────
exports.getBatchThreads = async (req, res) => {
  try {
    const userId   = req.user?._id || req.admin?._id;
    const { requests = [] } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ message: 'requests array is required' });
    }

    const threads = await outlookService.fetchMultipleThreads(userId, requests);
    return res.json({ threads });
  } catch (err) {
    if (err.message === 'OUTLOOK_NOT_CONNECTED' || err.message === 'NOT_CONNECTED') {
      return res.status(403).json({ message: 'Outlook not connected' });
    }
    console.error('[getBatchThreads]', err.response?.data || err.message);
    return res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/disconnect
// Wipes the stored Outlook tokens for the current user.
// ─────────────────────────────────────────────────────────────────────────────
exports.disconnect = async (req, res) => {
  try {
    const userId = req.user?._id || req.admin?._id;
    await User.findByIdAndUpdate(userId, {
      'outlookTokens.accessToken':  null,
      'outlookTokens.refreshToken': null,
      'outlookTokens.tokenExpiry':  null,
      'outlookTokens.outlookEmail': null,
      'outlookTokens.connectedAt':  null,
    });
    res.json({ success: true, message: 'Outlook account disconnected.' });
  } catch (err) {
    console.error('disconnect error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/reply/:msId
// POST /api/email/replyAll/:msId
//
// Sends an HTML reply to a real Outlook message using the stored access token.
// Uses createReply → PATCH body → send pattern so the body is proper HTML
// (the /reply shortcut only accepts plain-text via `comment` field).
// ─────────────────────────────────────────────────────────────────────────────
exports.replyEmail = async (req, res) => {
  try {
    const userId  = req.user?._id || req.admin?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const { msId }     = req.params;
    const { body = '', replyAll = false } = req.body;

    if (!body.trim()) return res.status(400).json({ message: 'Reply body is required' });

    const accessToken = await getValidToken(userId);
    const GRAPH       = 'https://graph.microsoft.com/v1.0';
    const endpoint    = replyAll ? 'createReplyAll' : 'createReply';

    // Step 1 — create draft reply
    const { data: draft } = await axios.post(
      `${GRAPH}/me/messages/${msId}/${endpoint}`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    // Step 2 — set HTML body on draft
    await axios.patch(
      `${GRAPH}/me/messages/${draft.id}`,
      {
        body: {
          contentType: 'HTML',
          content: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#1a1a2e;">${body}</div>`,
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    // Step 3 — send the draft
    await axios.post(
      `${GRAPH}/me/messages/${draft.id}/send`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log(`✉ ${replyAll ? 'Reply All' : 'Reply'} sent — msId=${msId} by userId=${userId}`);
    res.json({ success: true, message: replyAll ? 'Reply All sent' : 'Reply sent' });

  } catch (err) {
    console.error('[replyEmail]', err.response?.data || err.message);
    if (err.message === 'NOT_CONNECTED')
      return res.status(403).json({ message: 'Outlook not connected. Please reconnect.' });
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
};