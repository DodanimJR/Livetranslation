# Backend Server Setup Guide

## Overview

The application uses an Express.js backend server to handle Soniox API calls and avoid CORS issues. The frontend communicates with the backend, which then proxies requests to Soniox.

```
Frontend (React) → Backend (Express) → Soniox API
```

## Why a Backend?

Soniox API doesn't support CORS (Cross-Origin Resource Sharing) requests directly from browsers. By having a backend server, we can:

- ✅ Make server-to-server API calls (no CORS restrictions)
- ✅ Keep the Soniox API key secure (never exposed to the browser)
- ✅ Handle authentication and request validation
- ✅ Implement additional business logic if needed

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in the project root (or update your existing `.env.local`):

```bash
cp .env.example .env
```

Edit `.env` and add your Soniox credentials in the backend section:

```env
# Soniox API Configuration (Backend Only)
SONIOX_API_KEY=your_actual_soniox_api_key_here
SONIOX_API_URL=https://api.soniox.com

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 2. Start Both Frontend and Backend

**Option A: Run both concurrently**

```bash
npm run dev:all
```

This will start:
- Frontend on `http://localhost:3000` or `http://localhost:3001`
- Backend on `http://localhost:5000`

**Option B: Run separately in different terminals**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:server
```

## API Endpoints

The backend exposes the following endpoints:

### Health Check
```
GET /health
```

### Create Transcription Session
```
POST /api/soniox/sessions

Request Body:
{
  "languageCode": "es",
  "audioModel": "default",
  "enableTranslation": true,
  "translationLanguageCode": "en"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "session_uuid",
    "wsUrl": "wss://api.soniox.com/v1/sessions/session_uuid/stream?key=..."
  }
}
```

### Get Session Details
```
GET /api/soniox/sessions/:sessionId

Response:
{
  "success": true,
  "data": { ... }
}
```

### End Session
```
POST /api/soniox/sessions/:sessionId/end

Response:
{
  "success": true,
  "message": "Session ended successfully"
}
```

### Get WebSocket URL
```
GET /api/soniox/sessions/:sessionId/ws-url

Response:
{
  "success": true,
  "data": {
    "wsUrl": "wss://api.soniox.com/..."
  }
}
```

## Frontend Configuration

The frontend automatically connects to the backend using the `VITE_BACKEND_API_URL` environment variable:

**Frontend `.env.local`:**
```env
VITE_BACKEND_API_URL=http://localhost:5000/api
```

## Production Deployment

### Building for Production

```bash
npm run build
npm run build:server
```

This creates:
- `dist/` - Frontend build
- `dist/server/` - Backend build

### Running in Production

```bash
# Start backend
npm run server

# Serve frontend (using a static file server)
# You can use services like Vercel, Netlify, or traditional web servers
```

### Environment Variables for Production

```env
# Frontend
VITE_BACKEND_API_URL=https://your-backend-domain.com/api

# Backend
SONIOX_API_KEY=your_api_key
SONIOX_API_URL=https://api.soniox.com
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

## Troubleshooting

### Backend won't start

**Error: `EADDRINUSE: address already in use :::5000`**

The port 5000 is already in use. Either:
- Kill the process using port 5000
- Change the PORT in your `.env` file
- Use a different port: `PORT=5001 npm run dev:server`

**Solution:**
```bash
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# On Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### CORS errors still occurring

Make sure:
1. Backend is running (`npm run dev:server`)
2. `CORS_ORIGIN` in backend `.env` matches your frontend URL
3. Frontend `VITE_BACKEND_API_URL` points to correct backend URL
4. No firewall blocking the connection

### Soniox API errors

**"API key is not configured"**
- Check your `.env` file has `SONIOX_API_KEY` set
- Make sure it's not empty or incorrect
- Verify the key is valid from Soniox console

**"Failed to create session"**
- Verify Soniox API is accessible: `https://api.soniox.com`
- Check your internet connection
- Verify API key has proper permissions

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vite)           │
│  - User Interface                       │
│  - Audio Capture                        │
│  - WebSocket Connection to Soniox       │
└────────────────┬────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────┐
│      Backend (Express/TypeScript)       │
│  - Session Management                   │
│  - API Proxying                         │
│  - CORS Handling                        │
│  - Error Handling                       │
└────────────────┬────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────┐
│         Soniox API                      │
│  - Transcription                        │
│  - Translation                          │
│  - Real-time WebSocket Streaming        │
└─────────────────────────────────────────┘
```

## Performance Tips

1. **Connection pooling**: Backend reuses HTTP connections to Soniox
2. **Async handling**: All operations are non-blocking
3. **Error recovery**: Graceful error handling and logging
4. **Scalability**: Can run multiple backend instances behind a load balancer

## Security Considerations

- ✅ API key never exposed to browser
- ✅ CORS validation on all requests
- ✅ Input validation on all endpoints
- ✅ Error messages don't leak sensitive information
- ⚠️ In production, use HTTPS for all communications
- ⚠️ Store API keys in secure environment variables
- ⚠️ Implement rate limiting for production

## Development Workflow

1. Start both servers: `npm run dev:all`
2. Frontend available at: `http://localhost:3001`
3. Backend available at: `http://localhost:5000`
4. Health check: `curl http://localhost:5000/health`

## Support

For issues:
- Check server logs in the terminal
- Verify `.env` configuration
- Test API endpoints with curl or Postman
- Review Soniox API documentation
