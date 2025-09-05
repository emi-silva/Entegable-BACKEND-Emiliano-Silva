const User = require('../models/User');

class UserDAO {
  async getAll() {
    return User.find();
  }
  async getById(id) {
    return User.findById(id);
  }
  async getByEmail(email) {
    return User.findOne({ email });
  }
  async create(userData) {
    return User.create(userData);
  }
  async update(id, userData) {
    return User.findByIdAndUpdate(id, userData, { new: true });
  }
  async delete(id) {
    return User.findByIdAndDelete(id);
  }
}

module.exports = new UserDAO();
