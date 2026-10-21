const { createModel } = require('../config/nedbAdapter');

const SystemSetting = createModel('systemSettings');

module.exports = SystemSetting;
