const Ticket = require('../models/Ticket');

class TicketRepository {
  async create(ticketData) {
    return await Ticket.create(ticketData);
  }
  async getById(id) {
    return await Ticket.findById(id);
  }
  async getAll() {
    return await Ticket.find();
  }
}

module.exports = new TicketRepository();
