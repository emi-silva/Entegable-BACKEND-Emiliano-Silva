const CartDAO = require('../dao/CartDAO');
const CartDTO = require('../dto/CartDTO');

class CartRepository {
  async getAll() {
    const carts = await CartDAO.getAll();
    return carts.map(c => new CartDTO(c));
  }
  async getById(id) {
    const cart = await CartDAO.getById(id);
    return cart ? new CartDTO(cart) : null;
  }
  async create(cartData) {
    const cart = await CartDAO.create(cartData);
    return new CartDTO(cart);
  }
  async update(id, cartData) {
    const cart = await CartDAO.update(id, cartData);
    return cart ? new CartDTO(cart) : null;
  }
  async delete(id) {
    return await CartDAO.delete(id);
  }
}

module.exports = new CartRepository();
