const fs = require('fs/promises');
const path = require('path');

const filePath = path.resolve('data/carts.json');

class CartManager {
  constructor() {
    this.path = filePath;
  }

  async getCarts() {
    try {
      const data = await fs.readFile(this.path, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`No se pudo leer archivo ${this.path}, retornando array vacío.`);
      return [];
    }
  }

  async getCartById(cid) {
    const carts = await this.getCarts();
    return carts.find(cart => cart.id === Number(cid));
  }

  // Según router, createCart recibe { userId, items }
  async createCart({ userId, items }) {
    const carts = await this.getCarts();
    const maxId = carts.reduce((max, c) => (c.id > max ? c.id : max), 0);

    const newCart = {
      id: maxId + 1,
      userId: userId ?? null,
      products: Array.isArray(items) ? items : []
    };

    carts.push(newCart);
    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return newCart;
  }

  // Agregar producto por productId (numérico) y cantidad
  async addProductToCart(cid, productId, quantity = 1) {
    const carts = await this.getCarts();
    const cart = carts.find(c => c.id === Number(cid));

    if (!cart) return null;

    const existingProduct = cart.products.find(p => p.product === Number(productId));

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ product: Number(productId), quantity });
    }

    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return cart;
  }

  // Método para eliminar un carrito por ID (útil para DELETE /api/carts/:cid)
  async deleteCart(cid) {
    const carts = await this.getCarts();
    const initialLength = carts.length;
    const filtered = carts.filter(c => c.id !== Number(cid));

    if (filtered.length === initialLength) return false;

    await fs.writeFile(this.path, JSON.stringify(filtered, null, 2));
    return true;
  }
}

module.exports = { CartManager };
