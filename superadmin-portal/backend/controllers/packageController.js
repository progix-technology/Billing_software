const Package = require('../models/Package');

// Seed default packages if empty
const seedPackages = async () => {
  const count = await Package.countDocuments();
  if (count === 0) {
    await Package.create([
      {
        name: 'Silver Starter',
        price: 999,
        durationDays: 30,
        description: 'For small stores & single counter retail shops',
        features: ['Full GST Invoicing', 'Barcode Scanner Support', 'Thermal & A4 Printing', '30 Days Validity'],
        isPopular: false
      },
      {
        name: 'Gold Enterprise',
        price: 4999,
        durationDays: 365,
        description: 'Most popular 1-Year license for established businesses',
        features: ['Unlimited Invoicing & Bills', 'Stock & Inventory Audit', 'Excel Reports & Analytics', '1 Year Validity', 'Priority Support'],
        isPopular: true
      },
      {
        name: 'Diamond Lifetime',
        price: 11999,
        durationDays: 36500,
        description: 'One-time payment for lifetime peace of mind',
        features: ['Lifetime Permanent License', 'No Monthly/Yearly Fees', 'All Future Software Updates', 'VIP Technical Support'],
        isPopular: false
      }
    ]);
    console.log('[Packages Initialized] Default pricing tiers seeded.');
  }
};

exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ price: 1 });
    res.status(200).json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedPackages = seedPackages;
