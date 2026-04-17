const User        = require('../models/user');
const Admin       = require('../models/admin');
const ActivityLog = require('../models/activityLog'); // adjust path if needed

// ── Employee Number format: TX####-###### ──
const EMP_NO_REGEX = /^TX\d{4}-\d{6}$/;

// ── Frontend role ID → MongoDB enum value ──
const ROLE_MAP = {
  innovation:  'Innovation',
  audit:       'Audit and Compliance',
  hr:          'Human Resource',
  accounting:  'Accounting',
  recruitment: 'Recruitment',
  creatives:   'Creatives',
  marketing:   'Marketing',
  operations:  'Operations',
  user:        'User',
};

// ─────────────────────────────────────────────
// @route   POST /api/users/create
// @desc    Create a new user (saved to 'users' collection)
// @access  Private — Super Admin, Innovation
// ─────────────────────────────────────────────
exports.createUser = async (req, res) => {
  try {
    const { name, firstName, middleName, surname, email, phone, employeeNumber, role, password } = req.body;

    if (!name || !email || !role || !password || !employeeNumber) {
      return res.status(400).json({ message: 'Name, email, employee number, role, and password are required.' });
    }
    if (!EMP_NO_REGEX.test(employeeNumber.trim())) {
      return res.status(400).json({ message: 'Invalid employee number format. Must be TX####-###### (e.g. TX1234-678910).' });
    }

    const dbRole     = ROLE_MAP[role] || role;
    const validRoles = Object.values(ROLE_MAP);
    if (!validRoles.includes(dbRole)) {
      return res.status(400).json({ message: `Invalid role: "${role}". Must be one of: ${validRoles.join(', ')}` });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) return res.status(409).json({ message: 'An account with this email already exists.' });

    const existingEmpNo = await User.findOne({ employeeNumber: employeeNumber.trim() });
    if (existingEmpNo) return res.status(409).json({ message: 'Employee number is already in use.' });

    const newUser = new User({
      employeeNumber: employeeNumber.trim(),
      name:           name.trim(),
      firstName:      firstName?.trim()  || '',
      middleName:     middleName?.trim() || '',
      surname:        surname?.trim()    || '',
      email:          email.toLowerCase().trim(),
      phone:          phone?.trim()      || '',
      role:           dbRole,
      password,
    });

    await newUser.save();
    const savedUser = newUser.toObject();
    delete savedUser.password;

    console.log(`✅ New user created: ${savedUser.email} | Role: ${savedUser.role} | EmpNo: ${savedUser.employeeNumber}`);
    return res.status(201).json({ message: 'User account created successfully.', user: savedUser });

  } catch (error) {
    console.error('❌ createUser error:', error.message);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        message: field === 'employeeNumber'
          ? 'Employee number is already in use.'
          : 'An account with this email already exists.',
      });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/users
