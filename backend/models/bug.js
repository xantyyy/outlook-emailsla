const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  emailId: {
    type: String, unique: true, sparse: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Urgent', 'High', 'Normal', 'Low'],
    default: 'Normal'
  },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'Database', 'API', 'UI/UX', 'Performance', 'Security', 'Other'],
    default: 'Other'
  },
  reportedBy: {
    name:  { type: String, required: true },
    email: { type: String, required: true },
    role:  { type: String, default: 'User' }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    default: null,
  },
  screenshots: [{
    url: String, publicId: String, uploadedAt: { type: Date, default: Date.now }
  }],
  stepsToReproduce: { type: String, default: '' },
  expectedBehavior: { type: String, default: '' },
  actualBehavior:   { type: String, default: '' },
  environment: {
    browser: String, os: String, deviceType: String, screenResolution: String
  },
  comments: [{
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    authorName: String,
    message:    String,
    createdAt:  { type: Date, default: Date.now }
  }],
  tags:       [String],
  resolvedAt: { type: Date, default: null },
  closedAt:   { type: Date, default: null },
  receivedDateTime: { type: Date, default: null },
  startedAt:   { type: Date, default: null },
  slaHours:    { type: Number, default: null },
  slaDeadline: { type: Date, default: null },
  invalidReason: { type: String, default: null },

  // ── Archive fields ──────────────────────────────────
  archived:   { type: Boolean, default: false },
  archivedAt: { type: Date,    default: null },
  archivedBy: { type: String,  default: null },

  source: { type: String, enum: ['outlook', 'manual'], default: 'manual' },

}, { timestamps: true });

bugSchema.index({ status: 1 });
bugSchema.index({ severity: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ createdAt: -1 });
bugSchema.index({ emailId: 1 });
bugSchema.index({ slaDeadline: 1 });
bugSchema.index({ acceptedBy: 1 });
bugSchema.index({ archived: 1 });

module.exports = mongoose.model('Bug', bugSchema);