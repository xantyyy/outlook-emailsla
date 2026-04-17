const mongoose = require('mongoose');
const crypto   = require('crypto');

/**
 * outlookState.model.js
 *
 * Stores a one-time nonce tied to a userId for Microsoft OAuth.
 * The nonce is embedded in the OAuth `state` param as:
 *   `<userId>:<nonce>`
 *
 * Once the callback consumes it (or it expires), it is deleted.
 * This prevents replay attacks where someone reuses an old OAuth URL.
 */
const outlookStateSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    required: true,
    index:    true,
  },
  nonce: {
    type:     String,
    required: true,
    unique:   true,
    default:  () => crypto.randomBytes(32).toString('hex'),
  },
  // Auto-delete after 10 minutes — matches the OTP window
  expiresAt: {
    type:    Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
    index:   { expireAfterSeconds: 0 },   // MongoDB TTL index
  },
  used: {
    type:    Boolean,
    default: false,
  },
});

module.exports = mongoose.model('OutlookState', outlookStateSchema);