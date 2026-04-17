const Admin       = require('../models/admin');
const User        = require('../models/user');
const ActivityLog = require('../models/activityLog');

// ── Thresholds ────────────────────────────────────────────────────────────────
// If lastActiveAt is older than this, we assume the browser was CLOSED
// (frontend pings every 10s, so 20s gives a safe buffer for network delay)
const CLOSED_BROWSER_THRESHOLD_MS = 20 * 1000; // 20 seconds

/**
 * Finds accounts that are still marked isLoggedIn = true but haven't pinged
 * in 20s — meaning the browser was closed — and logs them out.
 * Records action as 'Auto Logout (Closed Browser)' so it's distinct from
 * the 'Session Timeout' written by the frontend when the browser was open.
 */
const runIdleSessionCron = async () => {
  const cutoff = new Date(Date.now() - CLOSED_BROWSER_THRESHOLD_MS);

  try {
    // ── Idle admins ──────────────────────────────────────────────────────
    const idleAdmins = await Admin.find({
      isLoggedIn:   true,
      lastActiveAt: { $lt: cutoff },
    }).lean();

    for (const admin of idleAdmins) {
      await Admin.findByIdAndUpdate(admin._id, { isLoggedIn: false });

      try {
        await ActivityLog.create({
          adminId:        admin._id,
          name:           admin.name,
          email:          admin.email,
          role:           admin.role,
          profilePicture: admin.profilePicture || '',
          action:         'Auto Logout (Closed Browser)',
          module:         'Auth',
          changes:        { before: null, after: null },
          ipAddress:      '',
        });
        console.log(`🔴 Closed-browser auto-logout (admin): ${admin.email}`);
      } catch (logErr) {
        console.error('⚠️  Activity log error (idle admin):', logErr.message);
      }
    }

    // ── Idle users ───────────────────────────────────────────────────────
    const idleUsers = await User.find({
      isLoggedIn:   true,
      lastActiveAt: { $lt: cutoff },
    }).lean();

    for (const user of idleUsers) {
      await User.findByIdAndUpdate(user._id, { isLoggedIn: false });

      try {
        await ActivityLog.create({
          adminId:        user._id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          profilePicture: user.profilePicture || '',
          action:         'Auto Logout (Closed Browser)',
          module:         'Auth',
          changes:        { before: null, after: null },
          ipAddress:      '',
        });
        console.log(`🔴 Closed-browser auto-logout (user): ${user.email}`);
      } catch (logErr) {
        console.error('⚠️  Activity log error (idle user):', logErr.message);
      }
    }

  } catch (err) {
    console.error('❌ idleSessionCron error:', err.message);
  }
};

/**
 * Starts the cron — runs every 10s to stay well within the 20s threshold.
 * Call once from server.js after DB connects.
 */
const startIdleSessionCron = () => {
  console.log('⏱️  Idle session cron started (runs every 10s, closes browser threshold: 20s)');
  setInterval(runIdleSessionCron, 10 * 1000);
};

module.exports = { startIdleSessionCron };