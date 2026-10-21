const { createModel } = require('../config/nedbAdapter');

const Payment = createModel('payments');

module.exports = Payment;
