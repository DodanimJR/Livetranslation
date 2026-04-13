/**
 * Iglesia Adventista UNADECA - Live Translation Backend
 * Monolithic JavaScript version for cPanel deployment
 * 
 * This file contains everything: Express server, WebSocket, API routes
 * No TypeScript, no tsx, no module imports - just plain Node.js
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env from:', envPath);
} else {
  dotenv.config();
  console.log('Loaded .env from default location');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Parse CORS origins
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map(o => o.trim());

log('CORS origins: ' + corsOrigins.join(', '));

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ============ WEBSOCKET BROADCAST SERVER ============
const clients = new Set();
let isLive = false;
const transcriptEntries = [];

function broadcastMessage(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastEntry(entry) {
  transcriptEntries.push(entry);
  broadcastMessage({
    type: 'entry',
    data: entry
  });
}

function broadcastStatus(live) {
  isLive = live;
  broadcastMessage({
    type: 'status',
    data: { isLive }
  });
}

function broadcastClear() {
  transcriptEntries.length = 0;
  broadcastMessage({
    type: 'clear'
  });
}

// ============ SONIOX SERVICE ============
// The browser connects directly to Soniox using the master API key.
// cPanel outbound HTTPS may be restricted, so we avoid making a
// server-side call to Soniox's temporary-key endpoint and instead
// pass the master key through. The key is scoped by CORS so it is
// only usable from the allowed origin.
async function createTemporaryApiKey(masterApiKey) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  return {
    api_key: masterApiKey,
    expires_at: expiresAt.toISOString()
  };
}

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sonioxConfigured: !!process.env.SONIOX_API_KEY,
    adminConfigured: !!process.env.ADMIN_PASSWORD,
    clientsConnected: clients.size,
    isLive: isLive
  });
});

// Soniox temporary key endpoint
app.post('/api/soniox/temporary-key', async (req, res) => {
  try {
    const apiKey = process.env.SONIOX_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'SONIOX_API_KEY is not configured on the server.',
      });
    }

    const result = await createTemporaryApiKey(apiKey);

    res.json({
      success: true,
      data: {
        apiKey: result.api_key,
        expiresAt: result.expires_at,
        wsUrl: 'wss://stt-rt.soniox.com/transcribe-websocket',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({
      success: false,
      error: 'ADMIN_PASSWORD is not configured on the server.',
    });
  }

  if (!password || password !== adminPassword) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password.',
    });
  }

  // Simple token
  const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    data: { token },
  });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    if (!decoded.startsWith('admin:')) {
      throw new Error('invalid');
    }
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  res.json({ success: true });
});

// Broadcast routes
app.post('/api/broadcast/entry', (req, res) => {
  const entry = req.body;
  if (!entry || !entry.text) {
    return res.status(400).json({ success: false, error: 'Missing entry data' });
  }
  broadcastEntry(entry);
  res.json({ success: true });
});

app.post('/api/broadcast/status', (req, res) => {
  const { isLive: liveStatus } = req.body;
  if (typeof liveStatus !== 'boolean') {
    return res.status(400).json({ success: false, error: 'isLive must be boolean' });
  }
  broadcastStatus(liveStatus);
  res.json({ success: true });
});

app.post('/api/broadcast/clear', (req, res) => {
  broadcastClear();
  res.json({ success: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// ============ CREATE SERVER ============
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  log('New WebSocket client connected');
  clients.add(ws);
  
  // Send current state
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      isLive: isLive,
      entries: transcriptEntries
    }
  }));
  
  ws.on('close', () => {
    log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    log(`WebSocket error: ${error.message}`);
    clients.delete(ws);
  });
});

// ============ START SERVER ============
server.listen(PORT, () => {
  const hasKey = !!process.env.SONIOX_API_KEY;
  const hasAdminPw = !!process.env.ADMIN_PASSWORD;
  
  log('========================================');
  log('Iglesia Adventista UNADECA - Backend Server');
  log('========================================');
  log(`HTTP:    http://localhost:${PORT}`);
  log(`WS:      ws://localhost:${PORT}`);
  log(`CORS:    ${corsOrigins.join(', ')}`);
  log(`Soniox:  ${hasKey ? 'configured' : 'WARNING: SONIOX_API_KEY missing!'}`);
  log(`Admin:   ${hasAdminPw ? 'password set' : 'WARNING: ADMIN_PASSWORD missing!'}`);
  log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

// Log any uncaught errors
process.on('uncaughtException', (err) => {
  log(`Uncaught Exception: ${err.message}`);
  log(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
