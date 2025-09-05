const Product = require('../models/Product');

class ProductDAO {
  async getAll() {
    return Product.find();
  }
  async getById(id) {
    return Product.findById(id);
  }
  async create(productData) {
    return Product.create(productData);
  }
  async update(id, productData) {
    return Product.findByIdAndUpdate(id, productData, { new: true });
  }
  async delete(id) {
    return Product.findByIdAndDelete(id);
  }
}

module.exports = new ProductDAO();
