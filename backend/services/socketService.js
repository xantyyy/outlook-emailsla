/**
 * services/socketService.js
 *
 * Socket.io v4 server with @socket.io/redis-adapter.
 * Enables real-time ticket status broadcasting across multiple Node.js processes.
 *
 * USAGE IN server.js
 * ──────────────────
 *   const { initSocketServer } = require('./services/socketService');
 *   const server = http.createServer(app);
 *   initSocketServer(server);          // ← call once, before server.listen()
 *   // global.io is now available everywhere in the process
 *
 * EVENTS EMITTED BY SERVER
 * ────────────────────────
 *   ticket:statusUpdated  — payload: { ticketId, conversationId, status, previousStatus,
 *                                      slaDeadline, slaPausedAt, slaTotalPausedMs, reason }
 *   ticket:slaExpired     — payload: { ticketId, conversationId }
 *
 * ROOMS
 * ─────
 *   ticket:<ticketId>     — clients watching a specific ticket
 *   (global broadcast)    — all agents watching the inbox list
 *
 * CLIENT USAGE (frontend)
 * ───────────────────────
 *   import { socket } from '../services/socketClient';
 *
 *   // Join a ticket room when detail view opens
 *   socket.emit('joinTicket', ticketId);
 *
 *   // Listen for status updates
 *   socket.on('ticket:statusUpdated', (payload) => {
 *     queryClient.setQueryData(['ticket', payload.conversationId], old => ({
 *       ...old,
 *       status: payload.status,
 *     }));
 *   });
 *
 * REDIS ADAPTER
 * ─────────────
 * Required when running multiple server instances (e.g. PM2 cluster / Kubernetes).
 * For a single-instance deployment you can remove the Redis adapter and it still works.
 *
 * Install deps:
 *   npm install socket.io @socket.io/redis-adapter ioredis
 */

const { Server }      = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient }  = require('ioredis');

/**
 * initSocketServer(httpServer)
 *
 * @param {http.Server} httpServer
 */
function initSocketServer(httpServer) {
  const FRONTEND_URL  = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const REDIS_URL     = process.env.REDIS_URL || 'redis://localhost:6379';
  const USE_REDIS     = process.env.USE_REDIS_ADAPTER !== 'false'; // default true

  const io = new Server(httpServer, {
    cors: {
      origin:      FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    // Path must be distinct from API routes
    path: '/socket.io',
    // Increase ping timeout for slow connections
    pingTimeout:  30_000,
    pingInterval: 10_000,
  });

  // ── Redis adapter (for multi-instance deployments) ──
  if (USE_REDIS) {
    try {
      const pubClient = createClient(REDIS_URL);
      const subClient = pubClient.duplicate();

      // ioredis connection errors should not crash the server
      pubClient.on('error', err => console.error('[Redis pub]', err.message));
      subClient.on('error', err => console.error('[Redis sub]', err.message));

      io.adapter(createAdapter(pubClient, subClient));
      console.log(`✅ [socketService] Redis adapter connected: ${REDIS_URL}`);
    } catch (err) {
      console.error('[socketService] Redis adapter init failed — falling back to in-memory:', err.message);
    }
  } else {
    console.log('ℹ [socketService] Redis adapter disabled — using in-memory adapter');
  }

  // ── Connection handler ──
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    console.log(`[socket] Client connected: socketId=${socket.id} userId=${userId || 'anonymous'}`);

    // ── Join a ticket-specific room for granular updates ──
    socket.on('joinTicket', (ticketId) => {
      if (!ticketId) return;
      socket.join(`ticket:${ticketId}`);
      console.log(`[socket] ${socket.id} joined room ticket:${ticketId}`);
    });

    socket.on('leaveTicket', (ticketId) => {
      if (!ticketId) return;
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] Client disconnected: ${socket.id} reason=${reason}`);
    });

    // ── Error handling ──
    socket.on('error', (err) => {
      console.error(`[socket] Error on ${socket.id}:`, err.message);
    });
  });

  // ── Expose globally so ticketService can emit without importing io ──
  global.io = io;

  console.log(`✅ [socketService] Socket.io server initialised (path=/socket.io)`);
  return io;
}

module.exports = { initSocketServer };