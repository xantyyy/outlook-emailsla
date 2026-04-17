// createAdmin.js - Run this to create your first admin user
// Usage: node createAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@telexph.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists with email: admin@telexph.com');
      console.log('Existing admin details:');
      console.log('  Name:', existingAdmin.name);
      console.log('  Email:', existingAdmin.email);
      console.log('  Role:', existingAdmin.role);
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      name: 'Kawander',
      email: 'admin@telexph.com',
      password: 'admin123',  // Will be hashed automatically by the model
      role: 'Super Admin',
      isActive: true
    });
    
    await admin.save();
    
    console.log('✅ Admin created successfully!');
    console.log('');
    console.log('📋 Admin Details:');
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Password: admin123');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('  Email: admin@telexph.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

// Run the function
createAdmin();