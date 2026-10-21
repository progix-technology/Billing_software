const { createModel } = require('../config/nedbAdapter');

const User = createModel('users');

module.exports = User;
