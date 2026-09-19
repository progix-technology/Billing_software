const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Models
const Tenant = require('./models/Tenant');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const Payment = require('./models/Payment');
const InventoryLog = require('./models/InventoryLog');
const ActivityLog = require('./models/ActivityLog');
const StoreSetting = require('./models/StoreSetting');

dotenv.config();

const migrateLegacyData = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting migration...');

    // 1. Create a Default Tenant if it doesn't exist
    let defaultTenant = await Tenant.findOne({ businessName: 'Legacy Business' });
    if (!defaultTenant) {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 10); // Give them 10 years access

      defaultTenant = await Tenant.create({
        businessName: 'Legacy Business',
        contactEmail: 'admin@legacy.com',
        contactPhone: '0000000000',
        plan: 'enterprise',
        validTill: expiry,
        status: 'active'
      });
      console.log('Created Default Tenant:', defaultTenant._id);
    } else {
      console.log('Default Tenant already exists:', defaultTenant._id);
    }

    const tenantId = defaultTenant._id;

    // 2. Update all normal Users missing a tenantId
    const usersUpdate = await User.updateMany(
      { role: { $ne: 'superadmin' }, tenantId: { $exists: false } },
      { $set: { tenantId } }
    );
    console.log(`Updated ${usersUpdate.modifiedCount} Users.`);

    // 3. Update all business models
    const productsUpdate = await Product.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${productsUpdate.modifiedCount} Products.`);

    const customersUpdate = await Customer.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${customersUpdate.modifiedCount} Customers.`);

    const invoicesUpdate = await Invoice.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${invoicesUpdate.modifiedCount} Invoices.`);

    const categoriesUpdate = await Category.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${categoriesUpdate.modifiedCount} Categories.`);

    const suppliersUpdate = await Supplier.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${suppliersUpdate.modifiedCount} Suppliers.`);

    const paymentsUpdate = await Payment.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${paymentsUpdate.modifiedCount} Payments.`);

    const invLogsUpdate = await InventoryLog.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${invLogsUpdate.modifiedCount} InventoryLogs.`);

    const actLogsUpdate = await ActivityLog.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${actLogsUpdate.modifiedCount} ActivityLogs.`);

    const settingsUpdate = await StoreSetting.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } });
    console.log(`Updated ${settingsUpdate.modifiedCount} StoreSettings.`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateLegacyData();
