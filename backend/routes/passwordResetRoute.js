const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const Admin    = require('../models/admin');
const User     = require('../models/user');
const { sendPasswordResetOTP } = require('../services/emailService');

// ── In-memory OTP store ──
// { email: { otp, expiresAt, name } }
// For production, consider using Redis or storing in MongoDB
const otpStore = new Map();

// ── Generate 6-digit OTP ──
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Find account in both collections ──
const findAccount = async (email) => {
  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (admin) return { account: admin, type: 'admin' };

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user) return { account: user, type: 'user' };

  return null;
};

/* ══════════════════════════════════════════════
   @route   POST /api/auth/forgot-password
   @desc    Send OTP to email
   @access  Public
══════════════════════════════════════════════ */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const found = await findAccount(email);

    // ── Always return success to prevent email enumeration ──
    if (!found) {
      return res.json({ message: 'If this email exists, an OTP has been sent.' });
    }

    const { account } = found;

    if (!account.isActive) {
      return res.status(403).json({ message: 'This account is deactivated.' });
    }

    // ── Generate OTP and store with 10-minute expiry ──
    const otp       = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase().trim(), { otp, expiresAt, name: account.name });

    // ── Send OTP email ──
    await sendPasswordResetOTP(email.toLowerCase().trim(), account.name, otp);

    console.log(`📧 OTP sent to ${email} | Expires: ${new Date(expiresAt).toLocaleTimeString()}`);

    return res.json({ message: 'If this email exists, an OTP has been sent.' });

  } catch (error) {
    console.error('❌ forgot-password error:', error.message);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

/* ══════════════════════════════════════════════
   @route   POST /api/auth/verify-otp
   @desc    Verify the 6-digit OTP
   @access  Public
══════════════════════════════════════════════ */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const record = otpStore.get(email.toLowerCase().trim());

    if (!record) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // ── OTP verified — mark as verified (allow password reset) ──
    record.verified = true;
    otpStore.set(email.toLowerCase().trim(), record);

    return res.json({ message: 'OTP verified successfully.' });

  } catch (error) {
    console.error('❌ verify-otp error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════
   @route   POST /api/auth/reset-password
   @desc    Set new password after OTP verification
   @access  Public
══════════════════════════════════════════════ */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Email, password, and confirm password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const record = otpStore.get(email.toLowerCase().trim());

    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Please verify your OTP first.' });
    }

    // ── Find account and update password ──
    const found = await findAccount(email);
    if (!found) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const { account } = found;

    // Update password — pre-save hook will hash it
    account.password = password;
    await account.save();

    // ── Remove OTP from store after successful reset ──
    otpStore.delete(email.toLowerCase().trim());

    console.log(`✅ Password reset successful for: ${email}`);

    return res.json({ message: 'Password reset successfully. You can now login.' });

  } catch (error) {
    console.error('❌ reset-password error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;