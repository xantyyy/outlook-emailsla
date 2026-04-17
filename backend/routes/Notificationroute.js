const express    = require('express');
const router     = express.Router();
const Bug        = require('../models/bug');
const ActivityLog = require('../models/activityLog');
const { auth, checkRole } = require('../middleware/auth');

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/** Relative time string, e.g. "3 minutes ago" */
function timeAgo(date) {
  if (!date) return '—';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) !== 1 ? 's' : ''} ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
}

/** Map a Bug document → notification shape (full data) */
function bugToNotif(bug) {
  const severityType = { Critical: 'critical', High: 'alert', Medium: 'progress', Low: 'resolved' };
  const statusType   = { 'In Progress': 'progress', Resolved: 'resolved', Closed: 'resolved', Reopened: 'alert' };
  const type         = statusType[bug.status] || severityType[bug.severity] || 'critical';

  const titleMap = {
    Open:          `${bug.severity} Bug Reported`,
    'In Progress': 'Bug In Progress',
    Resolved:      'Bug Resolved',
    Closed:        'Bug Closed',
    Reopened:      'Bug Reopened',
  };

  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 h window = unread

  return {
    id:          bug._id,
    type,
    title:       titleMap[bug.status] || `${bug.severity} Bug Reported`,
    desc:        bug.title?.length > 55 ? bug.title.slice(0, 55) + '…' : bug.title,

    // ── Full bug fields exposed to the dropdown ──
    bugTitle:    bug.title        || '—',
    status:      bug.status       || '—',
    severity:    bug.severity     || '—',
    priority:    bug.priority     || '—',
    category:    bug.category     || '—',
    email:       bug.reportedBy?.email || '—',
    reportedBy:  bug.reportedBy   || null,
    assignedTo:  bug.assignedTo   || null,
    acceptedBy:  bug.acceptedBy   || null,
    description: bug.description  || '',
    stepsToReproduce: bug.stepsToReproduce || '',
    expectedBehavior: bug.expectedBehavior || '',
    actualBehavior:   bug.actualBehavior   || '',
    environment: bug.environment  || null,
    screenshots: bug.screenshots  || [],
    tags:        bug.tags         || [],
    comments:    bug.comments     || [],
    slaHours:    bug.slaHours     || null,
    slaDeadline: bug.slaDeadline  || null,
    startedAt:   bug.startedAt    || null,
    resolvedAt:  bug.resolvedAt   || null,
    closedAt:    bug.closedAt     || null,
    invalidReason: bug.invalidReason || null,
    receivedDateTime: bug.receivedDateTime || null,
    createdAt:   bug.createdAt,
    updatedAt:   bug.updatedAt,

    time:   timeAgo(bug.createdAt),
    unread: bug.status === 'Open' && new Date(bug.createdAt) > cutoff,
    raw:    bug.createdAt,
  };
}

/** Actions excluded from the notification dropdown — login/logout are
 *  too noisy and carry no actionable info for the reader. */
const EXCLUDED_ACTIONS = [
  'User Login',
  'User Logout',
  'Session Timeout',
  'Auto Logout (Closed Browser)',
];

/** Map an ActivityLog document -> notification shape */
const ACTION_TYPE_MAP = {
  'Created Bug Report':      'critical',
  'Updated Bug Report':      'edit',
  'Deleted Bug Report':      'delete',
  'Updated Name':            'user_created',
  'Updated Profile Picture': 'user_created',
  'Updated Password':        'edit',
  'Add User':                'user_created',
  'Archive':                 'delete',
  'Deactivated User':        'delete',
  'Activated User':          'user_created',
};

function activityToNotif(log) {
  const type   = ACTION_TYPE_MAP[log.action] || 'system';
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  return {
    id:    log._id,
    type,
    title: log.action,
    desc:  log.name
      ? `${log.name}${log.role ? ` (${log.role})` : ''}`
      : log.email || '—',
    email:  log.email || '—',
    time:   timeAgo(log.createdAt),
    unread: new Date(log.createdAt) > cutoff,
    raw:    log.createdAt,
  };
}

// ─────────────────────────────────────────────
//  GET /api/notifications/bugs
//  ALL bug reports → full notification items (no cap)
//  Access: Super Admin + Innovation (auth only, role check inside route)
// ─────────────────────────────────────────────
router.get('/bugs', auth, async (req, res) => {
  try {
    // Support both admin and user tokens
    const actor        = req.admin || req.user;
    const actorRole    = (actor?.role || '').trim().toLowerCase();
    const isSuperAdmin = req.admin?.accountType === 'admin' || actorRole === 'super admin';
    const isInnovation = actorRole === 'innovation';

    // Super Admin and Innovation see ALL bugs; other roles see only bugs they accepted
    const filter = (isSuperAdmin || isInnovation) ? {} : { acceptedBy: actor?._id };

    // ✅ Removed .limit(8) — return ALL bugs so dropdown shows full list
    const bugs = await Bug.find(filter)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture')
      .lean();

    const notifications = bugs.map(bugToNotif);
    const unreadCount   = notifications.filter(n => n.unread).length;

    return res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (err) {
    console.error('❌ GET /notifications/bugs error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET /api/notifications/system
//  Latest 50 activity logs → notification items
//  Access: Super Admin only (matches activityLogRoute)
// ─────────────────────────────────────────────
router.get('/system', auth, checkRole('Super Admin', 'Innovation'), async (req, res) => {
  try {
    // ✅ Increased from 8 → 50 to show more system notifications
    const logs = await ActivityLog.find({ action: { $nin: EXCLUDED_ACTIONS } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action name email role createdAt')
      .lean();

    const notifications = logs.map(activityToNotif);
    const unreadCount   = notifications.filter(n => n.unread).length;

    return res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (err) {
    console.error('❌ GET /notifications/system error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET /api/notifications/summary
//  Returns BOTH tabs in one call + total unread
//  Used for the bell badge on initial page load
// ─────────────────────────────────────────────
router.get('/summary', auth, async (req, res) => {
  try {
    const actor        = req.admin || req.user;
    const actorRole    = (actor?.role || '').trim().toLowerCase();
    const isSuperAdmin = req.admin?.accountType === 'admin' || actorRole === 'super admin';
    const isInnovation = actorRole === 'innovation';
    const bugFilter    = (isSuperAdmin || isInnovation) ? {} : { acceptedBy: actor?._id };

    const [bugs, logs] = await Promise.all([
      // ✅ Removed .limit(8) — return ALL bugs for the summary too
      Bug.find(bugFilter)
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name email role')
        .populate('acceptedBy', 'name email role profilePicture')
        .lean(),

      // Activity logs for Super Admin AND Innovation
      (isSuperAdmin || actorRole === 'innovation')
        ? ActivityLog.find({ action: { $nin: EXCLUDED_ACTIONS } })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('action name email role createdAt')
            .lean()
        : Promise.resolve([]),
    ]);

    const bugNotifs    = bugs.map(bugToNotif);
    const systemNotifs = logs.map(activityToNotif);

    const bugUnread    = bugNotifs.filter(n => n.unread).length;
    const systemUnread = systemNotifs.filter(n => n.unread).length;

    return res.json({
      success: true,
      bugs:   { notifications: bugNotifs,    unreadCount: bugUnread,    total: bugNotifs.length    },
      system: { notifications: systemNotifs, unreadCount: systemUnread, total: systemNotifs.length },
      totalUnread: bugUnread + systemUnread,
    });
  } catch (err) {
    console.error('❌ GET /notifications/summary error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;