/**
 * outlookService.js
 * Core service: handles Microsoft OAuth token lifecycle + Graph API calls.
 */
const axios        = require('axios');
const OutlookToken = require('../models/outlookToken.model');
const OutlookState = require('../models/outlookState.model'); // ← NEW

const {
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_TENANT_ID,
} = process.env;

const TENANT    = MICROSOFT_TENANT_ID || 'consumers';
const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const AUTH_URL  = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
const GRAPH     = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.Send',
  'Mail.ReadWrite',
].join(' ');

/* ─────────────────────────────────────────────────────────────
   1. Build Microsoft consent URL
   
   CHANGED: state is now `<userId>:<nonce>` instead of just userId.
   The nonce is stored in DB (OutlookState) and is one-time use only.
   Expires in 10 minutes — if not used, TTL index auto-deletes it.
───────────────────────────────────────────────────────────── */
async function buildAuthUrl(userId) {
  // Delete any previous unused state for this user (clean slate)
  await OutlookState.deleteMany({ userId });

  // Create a fresh one-time nonce
  const stateDoc = await OutlookState.create({ userId });
  const state    = `${userId}:${stateDoc.nonce}`;

  const params = new URLSearchParams({
    client_id:     MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri:  MICROSOFT_REDIRECT_URI,
    scope:         SCOPES,
    response_mode: 'query',
    state,
    prompt:        'select_account',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/* ─────────────────────────────────────────────────────────────
   1b. Validate & consume the state from the OAuth callback.
   
   Returns the userId if valid, throws otherwise.
   Marks the nonce as used immediately so it can't be replayed.
───────────────────────────────────────────────────────────── */
async function consumeAuthState(stateParam) {
  if (!stateParam || !stateParam.includes(':')) {
    throw new Error('INVALID_STATE');
  }

  const colonIdx = stateParam.indexOf(':');
  const userIdStr = stateParam.substring(0, colonIdx);
  const nonce     = stateParam.substring(colonIdx + 1);

  if (!userIdStr || !nonce) throw new Error('INVALID_STATE');

  // Find the nonce in DB — must not be used or expired
  const stateDoc = await OutlookState.findOne({
    userId: userIdStr,
    nonce,
    used:   false,
  });

  if (!stateDoc) throw new Error('STATE_EXPIRED_OR_INVALID');

  // Check not expired (belt-and-suspenders on top of TTL index)
  if (stateDoc.expiresAt < new Date()) {
    await OutlookState.deleteOne({ _id: stateDoc._id });
    throw new Error('STATE_EXPIRED_OR_INVALID');
  }

  // Consume it — mark used then delete (one-time use)
  await OutlookState.deleteOne({ _id: stateDoc._id });

  return userIdStr;
}

/* ─────────────────────────────────────────────────────────────
   2. Exchange auth code → tokens (called once in callback)
───────────────────────────────────────────────────────────── */
async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    client_id:     MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    redirect_uri:  MICROSOFT_REDIRECT_URI,
    grant_type:    'authorization_code',
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + data.expires_in * 1000),
  };
}

/* ─────────────────────────────────────────────────────────────
   3. Refresh an expired access token silently
───────────────────────────────────────────────────────────── */
async function refreshAccessToken(tokenDoc) {
  const body = new URLSearchParams({
    client_id:     MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: tokenDoc.refreshToken,
    grant_type:    'refresh_token',
    scope:         SCOPES,
  });

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  tokenDoc.accessToken = data.access_token;
  tokenDoc.expiresAt   = new Date(Date.now() + data.expires_in * 1000);
  if (data.refresh_token) tokenDoc.refreshToken = data.refresh_token;
  await tokenDoc.save();

  return tokenDoc.accessToken;
}

/* ─────────────────────────────────────────────────────────────
   4. Get a valid access token — auto-refreshes if expired
───────────────────────────────────────────────────────────── */
async function getValidAccessToken(userId) {
  const tokenDoc = await OutlookToken.findOne({ userId });
  if (!tokenDoc) throw new Error('OUTLOOK_NOT_CONNECTED');

  if (tokenDoc.isAccessTokenValid()) return tokenDoc.accessToken;
  return refreshAccessToken(tokenDoc);
}

