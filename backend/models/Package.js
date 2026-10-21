const { createModel } = require('../config/nedbAdapter');

const Package = createModel('packages');

module.exports = Package;
