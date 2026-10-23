const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 
  'mongodb+srv://progixtechnology_db_user:H7uh3siFqBmeqveH@cluster0.eb6dcjz.mongodb.net/billing-software?retryWrites=true&w=majority&appName=cluster0';

// Dedicated Mongoose Connection for SuperAdmin Cloud Operations
const cloudConnection = mongoose.createConnection(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
});

cloudConnection.on('connected', () => {
  console.log('[SuperAdmin Cloud DB] Connected successfully to MongoDB Atlas!');
});

cloudConnection.on('error', (err) => {
  console.error('[SuperAdmin Cloud DB Error]:', err.message);
});

module.exports = cloudConnection;
