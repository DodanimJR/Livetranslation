/**
 * Simple JavaScript server - no TypeScript, no tsx
 * Test if basic Node.js works on cPanel
 */
const express = require('express');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'JavaScript server is running'
  });
});

// Simple API routes
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminPassword) {
    return res.status(500).json({ success: false, error: 'ADMIN_PASSWORD not configured' });
  }
  
  if (password !== adminPassword) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }
  
  res.json({ success: true, data: { token: 'test-token-123' } });
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`
========================================
JavaScript Server Running
HTTP: http://localhost:${PORT}
========================================
  `);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
