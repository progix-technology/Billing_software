const os = require('os');
const crypto = require('crypto');
const { getStore } = require('../config/nedbAdapter');

const licenseStore = getStore('license');
const _k1 = Buffer.from([80, 82, 79, 71, 73, 88, 95, 79, 70, 70, 76, 73, 78, 69]);
const _k2 = Buffer.from([95, 83, 69, 67, 82, 69, 84, 95, 75, 69, 89]);
const _k3 = Buffer.from([95, 64, 50, 48, 50, 54, 95, 69, 82, 80, 95, 83, 73, 71, 78, 65, 84, 85, 82, 69]);
const LICENSE_SECRET = Buffer.concat([_k1, _k2, _k3]).toString('utf-8');

// Generate digital HMAC integrity seal for local database storage
function generateStorageSeal(doc) {
  const expIso = doc.expiresAt ? new Date(doc.expiresAt).toISOString().slice(0, 10) : '';
  const payload = `${doc.machineId}|${doc.planName}|${expIso}|${doc.licenseKey}|${Boolean(doc.isTrial)}`;
  return crypto.createHmac('sha256', LICENSE_SECRET).update(payload).digest('hex');
}

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
  let expStr;
  let expiryDate;

  if (
    planName.toUpperCase().includes('LIFE') || 
    planName.toUpperCase().includes('PERM') || 
    parseInt(durationDays) >= 36500
  ) {
    // Permanent Lifetime - Year 9999 (Never Expires)
    expStr = '99991231';
    expiryDate = new Date(9999, 11, 31, 23, 59, 59);
  } else {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays));
    expStr = expiryDate.toISOString().slice(0, 10).replace(/-/g, '');
  }

  const cleanPlan = planName.toUpperCase().slice(0, 4).padEnd(4, 'X');
  const cleanMachine = (machineId === 'ANYPC' || machineId === 'ANYPC000') 
    ? 'ANYPC000' 
    : machineId.replace(/[^A-Z0-9]/g, '').slice(-8);

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
    let expiryDate;
    if (expStr === '99991231' || expStr.startsWith('9999')) {
      expiryDate = new Date(9999, 11, 31, 23, 59, 59);
    } else {
      const year = parseInt(expStr.slice(0, 4));
      const month = parseInt(expStr.slice(4, 6)) - 1;
      const day = parseInt(expStr.slice(6, 8));
      expiryDate = new Date(year, month, day, 23, 59, 59);
    }

    if (new Date() > expiryDate) {
      return { valid: false, message: 'This license key has already expired.' };
    }

    const isPermanent = expStr === '99991231' || expStr.startsWith('9999') || plan.startsWith('LIFE') || plan.startsWith('PERM');
    const diffDays = isPermanent ? 99999 : Math.max(0, Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)));

    let basePlanName = 'Standard';
    if (plan.startsWith('SILV')) basePlanName = 'Silver';
    else if (plan.startsWith('GOLD')) basePlanName = 'Gold';
    else if (plan.startsWith('DIAM')) basePlanName = 'Diamond';
    else if (plan.startsWith('PLAT')) basePlanName = 'Platinum';
    else if (plan.startsWith('STAN')) basePlanName = 'Standard';
    else if (plan.startsWith('BUSI')) basePlanName = 'Business';
    else if (isPermanent) basePlanName = 'Lifetime';
    else basePlanName = plan.replace(/X+$/, '');

    let cleanPlanName;
    if (isPermanent) {
      cleanPlanName = `${basePlanName} (Lifetime)`;
    } else {
      cleanPlanName = `${basePlanName} (${diffDays} Days)`;
    }

    return {
      valid: true,
      planName: cleanPlanName,
      expiryDate,
    };
  } catch (err) {
    return { valid: false, message: 'Error verifying license key: ' + err.message };
  }
}

