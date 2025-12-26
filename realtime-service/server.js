const WebSocket = require('ws');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
require('dotenv').config({ path: '../backend/.env' });

const PORT = process.env.REALTIME_PORT || 8002;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'saree_live';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

// Initialize MongoDB
let db;
MongoClient.connect(MONGO_URL)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Redis for locking
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryStrategy: () => null
});

redis.on('error', (err) => {
  console.log('Redis not available, continuing without inventory locking');
});

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();

// Keyword detection function
function detectKeyword(text) {
  const regex = /\bBUY\s+([A-Z0-9]+)\b/gi;
  const matches = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      keyword: 'BUY',
      saree_code: match[1].toUpperCase(),
      position: match.index,
      matched_text: match[0]
    });
  }
  
  return matches;
}

// Create order from comment
async function createOrderFromComment(sessionId, comment, keyword) {
  try {
    // Check if saree exists
    const saree = await db.collection('sarees').findOne({ saree_code: keyword.saree_code });
    if (!saree) {
      console.log(`Saree ${keyword.saree_code} not found`);
      return null;
    }
    
    // Check inventory lock
    const lockKey = `lock:${saree.id}`;
    const isLocked = await redis.get(lockKey);
    
    if (isLocked) {
      console.log(`Saree ${keyword.saree_code} is locked`);
      return null;
    }
    
    // Create order via API
    const axios = require('axios');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8001';
    
    try {
      const orderResponse = await axios.post(`${backendUrl}/api/orders/`, {
        saree_code: keyword.saree_code,
        customer_name: comment.username,
        phone_number: '', // Will be collected via WhatsApp
        payment_method: 'upi'
      }, {
        params: {
          live_session_id: sessionId
        }
      });
      
      const order = orderResponse.data;
      console.log(`Order ${order.order_id} created automatically for ${keyword.saree_code}`);
      
      // Lock inventory for 15 minutes (backend will also lock, this is backup)
      await redis.setex(lockKey, 900, order.order_id);
      
      // Broadcast order creation to all clients
      broadcast({
        type: 'order_created',
        data: order
      });
      
      return order;
    } catch (apiError) {
      console.error('Failed to create order via API:', apiError.message);
      return null;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

// Process comment
async function processComment(sessionId, comment) {
  try {
    // Detect keywords
    const keywords = detectKeyword(comment.comment_text);
    
    // Save comment to database
    const commentDoc = {
      id: generateUUID(),
      live_session_id: sessionId,
      platform: comment.platform,
      username: comment.username,
      user_id: comment.user_id,
      comment_text: comment.comment_text,
      matched_keyword: keywords.length > 0 ? 'BUY' : null,
      saree_code: keywords.length > 0 ? keywords[0].saree_code : null,
      timestamp: new Date().toISOString()
    };
    
    await db.collection('live_comments').insertOne(commentDoc);
    
    // If keyword detected, create order
    if (keywords.length > 0) {
      for (const keyword of keywords) {
        const order = await createOrderFromComment(sessionId, comment, keyword);
        
        if (order) {
          // Broadcast order creation to all clients
          broadcast({
            type: 'order_created',
            data: order
          });
          
          // TODO: Trigger WhatsApp automation
        }
      }
    }
    
    // Broadcast comment to all clients
    broadcast({
      type: 'new_comment',
      data: commentDoc
    });
    
  } catch (error) {
    console.error('Error processing comment:', error);
  }
}

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const clientId = generateUUID();
  clients.set(clientId, ws);
  
  console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe_session':
          ws.sessionId = data.session_id;
          console.log(`Client ${clientId} subscribed to session ${data.session_id}`);
          break;
        
        case 'new_comment':
          // Process incoming comment from platform
          await processComment(data.session_id, data.comment);
          break;
        
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${clients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`Real-time service running on port ${PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing connections...');
  wss.close(() => {
    redis.quit();
    process.exit(0);
  });
});
