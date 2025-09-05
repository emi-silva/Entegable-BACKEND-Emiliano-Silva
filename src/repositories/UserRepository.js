const UserDAO = require('../dao/UserDAO');
const UserDTO = require('../dto/UserDTO');

class UserRepository {
  async getAll() {
    const users = await UserDAO.getAll();
    return users.map(u => new UserDTO(u));
  }
  async getById(id) {
    const user = await UserDAO.getById(id);
    return user ? new UserDTO(user) : null;
  }
  async getByEmail(email) {
    const user = await UserDAO.getByEmail(email);
    return user ? new UserDTO(user) : null;
  }
  async create(userData) {
    const user = await UserDAO.create(userData);
    return new UserDTO(user);
  }
  async update(id, userData) {
    const user = await UserDAO.update(id, userData);
    return user ? new UserDTO(user) : null;
  }
  async delete(id) {
    return await UserDAO.delete(id);
  }
}

module.exports = new UserRepository();
