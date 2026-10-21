const os = require('os');
const crypto = require('crypto');
const { getStore } = require('../config/nedbAdapter');

const licenseStore = getStore('license');
const LICENSE_SECRET = 'PROGIX_OFFLINE_SECRET_KEY_@2026_ERP_SIGNATURE';

// Generate consistent unique machine fingerprint without external dependencies
function getMachineId() {
  const cpus = os.cpus().map(c => c.model).join('|');
  const network = JSON.stringify(os.networkInterfaces());
  const host = os.hostname();
  const user = os.userInfo ? os.userInfo().username : 'user';

  const raw = `${host}-${user}-${cpus.slice(0, 50)}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();

  // Return formatted Machine Code: e.g. PRGX-8A2F-9C1D-4E7B
  return `PRGX-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

// Generate License Key with cryptographic HMAC signature
function generateLicenseKey(machineId, planName = 'Gold', durationDays = 365) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays));

  // Format: YYYYMMDD
  const expStr = expiryDate.toISOString().slice(0, 10).replace(/-/g, '');
  const cleanPlan = planName.toUpperCase().slice(0, 4).padEnd(4, 'X');
  const cleanMachine = machineId.replace(/[^A-Z0-9]/g, '').slice(-8);

  const payload = `${cleanPlan}-${expStr}-${cleanMachine}`;
  const signature = crypto
    .createHmac('sha256', LICENSE_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase();

  return `${payload}-${signature}`;
}

// Verify a License Key
function verifyLicenseKey(licenseKey, currentMachineId = getMachineId()) {
  try {
    const parts = licenseKey.trim().toUpperCase().split('-');
    if (parts.length !== 4) return { valid: false, message: 'Invalid license key format.' };

    const [plan, expStr, keyMachine, providedSig] = parts;
    const payload = `${plan}-${expStr}-${keyMachine}`;
    const expectedSig = crypto
      .createHmac('sha256', LICENSE_SECRET)
      .update(payload)
      .digest('hex')
      .slice(0, 6)
      .toUpperCase();

    if (providedSig !== expectedSig) {
      return { valid: false, message: 'Invalid or forged license key signature.' };
    }

    // Verify machine match
    const cleanCurrentMachine = currentMachineId.replace(/[^A-Z0-9]/g, '').slice(-8);
    if (keyMachine !== 'ANYPC000' && keyMachine !== cleanCurrentMachine) {
      return { valid: false, message: 'This license key was generated for a different computer.' };
    }

    // Parse Expiry Date
    const year = parseInt(expStr.slice(0, 4));
    const month = parseInt(expStr.slice(4, 6)) - 1;
    const day = parseInt(expStr.slice(6, 8));
    const expiryDate = new Date(year, month, day, 23, 59, 59);

    if (new Date() > expiryDate) {
      return { valid: false, message: 'This license key has already expired.' };
    }

    return {
      valid: true,
      planName: plan === 'GOLD' ? 'Gold Annual' : plan === 'PLAT' ? 'Platinum Business' : `${plan} Plan`,
      expiryDate,
    };
  } catch (err) {
    return { valid: false, message: 'Error verifying license key: ' + err.message };
  }
}

// Get or Initialize current offline license status (Auto 14-day trial on first install)
async function getLicenseStatus() {
  const machineId = getMachineId();
  let license = await licenseStore.findOneAsync({ key: 'app_license' });

  if (!license) {
    // Fresh install: Create 14-day Free Trial
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14);

    license = {
      key: 'app_license',
      machineId,
      planName: '14-Day Free Trial',
      isTrial: true,
      activatedAt: new Date(),
      expiresAt: trialExpiry,
      licenseKey: 'TRIAL-ACTIVE',
    };
    await licenseStore.insertAsync(license);
  }

  const now = new Date();
  const expiresAt = new Date(license.expiresAt);
  const diffTime = expiresAt - now;
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;

  return {
    machineId,
    planName: license.planName,
    isTrial: license.isTrial,
    expiresAt: license.expiresAt,
    daysLeft: isExpired ? 0 : daysLeft,
    isExpired,
    licenseKey: license.licenseKey,
  };
}

// Activate new license key
async function activateLicenseKey(licenseKey) {
  const machineId = getMachineId();
  const verification = verifyLicenseKey(licenseKey, machineId);

  if (!verification.valid) {
    return { success: false, message: verification.message };
  }

  await licenseStore.updateAsync(
    { key: 'app_license' },
    {
      $set: {
        planName: verification.planName,
        isTrial: false,
        activatedAt: new Date(),
        expiresAt: verification.expiryDate,
        licenseKey: licenseKey.trim().toUpperCase(),
      },
    },
    { upsert: true }
  );

  return {
    success: true,
    message: `License activated successfully! Plan: ${verification.planName}`,
    expiresAt: verification.expiryDate,
  };
}

module.exports = {
  getMachineId,
  generateLicenseKey,
  verifyLicenseKey,
  getLicenseStatus,
  activateLicenseKey,
};
