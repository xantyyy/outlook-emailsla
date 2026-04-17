// changePasswordRoute.js
// Flow: Verify current password → Send OTP via email → Verify OTP → Update password
// ✅ OTP now stored in MongoDB (otpStore model) instead of in-memory Map
//    — survives server restarts and works with multiple instances

const express     = require('express');
const router      = express.Router();
const bcrypt      = require('bcryptjs');
const { auth }    = require('../middleware/auth');
const Admin       = require('../models/admin');
const User        = require('../models/user');
const ActivityLog = require('../models/activityLog');
const OtpStore    = require('../models/otpStore');
const { sendChangePasswordOTP, sendProfileUpdateOTP } = require('../services/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Helper: upsert OTP into MongoDB ──
const saveOtp = async (key, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await OtpStore.findOneAndUpdate(
    { key },
    { otp, expiresAt, verified: false },
    { upsert: true, new: true }
  );
};

// ── Helper: get OTP record from MongoDB ──
const getOtp = async (key) => {
  return OtpStore.findOne({ key });
};

// ── Helper: mark OTP as verified ──
const verifyOtp = async (key) => {
  await OtpStore.findOneAndUpdate({ key }, { verified: true });
};

// ── Helper: delete OTP ──
const deleteOtp = async (key) => {
  await OtpStore.deleteOne({ key });
};

// ── Helper: find account from either Admin or User collection ──
// ✅ Uses req.decoded.accountType (reliable) — req.admin drops non-schema props
const findAccount = async (req, selectPassword = false) => {
  const isUser = req.decoded?.accountType === 'user';
  const sel    = selectPassword ? '+password' : '-password';
  const id     = req.decoded?.id || req.admin._id;
  if (isUser) {
    return { account: await User.findById(id).select(sel), isUser: true };
  }
  return { account: await Admin.findById(id).select(sel), isUser: false };
};


/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/verify-current
   @desc    Step 1 — Verify current password, then send OTP
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/verify-current', auth, async (req, res) => {
  try {
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required.' });
    }

    const { account } = await findAccount(req, true);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const otp = generateOTP();
    await saveOtp(account.email, otp);
    await sendChangePasswordOTP(account.email, account.name, otp);

    console.log(`📧 Change-password OTP sent to: ${account.email}`);

    return res.json({
      message: 'Current password verified. OTP sent to your email.',
      email:   account.email,
    });

  } catch (error) {
    console.error('❌ verify-current error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/verify-otp
   @desc    Step 2 — Verify OTP
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required.' });
    }

    const { account } = await findAccount(req);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const record = await getOtp(account.email);

    if (!record) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }

    if (new Date() > record.expiresAt) {
      await deleteOtp(account.email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    await verifyOtp(account.email);

    return res.json({ message: 'OTP verified successfully.' });

  } catch (error) {
    console.error('❌ verify-otp error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/update
   @desc    Step 3 — Update password after OTP verified
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/update', auth, async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const { account } = await findAccount(req, true);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const record = await getOtp(account.email);
    if (!record || !record.verified) {
      return res.status(400).json({ message: 'Please verify your OTP first.' });
    }

    const isSame = await bcrypt.compare(newPassword, account.password);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from your current password.' });
    }

    account.password = newPassword;
    await account.save();

    await deleteOtp(account.email);

    // ✅ Log the password change
    try {
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        '';

      await ActivityLog.create({
        adminId:        account._id,
        name:           account.name,
        email:          account.email,
        role:           account.role || 'User',
        profilePicture: account.profilePicture || '',
        action:         'Updated Password',
        module:         'Settings',
        changes: {
          before: { password: '••••••••' },
          after:  { password: '••••••••' },
        },
        ipAddress: ip,
      });

      console.log(`📋 Activity log created for password change: ${account.email}`);
    } catch (logErr) {
      console.error('⚠️ Failed to write activity log:', logErr.message);
    }

    console.log(`✅ Password changed successfully for: ${account.email}`);

    return res.json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('❌ change-password update error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/resend-otp
   @desc    Resend OTP (cooldown enforced on frontend)
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/resend-otp', auth, async (req, res) => {
  try {
    const { account } = await findAccount(req);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const otp = generateOTP();
    await saveOtp(account.email, otp);
    await sendChangePasswordOTP(account.email, account.name, otp);

    console.log(`📧 Change-password OTP resent to: ${account.email}`);

    return res.json({ message: 'New OTP sent to your email.' });

  } catch (error) {
    console.error('❌ resend-otp error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/send-profile-otp
   @desc    Send OTP before saving profile changes (name/picture)
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/send-profile-otp', auth, async (req, res) => {
  try {
    const { account } = await findAccount(req);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const otp = generateOTP();
    // Use "profile:" prefix so it doesn't conflict with password-change OTP
    await saveOtp(`profile:${account.email}`, otp);
    await sendProfileUpdateOTP(account.email, account.name, otp);

    console.log(`📧 Profile update OTP sent to: ${account.email}`);

    return res.json({
      message: 'OTP sent to your email. Please verify to save your changes.',
      email:   account.email,
    });

  } catch (error) {
    console.error('❌ send-profile-otp error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

/* ══════════════════════════════════════════════════════════════
   @route   POST /api/admin/change-password/verify-profile-otp
   @desc    Verify OTP before saving profile changes
   @access  Private
══════════════════════════════════════════════════════════════ */
router.post('/verify-profile-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required.' });
    }

    const { account } = await findAccount(req);
    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const key    = `profile:${account.email}`;
    const record = await getOtp(key);

    if (!record) {
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }

    if (new Date() > record.expiresAt) {
      await deleteOtp(key);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Delete immediately after successful verification
    await deleteOtp(key);

    return res.json({ message: 'OTP verified. Profile changes will now be saved.' });

  } catch (error) {
    console.error('❌ verify-profile-otp error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;