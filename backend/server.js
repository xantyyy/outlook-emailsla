const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const NotificationService          = require('./services/notificationService');
const { startIdleSessionCron }     = require('./services/idleSessionCron');
dotenv.config();

// ── NEW IMPORTS ────────────────────────────────────────────────────────────────
const { initSocketServer }           = require('./services/socketService');
const { startSlaCron }               = require('./services/slaCron');
const { subscribeAllConnectedUsers } = require('./services/graphService');
// ──────────────────────────────────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);

// ── CORS — strip any accidental path from FRONTEND_URL ────────────────────────
function getSafeOrigin(raw) {
  try {
    const url = new URL(raw || 'http://localhost:3000');
    return url.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

const ALLOWED_ORIGIN = getSafeOrigin(process.env.FRONTEND_URL);
console.log(`🌐 CORS allowed origin: ${ALLOWED_ORIGIN}`);

app.use(cors({
  origin:      ALLOWED_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Socket.io (must be before routes) ─────────────────────────────────────────
initSocketServer(server); // sets global.io

// ── Database Connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    startIdleSessionCron();

    // Start background jobs AFTER DB is ready
    startSlaCron();

    // Re-subscribe all connected Outlook users on boot
    // (Graph subscriptions are lost when the server restarts)
    await subscribeAllConnectedUsers().catch(err =>
      console.error('[boot] subscribeAllConnectedUsers failed:', err.message)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// ── Notification / email monitor (unchanged) ──────────────────────────────────
const bugRoutes           = require('./routes/bugRoute');
const notificationService = new NotificationService(server);
global.notificationService = notificationService;
const EmailMonitor = require('./services/emailMonitor');
const emailMonitor = new EmailMonitor(notificationService);
emailMonitor.startMonitoring(1);

// ── Existing routes (unchanged) ───────────────────────────────────────────────
app.use('/api/auth',                  require('./routes/authRoute'));
app.use('/api/admin/change-password', require('./routes/changePasswordRoute'));
app.use('/api/admin',                 require('./routes/adminRoute'));
app.use('/api/users',                 require('./routes/userRoute'));
app.use('/api/auth',                  require('./routes/passwordResetRoute'));
app.use('/api/bugs',                  bugRoutes);
app.use('/api/outlook',               require('./routes/outlookRoute'));
app.use('/api/email',                 require('./routes/emailRoute'));
app.use('/api/activity-logs',         require('./routes/activityLogRoute'));
app.use('/api/notifications',         require('./routes/Notificationroute'));

// ── NEW routes ─────────────────────────────────────────────────────────────────
app.use('/api/webhooks', require('./routes/webhookRoute')); // Graph change notifications
app.use('/api/tickets',  require('./routes/ticketRoute'));  // Ticket CRUD + status updates

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    message:   'Bug Reporting API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path:    req.originalUrl,
  });
});

// ── Error Handling Middleware ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error:   process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;