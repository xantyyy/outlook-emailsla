const express = require('express');
const router  = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
  getActivityLogs,
  getActivityLogById,
  clearActivityLogs,
} = require('../controllers/activityLogController');

// GET    /api/activity-logs        — list all (paginated + filtered)
router.get('/',    auth, checkRole('Super Admin', 'Innovation'), getActivityLogs);

// GET    /api/activity-logs/:id    — single log with before/after
router.get('/:id', auth, checkRole('Super Admin', 'Innovation'), getActivityLogById);

// DELETE /api/activity-logs        — clear all logs
router.delete('/', auth, checkRole('Super Admin'), clearActivityLogs);

module.exports = router;