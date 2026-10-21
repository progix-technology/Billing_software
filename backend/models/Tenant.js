const { createModel } = require('../config/nedbAdapter');

const Tenant = createModel('tenants');

module.exports = Tenant;
