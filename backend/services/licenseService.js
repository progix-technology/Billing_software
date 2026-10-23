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

// Generate Smart Self-Configuring License Key (Encodes user credentials, plan & duration)
function generateSmartLicenseKey(params = {}) {
  const {
    adminUsername = 'Admin',
    adminEmail = 'admin@store.com',
    adminPassword = 'Admin@123',
    storeName = 'PRO Store',
    planName = 'Gold',
    durationDays = 365,
    machineId = 'ANYPC000',
  } = params;

  const cleanDays = parseInt(durationDays || 365, 10);
  const cleanPlan = (planName || 'Gold').trim();
  const cleanMachine = (machineId === 'ANYPC' || machineId === 'ANYPC000' || !machineId)
    ? 'ANYPC000'
    : machineId.replace(/[^A-Z0-9]/g, '').slice(-8);

  const payload = {
    u: (adminUsername || 'Admin').trim(),
    e: (adminEmail || 'admin@store.com').trim().toLowerCase(),
    p: (adminPassword || 'Admin@123').trim(),
    s: (storeName || 'PRO Store').trim(),
    plan: cleanPlan,
    days: cleanDays,
    m: cleanMachine,
    ts: Date.now(),
  };

  const secret = crypto.createHash('sha256').update(LICENSE_SECRET).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);
  const jsonStr = JSON.stringify(payload);
  const enc = cipher.update(jsonStr, 'utf8', 'hex') + cipher.final('hex');

  return 'PRGX-KEY-' + iv.toString('hex').toUpperCase() + enc.toUpperCase();
}

// Generate License Key with cryptographic HMAC signature (Legacy or Standard)
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

