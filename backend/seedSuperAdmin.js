const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin already exists. Exiting...');
      process.exit(0);
    }

    const superAdmin = await User.create({
      username: 'SuperAdmin',
      email: 'superadmin@example.com',
      password: 'password123', // In production, this should be a secure random password
      role: 'superadmin',
    });

    console.log('Superadmin created successfully:');
    console.log(`Email: ${superAdmin.email}`);
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding superadmin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();
