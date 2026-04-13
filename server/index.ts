import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { errorHandler } from './middleware/errorHandler.js';
import sonioxRoutes from './routes/soniox.js';
import authRoutes from './routes/auth.js';
import broadcastRoutes from './routes/broadcast.js';
import { initBroadcastServer } from './services/broadcastServer.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse CORS origins into an array
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((o) => o.trim());

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sonioxConfigured: !!process.env.SONIOX_API_KEY,
  });
});

// API Routes
app.use('/api/soniox', sonioxRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/broadcast', broadcastRoutes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server and attach WebSocket broadcast server
const server = http.createServer(app);
const wss = initBroadcastServer(server);

server.listen(PORT, () => {
  const hasKey = !!process.env.SONIOX_API_KEY;
  const hasAdminPw = !!process.env.ADMIN_PASSWORD;
  console.log(`
  Iglesia Adventista UNADECA - Backend Server

  HTTP:    http://localhost:${PORT}
  WS:      ws://localhost:${PORT}  (broadcast)
  CORS:    ${corsOrigins.join(', ')}
  Soniox:  ${hasKey ? 'configured' : 'WARNING: SONIOX_API_KEY missing!'}
  Admin:   ${hasAdminPw ? 'password set' : 'WARNING: ADMIN_PASSWORD missing!'}
  `);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
