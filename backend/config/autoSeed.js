const fs = require('fs');
const path = require('path');
const { getStore } = require('./nedbAdapter');
const bcrypt = require('bcryptjs');

async function autoSeedOffline() {
  try {
    const userStore = getStore('users');
    const adminExists = await userStore.findOneAsync({ role: 'admin' });

    if (!adminExists) {
      console.log('[AutoSeed] First run detected. Initializing database...');
      
      const seedFile = path.join(__dirname, 'initialData.json');
      if (fs.existsSync(seedFile)) {
        console.log('[AutoSeed] Populating initial dataset from bundled initialData.json...');
        const initialData = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
        for (const [colName, docs] of Object.entries(initialData)) {
          if (Array.isArray(docs) && docs.length > 0) {
            const store = getStore(colName);
            const count = await store.countAsync({});
            if (count === 0) {
              for (const doc of docs) {
                await store.insertAsync(doc);
              }
              console.log(`[AutoSeed] Seeded ${docs.length} records into ${colName}`);
            }
          }
        }
      }

      // Do not create any default store admin. Stores are created via SuperAdmin Activation Keys.
    }
  } catch (err) {
    console.error('[AutoSeed Error]:', err.message);
  }
}

module.exports = autoSeedOffline;
