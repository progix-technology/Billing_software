const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkUsers = async () => {
  await connectDB();
  const users = await User.find();
  console.log('Users in DB:');
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role}, Tenant: ${u.tenantId})`));
  process.exit(0);
};

checkUsers();
