const { createModel } = require('../config/nedbAdapter');

const Customer = createModel('customers');

module.exports = Customer;
