const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const NotificationService = require('./services/notificationService');
const { startIdleSessionCron } = require('./services/idleSessionCron');
dotenv.config();

const app = express();
const server = http.createServer(app);

// ── CORS — strip any accidental path from FRONTEND_URL ──────────────────────
// If FRONTEND_URL is set to "http://localhost:3000/admin/messaging" by mistake,
// the CORS origin check would reject all requests from "http://localhost:3000".
// We parse it down to just the origin (protocol + host + port) to be safe.
function getSafeOrigin(raw) {
  try {
    const url = new URL(raw || 'http://localhost:3000');
    return url.origin; // e.g. "http://localhost:3000" — no path, no trailing slash
  } catch {
    return 'http://localhost:3000';
  }
}

const ALLOWED_ORIGIN = getSafeOrigin(process.env.FRONTEND_URL);
console.log(`🌐 CORS allowed origin: ${ALLOWED_ORIGIN}`);

app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true,
}));
// ────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => { console.log('✅ MongoDB Connected Successfully'); startIdleSessionCron(); })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const bugRoutes = require('./routes/bugRoute');
const notificationService = new NotificationService(server);
global.notificationService = notificationService;
const EmailMonitor = require('./services/emailMonitor');
const emailMonitor = new EmailMonitor(notificationService);
emailMonitor.startMonitoring(1);

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/admin/change-password', require('./routes/changePasswordRoute'));
app.use('/api/admin', require('./routes/adminRoute'));
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/auth', require('./routes/passwordResetRoute'));
app.use('/api/bugs', bugRoutes);
app.use('/api/outlook', require('./routes/outlookRoute'));
app.use('/api/email',   require('./routes/emailRoute'));
app.use('/api/activity-logs', require('./routes/activityLogRoute'));
app.use('/api/notifications', require('./routes/Notificationroute'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bug Reporting API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;