const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const User = require('../models/user');
const ActivityLog = require('../models/activityLog');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/admin
// @desc    Get all admins
// @access  Private (Admin only)
router.get('/', auth, checkRole('Super Admin', 'Admin'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ admins, total: admins.length });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/:id
// @desc    Get single admin
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/:id
// @desc    Update admin or user profile (name, profilePicture)
// @access  Private (Super Admin only or self)
router.put('/:id', auth, async (req, res) => {
  try {
    // ── Determine account type from decoded token ──
    // req.decoded is set by auth middleware and is always reliable.
    // req.admin is a Mongoose doc and drops non-schema fields like accountType.
    const isUser    = req.decoded?.accountType === 'user';
    const selfId    = req.decoded?.id || req.admin._id.toString();
    const targetId  = req.params.id;

    // Only allow self-update unless Super Admin
    if (targetId !== selfId && req.admin.role !== 'Super Admin') {
      return res.status(403).json({
        message: 'You can only update your own profile unless you are a Super Admin',
      });
    }

    // ── Find account in the correct collection ──
    let account = null;
    let isUserAccount = false;

    if (isUser) {
      // Logged-in account is a User — look in User collection
      account = await User.findById(targetId);
      isUserAccount = true;
    } else {
      // Logged-in account is an Admin — look in Admin collection first
      account = await Admin.findById(targetId);
      if (!account) {
        // Super Admin updating a user's profile — fall back to User collection
        account = await User.findById(targetId);
        isUserAccount = !!account;
      }
    }

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // ── Snapshot BEFORE update ──
    const beforeName           = account.name;
    const beforeProfilePicture = account.profilePicture;

    // ── Allowed fields ──
    const allowedUpdates = ['name', 'profilePicture'];
    if (req.admin.role === 'Super Admin' && !isUserAccount) {
      allowedUpdates.push('role', 'isActive');
    }

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        account[key] = req.body[key];
      }
    });

    await account.save();

    // ── Return updated account without password ──
    const Model   = isUserAccount ? User : Admin;
    const updated = await Model.findById(account._id).select('-password');

    // ── Detect what changed ──
    const nameChanged    = req.body.name           !== undefined && req.body.name           !== beforeName;
    const pictureChanged = req.body.profilePicture !== undefined && req.body.profilePicture !== beforeProfilePicture;

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';

    if (nameChanged) {
      await ActivityLog.create({
        adminId:        req.admin._id,
        name:           updated.name,
        email:          updated.email,
        role:           updated.role,
        profilePicture: updated.profilePicture,
        action:         'Updated Name',
        module:         'Settings',
        changes: {
          before: { name: beforeName },
          after:  { name: updated.name },
        },
        ipAddress,
      });
    }

    if (pictureChanged) {
      await ActivityLog.create({
        adminId:        req.admin._id,
        name:           updated.name,
        email:          updated.email,
        role:           updated.role,
        profilePicture: updated.profilePicture,
        action:         'Updated Profile Picture',
        module:         'Settings',
        changes: {
          before: { profilePicture: beforeProfilePicture },
          after:  { profilePicture: updated.profilePicture },
        },
        ipAddress,
      });
    }

    res.json({
      message: 'Profile updated successfully',
      admin: updated,
    });

  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/:id/password
// @desc    Change admin password
// @access  Private (Self only)
router.put('/:id/password', auth, async (req, res) => {
  try {
    if (req.params.id !== req.admin._id.toString()) {
      return res.status(403).json({ message: 'You can only change your own password' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current password and new password' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/:id
// @desc    Delete admin
// @access  Private (Super Admin only)
router.delete('/:id', auth, checkRole('Super Admin'), async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   CONNECT OUTLOOK OTP ROUTES
   ✅ Dedicated routes — completely separate from profile-otp
      and change-password-otp to prevent wrong email subject
      and double-send bugs.

   Flow:
     1. POST /api/admin/change-password/send-connect-outlook-otp
        → Generates OTP, sends "Connect Outlook Verification" email
     2. POST /api/admin/change-password/verify-connect-outlook-otp
        → Validates OTP (one-time use, expires in 10 min)
        → Frontend then calls /api/outlook/auth/start to redirect to Microsoft OAuth
══════════════════════════════════════════════════════════════ */

// ── In-memory OTP store: { email → { otp, expiresAt } }
// If your project already stores OTPs in the DB (e.g. in the Admin model),
// replace the Map with your existing DB pattern.
const connectOutlookOtpStore = new Map();

// Adjust this path to match where emailService.js lives in your project
const emailService = require('../services/emailService');

// POST /api/admin/change-password/send-connect-outlook-otp
router.post('/change-password/send-connect-outlook-otp', auth, async (req, res) => {
  try {
    const account = req.admin;
    if (!account?.email) return res.status(400).json({ message: 'No email found for this account.' });

    // Generate 6-digit OTP
    const otp     = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store (overwrites any existing pending OTP for this email)
    connectOutlookOtpStore.set(account.email, { otp, expiresAt: expires });

    // ✅ Uses dedicated "Connect Outlook Verification" email — not profile-update
    await emailService.sendConnectOutlookOTP(account.email, account.name || account.email, otp);

    console.log(`[send-connect-outlook-otp] OTP sent to ${account.email}`);
    res.json({ message: 'OTP sent.' });
  } catch (err) {
    console.error('[send-connect-outlook-otp]', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/admin/change-password/verify-connect-outlook-otp
router.post('/change-password/verify-connect-outlook-otp', auth, async (req, res) => {
  try {
    const { otp }  = req.body;
    const account  = req.admin;

    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    const stored = connectOutlookOtpStore.get(account.email);

    if (!stored) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      connectOutlookOtpStore.delete(account.email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (stored.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // ✅ One-time use — delete immediately after successful verification
    connectOutlookOtpStore.delete(account.email);

    console.log(`[verify-connect-outlook-otp] OTP verified for ${account.email}`);
    res.json({ message: 'OTP verified.' });
  } catch (err) {
    console.error('[verify-connect-outlook-otp]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;