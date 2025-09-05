class CartDTO {
  constructor(cart) {
    this.id = cart._id;
    this.products = cart.products.map(item => ({
      product: item.product._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    }));
  }
}

module.exports = CartDTO;
