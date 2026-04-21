const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ticket = require('./models/ticket.model');

dotenv.config();

async function setAllTicketsToNew() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/outlook-emailsla');

    const result = await Ticket.updateMany(
      {},
      {
        status: 'new',
        customerStatus: 'new',
        statusHistory: [{ status: 'new', changedAt: new Date(), reason: 'bulk_update' }],
        slaStartedAt: null,
        slaDeadline: null,
        slaPausedAt: null,
        slaTotalPausedMs: 0,
        slaExpired: false,
      }
    );

    console.log(`Updated ${result.modifiedCount} tickets to 'new' status.`);
  } catch (error) {
    console.error('Error updating tickets:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setAllTicketsToNew();