// Verify a License Key (Handles both Smart Self-Configuring keys and Legacy keys)
function verifyLicenseKey(rawKey, currentMachineId = getMachineId()) {
  try {
    const key = (rawKey || '').trim();
    if (!key) return { valid: false, message: 'Please provide a license key.' };

    const cleanCurrentMachine = currentMachineId.replace(/[^A-Z0-9]/g, '').slice(-8);

    // MODE 1: Smart Encrypted Key (PRGX-KEY-...)
    if (key.toUpperCase().startsWith('PRGX-KEY-')) {
      const hexStr = key.replace(/PRGX-KEY-/i, '').toLowerCase().trim();
      if (hexStr.length < 64) {
        return { valid: false, message: 'Invalid smart activation key length.' };
      }

      const iv = Buffer.from(hexStr.slice(0, 32), 'hex');
      const ciphertext = hexStr.slice(32);
      const secret = crypto.createHash('sha256').update(LICENSE_SECRET).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv);
      let decrypted;
      try {
        decrypted = decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');
      } catch (e) {
        return { valid: false, message: 'Activation key decryption failed or key has been corrupted.' };
      }

      const payload = JSON.parse(decrypted);

      // Verify machine hardware binding
      if (payload.m && payload.m !== 'ANYPC000' && payload.m !== cleanCurrentMachine) {
        return { valid: false, message: 'This activation key was generated for a different computer.' };
      }

      const isPermanent = parseInt(payload.days) >= 36500 || String(payload.plan).toUpperCase().includes('LIFE');
      let expiryDate;
      if (isPermanent) {
        expiryDate = new Date(9999, 11, 31, 23, 59, 59);
      } else {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(payload.days || 365));
      }

      return {
        valid: true,
        isSmartKey: true,
        planName: `${payload.plan || 'Standard'} (${isPermanent ? 'Lifetime' : `${payload.days || 365} Days`})`,
        basePlan: payload.plan || 'Standard',
        durationDays: isPermanent ? 'Lifetime' : parseInt(payload.days || 365),
        expiryDate,
        payload,
      };
    }

    // MODE 2: Legacy 4-Part Key (e.g. GOLD-20271023-ANYPC000-A1B2C3)
    const parts = key.toUpperCase().split('-');
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
      cleanPlanName = basePlanName === 'Lifetime' ? 'Lifetime (Permanent)' : `${basePlanName} Lifetime`;
    } else {
      cleanPlanName = `${basePlanName} (${diffDays} Days)`;
    }

    return {
      valid: true,
      isSmartKey: false,
      planName: cleanPlanName,
      basePlan: basePlanName,
      durationDays: diffDays,
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

// Activate new license key with cryptographic seal, machine binding, & automatic user provisioning
async function activateLicenseKey(licenseKey) {
  const machineId = getMachineId();
  const verification = verifyLicenseKey(licenseKey, machineId);

  if (!verification.valid) {
    return { success: false, message: verification.message };
  }

  const cleanKey = licenseKey.trim().toUpperCase();

  const licenseDoc = {
    key: 'app_license',
    machineId,
    planName: verification.planName,
    isTrial: false,
    activatedAt: new Date(),
    expiresAt: verification.expiryDate,
    licenseKey: cleanKey,
    lastSeenTime: Date.now(),
  };

  // Generate tamper seal
  licenseDoc.seal = generateStorageSeal(licenseDoc);

  await licenseStore.updateAsync(
    { key: 'app_license' },
    { $set: licenseDoc },
    { upsert: true }
  );

  let provisionedUser = null;

  // Auto-configure Admin Account & Store Settings if Smart Key
  if (verification.isSmartKey && verification.payload) {
    try {
      const User = require('../models/User');
      const Tenant = require('../models/Tenant');
      const StoreSetting = require('../models/StoreSetting');
      const bcrypt = require('bcryptjs');

      const { u, e, p, s, plan, days } = verification.payload;
      const adminUsername = (u || 'Admin').trim();
      const adminEmail = (e || 'admin@store.com').trim().toLowerCase();
      const adminPassword = (p || 'Admin@123').trim();
      const storeName = (s || 'PRO Store').trim();

      // 1. Create or Update Tenant
      let tenant = await Tenant.findOne({});
      if (!tenant) {
        tenant = await Tenant.create({
          businessName: storeName,
          contactEmail: adminEmail,
          plan: plan || 'Gold',
          validTill: verification.expiryDate,
          status: 'active',
          machineId: verification.payload.m || machineId,
          licenseKey: cleanKey,
        });
      } else {
        tenant.businessName = storeName;
        tenant.contactEmail = adminEmail;
        tenant.plan = plan || 'Gold';
        tenant.validTill = verification.expiryDate;
        tenant.licenseKey = cleanKey;
        await tenant.save();
      }

      // 2. Create or Update Primary Admin User (Model.save handles bcrypt hashing)
      let adminUser = await User.findOne({ email: adminEmail });

      if (!adminUser) {
        adminUser = await User.create({
          tenantId: tenant._id,
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
        });
      } else {
        adminUser.username = adminUsername;
        adminUser.password = adminPassword;
        adminUser._isNewPassword = true;
        adminUser.role = 'admin';
        adminUser.tenantId = tenant._id;
        await adminUser.save();
      }

      // 3. Mark store profile & setup as completed
      let store = await StoreSetting.findOne({});
      if (!store) {
        store = await StoreSetting.create({
          storeName: storeName,
          ownerName: adminUsername,
          email: adminEmail,
          setupCompleted: true,
          sampleDataSeeded: false,
          isDemoMode: false,
        });
      } else {
        store.storeName = storeName;
        store.ownerName = adminUsername;
        store.email = adminEmail;
        store.setupCompleted = true;
        await store.save();
      }

      provisionedUser = {
        email: adminEmail,
        username: adminUsername,
      };
      console.log(`[SmartKey Engine] Auto-provisioned Admin (${adminEmail}) for ${storeName} successfully!`);
    } catch (provisionErr) {
      console.error('[SmartKey Engine] Provisioning warning:', provisionErr.message);
    }
  }

  return {
    success: true,
    isSmartKey: Boolean(verification.isSmartKey),
    planName: verification.basePlan || verification.planName,
    durationDays: verification.durationDays,
    message: `🎉 ${verification.planName} Activated Successfully!`,
    expiresAt: verification.expiryDate,
    adminEmail: provisionedUser ? provisionedUser.email : null,
    adminUsername: provisionedUser ? provisionedUser.username : null,
    redirect: '/login',
  };
}

module.exports = {
  getMachineId,
  generateLicenseKey,
  generateSmartLicenseKey,
  verifyLicenseKey,
  getLicenseStatus,
  activateLicenseKey,
};