// Get or Initialize current offline license status with multi-layer tamper detection
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
      lastSeenTime: Date.now(),
    };
    license.seal = generateStorageSeal(license);
    await licenseStore.insertAsync(license);
  }

  const now = Date.now();

  // 1. Anti-Clock Rollback Detection (Prevents setting PC clock backwards to extend trial/license)
  const lastSeen = license.lastSeenTime || 0;
  if (lastSeen && (lastSeen - now > 4 * 60 * 60 * 1000)) {
    return {
      isActivated: false,
      isExpired: true,
      isClockTampered: true,
      message: 'System clock rollback detected! Please restore the correct computer date & time.',
      machineId,
      expiresAt: license.expiresAt,
      daysLeft: 0,
      licenseKey: license.licenseKey,
      planName: license.planName,
      isTrial: Boolean(license.isTrial),
      isPermanent: false,
    };
  }

  // 2. Database File Integrity Seal Check (Detects manual Notepad edits in license.db)
  if (license.seal) {
    const expectedSeal = generateStorageSeal(license);
    if (license.seal !== expectedSeal) {
      return {
        isActivated: false,
        isExpired: true,
        isTampered: true,
        message: 'Security Alert: License file integrity verification failed. Manual file modification detected.',
        machineId,
        expiresAt: new Date(0),
        daysLeft: 0,
        licenseKey: '',
        planName: 'Tampered (Invalidated)',
        isTrial: false,
        isPermanent: false,
      };
    }
  }

  // 3. Continuous Cryptographic Re-Verification
  // Ensures license key matches this computer hardware and signature is 100% valid
  if (license.licenseKey && license.licenseKey !== 'TRIAL-ACTIVE') {
    const check = verifyLicenseKey(license.licenseKey, machineId);
    if (!check.valid) {
      return {
        isActivated: false,
        isExpired: true,
        isTampered: true,
        message: check.message || 'License key is invalid for this computer hardware.',
        machineId,
        expiresAt: new Date(0),
        daysLeft: 0,
        licenseKey: license.licenseKey,
        planName: 'Invalid License',
        isTrial: false,
        isPermanent: false,
      };
    }
  }

  // Update last seen timestamp
  if (now > lastSeen) {
    licenseStore.updateAsync(
      { key: 'app_license' },
      { $set: { lastSeenTime: now } }
    ).catch(() => {});
  }

  const expiresAt = new Date(license.expiresAt);
  const diffTime = expiresAt - new Date(now);
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isPermanent = expiresAt.getFullYear() >= 9000;
  const isExpired = isPermanent ? false : daysLeft <= 0;
  const isActivated = Boolean(license && !isExpired && license.licenseKey && license.licenseKey !== 'TRIAL-ACTIVE');

  const safeDays = isPermanent ? 'Lifetime' : (isExpired ? 0 : daysLeft);

  return {
    isActivated,
    machineId,
    planName: license.planName,
    isTrial: Boolean(license.isTrial),
    expiresAt: license.expiresAt,
    daysLeft: safeDays,
    daysRemaining: safeDays,
    isPermanent,
    isExpired,
    licenseKey: license.licenseKey,
  };
}

// Activate new license key with cryptographic seal & machine binding
async function activateLicenseKey(licenseKey) {
  const machineId = getMachineId();
  const verification = verifyLicenseKey(licenseKey, machineId);

  if (!verification.valid) {
    return { success: false, message: verification.message };
  }

  const licenseDoc = {
    key: 'app_license',
    machineId,
    planName: verification.planName,
    isTrial: false,
    activatedAt: new Date(),
    expiresAt: verification.expiryDate,
    licenseKey: licenseKey.trim().toUpperCase(),
    lastSeenTime: Date.now(),
  };

  // Generate tamper seal
  licenseDoc.seal = generateStorageSeal(licenseDoc);

  await licenseStore.updateAsync(
    { key: 'app_license' },
    { $set: licenseDoc },
    { upsert: true }
  );

  return {
    success: true,
    planName: verification.planName,
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
