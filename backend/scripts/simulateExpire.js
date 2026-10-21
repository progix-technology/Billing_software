const { getStore } = require('../config/nedbAdapter');

async function expireNow() {
  const licenseStore = getStore('license');
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1); // Yesterday

  await licenseStore.updateAsync(
    { key: 'app_license' },
    {
      $set: {
        planName: '14-Day Free Trial (Expired)',
        isTrial: true,
        expiresAt: pastDate,
        licenseKey: 'TRIAL-EXPIRED',
      }
    },
    { upsert: true }
  );

  console.log('--- License has been set to EXPIRED ---');
  console.log('Now refresh your app or try to create an invoice in Billing.');
  console.log('You will see the red Subscription Expired Lock modal!');
  process.exit(0);
}

expireNow();
