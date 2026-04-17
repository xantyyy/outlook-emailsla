const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // Who did the action
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: false, // ← relaxed: operators can be Admin OR User accounts
    },
    name:           { type: String, default: '' },
    email:          { type: String, default: '' },
    role:           { type: String, default: '' },
    profilePicture: { type: String, default: '' },

    // What they did
    action: {
      type: String,
      enum: [
        'User Login',
        'User Logout',
        'Updated Name',
        'Updated Profile Picture',
        'Updated Password',
        'Created Bug Report',
        'Updated Bug Report',
        'Deleted Bug Report',
        'Add User',
        'Archive',
        'Deactivated User',             // ✅ added
        'Activated User',               // ✅ added
        'Session Timeout',              // ✅ browser open, idle 2 min
        'Auto Logout (Closed Browser)', // ✅ browser closed, no ping 20s
      ],
      required: true,
    },

    // Where it happened
    module: {
      type: String,
      enum: [
        'Auth',
        'Settings',
        'Bug Reports',
        'User Management', // ✅ added
      ],
      default: 'Auth',
    },

    // Before & After snapshot — for Settings updates
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after:  { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // Who was affected — for Deactivated/Activated User actions
    targetUser: {
      name:           { type: String, default: '' },
      email:          { type: String, default: '' },
      role:           { type: String, default: '' },
      profilePicture: { type: String, default: '' },
      reason:         { type: String, default: '' }, // reason for deactivation
    },

    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);