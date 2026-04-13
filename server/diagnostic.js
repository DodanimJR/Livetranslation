/**
 * Diagnostic server - logs everything to file
 */
const fs = require('fs');
const path = require('path');

const logFile = '/home/vcubed/transcription_backend/debug.log';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(logFile, line);
}

try {
  log('=== SERVER STARTING ===');
  log(`Node version: ${process.version}`);
  log(`Working directory: ${process.cwd()}`);
  log(`__dirname: ${__dirname}`);
  
  // Check if .env exists
  const envPath = path.join(__dirname, '.env');
  log(`Checking for .env at: ${envPath}`);
  if (fs.existsSync(envPath)) {
    log('.env file FOUND');
  } else {
    log('.env file NOT FOUND');
  }
  
  // Try loading dotenv
  log('Loading dotenv...');
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
  log('dotenv loaded');
  
  // Check environment
  log(`PORT env: ${process.env.PORT || 'NOT SET'}`);
  log(`SONIOX_API_KEY: ${process.env.SONIOX_API_KEY ? 'SET (hidden)' : 'NOT SET'}`);
  log(`ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? 'SET (hidden)' : 'NOT SET'}`);
  
  // Try loading express
  log('Loading express...');
  const express = require('express');
  log('express loaded');
  
  // Try loading other modules
  log('Loading cors...');
  const cors = require('cors');
  log('cors loaded');
  
  log('Loading ws...');
  const WebSocket = require('ws');
  log('ws loaded');
  
  // Create app
  const app = express();
  const PORT = process.env.PORT || 5000;
  
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    log('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
  });
  
  // Simple error test
  app.get('/error', (req, res) => {
    throw new Error('Test error');
  });
  
  // Global error handler
  app.use((err, req, res, next) => {
    log(`Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  });
  
  // Start server
  log(`Starting server on port ${PORT}...`);
  const server = app.listen(PORT, () => {
    log(`=== SERVER STARTED SUCCESSFULLY ===`);
    log(`Listening on port ${PORT}`);
  });
  
  // Handle errors
  server.on('error', (err) => {
    log(`Server error: ${err.message}`);
  });
  
} catch (error) {
  log(`=== FATAL ERROR ===`);
  log(error.message);
  log(error.stack);
  process.exit(1);
}

// Keep running
setInterval(() => {
  log('Heartbeat');
}, 30000);
