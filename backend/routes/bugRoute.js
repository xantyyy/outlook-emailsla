const express = require('express');
const router  = express.Router();
const Bug     = require('../models/bug');
const { auth } = require('../middleware/auth');
const { fetchBugReportsFromOutlook, fetchEmailAttachments } = require('../services/graphService');
const { parseEmailToBug }            = require('../utils/emailParser');

// SLA hours must match SLA_UPDATE_INTERVAL in BugReportModal.js and emailParser.js
const SLA_HOURS = { Critical: 4, High: 8, Medium: 8, Low: 24 };

const isSuperAdmin = (req) => req.decoded?.accountType === 'admin';

// ─────────────────────────────────────────────
// POST /api/bugs/sync
// ─────────────────────────────────────────────
router.post('/sync', auth, async (req, res) => {
  try {
    const emails = await fetchBugReportsFromOutlook();
    const newBugs = [], existingBugs = [], errors = [];
    for (const email of emails) {
      try {
        const existingBug = await Bug.findOne({ emailId: email.id });
        if (existingBug) { existingBugs.push(existingBug); continue; }
        const bugData = parseEmailToBug(email);
        const bug = new Bug(bugData);
        await bug.save();
        newBugs.push(bug);
      } catch (error) {
        errors.push({ emailId: email.id, subject: email.subject, error: error.message });
      }
    }
    res.json({
      success: true,
      message: `Synced ${newBugs.length} new bug reports`,
      summary: { totalEmails: emails.length, newBugs: newBugs.length, existingBugs: existingBugs.length, errors: errors.length },
      newBugs, errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sync', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs/pending
// ─────────────────────────────────────────────
router.get('/pending', auth, async (req, res) => {
  try {
    const filter = { status: { $in: ['Open', 'Reopened'] }, archived: { $ne: true } };
    if (!isSuperAdmin(req)) filter.acceptedBy = null;
    const pendingBugs = await Bug.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(pendingBugs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs/archived  ← NEW: fetch archived bugs for Archive page
// IMPORTANT: must be defined BEFORE /:id to avoid Express matching 'archived' as an ID
// ─────────────────────────────────────────────
router.get('/archived', auth, async (req, res) => {
  try {
    const {
      search, severity, status,
      page = 1, limit = 100, sortBy = 'archivedAt', sortOrder = 'desc',
    } = req.query;

    const filter = { archived: true };

    if (!isSuperAdmin(req)) {
      filter.acceptedBy = req.user._id;
    }

    if (severity) filter.severity = severity;
    if (status)   filter.status   = status;
    if (search) {
      filter.$or = [
        { title:              { $regex: search, $options: 'i' } },
        { description:        { $regex: search, $options: 'i' } },
        { 'reportedBy.name':  { $regex: search, $options: 'i' } },
        { 'reportedBy.email': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const bugs = await Bug.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture')
      .sort(sort).skip(skip).limit(parseInt(limit));

    const total = await Bug.countDocuments(filter);

    res.json({ bugs, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const {
      status, severity, priority, category, search,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
      dateFrom, dateTo,
    } = req.query;

    // Always exclude archived bugs from the main list
    const filter = { archived: { $ne: true } };

    if (!isSuperAdmin(req)) {
      filter.acceptedBy = req.user._id;
    }

    if (status)   filter.status   = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    if (search) {
      filter.$or = [
        { title:              { $regex: search, $options: 'i' } },
        { description:        { $regex: search, $options: 'i' } },
        { 'reportedBy.name':  { $regex: search, $options: 'i' } },
        { 'reportedBy.email': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const bugs = await Bug.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture')
      .sort(sort).skip(skip).limit(parseInt(limit));

    const total = await Bug.countDocuments(filter);

    res.json({
      bugs, total,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs/stats
// ─────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const bf = isSuperAdmin(req)
      ? { archived: { $ne: true } }
      : { acceptedBy: req.user._id, archived: { $ne: true } };

    const stats = {
      total: await Bug.countDocuments(bf),
      byStatus: {
        open:       await Bug.countDocuments({ ...bf, status: 'Open' }),
        inProgress: await Bug.countDocuments({ ...bf, status: 'In Progress' }),
        resolved:   await Bug.countDocuments({ ...bf, status: 'Resolved' }),
        closed:     await Bug.countDocuments({ ...bf, status: 'Closed' }),
        reopened:   await Bug.countDocuments({ ...bf, status: 'Reopened' }),
      },
      bySeverity: {
        critical: await Bug.countDocuments({ ...bf, severity: 'Critical' }),
        high:     await Bug.countDocuments({ ...bf, severity: 'High' }),
        medium:   await Bug.countDocuments({ ...bf, severity: 'Medium' }),
        low:      await Bug.countDocuments({ ...bf, severity: 'Low' }),
      },
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs/:id/attachments  ← LAZY — only called when user opens a report
// Fetches image attachments from Outlook on-demand so sync stays fast.
// Returns: [{ id, name, contentType, size, contentBytes (base64) }]
// ─────────────────────────────────────────────
router.get('/:id/attachments', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id).select('emailId hasAttachments');
    if (!bug)              return res.status(404).json({ message: 'Bug not found' });
    if (!bug.emailId)      return res.json({ attachments: [] });
    if (!bug.hasAttachments) return res.json({ attachments: [] });

    const attachments = await fetchEmailAttachments(bug.emailId);
    res.json({ attachments });
  } catch (error) {
    // Non-critical — return empty rather than breaking the detail view
    console.error('Attachment fetch error:', error.message);
    res.json({ attachments: [] });
  }
});

// ─────────────────────────────────────────────
// GET /api/bugs/:id
// ─────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture')
      .populate('comments.author', 'name email');

    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    if (!isSuperAdmin(req)) {
      const acceptedById = bug.acceptedBy?._id?.toString() || bug.acceptedBy?.toString();
      if (acceptedById !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    res.json(bug);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/bugs
// ─────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const bug = new Bug({
      ...req.body,
      reportedBy: { name: req.user.name, email: req.user.email, role: req.user.role },
    });
    await bug.save();
    res.status(201).json({ message: 'Bug created successfully', bug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/bugs/:id/archive  ← UPDATED: uses archived field
// ─────────────────────────────────────────────
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    bug.archived   = true;
    bug.archivedAt = new Date();
    // store the name of who archived it (works for both admin and user tokens)
    bug.archivedBy = req.admin?.name || req.user?.name || 'Unknown';

    await bug.save();

    console.log(`📦 Bug archived: "${bug.title}" by ${bug.archivedBy}`);
    res.json({ message: 'Bug archived successfully', bug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/bugs/:id/restore  ← NEW: restore from archive
// ─────────────────────────────────────────────
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    bug.archived   = false;
    bug.archivedAt = null;
    bug.archivedBy = null;

    await bug.save();

    const restoredBy = req.admin?.name || req.user?.name || 'Unknown';
    console.log(`♻️  Bug restored: "${bug.title}" by ${restoredBy}`);
    res.json({ message: 'Bug restored successfully', bug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/bugs/:id/confirm
// ─────────────────────────────────────────────
router.patch('/:id/confirm', auth, async (req, res) => {
  try {
    const { status, priority, severity, notes, assignedTo, slaHours } = req.body;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    const oldStatus = bug.status;

    if (status)     bug.status     = status;
    if (priority)   bug.priority   = priority;
    if (severity)   bug.severity   = severity;
    if (assignedTo) bug.assignedTo = assignedTo;

    if (status === 'In Progress') {
      const hours     = slaHours || SLA_HOURS[severity] || SLA_HOURS[bug.severity] || 8;
      const now       = new Date();
      bug.startedAt   = now;
      bug.slaHours    = hours;
      bug.slaDeadline = new Date(now.getTime() + hours * 60 * 60 * 1000);
      bug.invalidReason = null;
      bug.acceptedBy  = req.user._id;
      if (notes?.trim()) {
        bug.comments.push({ authorName: req.user.name, author: req.user._id, message: `Confirmed: ${notes.trim()}`, createdAt: new Date() });
      }
    }

    if (status === 'Closed') {
      bug.invalidReason = notes?.trim() || 'Closed as invalid';
      bug.closedAt      = new Date();
      bug.startedAt     = null;
      bug.slaHours      = null;
      bug.slaDeadline   = null;
    }

    await bug.save();

    if (global.notificationService) {
      global.notificationService.notifyBugStatusChange(bug, oldStatus, status);
    }

    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture');

    res.json({ message: 'Bug updated successfully', bug: updatedBug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/bugs/:id/status
// ─────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found.' });

    const oldStatus = bug.status;
    bug.status = req.body.status;
    if (req.body.status === 'Resolved') bug.resolvedAt = new Date();
    if (req.body.status === 'Closed')   bug.closedAt   = new Date();

    await bug.save();

    if (global.notificationService) {
      global.notificationService.notifyBugStatusChange(bug, oldStatus, req.body.status);
    }

    return res.json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// PUT /api/bugs/:id
// ─────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') bug[key] = req.body[key];
    });

    if (req.body.status === 'Resolved' && !bug.resolvedAt) bug.resolvedAt = new Date();
    if (req.body.status === 'Closed'   && !bug.closedAt)   bug.closedAt   = new Date();

    await bug.save();

    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role')
      .populate('acceptedBy', 'name email role profilePicture');

    res.json({ message: 'Bug updated successfully', bug: updatedBug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/bugs/:id
// ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });
    await Bug.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bug deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/bugs/:id/comments
// ─────────────────────────────────────────────
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ message: 'Bug not found' });

    bug.comments.push({
      author: req.user._id, authorName: req.user.name,
      message: req.body.message, createdAt: new Date(),
    });

    await bug.save();

    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email');

    res.json({ message: 'Comment added successfully', bug: updatedBug });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;