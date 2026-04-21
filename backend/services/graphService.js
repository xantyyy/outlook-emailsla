/**
 * graphService.js
 *
 * TWO RESPONSIBILITIES:
 *
 *  1. SYSTEM INBOX (existing — unchanged)
 *     Uses app-level client credentials (AZURE_CLIENT_ID / SECRET / TENANT_ID)
 *     to read bug report emails from the fixed ADMIN_EMAIL inbox.
 *     → fetchBugReportsFromOutlook()
 *     → markEmailAsRead()
 *
 *  2. USER WEBHOOK SUBSCRIPTIONS (new)
 *     Uses per-user OAuth tokens (stored in OutlookToken) to create
 *     Graph change-notification subscriptions on each user's personal mailbox.
 *     These fire the webhook at /api/webhooks/graph when messages arrive or change.
 *     → subscribeUser()
 *     → renewSubscription()
 *     → deleteSubscription()
 *     → renewAllSubscriptions()
 *     → subscribeAllConnectedUsers()
 *
 * OTP email sending is handled by emailService.js — NOT here.
 */

const msal       = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const axios      = require('axios');
const OutlookToken = require('../models/outlookToken.model');

const GRAPH = 'https://graph.microsoft.com/v1.0';

/* ══════════════════════════════════════════════════════════════════════════════
   PART 1 — SYSTEM INBOX (existing logic, untouched)
   Uses app-level client credentials to access the fixed ADMIN_EMAIL mailbox.
══════════════════════════════════════════════════════════════════════════════ */

// Lazy initialization — hindi mag-eexecute hanggang hindi pa na-load ang .env
let msalClient = null;

function getMsalClient() {
  if (!msalClient) {
    const clientId     = process.env.AZURE_CLIENT_ID;
    const tenantId     = process.env.AZURE_TENANT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!clientId)     throw new Error('Missing env variable: AZURE_CLIENT_ID');
    if (!tenantId)     throw new Error('Missing env variable: AZURE_TENANT_ID');
    if (!clientSecret) throw new Error('Missing env variable: AZURE_CLIENT_SECRET');

    msalClient = new msal.ConfidentialClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
    });
  }

  return msalClient;
}

async function getAccessToken() {
  const tokenRequest = { scopes: ['https://graph.microsoft.com/.default'] };

  try {
    const response = await getMsalClient().acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    throw new Error(`Failed to authenticate with Microsoft Graph: ${error.message}`);
  }
}

async function getGraphClient() {
  const accessToken = await getAccessToken();
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

async function fetchBugReportsFromOutlook() {
  try {
    const client     = await getGraphClient();
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL is not configured in environment variables');
    }

    console.log(`📧 Fetching recent emails from: ${adminEmail}`);

    // METHOD 1: Search
    try {
      const searchResults = await client
        .api(`/users/${adminEmail}/messages`)
        .search('"BUG REPORT"')
        .select('id,subject,bodyPreview,body,uniqueBody,from,receivedDateTime,isRead,hasAttachments,conversationId')
        .filter('isDraft eq false')
        .top(50)
        .get();

      let bugReports = searchResults.value.filter(msg => {
        if (!msg.subject || !msg.subject.includes('[BUG REPORT]')) return false;
        const subject = msg.subject.toUpperCase();
        if (subject.startsWith('RE:') || subject.startsWith('FW:') || subject.startsWith('FWD:')) {
          return false;
        }
        return true;
      });

      const uniqueConversations = new Map();
      bugReports.forEach(msg => {
        const convId = msg.conversationId;
        if (!uniqueConversations.has(convId)) {
          uniqueConversations.set(convId, msg);
        } else {
          const existing = uniqueConversations.get(convId);
          if (new Date(msg.receivedDateTime) < new Date(existing.receivedDateTime)) {
            uniqueConversations.set(convId, msg);
          }
        }
      });

      bugReports = Array.from(uniqueConversations.values());
      if (bugReports.length > 0) {
        console.log(`✓ Search method: Found ${bugReports.length} unique bug report emails`);
      }
      bugReports.sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime));
      return bugReports;

    } catch (searchError) {

      // METHOD 2: Fallback — inbox only
      const messages = await client
        .api(`/users/${adminEmail}/mailFolders/inbox/messages`)
        .select('id,subject,bodyPreview,body,uniqueBody,from,receivedDateTime,isRead,hasAttachments,conversationId')
        .filter('isDraft eq false')
        .top(100)
        .get();

      console.log(`✓ Fetched ${messages.value.length} recent emails from INBOX`);

      let bugReports = messages.value.filter(msg => {
        if (!msg.subject || !msg.subject.toUpperCase().includes('[BUG REPORT]')) return false;
        const subject = msg.subject.toUpperCase();
        if (subject.startsWith('RE:') || subject.startsWith('FW:') || subject.startsWith('FWD:')) {
          return false;
        }
        return true;
      });

      const uniqueConversations = new Map();
      bugReports.forEach(msg => {
        const convId = msg.conversationId;
        if (!uniqueConversations.has(convId)) {
          uniqueConversations.set(convId, msg);
        } else {
          const existing = uniqueConversations.get(convId);
          if (new Date(msg.receivedDateTime) < new Date(existing.receivedDateTime)) {
            uniqueConversations.set(convId, msg);
          }
        }
      });

      bugReports = Array.from(uniqueConversations.values());
      if (bugReports.length > 0) {
        console.log(`✓ Fallback method: Found ${bugReports.length} unique bug report emails`);
      }
      bugReports.sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime));
      return bugReports;
    }

  } catch (error) {
    console.error('❌ Error fetching emails from Outlook:', error.message);
    if (error.statusCode === 401) throw new Error('Authentication failed. Check Azure credentials and permissions.');
    if (error.statusCode === 403) throw new Error('Access forbidden. Grant Mail.Read permission in Azure Portal.');
    if (error.statusCode === 404) throw new Error(`User ${process.env.ADMIN_EMAIL} not found. Check ADMIN_EMAIL in .env`);
    throw error;
  }
}

