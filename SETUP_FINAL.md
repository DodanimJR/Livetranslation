# Final Setup - Add Your Soniox API Key

Your **Iglesia Adventista UNADECA Live Translation Platform** is almost ready! 

You now have both servers running:
- ✅ Frontend: http://localhost:3001
- ✅ Backend: http://localhost:5000

## One Final Step: Add Your Soniox API Key

### Step 1: Get Your API Key

1. Go to [Soniox Console](https://console.soniox.com) 
2. Sign in to your account
3. Navigate to **API Keys** section
4. Copy your API key

### Step 2: Create `.env` File

In the project root directory, create a `.env` file:

```bash
# On Windows (PowerShell)
New-Item -Path .env -ItemType File

# On Mac/Linux
touch .env
```

### Step 3: Add Your Configuration

Edit the `.env` file and add:

```env
# ===== REQUIRED: Soniox Configuration =====
SONIOX_API_KEY=your_actual_api_key_here
SONIOX_API_URL=https://api.soniox.com

# ===== Frontend Configuration =====
VITE_BACKEND_API_URL=http://localhost:5000/api
VITE_CHURCH_NAME=Iglesia Adventista UNADECA
VITE_DEFAULT_SOURCE_LANGUAGE=es
VITE_DEFAULT_TARGET_LANGUAGE=en

# ===== Backend Configuration =====
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Step 4: Restart the Servers

Kill the running servers and restart:

```bash
npm run dev:all
```

You should now see:
- ✅ No more warning about missing API key
- ✅ Backend shows: "🚀 Server running on http://localhost:5000"
- ✅ Frontend shows: "➜ Local: http://localhost:3001"

## Test It Works

### 1. Open Frontend

Visit: **http://localhost:3001**

### 2. Go to Admin Tab

Click the "Administrador" (Admin) tab

### 3. Click "Iniciar Transmisión"

Click the green **🎙 Iniciar Transmisión** button

### 4. Check the Status

You should see:
- ✅ Audio device detected
- ✅ Session ID created
- ✅ Soniox connected (green checkmark)
- ✅ Recording started

### 5. Speak into Your Microphone

Speak in Spanish, and you should see:
- 📝 Transcription appearing on the **Miembros** tab
- 🌍 Translation to English appearing below

## Troubleshooting

### "SONIOX_API_KEY not configured" in logs
- ✅ Add `SONIOX_API_KEY` to `.env` file
- ✅ Restart servers: `npm run dev:all`

### "Invalid API key" error
- ✅ Double-check your API key is correct
- ✅ Make sure you copied the entire key (no extra spaces)
- ✅ Verify key is active in Soniox console

### Backend won't start
- ✅ Port 5000 in use? Change in `.env`: `PORT=5001`
- ✅ Check `.env` file exists in project root
- ✅ Restart with: `npm run dev:all`

### Frontend won't load
- ✅ Check frontend URL: http://localhost:3001
- ✅ Check backend is running: http://localhost:5000/health
- ✅ Check `VITE_BACKEND_API_URL` in `.env`

### No audio devices detected
- ✅ Check browser microphone permissions
- ✅ Make sure microphone is connected
- ✅ Click "🔄 Actualizar Dispositivos" button

## Environment Variables Reference

### Required Variables
| Variable | Example | Description |
|----------|---------|-------------|
| `SONIOX_API_KEY` | `sk_...` | Your Soniox API key (REQUIRED) |

### Optional Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `SONIOX_API_URL` | `https://api.soniox.com` | Soniox API endpoint |
| `VITE_BACKEND_API_URL` | `http://localhost:5000/api` | Backend API endpoint |
| `VITE_CHURCH_NAME` | `Iglesia Adventista UNADECA` | Church name display |
| `VITE_DEFAULT_SOURCE_LANGUAGE` | `es` | Original language (Spanish) |
| `VITE_DEFAULT_TARGET_LANGUAGE` | `en` | Translation language (English) |
| `PORT` | `5000` | Backend server port |
| `NODE_ENV` | `development` | Node environment |
| `CORS_ORIGIN` | `http://localhost:3001` | Allowed frontend URLs |

## Next Steps

### Customize Church Info
Edit in `.env`:
```env
VITE_CHURCH_NAME=Your Church Name
VITE_CHURCH_LOGO_URL=https://your-logo-url.png
```

### Support Multiple Languages
Available languages:
- Spanish (es) - Default
- English (en)
- French (fr)
- Portuguese (pt)
- German (de)

Change in `.env`:
```env
VITE_DEFAULT_SOURCE_LANGUAGE=es
VITE_DEFAULT_TARGET_LANGUAGE=en
```

### Deploy to Production
See `README.md` for deployment instructions to:
- Vercel
- Netlify
- AWS
- Traditional servers

## File Locations

```
livetranslation/
├── .env                      ← ADD YOUR KEY HERE!
├── package.json
├── QUICKSTART.md             ← Quick reference
├── README.md                 ← Full documentation
├── SERVER_SETUP.md           ← Backend details
├── src/                      ← Frontend code
├── server/                   ← Backend code
```

## Support & Resources

- 📖 **QUICKSTART.md** - Quick reference guide
- 📚 **README.md** - Full documentation
- 🔧 **SERVER_SETUP.md** - Backend configuration
- 🔗 **Soniox Docs** - https://soniox.com/docs
- 💬 **Issues** - Check GitHub for reported problems

## You're Ready! 🎉

You now have a fully functional live transcription and translation platform for your church!

### Key Features at Your Fingertips:

✅ **Real-time Transcription** - Spanish speech → Text  
✅ **Live Translation** - Spanish → English (+ more languages)  
✅ **Audio Monitoring** - Visual level indicators  
✅ **Device Management** - Multiple microphone support  
✅ **Professional UI** - Beautiful, responsive design  
✅ **Church Branding** - Customizable with your church info  

---

**Questions?** Check the documentation files or visit the Soniox support page.

**Ready to broadcast?** Click that green 🎙 button and start translating! 

**Iglesia Adventista UNADECA** - Bringing the message to everyone, everywhere. 🙏
