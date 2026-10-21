const { createModel } = require('../config/nedbAdapter');

const InventoryLog = createModel('inventoryLogs');

module.exports = InventoryLog;
