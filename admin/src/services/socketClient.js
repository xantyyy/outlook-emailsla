/**
 * services/socketClient.js  (FRONTEND — place in src/services/)
 *
 * Singleton Socket.io client.
 * Import `socket` wherever you need real-time events.
 *
 * Usage:
 *   import { socket } from '../services/socketClient';
 *   socket.on('ticket:statusUpdated', handler);
 *   socket.emit('joinTicket', ticketId);
 *
 * The socket is lazy-connected: it only opens when first imported.
 * Pass the logged-in user's ID via auth so the server can identify the connection.
 */

import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  || process.env.REACT_APP_BACKEND_URL
  || 'http://localhost:5000';

// Read stored userId from wherever your auth layer keeps it.
// Adjust this if you use a different auth store (Redux, Context, etc.)
function getStoredUserId() {
  try {
    const raw = localStorage.getItem('adminUser') || localStorage.getItem('user');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id;
  } catch {
    return undefined;
  }
}

export const socket = io(BACKEND_URL, {
  path:        '/socket.io',
  autoConnect: true,
  withCredentials: true,
  auth: {
    userId: getStoredUserId(),
  },
  reconnection:        true,
  reconnectionAttempts: 10,
  reconnectionDelay:   1_000,
  reconnectionDelayMax: 10_000,
});

// ── Debug logging in development ──
if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
  socket.on('connect',    ()  => console.log('[socket] connected:', socket.id));
  socket.on('disconnect', (r) => console.log('[socket] disconnected:', r));
  socket.on('connect_error', (e) => console.warn('[socket] connect error:', e.message));
}