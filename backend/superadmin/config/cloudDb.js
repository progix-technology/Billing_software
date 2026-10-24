let mongoose;
try {
  mongoose = require('mongoose');
} catch (err) {
  console.warn('[SuperAdmin Cloud DB] Mongoose module require note:', err.message);
}

const MONGO_URI = process.env.MONGO_URI;

let cloudConnection;

if (MONGO_URI && mongoose && typeof mongoose.createConnection === 'function') {
  cloudConnection = mongoose.createConnection(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });

  cloudConnection.on('connected', () => {
    console.log('[SuperAdmin Cloud DB] Connected successfully to MongoDB Atlas!');
  });

  cloudConnection.on('error', (err) => {
    console.warn('[SuperAdmin Cloud DB Error]:', err.message);
  });
} else {
  cloudConnection = {
    model: () => ({
      find: () => ({ sort: () => [] }),
      findOne: () => null,
      findById: () => null,
      create: () => ({}),
      countDocuments: () => 0
    }),
    on: () => { }
  };
}

module.exports = cloudConnection;
