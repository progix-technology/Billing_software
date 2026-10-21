const { createModel } = require('../config/nedbAdapter');

const Invoice = createModel('invoices');

module.exports = Invoice;
