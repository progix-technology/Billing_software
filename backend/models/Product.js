const { createModel } = require('../config/nedbAdapter');

const Product = createModel('products');

module.exports = Product;
