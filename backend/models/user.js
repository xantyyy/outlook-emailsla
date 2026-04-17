const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    employeeNumber: {
      type:     String,
      required: [true, 'Employee number is required'],
      unique:   true,
      trim:     true,
      validate: {
        validator: (v) => /^TX\d{4}-\d{6}$/.test(v),
        message:   'Invalid format. Must be TX####-###### (e.g. TX1234-678910).',
      },
    },
    name:       { type: String, required: [true, 'Name is required'], trim: true },
    firstName:  { type: String, default: '', trim: true },
    middleName: { type: String, default: '', trim: true },
    surname:    { type: String, default: '', trim: true },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    phone: { type: String, default: '', trim: true },
    role: {
      type: String,
      enum: [
        'Innovation', 'Audit and Compliance', 'Human Resource',
        'Accounting', 'Recruitment', 'Creatives',
        'Marketing', 'Operations', 'User',
      ],
      required: [true, 'Role is required'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: 8,
    },
    isActive:          { type: Boolean, default: true  },
    inactiveReason:    { type: String,  default: ''    },
    activationReason:  { type: String,  default: ''    }, // ← reason when last activated
    activationHistory: {                                  // ← full activation log
      type: [{
        reason:     { type: String, default: '' },
        activatedBy:{ type: String, default: '' },
        activatedAt:{ type: Date,   default: Date.now },
      }],
      default: [],
    },
    deactivationHistory: {                                // ← full deactivation log
      type: [{
        reason:       { type: String, default: '' },
        deactivatedBy:{ type: String, default: '' },
        deactivatedAt:{ type: Date,   default: Date.now },
      }],
      default: [],
    },
    isArchived:     { type: Boolean, default: false },
    archivedAt:     { type: Date,    default: null  },
    archivedBy:     { type: String,  default: ''    },
    isLoggedIn:     { type: Boolean, default: false },
    profilePicture: { type: String,  default: ''    },
    lastLogin:      { type: Date,    default: null  },
    lastActiveAt:   { type: Date,    default: null  },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt    = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);