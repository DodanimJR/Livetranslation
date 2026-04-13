# Deploying to cPanel

Complete guide to deploy the Live Translation Platform on a cPanel hosting server.

## Architecture overview

This app has **two parts** that must both run in production:

```
┌────────────────────────────┐     ┌──────────────────────────┐
│  Frontend (React SPA)      │     │  Backend (Node.js/Express)│
│  Static files served by    │────>│  API + WebSocket server   │
│  Apache / cPanel           │     │  Runs via Node.js App     │
│  Port: 443 (your domain)  │     │  Port: assigned by cPanel │
└────────────────────────────┘     └──────────────────────────┘
```

## Prerequisites

- cPanel hosting with **Node.js Selector** (or SSH access to run Node)
- A domain or subdomain pointed to your hosting
- Node.js 18+ available on the server
- Your Soniox API key
- An admin password for the control panel

---

## Step 1: Build the frontend locally

On your local machine, run:

```bash
npm install
npm run build
```

This creates a `dist/` folder with the production-ready frontend.

## Step 2: Upload files to cPanel

### Option A: File Manager

1. Log in to **cPanel**
2. Open **File Manager**
3. Navigate to `public_html` (or your subdomain folder)
4. Upload the contents of the `dist/` folder here
5. Create a new folder called `backend` in your home directory (e.g., `/home/youruser/backend`)
6. Upload the `server/` folder, `package.json`, and `package-lock.json` into `/home/youruser/backend/`

### Option B: SSH + Git

```bash
# SSH into your server
ssh youruser@yourdomain.com

# Clone the repo
cd ~
git clone <your-repo-url> livetranslation

# Build frontend
cd livetranslation
npm install
npm run build

# Copy frontend to public_html
cp -r dist/* ~/public_html/

# Set up backend directory
mkdir -p ~/backend
cp -r server/ package.json package-lock.json ~/backend/
```

## Step 3: Configure Apache for SPA routing

The React app uses client-side routing (`/admin`), so Apache needs
to serve `index.html` for all routes that don't match a real file.

Create or edit `.htaccess` in `public_html/`:

```apache
RewriteEngine On
RewriteBase /

# If the request is not a real file or directory, serve index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

## Step 4: Set up the Node.js backend

### Option A: Using cPanel Node.js Selector

1. In cPanel, go to **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18 or higher
   - **Application mode**: Production
   - **Application root**: `backend` (the folder you created)
   - **Application URL**: `api.yourdomain.com` (create a subdomain) or a subfolder
   - **Application startup file**: `server/index.ts`

   > **Note**: Since we use TypeScript, you need to set the startup command manually. See Step 5.

4. Click **Create**
5. Note the **port number** cPanel assigns

### Option B: Using SSH + PM2

If you have SSH access, PM2 is the most reliable approach:

```bash
# Install PM2 globally
npm install -g pm2

# Navigate to backend
cd ~/backend

# Install dependencies
npm install --production
npm install tsx  # needed to run TypeScript

# Create .env file
cat > .env << 'EOF'
SONIOX_API_KEY=your_actual_api_key
SONIOX_API_URL=https://api.soniox.com
ADMIN_PASSWORD=your_secure_password
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF

# Start with PM2
pm2 start "node --import tsx/esm server/index.ts" --name livetranslation-backend

# Save PM2 process list so it survives reboots
pm2 save
pm2 startup
```

## Step 5: Configure the backend startup

Since the backend is TypeScript, the startup command needs `tsx`:

```bash
node --import tsx/esm server/index.ts
```

If using cPanel Node.js Selector, set this as the startup command
in the app configuration.

## Step 6: Set up a reverse proxy for the backend

The backend runs on an internal port (e.g., 5000). You need Apache
to proxy requests to it. There are two approaches:

### Option A: Subdomain for API (recommended)

1. In cPanel, create a subdomain: `api.yourdomain.com`
2. Point it to a folder (e.g., `~/api_public`)
3. Create `.htaccess` in that folder:

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI} !^/\.well-known/
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]

# WebSocket proxy
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule ^(.*)$ ws://127.0.0.1:5000/$1 [P,L]
```

4. Update your frontend `.env` before building:

```env
VITE_BACKEND_API_URL=https://api.yourdomain.com/api
```

### Option B: Path-based proxy (no subdomain)

Add to your main `public_html/.htaccess`:

```apache
# Proxy /api requests to Node.js backend
RewriteEngine On

# API proxy
RewriteCond %{REQUEST_URI} ^/api/ [NC]
RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]

# WebSocket proxy
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteCond %{REQUEST_URI} ^/ws [NC]
RewriteRule ^ws$ ws://127.0.0.1:5000/ws [P,L]

# Health check proxy
RewriteCond %{REQUEST_URI} ^/health [NC]
RewriteRule ^health$ http://127.0.0.1:5000/health [P,L]

# SPA fallback (must be last)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/ws
RewriteRule ^ index.html [L]
```

