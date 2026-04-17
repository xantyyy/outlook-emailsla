const Bug = require('../models/Bug');

// ─────────────────────────────────────────────
// @route   PATCH /api/bugs/:bugId/confirm
// @desc    Confirm & Start Working OR Close as Invalid
// @access  Private
// ─────────────────────────────────────────────
exports.confirmBug = async (req, res) => {
  try {
    const { bugId }                          = req.params;
    const { status, priority, severity, notes } = req.body;

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ message: 'Bug not found.' });

    const oldStatus = bug.status;

    bug.status   = status;
    bug.priority = priority || bug.priority;
    bug.severity = severity || bug.severity;

    // ── Confirm & Start Working → record startedAt for 24hr timer ──
    if (status === 'In Progress') {
      bug.startedAt    = new Date();
      bug.invalidReason = null;
    }

    // ── Close as Invalid → record reason and closedAt ──
    if (status === 'Closed') {
      bug.invalidReason = notes?.trim() || 'Closed as invalid';
      bug.closedAt      = new Date();
      bug.startedAt     = null;
    }

    if (notes?.trim() && status === 'In Progress') {
      bug.comments.push({
        authorName: 'System',
        message:    notes.trim(),
        createdAt:  new Date(),
      });
    }

    await bug.save();

    // ── Real-time notification ──
    if (global.notificationService) {
      global.notificationService.notifyBugStatusChange(bug, oldStatus, status);
    }

    console.log(`✅ Bug ${status === 'In Progress' ? 'confirmed' : 'closed as invalid'}: ${bug.title}`);

    return res.json({ success: true, bug });

  } catch (error) {
    console.error('❌ confirmBug error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/bugs/:bugId/status
// @desc    Update bug status
// @access  Private
// ─────────────────────────────────────────────
exports.updateBugStatus = async (req, res) => {
  try {
    const { bugId }  = req.params;
    const { status } = req.body;

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ message: 'Bug not found.' });

    const oldStatus = bug.status;
    bug.status = status;

    if (status === 'Resolved') bug.resolvedAt = new Date();
    if (status === 'Closed')   bug.closedAt   = new Date();

    await bug.save();

    if (global.notificationService) {
      global.notificationService.notifyBugStatusChange(bug, oldStatus, status);
    }

    return res.json({ success: true, bug });

  } catch (error) {
    console.error('❌ updateBugStatus error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   PATCH /api/bugs/:bugId/assign
// @desc    Assign bug to admin
// @access  Private
// ─────────────────────────────────────────────
exports.assignBug = async (req, res) => {
  try {
    const { bugId }      = req.params;
    const { assignedTo } = req.body;

    const bug = await Bug.findById(bugId);
    if (!bug) return res.status(404).json({ message: 'Bug not found.' });

    bug.assignedTo = assignedTo;
    await bug.save();

    if (global.notificationService) {
      const User = require('../models/user');
      const user = await User.findById(assignedTo);
      if (user) global.notificationService.notifyBugAssignment(bug, user);
    }

    return res.json({ success: true, bug });

  } catch (error) {
    console.error('❌ assignBug error:', error.message);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};