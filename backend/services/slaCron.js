const cron = require('node-cron');
const { renewAllSubscriptions } = require('./graphService');
const { expireSlaForTicket } = require('./ticketService');
const Ticket = require('../models/ticket.model');

async function runSlaWatchdog() {
  try {
    const now = new Date();

    // Expire any ticket whose deadline has passed and is not already marked expired.
    const expiredTickets = await Ticket.find({
      slaExpired: false,
      slaDeadline: { $ne: null, $lte: now },
    }).select('_id');

    if (expiredTickets.length > 0) {
      console.log(`⏱️  SLA watchdog found ${expiredTickets.length} expired ticket(s)`);
      await Promise.all(expiredTickets.map((ticket) => expireSlaForTicket(ticket._id)));
    }

    // Renew Graph subscriptions for Outlook users whose subscriptions are about to expire.
    await renewAllSubscriptions();
  } catch (err) {
    console.error('❌ slaCron error:', err.message);
  }
}

function startSlaCron() {
  runSlaWatchdog();
  cron.schedule('* * * * *', runSlaWatchdog);
}

module.exports = { startSlaCron };
