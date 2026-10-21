const fs = require('fs');
const path = require('path');
const { getStore, DATA_DIR } = require('../config/nedbAdapter');

const COLLECTIONS = [
  'users',
  'products',
  'invoices',
  'customers',
  'categories',
  'suppliers',
  'inventoryLogs',
  'settings',
  'payments',
  'license',
];

// Export all collections to an object
async function exportDatabase() {
  const backupData = {
    appName: 'ProBilling ERP',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    collections: {},
  };

  for (const coll of COLLECTIONS) {
    const store = getStore(coll);
    backupData.collections[coll] = await store.findAsync({});
  }

  return backupData;
}

// Restore database from backup object
async function restoreDatabase(backupData) {
  if (!backupData || !backupData.collections) {
    throw new Error('Invalid backup file format.');
  }

  const restoredCounts = {};

  for (const coll of COLLECTIONS) {
    const records = backupData.collections[coll];
    if (Array.isArray(records)) {
      const store = getStore(coll);
      // Clear existing records
      await store.removeAsync({}, { multi: true });
      // Insert backup records
      if (records.length > 0) {
        await store.insertAsync(records);
      }
      restoredCounts[coll] = records.length;
    }
  }

  return restoredCounts;
}

module.exports = {
  exportDatabase,
  restoreDatabase,
  COLLECTIONS,
};
