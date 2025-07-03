const path = require('path');
const fs = require('fs/promises');

const filePath = path.resolve(__dirname, '../../data/products.json');

class ProductManager {
  constructor() {
    this.path = filePath;
  }

  async getProducts() {
    try {
      console.log('Intentando leer:', this.path);
      const data = await fs.readFile(this.path, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`No se pudo leer archivo ${this.path}, retornando array vacío.`);
      console.error(error); // <--- Agrega esto para ver el error real
      return [];
    }
  }

  async getProductById(pid) {
    const products = await this.getProducts();
    return products.find(prod => prod.id === Number(pid));
  }

  async addProduct(product) {
    const products = await this.getProducts();

    if (products.some(p => p.code === product.code)) {
      throw new Error('El código del producto ya existe');
    }

    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newProduct = {
      id: maxId + 1,
      ...product
    };

    products.push(newProduct);
    await fs.writeFile(this.path, JSON.stringify(products, null, 2));
    return newProduct;
  }

  async updateProduct(pid, updates) {
    const products = await this.getProducts();
    const index = products.findIndex(prod => prod.id === Number(pid));

    if (index === -1) return null;

    const updatedProduct = {
      ...products[index],
      ...updates,
      id: products[index].id
    };

    products[index] = updatedProduct;
    await fs.writeFile(this.path, JSON.stringify(products, null, 2));
    return updatedProduct;
  }

  async deleteProduct(pid) {
    const products = await this.getProducts();
    const initialLength = products.length;
    const filtered = products.filter(prod => prod.id !== Number(pid));

    if (filtered.length === initialLength) return false;

    await fs.writeFile(this.path, JSON.stringify(filtered, null, 2));
    return true;
  }
}

module.exports = { ProductManager };
