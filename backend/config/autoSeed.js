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

      // Check if admin is now present after seeding
      const checkAdmin = await userStore.findOneAsync({ role: 'admin' });
      if (!checkAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Progix@123', salt);

        await userStore.insertAsync({
          username: 'Clothes Shop',
          email: 'progixtechnology@gmail.com',
          password: hashedPassword,
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log('[AutoSeed] Default Admin created: progixtechnology@gmail.com / Progix@123');
      }
    }

    // Always ensure SuperAdmin account exists with Password@123
    const superAdmin = await userStore.findOneAsync({ email: 'superadmin@gmail.com' });
    if (!superAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password@123', salt);

      await userStore.insertAsync({
        username: 'SuperAdmin',
        email: 'superadmin@gmail.com',
        password: hashedPassword,
        role: 'superadmin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('[AutoSeed] SuperAdmin account created: superadmin@gmail.com / Password@123');
    }
  } catch (err) {
    console.error('[AutoSeed Error]:', err.message);
  }
}

module.exports = autoSeedOffline;