/* ─────────────────────────────────────────────────────────────
   5. Fetch Microsoft user profile
───────────────────────────────────────────────────────────── */
async function getUserProfile(accessToken) {
  const { data } = await axios.get(`${GRAPH}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

/* ─────────────────────────────────────────────────────────────
   6. Fetch emails from a folder (default: inbox)
───────────────────────────────────────────────────────────── */
async function fetchEmails(userId, options = {}) {
  const accessToken = await getValidAccessToken(userId);
  const { top = 25, skip = 0, search = '', folder = 'inbox' } = options;

  const params = new URLSearchParams({
    $top:     top,
    $skip:    skip,
    $orderby: 'receivedDateTime desc',
    $select:  [
      'id','conversationId','subject','body','bodyPreview','receivedDateTime',
      'isRead','from','toRecipients','ccRecipients',
      'hasAttachments','importance','flag',
    ].join(','),
  });

  if (search) params.set('$search', `"${search}"`);

  const url = `${GRAPH}/me/mailFolders/${folder}/messages?${params.toString()}`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(search ? { ConsistencyLevel: 'eventual' } : {}),
    },
  });

  await OutlookToken.updateOne({ userId }, { lastSyncAt: new Date() });
  return data.value || [];
}

/* ─────────────────────────────────────────────────────────────
   7. Fetch single email with full body + attachments
───────────────────────────────────────────────────────────── */
async function fetchEmailById(userId, messageId) {
  const accessToken = await getValidAccessToken(userId);
  const { data } = await axios.get(
    `${GRAPH}/me/messages/${messageId}?$expand=attachments`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data;
}

/* ─────────────────────────────────────────────────────────────
   8. Mark message as read / unread
───────────────────────────────────────────────────────────── */
async function markAsRead(userId, messageId, isRead = true) {
  const accessToken = await getValidAccessToken(userId);
  await axios.patch(
    `${GRAPH}/me/messages/${messageId}`,
    { isRead },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/* ─────────────────────────────────────────────────────────────
   9. Delete a message
───────────────────────────────────────────────────────────── */
async function deleteMessage(userId, messageId) {
  const accessToken = await getValidAccessToken(userId);
  await axios.delete(`${GRAPH}/me/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

/* ─────────────────────────────────────────────────────────────
   10. Move message to a folder
───────────────────────────────────────────────────────────── */
async function moveMessage(userId, messageId, destinationFolderId) {
  const accessToken = await getValidAccessToken(userId);
  const { data } = await axios.post(
    `${GRAPH}/me/messages/${messageId}/move`,
    { destinationId: destinationFolderId },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return data;
}

/* ─────────────────────────────────────────────────────────────
   11. Send a new email (compose)
───────────────────────────────────────────────────────────── */
async function sendEmail(userId, payload) {
  const accessToken = await getValidAccessToken(userId);

  const message = {
    subject: payload.subject || '(no subject)',
    body: {
      contentType: 'HTML',
      content:     payload.body || '',
    },
    toRecipients:  (payload.toRecipients  || []).map(toAddrObj),
    ccRecipients:  (payload.ccRecipients  || []).map(toAddrObj),
    bccRecipients: (payload.bccRecipients || []).map(toAddrObj),
  };

  if (payload.attachments?.length) {
    message.attachments = payload.attachments.map(a => ({
      '@odata.type': '#microsoft.graph.fileAttachment',
      name:          a.name,
      contentType:   a.contentType || 'application/octet-stream',
      contentBytes:  a.base64,
    }));
  }

  await axios.post(
    `${GRAPH}/me/sendMail`,
    { message, saveToSentItems: true },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/* ─────────────────────────────────────────────────────────────
   12. Reply to a message
───────────────────────────────────────────────────────────── */
async function replyToMessage(userId, messageId, replyBody, replyAll = false) {
  const accessToken = await getValidAccessToken(userId);
  const endpoint    = replyAll ? 'createReplyAll' : 'createReply';

  const { data: draft } = await axios.post(
    `${GRAPH}/me/messages/${messageId}/${endpoint}`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  const draftId = draft.id;

  await axios.patch(
    `${GRAPH}/me/messages/${draftId}`,
    {
      body: {
        contentType: 'HTML',
        content: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; color: #1a1a2e; line-height: 1.7;">
            ${replyBody}
          </div>
        `,
      },
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  await axios.post(
    `${GRAPH}/me/messages/${draftId}/send`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

/* ─────────────────────────────────────────────────────────────
   13. Forward a message
───────────────────────────────────────────────────────────── */
async function forwardMessage(userId, messageId, toRecipients, comment = '') {
  const accessToken = await getValidAccessToken(userId);
  await axios.post(
    `${GRAPH}/me/messages/${messageId}/forward`,
    {
      comment,
      toRecipients: toRecipients.map(toAddrObj),
    },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
}

/* ─────────────────────────────────────────────────────────────
   14. Fetch conversation thread
   
   CHANGED: Now searches ALL messages via /me/messages (mailbox-wide)
   instead of only inbox + sentitems. This ensures thread messages
   in archive, deleted items, or any other folder are included.
   Falls back to per-folder search if mailbox-wide search fails.
   Supports fetching up to 20 threads via batch conversationIds.
───────────────────────────────────────────────────────────── */
async function fetchConversationThread(userId, conversationId, excludeId) {
  const accessToken = await getValidAccessToken(userId);

  const SELECT = 'id,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,isDraft,flag,conversationId';

  // ── Strategy 1: mailbox-wide search (finds messages in any folder) ──
  // NOTE: $orderby cannot be combined with $filter on /me/messages — Graph returns 400.
  // We sort manually after fetching instead.
  const fetchMailboxWide = async (convId) => {
    const params = new URLSearchParams();
    params.set('$filter', `conversationId eq '${convId}'`);
    params.set('$select', SELECT);
    params.set('$top',    '50');

    const { data } = await axios.get(`${GRAPH}/me/messages?${params.toString()}`, {
      headers: {
        Authorization:    `Bearer ${accessToken}`,
        ConsistencyLevel: 'eventual',
        Prefer:           'outlook.body-content-type="html"',
      },
    });
    return data.value || [];
  };

  // ── Strategy 2: fallback — search inbox + sentitems + archive + deleted ──
  const fetchFolder = async (folder) => {
    const params = new URLSearchParams();
    params.set('$filter', `conversationId eq '${conversationId}'`);
    params.set('$select', SELECT);
    params.set('$top',    '50');
    params.set('$count',  'true');
    const { data } = await axios.get(`${GRAPH}/me/mailFolders/${folder}/messages?${params.toString()}`, {
      headers: {
        Authorization:    `Bearer ${accessToken}`,
        ConsistencyLevel: 'eventual',
      },
    });
    return data.value || [];
  };

  let allMessages = [];

  try {
    allMessages = await fetchMailboxWide(conversationId);
  } catch (err) {
    console.warn('[fetchConversationThread] Mailbox-wide search failed, falling back to folder search:', err.message);
    const [inboxMsgs, sentMsgs, archiveMsgs, deletedMsgs] = await Promise.all([
      fetchFolder('inbox').catch(() => []),
      fetchFolder('sentitems').catch(() => []),
      fetchFolder('archive').catch(() => []),
      fetchFolder('deleteditems').catch(() => []),
    ]);
    allMessages = [...inboxMsgs, ...sentMsgs, ...archiveMsgs, ...deletedMsgs];
  }

  // Deduplicate, exclude the selected message, and exclude drafts
  const seen = new Set();
  const filtered = allMessages.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return m.id !== excludeId && !m.isDraft;
  });

  return filtered.sort((a, b) =>
    new Date(a.receivedDateTime || a.sentDateTime) -
    new Date(b.receivedDateTime || b.sentDateTime)
  );
}

/* ─────────────────────────────────────────────────────────────
   14b. Fetch multiple conversation threads in parallel (up to 20)
   
   NEW: Accepts an array of { conversationId, excludeId } objects
   and returns a map of conversationId → thread messages.
   Used by the batch thread prefetch in the frontend.
───────────────────────────────────────────────────────────── */
async function fetchMultipleThreads(userId, requests) {
  // Cap at 20 to avoid overwhelming Graph API
  const capped = requests.slice(0, 20);

  const results = await Promise.allSettled(
    capped.map(({ conversationId, excludeId }) =>
      fetchConversationThread(userId, conversationId, excludeId)
    )
  );

  const map = {};
  capped.forEach(({ conversationId }, i) => {
    const r = results[i];
    map[conversationId] = r.status === 'fulfilled' ? r.value : [];
  });

  return map;
}

/* ─────────────────────────────────────────────────────────────
   15. List mail folders
───────────────────────────────────────────────────────────── */
async function listFolders(userId) {
  const accessToken = await getValidAccessToken(userId);
  const { data } = await axios.get(`${GRAPH}/me/mailFolders?$top=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.value || [];
}

// Helper: normalize recipient to Graph API format
function toAddrObj(r) {
  if (typeof r === 'string') return { emailAddress: { address: r } };
  return { emailAddress: { address: r.email || r.address, name: r.name } };
}

module.exports = {
  buildAuthUrl,
  consumeAuthState,
  exchangeCodeForTokens,
  getValidAccessToken,
  getUserProfile,
  fetchEmails,
  fetchEmailById,
  markAsRead,
  deleteMessage,
  moveMessage,
  sendEmail,
  replyToMessage,
  forwardMessage,
  listFolders,
  fetchConversationThread,
  fetchMultipleThreads,   // ← NEW
};