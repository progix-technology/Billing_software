const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const ClientAdmin = require('../models/ClientAdmin');
const LicenseKey = require('../models/LicenseKey');
const { SUPERADMIN_JWT_SECRET } = require('../middleware/superAdminAuth');

// Obfuscated HMAC secret matching offline verification engine
const _k1 = Buffer.from([80, 82, 79, 71, 73, 88, 95, 79, 70, 70, 76, 73, 78, 69]);
const _k2 = Buffer.from([95, 83, 69, 67, 82, 69, 84, 95, 75, 69, 89]);
const _k3 = Buffer.from([95, 64, 50, 48, 50, 54, 95, 69, 82, 80, 95, 83, 73, 71, 78, 65, 84, 85, 82, 69]);
const LICENSE_SECRET = Buffer.concat([_k1, _k2, _k3]).toString('utf-8');

// Generate Cryptographic HMAC-SHA256 signed license key
function createCryptographicKey(machineId, planName, durationDays) {
  let expStr;
  let expiryDate;

  if (
    planName.toUpperCase().includes('LIFE') || 
    planName.toUpperCase().includes('PERM') || 
    parseInt(durationDays) >= 36500
  ) {
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
    machineId: cleanMachine
  };
}

// Auto seed root SuperAdmin if none exists in Atlas
async function seedSuperAdminUser() {
  try {
    const existing = await SuperAdmin.findOne({ email: 'superadmin@gmail.com' });
    if (!existing) {
      const admin = new SuperAdmin({
        username: 'SuperAdmin',
        email: 'superadmin@gmail.com',
        password: 'Password@123',
        role: 'superadmin'
      });
      await admin.save();
      console.log('[SuperAdmin Cloud] Root SuperAdmin account initialized in MongoDB Atlas!');
    }
  } catch (err) {
    console.error('[SuperAdmin Cloud] Seed error:', err.message);
  }
}

