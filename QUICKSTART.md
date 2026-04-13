# Quick Start Guide

Get the Live Translation Platform running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- A Soniox API key (get one at https://soniox.com)

## Setup Steps

### 1. Clone & Install

```bash
cd livetranslation
npm install
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Soniox credentials:

```env
# Backend (Soniox)
SONIOX_API_KEY=your_actual_key_here
SONIOX_API_URL=https://api.soniox.com

# Frontend
VITE_BACKEND_API_URL=http://localhost:5000/api
VITE_CHURCH_NAME=Iglesia Adventista UNADECA
```

### 3. Start Development Servers

**Option A: Both servers together**
```bash
npm run dev:all
```

**Option B: Separate terminals**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:server
```

### 4. Open in Browser

Frontend: **http://localhost:3001**
Backend: **http://localhost:5000** (API)

## First Test

1. **Check backend is running:**
   ```
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok",...}`

2. **Visit frontend:** http://localhost:3001

3. **Go to "Administrador" tab**

4. **Click "🎙 Iniciar Transmisión" (Start Broadcasting)**

5. **Watch the magic happen!** ✨

## File Structure

```
livetranslation/
├── src/                    # Frontend (React/TypeScript)
│   ├── components/         # React components
│   ├── services/           # Business logic
│   ├── hooks/              # React hooks
│   └── context/            # State management
├── server/                 # Backend (Express)
│   ├── services/           # Soniox integration
│   ├── routes/             # API endpoints
│   └── middleware/         # Error handling
├── package.json            # Dependencies
├── .env                    # Configuration (create this)
└── README.md              # Full documentation
```

## Key Commands

```bash
# Development
npm run dev              # Frontend only
npm run dev:server       # Backend only
npm run dev:all          # Both servers

# Production
npm run build            # Build frontend
npm run build:server     # Build backend
npm run server           # Run backend

# Utilities
npm run lint             # Check TypeScript errors
```

## Configuration

### Frontend Settings (`.env`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_BACKEND_API_URL` | Backend API endpoint | `http://localhost:5000/api` |
| `VITE_CHURCH_NAME` | Church name display | `Iglesia Adventista UNADECA` |
| `VITE_DEFAULT_SOURCE_LANGUAGE` | Original language | `es` (Spanish) |
| `VITE_DEFAULT_TARGET_LANGUAGE` | Translation language | `en` (English) |

### Backend Settings (`.env`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `SONIOX_API_KEY` | **REQUIRED**: Your Soniox API key | ❌ Required |
| `SONIOX_API_URL` | Soniox API endpoint | `https://api.soniox.com` |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Allowed frontend URLs | `http://localhost:3000,3001` |

## Troubleshooting

### "Cannot GET /api/soniox/sessions"
- ✅ Backend not running? Run `npm run dev:server`
- ✅ Wrong URL? Check `VITE_BACKEND_API_URL` in frontend `.env`

### "SONIOX_API_KEY is not configured"
- ✅ Add `SONIOX_API_KEY` to `.env` file
- ✅ Restart backend: `npm run dev:server`

### Port 5000 already in use
- Kill existing process: `lsof -ti:5000 | xargs kill -9`
- Or use different port: `PORT=5001 npm run dev:server`

### "WebSocket connection failed"
- ✅ Check internet connection
- ✅ Verify Soniox API key is valid
- ✅ Check backend logs for error messages

## Architecture Overview

```
Your Browser
    ↓
[React Frontend] (Port 3001)
    ↓ HTTP
[Express Backend] (Port 5000)
    ↓ HTTP
[Soniox API] (https://api.soniox.com)
    ↓ WebSocket
[Soniox Transcription Service]
```

## Features

### 👥 User Tab (Miembros)
- Real-time transcription in Spanish
- Live translation to English
- Auto-scrolling transcript feed
- Live status indicator

### ⚙️ Admin Tab (Administrador)
- Select microphone device
- Real-time audio level monitoring
- Session control (start/stop)
- Connection status dashboard

## Next Steps

1. **Read full docs:** See `README.md` for complete documentation
2. **Server setup:** Check `SERVER_SETUP.md` for backend details
3. **API reference:** Review Soniox docs at https://soniox.com/docs
4. **Deploy:** Follow deployment instructions in README.md

## Support

- 📖 Full documentation: `README.md`
- 🔧 Backend setup: `SERVER_SETUP.md`
- 🆘 Troubleshooting section in README.md
- 📡 Soniox API docs: https://soniox.com/docs

---

**Ready to go live?** Happy broadcasting! 🎙️✨