// @desc    Get all users
// @access  Private — Super Admin, Innovation, Admin
// ─────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isArchived: { $ne: true } }).select('-password').sort({ createdAt: -1 });
    const roleCounts = {};
    users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
    return res.json({ users, total: users.length, roleCounts });
  } catch (error) {
    console.error('❌ getAllUsers error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/users/:id/status
// @desc    Toggle user active/inactive status
//          Requires: adminPassword (of the operator), reason (if deactivating)
// @access  Private — Super Admin, Innovation
// ─────────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id }                                              = req.params;
    const { isActive, reason, activationReason, adminPassword } = req.body;

    // ── 1. Require admin password ──
    if (!adminPassword) {
      return res.status(400).json({ message: 'Your password is required to perform this action.' });
    }

    // ── 2. Verify the operator's password (support both Admin + User accounts) ──
    const operatorId      = req.decoded?.id || req.admin?._id;
    const operatorAccount = req.decoded?.accountType === 'user'
      ? await User.findById(operatorId)
      : await Admin.findById(operatorId);

    if (!operatorAccount) {
      return res.status(401).json({ message: 'Operator account not found.' });
    }

    const passwordMatch = await operatorAccount.comparePassword(adminPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    // ── 3. Find the target user ──
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // ── 4. Require reason when deactivating ──
    if (isActive === false && (!reason || !reason.trim())) {
      return res.status(400).json({ message: 'A reason is required when deactivating an account.' });
    }

    // ── 5. Apply update ──
    targetUser.isActive = isActive !== undefined ? Boolean(isActive) : targetUser.isActive;
    targetUser.inactiveReason = isActive === false
      ? reason.trim()
      : '';  // clear reason when re-activating

    // Track activation reason + history
    if (isActive === true) {
      const actReason = (activationReason || '').trim();
      targetUser.activationReason = actReason;
      if (!Array.isArray(targetUser.activationHistory)) targetUser.activationHistory = [];
      targetUser.activationHistory.push({
        reason:      actReason,
        activatedBy: operatorAccount.name || operatorAccount.email,
        activatedAt: new Date(),
      });
    }

    // Track deactivation reason + history
    if (isActive === false) {
      if (!Array.isArray(targetUser.deactivationHistory)) targetUser.deactivationHistory = [];
      targetUser.deactivationHistory.push({
        reason:       reason.trim(),
        deactivatedBy: operatorAccount.name || operatorAccount.email,
        deactivatedAt: new Date(),
      });
    }

    await targetUser.save();

    const updatedUser = targetUser.toObject();
    delete updatedUser.password;

    console.log(`✅ User ${updatedUser.email} status → ${updatedUser.isActive ? 'Active' : 'Inactive'} by ${operatorAccount.email}`);

    // ── 6. Record activity log ──────────────────────────────────────────────
    try {
      const actionLabel = updatedUser.isActive ? 'Activated User' : 'Deactivated User';

      await ActivityLog.create({
        // Who performed the action (the admin/operator)
        adminId:        operatorAccount._id,
        name:           operatorAccount.name,
        email:          operatorAccount.email,
        role:           operatorAccount.role || 'Admin',
        profilePicture: operatorAccount.profilePicture || '',

        // What was done
        action:  actionLabel,
        module:  'User Management',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',

        // Who was affected (shown in the detail modal banner)
        targetUser: {
          name:           updatedUser.name,
          email:          updatedUser.email,
          role:           updatedUser.role,
          profilePicture: updatedUser.profilePicture || '',
          reason:         isActive === false ? reason.trim() : '',
          activationReason: isActive === true ? (activationReason || '').trim() : '',
        },
      });
    } catch (logErr) {
      // Log failure should NOT block the main response
      console.error('⚠️  Activity log error (non-fatal):', logErr.message);
    }
    // ───────────────────────────────────────────────────────────────────────

    return res.json({
      message: `User account ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully.`,
      user:    updatedUser,
    });

  } catch (error) {
    console.error('❌ toggleUserStatus error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// ─────────────────────────────────────────────
// @route   PATCH /api/users/:id/archive
// @desc    Archive an inactive user account (soft-delete with isArchived flag)
//          Requires: adminPassword of the operator
// @access  Private — Super Admin, Innovation
// ─────────────────────────────────────────────
exports.archiveUser = async (req, res) => {
  try {
    const { id }            = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ message: 'Your password is required to perform this action.' });
    }

    const operatorId      = req.decoded?.id || req.admin?._id;
    const operatorAccount = req.decoded?.accountType === 'user'
      ? await User.findById(operatorId)
      : await Admin.findById(operatorId);

    if (!operatorAccount) {
      return res.status(401).json({ message: 'Operator account not found.' });
    }

    const passwordMatch = await operatorAccount.comparePassword(adminPassword);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (targetUser.isActive !== false) {
      return res.status(400).json({ message: 'Only inactive accounts can be archived. Please deactivate the account first.' });
    }

    targetUser.isArchived = true;
    targetUser.archivedAt = new Date();
    targetUser.archivedBy = operatorAccount.name || operatorAccount.email;
    targetUser.isLoggedIn = false;

    await targetUser.save();

    const archivedUser = targetUser.toObject();
    delete archivedUser.password;

    console.log(`📦 User archived: ${archivedUser.email} by ${operatorAccount.email}`);

    try {
      await ActivityLog.create({
        adminId:        operatorAccount._id,
        name:           operatorAccount.name,
        email:          operatorAccount.email,
        role:           operatorAccount.role || 'Admin',
        profilePicture: operatorAccount.profilePicture || '',
        action:         'Archive',
        module:         'User Management',
        ipAddress:      req.ip || req.headers['x-forwarded-for'] || '',
        targetUser: {
          name:           archivedUser.name,
          email:          archivedUser.email,
          role:           archivedUser.role,
          profilePicture: archivedUser.profilePicture || '',
          reason:         archivedUser.inactiveReason || '',
        },
      });
    } catch (logErr) {
      console.error('⚠️  Activity log error (non-fatal):', logErr.message);
    }

    return res.json({ message: 'User account archived successfully.', user: archivedUser });

  } catch (error) {
    console.error('❌ archiveUser error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/users/archived
// @desc    Get all archived users
// @access  Private — Super Admin, Innovation
// ─────────────────────────────────────────────
exports.getArchivedUsers = async (req, res) => {
  try {
    const users = await User.find({ isArchived: true }).select('-password').sort({ archivedAt: -1 });
    return res.json({ users, total: users.length });
  } catch (error) {
    console.error('❌ getArchivedUsers error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/users/:id/restore-archive
// @desc    Restore an archived user (un-archive, keep inactive until manually activated)
// @access  Private — Super Admin, Innovation
// ─────────────────────────────────────────────
exports.restoreArchivedUser = async (req, res) => {
  try {
    const { id }            = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ message: 'Your password is required.' });
    }

    const operatorId      = req.decoded?.id || req.admin?._id;
    const operatorAccount = req.decoded?.accountType === 'user'
      ? await User.findById(operatorId)
      : await Admin.findById(operatorId);

    if (!operatorAccount) return res.status(401).json({ message: 'Operator not found.' });

    const passwordMatch = await operatorAccount.comparePassword(adminPassword);
    if (!passwordMatch) return res.status(401).json({ message: 'Incorrect password.' });

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    targetUser.isArchived = false;
    targetUser.archivedAt = null;
    targetUser.archivedBy = '';

    await targetUser.save();
    const restoredUser = targetUser.toObject();
    delete restoredUser.password;

    console.log(`♻️  User restored: ${restoredUser.email} by ${operatorAccount.email}`);

    return res.json({ message: 'User restored. Account is inactive — activate to restore access.', user: restoredUser });

  } catch (error) {
    console.error('❌ restoreArchivedUser error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/users/:id
// @desc    Get a single user by ID (includes full history arrays)
// @access  Private — Super Admin, Innovation, Admin
// ─────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  } catch (error) {
    console.error('❌ getUserById error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};