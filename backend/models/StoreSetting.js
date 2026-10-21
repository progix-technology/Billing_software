const { createModel } = require('../config/nedbAdapter');

const StoreSetting = createModel('settings');

module.exports = StoreSetting;
