const mongoose = require('mongoose');

/**
 * Stores one Outlook OAuth token set per user/admin.
 * userId maps to Admin._id or User._id (both are ObjectIds).
 */
const outlookTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    index: true,
  },
  accountType: {
    type: String,
    enum: ['admin', 'user'],
    default: 'admin',
  },
  // Microsoft account info (populated after first connect)
  microsoftEmail:  { type: String, default: null },
  microsoftName:   { type: String, default: null },

  // OAuth tokens
  accessToken:  { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiresAt:    { type: Date,   required: true },

  connectedAt: { type: Date, default: Date.now },
  lastSyncAt:  { type: Date, default: null },

  // Graph change-notification subscription
  graphSubscriptionId:     { type: String, default: null, index: true },
  graphSubscriptionExpiry: { type: Date,   default: null },
}, { timestamps: true });

// Returns true if access token still has > 5 min before expiry
outlookTokenSchema.methods.isAccessTokenValid = function () {
  return this.expiresAt && (this.expiresAt.getTime() - Date.now()) > 5 * 60 * 1000;
};

module.exports = mongoose.model('OutlookToken', outlookTokenSchema);