Set in your `.env` before building:

```env
VITE_BACKEND_API_URL=https://yourdomain.com/api
```

## Step 7: Create the production .env files

### Backend `.env` (in ~/backend/)

```env
SONIOX_API_KEY=your_actual_soniox_api_key
SONIOX_API_URL=https://api.soniox.com
ADMIN_PASSWORD=your_secure_admin_password
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### Frontend `.env` (build locally before uploading)

Create `.env.production` in the project root before running `npm run build`:

```env
VITE_BACKEND_API_URL=https://api.yourdomain.com/api
VITE_CHURCH_NAME=Iglesia Adventista UNADECA
VITE_DEFAULT_SOURCE_LANGUAGE=es
VITE_DEFAULT_TARGET_LANGUAGE=en
```

Then build:

```bash
npm run build
```

Upload the `dist/` contents to `public_html/`.

## Step 8: Enable HTTPS

1. In cPanel, go to **SSL/TLS** or **Let's Encrypt**
2. Issue a certificate for your domain
3. Enable **Force HTTPS** redirect

This is critical because:
- Microphone access requires HTTPS
- WebSocket connections need WSS in production

## Step 9: Verify the deployment

### Check the backend

```bash
curl https://api.yourdomain.com/health
# or
curl https://yourdomain.com/health
```

Should return:

```json
{"status":"ok","timestamp":"...","sonioxConfigured":true}
```

### Check the frontend

1. Visit `https://yourdomain.com` — you should see the members page
2. Visit `https://yourdomain.com/admin` — you should see the login page
3. Log in with your admin password
4. Start a broadcast and verify audio levels appear

### Check WebSocket

Open browser console on the members page and look for:

```
[broadcast-client] connecting to wss://api.yourdomain.com/ws
[broadcast-client] connected
```

## Troubleshooting

### Frontend shows blank page

- Check browser console for errors
- Verify `.htaccess` SPA rewrite rules are in place
- Ensure `index.html` is in `public_html/`

### Backend won't start

- Check Node.js version: `node -v` (must be 18+)
- Check logs: `pm2 logs livetranslation-backend`
- Verify `.env` file exists and has correct values
- Check port is not in use: `lsof -i :5000`

### CORS errors

- Verify `CORS_ORIGIN` in backend `.env` matches your exact domain
  (including `https://` and no trailing slash)
- Check Apache proxy is forwarding headers correctly

### WebSocket connection fails

- Apache `mod_proxy_wstunnel` must be enabled
- Check your `.htaccess` has the WebSocket rewrite rules
- Verify the backend is running: `pm2 status`

### Microphone not working

- HTTPS is required for `getUserMedia`
- Check browser permissions
- Some shared hosting blocks WebSocket connections — contact your host

### 502 Bad Gateway

- Backend is not running. Start it: `pm2 start livetranslation-backend`
- Port mismatch between Apache proxy and backend `.env`

### /admin returns 404

- `.htaccess` SPA fallback is missing or incorrect
- Make sure the `RewriteRule ^ index.html [L]` line is present

## Complete .htaccess example

For a path-based setup (no subdomain), use this full `.htaccess`
in `public_html/`:

```apache
RewriteEngine On
RewriteBase /

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api/ [NC]
RewriteRule ^api/(.*)$ http://127.0.0.1:5000/api/$1 [P,L]

# Proxy WebSocket to Node.js backend
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteCond %{REQUEST_URI} ^/ws [NC]
RewriteRule ^ws$ ws://127.0.0.1:5000/ws [P,L]

# Proxy health check
RewriteRule ^health$ http://127.0.0.1:5000/health [P,L]

# SPA fallback — serve index.html for all other routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

## Updating the app

When you have new changes:

```bash
# Locally
git pull
npm install
npm run build

# Upload dist/ to public_html/
# Upload server/ changes to ~/backend/

# On server (SSH)
cd ~/backend
npm install
pm2 restart livetranslation-backend
```

## Quick reference

| Component | Local URL | Production URL |
|-----------|-----------|----------------|
| Members page | http://localhost:3001 | https://yourdomain.com |
| Admin panel | http://localhost:3001/admin | https://yourdomain.com/admin |
| Backend API | http://localhost:5000/api | https://yourdomain.com/api |
| WebSocket | ws://localhost:5000/ws | wss://yourdomain.com/ws |
| Health check | http://localhost:5000/health | https://yourdomain.com/health |

## Security checklist

- [ ] HTTPS enabled and forced
- [ ] `ADMIN_PASSWORD` is strong and unique
- [ ] `SONIOX_API_KEY` is not exposed in frontend code
- [ ] `CORS_ORIGIN` is set to your exact domain
- [ ] `.env` file is not publicly accessible
- [ ] `/admin` URL is only shared with the church team
- [ ] Node.js backend runs as a non-root user
