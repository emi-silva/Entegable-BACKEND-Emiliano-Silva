const ProductDAO = require('../dao/ProductDAO');
const ProductDTO = require('../dto/ProductDTO');

class ProductRepository {
  async getAll() {
    const products = await ProductDAO.getAll();
    return products.map(p => new ProductDTO(p));
  }
  async getById(id) {
    const product = await ProductDAO.getById(id);
    return product ? new ProductDTO(product) : null;
  }
  async create(productData) {
    const product = await ProductDAO.create(productData);
    return new ProductDTO(product);
  }
  async update(id, productData) {
    const product = await ProductDAO.update(id, productData);
    return product ? new ProductDTO(product) : null;
  }
  async delete(id) {
    return await ProductDAO.delete(id);
  }
}

module.exports = new ProductRepository();