async function markEmailAsRead(messageId) {
  try {
    const client     = await getGraphClient();
    const adminEmail = process.env.ADMIN_EMAIL;

    await client
      .api(`/users/${adminEmail}/messages/${messageId}`)
      .update({ isRead: true });

    console.log(`✓ Marked email ${messageId} as read`);
  } catch (error) {
    console.error('❌ Error marking email as read:', error.message);
    // Non-critical, don't throw
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   PART 2 — USER WEBHOOK SUBSCRIPTIONS (new)
   Uses per-user OAuth tokens (from OutlookToken collection) to subscribe each
   connected user's personal mailbox to Graph change notifications.

   NOTE: This is SEPARATE from the system MSAL client above.
   These use delegated OAuth tokens stored by outlookService.js, not app credentials.
══════════════════════════════════════════════════════════════════════════════ */

/**
 * Returns the public webhook URL for Graph to POST notifications to.
 * MUST be HTTPS in production. Use ngrok or a public HTTPS tunnel in development.
 */
function getNotificationUrl() {
  const base = process.env.GRAPH_WEBHOOK_URL || process.env.BACKEND_URL;
  if (!base) {
    throw new Error(
      'GRAPH_WEBHOOK_URL env var is required for Graph subscriptions. Set it to a public HTTPS endpoint like https://your-domain.com'
    );
  }

  const normalized = base.replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('GRAPH_WEBHOOK_URL must be a valid URL starting with https://');
  }

  if (!normalized.toLowerCase().startsWith('https://')) {
    throw new Error('GRAPH_WEBHOOK_URL must use https:// for Microsoft Graph subscriptions');
  }

  return `${normalized}/api/webhooks/graph`;
}

/**
 * Returns expiry timestamp 55 minutes from now.
 * Safely under the 60-minute personal account limit.
 * AAD (work) accounts support up to ~3 days, but 55 min works for both.
 */
function getExpiryDateTime() {
  return new Date(Date.now() + 55 * 60 * 1000).toISOString();
}

/**
 * Get a valid per-user access token from the OutlookToken collection.
 * Refreshes automatically if expired using the stored refreshToken.
 */
async function getUserAccessToken(userId) {
  const tokenDoc = await OutlookToken.findOne({ userId });
  if (!tokenDoc) throw new Error('OUTLOOK_NOT_CONNECTED');

  if (tokenDoc.isAccessTokenValid()) return tokenDoc.accessToken;

  // Refresh the token
  const TENANT    = process.env.AZURE_TENANT_ID || process.env.MICROSOFT_TENANT_ID || 'consumers';
  const TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id:     process.env.AZURE_CLIENT_ID     || process.env.MICROSOFT_CLIENT_ID,
    client_secret: process.env.AZURE_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET,
    refresh_token: tokenDoc.refreshToken,
    grant_type:    'refresh_token',
    scope:         'offline_access User.Read Mail.Read Mail.Send Mail.ReadWrite',
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

/**
 * subscribeUser(userId)
 *
 * Creates a Graph change-notification subscription for the user's mailbox.
 * Subscribes to: all messages (created or updated = new emails + isRead changes).
 * Stores the subscriptionId in OutlookToken for later renewal/deletion.
 *
 * @param {string|ObjectId} userId
 * @returns {string} subscriptionId
 */
async function subscribeUser(userId) {
  const accessToken = await getUserAccessToken(userId);

  const body = {
    changeType:         'created,updated',
    notificationUrl:    getNotificationUrl(),
    resource:           'me/messages',
    expirationDateTime: getExpiryDateTime(),
    clientState:        process.env.GRAPH_WEBHOOK_SECRET || 'ticketsystem-secret',
  };

  let data;
  try {
    const res = await axios.post(`${GRAPH}/subscriptions`, body, {
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    data = res.data;
  } catch (err) {
    const graphErr = err.response?.data?.error;
    console.error(
      `[graphService] subscribeUser failed for userId=${userId}:`,
      graphErr ? `${graphErr.code}: ${graphErr.message}` : err.message
    );
    throw err;
  }

  await OutlookToken.updateOne(
    { userId },
    {
      graphSubscriptionId:     data.id,
      graphSubscriptionExpiry: new Date(data.expirationDateTime),
    }
  );

  console.log(`✅ [graphService] Subscription created — userId=${userId} subId=${data.id} expires=${data.expirationDateTime}`);
  return data.id;
}

/**
 * renewSubscription(userId)
 *
 * Extends the existing subscription's expiry by 55 minutes.
 * If the subscription no longer exists on Graph's side (404), recreates it.
 *
 * @param {string|ObjectId} userId
 */
async function renewSubscription(userId) {
  const tokenDoc = await OutlookToken.findOne({ userId });
  if (!tokenDoc?.graphSubscriptionId) {
    // No subscription on record — create a fresh one
    return subscribeUser(userId);
  }

  const accessToken = await getUserAccessToken(userId);
  const newExpiry   = getExpiryDateTime();

  try {
    await axios.patch(
      `${GRAPH}/subscriptions/${tokenDoc.graphSubscriptionId}`,
      { expirationDateTime: newExpiry },
      {
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await OutlookToken.updateOne(
      { userId },
      { graphSubscriptionExpiry: new Date(newExpiry) }
    );

    console.log(`🔄 [graphService] Subscription renewed — userId=${userId} newExpiry=${newExpiry}`);
  } catch (err) {
    if (err.response?.status === 404) {
      // Subscription gone on Graph's side — recreate it
      console.warn(`[graphService] Subscription not found for userId=${userId}, recreating…`);
      await OutlookToken.updateOne({ userId }, { graphSubscriptionId: null });
      return subscribeUser(userId);
    }
    throw err;
  }
}

/**
 * deleteSubscription(userId)
 *
 * Deletes the Graph subscription and clears it from the DB.
 * Call this when a user disconnects Outlook.
 *
 * @param {string|ObjectId} userId
 */
async function deleteSubscription(userId) {
  const tokenDoc = await OutlookToken.findOne({ userId });
  if (!tokenDoc?.graphSubscriptionId) return; // nothing to delete

  try {
    const accessToken = await getUserAccessToken(userId);
    await axios.delete(
      `${GRAPH}/subscriptions/${tokenDoc.graphSubscriptionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    console.log(`🗑 [graphService] Subscription deleted — userId=${userId}`);
  } catch (err) {
    if (err.response?.status !== 404) {
      console.error(`[graphService] deleteSubscription failed for userId=${userId}:`, err.message);
    }
    // 404 = already gone, that's fine
  }

  await OutlookToken.updateOne(
    { userId },
    { graphSubscriptionId: null, graphSubscriptionExpiry: null }
  );
}

/**
 * renewAllSubscriptions()
 *
 * Finds all subscriptions expiring within the next 10 minutes and renews them.
 * Called by the cron job in slaCron.js every 45 minutes.
 */
async function renewAllSubscriptions() {
  const tenMinFromNow = new Date(Date.now() + 10 * 60 * 1000);

  const expiringSoon = await OutlookToken.find({
    graphSubscriptionId:     { $ne: null },
    graphSubscriptionExpiry: { $lte: tenMinFromNow },
  }).select('userId');

  if (expiringSoon.length === 0) {
    console.log('[graphService] No subscriptions need renewal');
    return;
  }

  console.log(`[graphService] Renewing ${expiringSoon.length} subscription(s)…`);

  const results = await Promise.allSettled(
    expiringSoon.map(doc => renewSubscription(doc.userId))
  );

  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(
        `[graphService] Renewal failed for userId=${expiringSoon[i].userId}:`,
        r.reason?.message
      );
    }
  });
}

/**
 * subscribeAllConnectedUsers()
 *
 * On server boot, ensures every connected Outlook user has an active subscription.
 * Skips users that already have a valid (non-expired) subscription.
 * Called once from server.js after MongoDB connects.
 */
async function subscribeAllConnectedUsers() {
  const now      = new Date();
  const tokenDocs = await OutlookToken.find({
    refreshToken: { $ne: null },
  }).select('userId graphSubscriptionId graphSubscriptionExpiry');

  console.log(`[graphService] Bootstrapping subscriptions for ${tokenDocs.length} user(s)…`);

  for (const doc of tokenDocs) {
    const isValid =
      doc.graphSubscriptionId &&
      doc.graphSubscriptionExpiry &&
      new Date(doc.graphSubscriptionExpiry) > now;

    if (isValid) {
      console.log(`[graphService] userId=${doc.userId} already has a valid subscription — skipping`);
      continue;
    }

    try {
      await subscribeUser(doc.userId);
    } catch (err) {
      console.error(`[graphService] Bootstrap failed for userId=${doc.userId}:`, err.message);
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   EXPORTS
══════════════════════════════════════════════════════════════════════════════ */

module.exports = {
  // Part 1 — System inbox (existing)
  fetchBugReportsFromOutlook,
  markEmailAsRead,

  // Part 2 — User webhook subscriptions (new)
  subscribeUser,
  renewSubscription,
  deleteSubscription,
  renewAllSubscriptions,
  subscribeAllConnectedUsers,
};