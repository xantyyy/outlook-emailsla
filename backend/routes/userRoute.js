const express = require('express');
const router  = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { createUser, getAllUsers, toggleUserStatus } = require('../controllers/userController');
const { archiveUser, getArchivedUsers, restoreArchivedUser, getUserById } = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users + live role counts (excludes archived)
// @access  Private (Super Admin, Innovation, Admin)
router.get('/', auth, checkRole('Super Admin', 'Innovation', 'Admin'), getAllUsers);

// @route   GET /api/users/archived
// @desc    Get all archived users
// @access  Private (Super Admin, Innovation)
router.get('/archived', auth, checkRole('Super Admin', 'Innovation'), getArchivedUsers);

// @route   GET /api/users/:id
// @desc    Get a single user by ID — includes full activationHistory & deactivationHistory
// @access  Private (Super Admin, Innovation, Admin)
router.get('/:id', auth, checkRole('Super Admin', 'Innovation', 'Admin'), getUserById);

// @route   POST /api/users/create
// @desc    Create a new user account
// @access  Private (Super Admin, Innovation)
router.post('/create', auth, checkRole('Super Admin', 'Innovation'), createUser);

// @route   PATCH /api/users/:id/status
// @desc    Toggle user active / inactive — requires adminPassword + reason
// @access  Private (Super Admin, Innovation)
router.patch('/:id/status', auth, checkRole('Super Admin', 'Innovation'), toggleUserStatus);

// @route   PATCH /api/users/:id/archive
// @desc    Archive an inactive user account — requires adminPassword
// @access  Private (Super Admin, Innovation)
router.patch('/:id/archive', auth, checkRole('Super Admin', 'Innovation'), archiveUser);

// @route   PATCH /api/users/:id/restore-archive
// @desc    Restore a user from archive (keeps inactive status)
// @access  Private (Super Admin, Innovation)
router.patch('/:id/restore-archive', auth, checkRole('Super Admin', 'Innovation'), restoreArchivedUser);

module.exports = router;