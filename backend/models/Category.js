const { createModel } = require('../config/nedbAdapter');

const Category = createModel('categories');

module.exports = Category;
