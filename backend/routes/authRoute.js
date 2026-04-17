const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/user');
const ActivityLog = require('../models/activityLog');
const { auth } = require('../middleware/auth');

const getIp = (req) => req.ip || req.headers['x-forwarded-for'] || '';

// @route   POST /api/auth/register
// @desc    Register new admin
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    const admin = new Admin({ name, email, password, role: role || 'Admin' });
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, accountType: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        accountType: 'admin',
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login – checks admins collection first, then users collection
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // ── Verify Cloudflare Turnstile CAPTCHA ──
    if (!captchaToken) {
      return res.status(400).json({ message: 'CAPTCHA verification is required.' });
    }

    const captchaVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret:   process.env.TURNSTILE_SECRET_KEY,
        response: captchaToken,
      }),
    });
    const captchaResult = await captchaVerify.json();

    if (!captchaResult.success) {
      console.warn('❌ CAPTCHA failed:', captchaResult['error-codes']);
      return res.status(400).json({ message: 'CAPTCHA verification failed. Please try again.' });
    }

    console.log('✅ CAPTCHA verified successfully');

    // ── Step 1: Check admins collection first ──
    const admin = await Admin.findOne({ email });

    if (admin) {
      if (!admin.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // ✅ Mark as logged in — use findByIdAndUpdate to avoid triggering password re-hash
      await Admin.findByIdAndUpdate(admin._id, { isLoggedIn: true, lastLogin: new Date() });

      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: admin.role, accountType: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      try {
        await ActivityLog.create({
          adminId:        admin._id,
          name:           admin.name,
          email:          admin.email,
          role:           admin.role,
          profilePicture: admin.profilePicture || '',
          action:         'User Login',
          module:         'Auth',
          changes:        { before: null, after: null },
          ipAddress:      getIp(req),
        });
        console.log('🟢 Login log created for:', admin.email);
      } catch (logErr) {
        console.error('🔴 ActivityLog.create() FAILED:', logErr.message);
      }

      return res.json({
        message: 'Login successful',
        token,
        admin: {
          id:             admin._id,
          name:           admin.name,
          email:          admin.email,
          role:           admin.role,
          accountType:    'admin',
          profilePicture: admin.profilePicture,
        }
      });
    }

    // ── Step 2: Check users collection ──
    const user = await User.findOne({ email });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // ✅ Mark as logged in — use findByIdAndUpdate to avoid triggering password re-hash
      await User.findByIdAndUpdate(user._id, { isLoggedIn: true, lastLogin: new Date() });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role, accountType: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      try {
        await ActivityLog.create({
          adminId:        user._id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          profilePicture: user.profilePicture || '',
          action:         'User Login',
          module:         'Auth',
          changes:        { before: null, after: null },
          ipAddress:      getIp(req),
        });
        console.log('🟢 Login log created for:', user.email);
      } catch (logErr) {
        console.error('🔴 ActivityLog.create() FAILED:', logErr.message);
      }

      return res.json({
        message: 'Login successful',
        token,
        admin: {
          id:             user._id,
          name:           user.name,
          email:          user.email,
          role:           user.role,
          accountType:    'user',
          profilePicture: user.profilePicture || '',
        }
      });
    }

    // ── Step 3: Not found in either collection ──
    return res.status(400).json({ message: 'Invalid credentials' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout – log the activity + mark isLoggedIn = false
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // ✅ Use req.decoded from auth middleware — guaranteed correct accountType
    const accountType = req.decoded?.accountType || 'admin';
    const accountId   = req.decoded?.id || req.admin._id;

    if (accountType === 'user') {
      await User.findByIdAndUpdate(accountId, { isLoggedIn: false });
      console.log(`🟢 User isLoggedIn = false for: ${req.admin.email}`);
    } else {
      await Admin.findByIdAndUpdate(accountId, { isLoggedIn: false });
      console.log(`🟢 Admin isLoggedIn = false for: ${req.admin.email}`);
    }

    // reason: 'timeout' = browser open idle, 'closed_browser' = browser closed
    const reason = req.body?.reason || 'manual';
    const actionMap = {
      timeout:        'Session Timeout',
      closed_browser: 'Auto Logout (Closed Browser)',
      manual:         'User Logout',
    };
    const action = actionMap[reason] || 'User Logout';

    try {
      await ActivityLog.create({
        adminId:        req.admin._id,
        name:           req.admin.name,
        email:          req.admin.email,
        role:           req.admin.role,
        profilePicture: req.admin.profilePicture || '',
        action,
        module:         'Auth',
        changes:        { before: null, after: null },
        ipAddress:      getIp(req),
      });
      console.log('🟢 Logout log created:', req.admin.email, '| reason:', reason);
    } catch (logErr) {
      console.error('🔴 Logout ActivityLog FAILED:', logErr.message);
    }

    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in account
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      admin: {
        id:             req.admin._id,
        name:           req.admin.name,
        email:          req.admin.email,
        role:           req.admin.role,
        accountType:    req.admin.accountType || 'admin',
        profilePicture: req.admin.profilePicture,
        isActive:       req.admin.isActive,
        lastLogin:      req.admin.lastLogin,
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/ping
// @desc    Heartbeat — updates lastActiveAt so the idle cron does not log them out
// @access  Private
router.post('/ping', auth, async (req, res) => {
  try {
    const accountType = req.decoded?.accountType || 'admin';
    const accountId   = req.decoded?.id || req.admin._id;
    const now         = new Date();

    // ── Check if this account was logged out by the cron or another tab ──
    // If isLoggedIn = false, return 403 so ALL open tabs detect it and redirect
    const Model   = accountType === 'user' ? User : Admin;
    const account = await Model.findById(accountId).select('isLoggedIn').lean();

    if (!account) {
      return res.status(401).json({ message: 'Account not found.' });
    }
    if (!account.isLoggedIn) {
      return res.status(403).json({ message: 'Session ended.' });
    }

    // Still logged in — update lastActiveAt
    await Model.findByIdAndUpdate(accountId, { lastActiveAt: now });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Ping error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;