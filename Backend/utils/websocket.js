// utils/websocket.js
const WebSocket = require('ws');

const wss = null; // Will be initialized from server.js
const bookingClients = new Map(); // bookingId → Set<ws>

function initWebSocket(server) {
  const wsServer = new WebSocket.Server({ server });

  wsServer.on('connection', (ws, req) => {
    console.log('🔌 New WebSocket client connected');

    const urlParts = req.url ? req.url.split('/') : [];
    const bookingId = urlParts[urlParts.length - 1];

    if (bookingId && bookingId !== 'undefined' && bookingId !== '') {
      if (!bookingClients.has(bookingId)) {
        bookingClients.set(bookingId, new Set());
      }
      bookingClients.get(bookingId).add(ws);

      console.log(`📡 Client subscribed to booking #${bookingId}`);

      ws.send(JSON.stringify({
        type: 'connected',
        message: `Connected to real-time updates for booking #${bookingId}`,
        bookingId
      }));
    }

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected');
      bookingClients.forEach((clients, id) => {
        clients.delete(ws);
        if (clients.size === 0) bookingClients.delete(id);
      });
    });
  });

  console.log('✅ WebSocket server initialized');
  return wsServer;
}

function broadcastBookingUpdate(bookingId, updateData) {
  const clients = bookingClients.get(bookingId.toString());
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify({
    type: 'booking_update',
    booking: updateData,
    timestamp: new Date().toISOString()
  });

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`📢 Broadcasted update for booking #${bookingId}`);
}

module.exports = {
  initWebSocket,
  broadcastBookingUpdate
};