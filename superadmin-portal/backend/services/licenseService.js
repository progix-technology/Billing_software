const crypto = require('crypto');

const _k1 = Buffer.from([80, 82, 79, 71, 73, 88, 95, 79, 70, 70, 76, 73, 78, 69]);
const _k2 = Buffer.from([95, 83, 69, 67, 82, 69, 84, 95, 75, 69, 89]);
const _k3 = Buffer.from([95, 64, 50, 48, 50, 54, 95, 69, 82, 80, 95, 83, 73, 71, 78, 65, 84, 85, 82, 69]);
const LICENSE_SECRET = Buffer.concat([_k1, _k2, _k3]).toString('utf-8');

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

  return {
    licenseKey: `${payload}-${signature}`,
    expiryDate,
    planName,
    machineId
  };
}

// Verify a License Key against a machine
function verifyLicenseKey(licenseKey, currentMachineId) {
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

    if (currentMachineId) {
      const cleanCurrentMachine = currentMachineId.replace(/[^A-Z0-9]/g, '').slice(-8);
      if (keyMachine !== 'ANYPC000' && keyMachine !== cleanCurrentMachine) {
        return { valid: false, message: 'This license key was generated for a different computer.' };
      }
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
      return { valid: false, message: 'This license key has expired.' };
    }

    return {
      valid: true,
      planCode: plan,
      expiryDate,
      isLifetime: expStr.startsWith('9999'),
      machineId: keyMachine
    };
  } catch (err) {
    return { valid: false, message: err.message };
  }
}

module.exports = {
  generateLicenseKey,
  verifyLicenseKey
};
