// models/otpStore.js
// Replaces the in-memory Map — persists OTPs in MongoDB
// so server restarts don't invalidate pending OTPs.

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true }, // e.g. "profile:email" or "email"
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  verified:  { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete expired documents (MongoDB TTL index)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpStore', otpSchema);