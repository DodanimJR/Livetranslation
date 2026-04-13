import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import sonioxRoutes from './routes/soniox.js';

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
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    sonioxConfigured: !!process.env.SONIOX_API_KEY,
  });
});

// API Routes
app.use('/api/soniox', sonioxRoutes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  const hasKey = !!process.env.SONIOX_API_KEY;
  console.log(`
  Iglesia Adventista UNADECA - Backend Server

  Server:  http://localhost:${PORT}
  CORS:    ${corsOrigins.join(', ')}
  Soniox:  ${hasKey ? 'API key configured' : 'WARNING: SONIOX_API_KEY missing!'}
  `);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
