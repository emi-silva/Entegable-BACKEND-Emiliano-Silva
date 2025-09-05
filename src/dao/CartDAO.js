const Cart = require('../models/Cart');

class CartDAO {
  async getAll() {
    return Cart.find().populate('products.product');
  }
  async getById(id) {
    return Cart.findById(id).populate('products.product');
  }
  async create(cartData) {
    return Cart.create(cartData);
  }
  async update(id, cartData) {
    return Cart.findByIdAndUpdate(id, cartData, { new: true });
  }
  async delete(id) {
    return Cart.findByIdAndDelete(id);
  }
}

module.exports = new CartDAO();