// 1. SuperAdmin Login (against MongoDB Atlas)
exports.login = async (req, res) => {
  try {
    const rawEmail = (req.body.email || req.body.emailOrUsername || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    if (!rawEmail || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const admin = await SuperAdmin.findOne({ email: rawEmail }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid SuperAdmin credentials.' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid SuperAdmin credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      SUPERADMIN_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'SuperAdmin authenticated successfully via MongoDB Atlas',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get Current SuperAdmin Profile
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.superAdmin._id,
      username: req.superAdmin.username,
      email: req.superAdmin.email,
      role: req.superAdmin.role
    }
  });
};

const { generateSmartLicenseKey } = require('../../services/licenseService');

// 3. Quick Generate Activation Key & Save to MongoDB Atlas
exports.generateKey = async (req, res) => {
  try {
    const { 
      machineId, 
      planName, 
      durationDays, 
      issuedTo, 
      storeName,
      adminUsername,
      adminEmail,
      adminPassword,
      phone, 
      notes 
    } = req.body;

    const days = parseInt(durationDays || 365, 10);
    const plan = planName || 'Gold';
    const machine = (machineId || 'ANYPC000').trim().toUpperCase();

    let expiryDate;
    if (plan.toUpperCase().includes('LIFE') || days >= 36500) {
      expiryDate = new Date(9999, 11, 31, 23, 59, 59);
    } else {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }

    const key = generateSmartLicenseKey({
      adminUsername: adminUsername || issuedTo || 'Admin',
      adminEmail: adminEmail || 'admin@store.com',
      adminPassword: adminPassword || 'Admin@123',
      storeName: storeName || issuedTo || 'PRO Store',
      planName: plan,
      durationDays: days,
      machineId: machine
    });

    // Save record to MongoDB Atlas
    const record = await LicenseKey.create({
      licenseKey: key,
      machineId: machine,
      planName: plan,
      durationDays: days,
      issuedTo: (issuedTo || storeName || adminUsername || 'Direct Client').trim(),
      phone: phone || '',
      expiryDate,
      notes: notes || `Admin: ${adminEmail || 'admin@store.com'}`,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      licenseKey: key,
      validTill: expiryDate,
      planName: plan,
      machineId: machine,
      record
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Get All Generated Licenses from MongoDB Atlas
exports.getLicenses = async (req, res) => {
  try {
    const licenses = await LicenseKey.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: licenses.length, licenses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Revoke a License Key in MongoDB Atlas
exports.revokeLicense = async (req, res) => {
  try {
    const license = await LicenseKey.findById(req.params.id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License key not found' });
    }
    license.status = 'revoked';
    await license.save();
    res.status(200).json({ success: true, message: 'License revoked successfully', license });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Get All Client Admins / Tenants from MongoDB Atlas
exports.getClients = async (req, res) => {
  try {
    const clients = await ClientAdmin.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: clients.length, 
      clients, 
      tenants: clients 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Create New Client / Admin in MongoDB Atlas
exports.createClient = async (req, res) => {
  try {
    const { 
      storeName, 
      businessName, 
      ownerName, 
      adminUsername,
      adminPassword,
      phone, 
      contactPhone,
      email, 
      contactEmail,
      adminEmail,
      machineId, 
      planName, 
      plan,
      durationDays, 
      notes 
    } = req.body;

    const resolvedStoreName = (storeName || businessName || '').trim();
    const resolvedEmail = (email || contactEmail || adminEmail || '').trim().toLowerCase();
    const resolvedUsername = (ownerName || adminUsername || 'Admin').trim();
    const resolvedPassword = (adminPassword || 'Admin@123').trim();

    if (!resolvedStoreName || !resolvedEmail) {
      return res.status(400).json({ success: false, message: 'Store Name and Email are required.' });
    }

    const days = parseInt(durationDays || 365, 10);
    const resolvedPlan = planName || plan || 'Standard';
    const machine = (machineId || 'ANYPC000').trim().toUpperCase();

    // Auto-generate Smart Self-Configuring key embedding store & admin credentials
    const smartKey = generateSmartLicenseKey({
      adminUsername: resolvedUsername,
      adminEmail: resolvedEmail,
      adminPassword: resolvedPassword,
      storeName: resolvedStoreName,
      planName: resolvedPlan,
      durationDays: days,
      machineId: machine
    });

    let expiryDate;
    if (resolvedPlan.toUpperCase().includes('LIFE') || days >= 36500) {
      expiryDate = new Date(9999, 11, 31, 23, 59, 59);
    } else {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
    }

    // Save client in MongoDB Atlas
    const client = await ClientAdmin.create({
      storeName: resolvedStoreName,
      ownerName: resolvedUsername,
      phone: (phone || contactPhone || '').trim(),
      email: resolvedEmail,
      machineId: machine,
      planName: resolvedPlan,
      durationDays: days,
      licenseKey: smartKey,
      validTill: expiryDate,
      status: 'active',
      notes: notes || `Auto-configured password: ${resolvedPassword}`
    });

    // Also record the key in licenses collection
    await LicenseKey.create({
      licenseKey: smartKey,
      machineId: machine,
      planName: resolvedPlan,
      durationDays: days,
      issuedTo: resolvedStoreName,
      phone: phone || contactPhone || '',
      expiryDate,
      notes: `Issued to new store: ${resolvedStoreName} | Admin: ${resolvedEmail}`,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'New Client Admin successfully saved in MongoDB Atlas with Smart Activation Key!',
      client,
      tenant: client,
      licenseKey: smartKey,
      validTill: expiryDate
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 8. Update Client Details in MongoDB Atlas
exports.updateClient = async (req, res) => {
  try {
    const client = await ClientAdmin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    res.status(200).json({ success: true, message: 'Client updated successfully', client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Delete Client from MongoDB Atlas
exports.deleteClient = async (req, res) => {
  try {
    const client = await ClientAdmin.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }
    res.status(200).json({ success: true, message: 'Client deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Dashboard Analytics from MongoDB Atlas
exports.getDashboardStats = async (req, res) => {
  try {
    const totalClients = await ClientAdmin.countDocuments();
    const activeClients = await ClientAdmin.countDocuments({ status: 'active' });
    const totalLicenses = await LicenseKey.countDocuments();
    const activeLicenses = await LicenseKey.countDocuments({ status: 'active' });

    // Expiring within next 7 days
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const expiringSoon = await LicenseKey.countDocuments({
      status: 'active',
      expiryDate: { $gt: new Date(), $lte: next7Days }
    });

    const recentLicenses = await LicenseKey.find().sort({ createdAt: -1 }).limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalClients,
        activeClients,
        totalLicenses,
        activeLicenses,
        expiringSoon
      },
      recentLicenses
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.seedSuperAdminUser = seedSuperAdminUser;
