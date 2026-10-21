const { DATA_DIR } = require('./nedbAdapter');
const autoSeedOffline = require('./autoSeed');

const connectDB = async () => {
  try {
    console.log(`[Offline Database] NeDB storage initialized successfully at: ${DATA_DIR}`);
    // Run first-time auto-seed check (creates default Admin & settings if not present)
    await autoSeedOffline();
    console.log(`[Offline Database] System initialized and ready.`);
  } catch (error) {
    console.error(`[Offline Database Error]: ${error.message}`);
  }
};

module.exports = connectDB;
