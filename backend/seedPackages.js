const mongoose = require('mongoose');
const Package = require('./models/Package');
const connectDB = require('./config/db');
require('dotenv').config();

const seedPackages = async () => {
  await connectDB();
  const packages = [
    {
      name: 'basic',
      price: 299,
      durationMonths: 1,
      features: ['Up to 5 Admins', 'Basic Reporting', 'Email Support'],
      maxAdmins: 5,
    },
    {
      name: 'premium',
      price: 2999,
      durationMonths: 12,
      features: ['Up to 20 Admins', 'Advanced Reporting', 'Priority Support'],
      maxAdmins: 20,
    },
    {
      name: 'enterprise',
      price: 4999,
      durationMonths: 12,
      features: ['Unlimited Admins', 'Custom Features', '24/7 Dedicated Support'],
      maxAdmins: 999,
    },
  ];

  try {
    for (const pkg of packages) {
      await Package.findOneAndUpdate({ name: pkg.name }, pkg, { upsert: true });
    }
    console.log('Packages seeded successfully!');
  } catch (error) {
    console.error('Error seeding packages:', error);
  }
  process.exit(0);
};

seedPackages();
