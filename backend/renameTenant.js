const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const connectDB = require('./config/db');
require('dotenv').config();

const renameTenant = async () => {
  await connectDB();
  const tenant = await Tenant.findOne({ businessName: 'Legacy Business' });
  if (tenant) {
    tenant.businessName = 'Progix Technology';
    await tenant.save();
    console.log('Tenant renamed to Progix Technology');
  } else {
    console.log('Legacy Business tenant not found');
  }
  process.exit(0);
};

renameTenant();
