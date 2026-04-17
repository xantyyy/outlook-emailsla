const ActivityLog = require('../models/activityLog');
const Admin       = require('../models/admin');
const User        = require('../models/user');

const getActivityLogs = async (req, res) => {
  try {
    const {
      search, action, module: mod, startDate, endDate,
      sort = 'newest', page = 1, limit = 8,
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (action) filter.action = action;
    if (mod)    filter.module = mod;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const sortOrder = sort === 'oldest' ? 1 : -1;
    const skip      = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: sortOrder }).skip(skip).limit(Number(limit)).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalActivities, activitiesToday, uniqueAdminIds, loginEvents, deleteActions] = await Promise.all([
      ActivityLog.countDocuments(),
      ActivityLog.countDocuments({ createdAt: { $gte: today } }),
      ActivityLog.distinct('adminId'),
      ActivityLog.countDocuments({ action: 'User Login' }),
      ActivityLog.countDocuments({ action: 'Deleted Bug Report' }),
    ]);

    // ✅ isLoggedIn: true = currently logged in lang
    // isActive: true = account enabled/disabled — hindi ito ginagamit dito
    const [activeAdmins, activeUserAccounts] = await Promise.all([
      Admin.find({ isLoggedIn: true }).select('-password').sort({ name: 1 }).lean(),
      User.find({ isLoggedIn: true }).select('-password').sort({ name: 1 }).lean(),
    ]);
    const activeUsers = [...activeAdmins, ...activeUserAccounts];

    return res.json({
      success: true,
      stats: { totalActivities, activitiesToday, uniqueUsers: uniqueAdminIds.length, loginEvents, deleteActions },
      activeUsers,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (err) {
    console.error('❌ getActivityLogs error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ success: false, message: 'Log not found.' });
    return res.json({ success: true, log });
  } catch (err) {
    console.error('❌ getActivityLogById error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const clearActivityLogs = async (req, res) => {
  try {
    await ActivityLog.deleteMany({});
    return res.json({ success: true, message: 'All activity logs cleared.' });
  } catch (err) {
    console.error('❌ clearActivityLogs error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getActivityLogs, getActivityLogById, clearActivityLogs };