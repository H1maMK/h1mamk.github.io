/**
 * Models Index File
 * 
 * This file exports all Mongoose models for the DeviceMaster application.
 * Import this file to access all models in one place.
 */

const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const Article = require('./Article');
const Category = require('./Category');

module.exports = {
  User,
  Product,
  Order,
  Article,
  Category
};

// Export individual models as well for convenience
module.exports.User = User;
module.exports.Product = Product;
module.exports.Order = Order;
module.exports.Article = Article;
module.exports.Category = Category;