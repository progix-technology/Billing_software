const { createModel } = require('../config/nedbAdapter');

const Supplier = createModel('suppliers');

module.exports = Supplier;
