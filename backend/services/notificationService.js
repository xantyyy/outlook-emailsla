// ============================================
// REAL-TIME NOTIFICATION SERVICE (Backend)
// WebSocket Server for Instant Bug Notifications
// ============================================

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationService {
  constructor(server) {
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/notifications'
    });
    
    // Store connected clients
    this.clients = new Map(); // Map<userId, Set<WebSocket>>
    
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', (ws, req) => {
      console.log('📡 New WebSocket connection');

      // Authenticate the connection
      const token = this.extractToken(req);
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Store client connection
        if (!this.clients.has(userId)) {
          this.clients.set(userId, new Set());
        }
        this.clients.get(userId).add(ws);

        console.log(`✅ Client authenticated: ${userId}`);
        console.log(`📊 Total connections: ${this.getTotalConnections()}`);

        // Send welcome message
        this.sendToClient(ws, {
          type: 'connected',
          message: 'Connected to real-time notifications',
          timestamp: new Date()
        });

        // Handle messages from client
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            console.log('📨 Received from client:', data);
            
            // Handle ping/pong for keep-alive
            if (data.type === 'ping') {
              this.sendToClient(ws, { type: 'pong', timestamp: new Date() });
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        // Handle client disconnect
        ws.on('close', () => {
          console.log(`❌ Client disconnected: ${userId}`);
          const userClients = this.clients.get(userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              this.clients.delete(userId);
            }
          }
          console.log(`📊 Total connections: ${this.getTotalConnections()}`);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

      } catch (error) {
        console.error('Authentication error:', error);
        ws.close(1008, 'Invalid token');
      }
    });
  }

  // Extract token from query params or headers
  extractToken(req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) return token;
    
    // Try to get from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  // Send notification to specific user
  notifyUser(userId, notification) {
    const userClients = this.clients.get(userId);
    
    if (!userClients || userClients.size === 0) {
      console.log(`⚠️ No active connections for user: ${userId}`);
      return false;
    }

    const payload = {
      type: 'notification',
      data: notification,
      timestamp: new Date()
    };

    let sent = 0;
    userClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(payload));
        sent++;
      }
    });

    console.log(`✉️ Notification sent to ${sent} client(s) for user: ${userId}`);
    return sent > 0;
  }

  // Broadcast to all connected clients
  broadcast(notification) {
    const payload = {
      type: 'broadcast',
      data: notification,
      timestamp: new Date()
    };

    let sent = 0;
    this.clients.forEach((clientSet) => {
      clientSet.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
          sent++;
        }
      });
    });

    console.log(`📢 Broadcast sent to ${sent} client(s)`);
    return sent;
  }

  // Send to specific client
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Notify about new bug from Outlook
  notifyNewBugFromOutlook(bugData) {
    const notification = {
      type: 'new_bug_outlook',
      title: '🐛 New Bug from Outlook',
      message: `New bug report: "${bugData.title}"`,
      data: bugData,
      bugId: bugData._id,
      severity: bugData.severity,
      priority: bugData.priority,
      reportedBy: bugData.reportedBy,
      source: 'outlook'
    };

    // Broadcast to all admin users
    return this.broadcast(notification);
  }

  // Notify about bug status change
  notifyBugStatusChange(bugData, oldStatus, newStatus) {
    const notification = {
      type: 'bug_status_change',
      title: '🔄 Bug Status Updated',
      message: `Bug "${bugData.title}" changed from ${oldStatus} to ${newStatus}`,
      bugId: bugData._id,
      oldStatus,
      newStatus
    };

    return this.broadcast(notification);
  }

  // Notify about bug assignment
  notifyBugAssignment(bugData, assignedTo) {
    const notification = {
      type: 'bug_assigned',
      title: '👤 Bug Assigned',
      message: `Bug "${bugData.title}" assigned to ${assignedTo.name}`,
      bugId: bugData._id,
      assignedTo
    };

    // Notify the assigned user
    if (assignedTo._id) {
      this.notifyUser(assignedTo._id.toString(), notification);
    }

    return this.broadcast(notification);
  }

  // Get total number of connections
  getTotalConnections() {
    let total = 0;
    this.clients.forEach(clientSet => {
      total += clientSet.size;
    });
    return total;
  }

  // Get number of connected users
  getConnectedUsers() {
    return this.clients.size;
  }

  // Health check
  getStats() {
    return {
      totalConnections: this.getTotalConnections(),
      connectedUsers: this.getConnectedUsers(),
      timestamp: new Date()
    };
  }
}

module.exports = NotificationService;