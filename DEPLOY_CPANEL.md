# Deploying to cPanel (No SSH Required)

Complete step-by-step guide to deploy the Iglesia Adventista UNADECA Live Translation
Platform on cPanel using **only the cPanel web interface** -- no SSH, no terminal, no
scripts on the server.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What You Need Before Starting](#2-what-you-need-before-starting)
3. [Step 1: Prepare the Frontend Build Locally](#step-1-prepare-the-frontend-build-locally)
4. [Step 2: Prepare the Backend Build Locally](#step-2-prepare-the-backend-build-locally)
5. [Step 3: Create a Subdomain for the API](#step-3-create-a-subdomain-for-the-api)
6. [Step 4: Enable SSL/HTTPS](#step-4-enable-sslhttps)
7. [Step 5: Upload the Frontend Files](#step-5-upload-the-frontend-files)
8. [Step 6: Create the .htaccess File for the Frontend](#step-6-create-the-htaccess-file-for-the-frontend)
9. [Step 7: Upload the Backend Files](#step-7-upload-the-backend-files)
10. [Step 8: Create the Backend .env File](#step-8-create-the-backend-env-file)
11. [Step 9: Set Up the Node.js Application in cPanel](#step-9-set-up-the-nodejs-application-in-cpanel)
12. [Step 10: Install Backend Dependencies via cPanel](#step-10-install-backend-dependencies-via-cpanel)
13. [Step 11: Configure the API Subdomain .htaccess](#step-11-configure-the-api-subdomain-htaccess)
14. [Step 12: Verify Everything Works](#step-12-verify-everything-works)
15. [Updating the App](#updating-the-app)
16. [Troubleshooting](#troubleshooting)
17. [Security Checklist](#security-checklist)

---

## 1. Architecture Overview

This application has two parts:

```
┌──────────────────────────────────────┐
│  FRONTEND  (Static HTML/JS/CSS)      │
│  Served by Apache from public_html   │
│  URL: https://yourdomain.com         │
│  - Members page at /                 │
│  - Admin panel at /admin             │
└──────────────┬───────────────────────┘
               │ HTTP + WebSocket
               ▼
┌──────────────────────────────────────┐
│  BACKEND  (Node.js / Express)        │
│  Runs via cPanel Node.js Selector    │
│  URL: https://api.yourdomain.com     │
│  - REST API endpoints                │
│  - WebSocket broadcast server        │
│  - Soniox API key management         │
└──────────────────────────────────────┘
```

**The frontend** is a set of static files (HTML, JS, CSS) that Apache serves.
No server-side processing needed -- it's just files in a folder.

**The backend** is a Node.js application that handles the Soniox API key,
broadcasts transcription data to all connected viewers via WebSocket, and
authenticates the admin.

---

## 2. What You Need Before Starting

### On your local computer

- **Node.js 18+** installed ([download](https://nodejs.org))
- **The project source code** (this repository)
- A **code editor** (VS Code, Notepad++, etc.)

### On your hosting

- **cPanel** with the **Node.js Selector** feature (most modern shared
  hosting includes this -- check with your host if you're unsure)
- A **domain name** pointed to your hosting (e.g., `liveunadeca.com`)
- The ability to create **subdomains** in cPanel

### API keys & passwords

- A **Soniox API key** (get one at https://console.soniox.com)
- An **admin password** you'll use to access the admin panel

### Gather these values now -- you'll need them later:

| Value | Example | Where you'll use it |
|-------|---------|---------------------|
| Your domain | `liveunadeca.com` | Frontend URL |
| API subdomain | `api.liveunadeca.com` | Backend URL |
| Soniox API key | `sk_live_abc123...` | Backend .env file |
| Admin password | `MySecureP@ss2024!` | Backend .env file |

---

## Step 1: Prepare the Frontend Build Locally

You will build the frontend on your local computer and then upload the
output files to cPanel.

### 1.1 Open a terminal on your computer

Navigate to the project folder:

```bash
cd path/to/Livetranslation
```

### 1.2 Install dependencies

```bash
npm install
```

### 1.3 Create a production environment file

Create a file called `.env.production` in the project root with this content:

```env
VITE_BACKEND_API_URL=https://api.yourdomain.com/api
VITE_CHURCH_NAME=Iglesia Adventista UNADECA
VITE_DEFAULT_SOURCE_LANGUAGE=es
VITE_DEFAULT_TARGET_LANGUAGE=en
```

> **IMPORTANT**: Replace `api.yourdomain.com` with your actual API subdomain.
> This is the subdomain you will create in Step 3.

### 1.4 Build the frontend

```bash
npm run build
```

This creates a `dist/` folder containing:

```
dist/
├── index.html          ← Main HTML file
├── assets/
│   ├── index-XXXX.js   ← Application JavaScript
│   └── index-XXXX.css  ← Application styles
└── vite.svg            ← Favicon
```

These are the files you'll upload to `public_html`.

---

## Step 2: Prepare the Backend Build Locally

The backend is written in TypeScript, but cPanel's Node.js Selector needs
plain JavaScript. You'll compile it locally and upload the compiled output.

### 2.1 Install the TypeScript compiler for the backend

This is already included in dev dependencies, but make sure:

```bash
npm install
```

### 2.2 Create a backend startup file

Create a file called `server/start.mjs` with this content:

```javascript
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('tsx/esm', pathToFileURL('./'));

const { default: _ } = await import('./index.ts');
```

> This file lets Node.js run the TypeScript backend without pre-compiling.
> cPanel's Node.js Selector will use this as the startup file.

### 2.3 Prepare the backend folder for upload

You will upload these files/folders to the server:

```
Files to upload to the backend folder:
├── server/
│   ├── start.mjs           ← Startup file (you just created this)
│   ├── index.ts             ← Main server
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── broadcast.ts
│   │   └── soniox.ts
│   └── services/
│       ├── broadcastServer.ts
│       └── sonioxService.ts
├── package.json
└── package-lock.json
```

---

## Step 3: Create a Subdomain for the API

The backend needs its own URL. The easiest approach is a subdomain.

### 3.1 Log in to cPanel

Open your browser and go to your cPanel login URL (usually
`https://yourdomain.com:2083` or provided by your host).

### 3.2 Go to "Domains" or "Subdomains"

In cPanel, find and click **Domains** (or **Subdomains** on older cPanel versions).

### 3.3 Create the subdomain

- **Subdomain**: `api`
- **Domain**: `yourdomain.com`
- **Document root**: `/home/youruser/api.yourdomain.com`
  (cPanel usually auto-fills this -- the exact path is fine)

Click **Create** or **Submit**.

### 3.4 Note the document root path

Write down the **document root** path that cPanel shows for the subdomain.
It will be something like:

```
/home/youruser/api.yourdomain.com
```

You'll need this path in Step 9.

---

## Step 4: Enable SSL/HTTPS

**HTTPS is mandatory.** The microphone API (`getUserMedia`) only works over
HTTPS, and WebSocket connections need WSS (WebSocket Secure) in production.

### 4.1 Go to "SSL/TLS Status" or "Let's Encrypt"

In cPanel, look for:
- **SSL/TLS Status** (modern cPanel), or
- **Let's Encrypt** (if your host provides it), or
- **AutoSSL**

### 4.2 Issue certificates

Make sure SSL certificates are issued for **both**:
- `yourdomain.com`
- `api.yourdomain.com`

Most cPanel hosts with AutoSSL will do this automatically within a few
minutes of creating the subdomain.

### 4.3 Force HTTPS (optional but recommended)

In cPanel, go to **Domains** and enable **Force HTTPS Redirect** for both
your main domain and the API subdomain.

---

## Step 5: Upload the Frontend Files

### 5.1 Open File Manager

In cPanel, click **File Manager**.

### 5.2 Navigate to public_html

Click on `public_html` in the left sidebar. This is the folder that serves
your main domain (`yourdomain.com`).

### 5.3 Clean up existing files (if any)

If there are existing files (like a default `index.html` from your host),
select them and delete them. **Be careful not to delete `.htaccess` if one
exists** -- you'll edit it later.

### 5.4 Upload the frontend build

1. Click the **Upload** button at the top of File Manager
2. Select **all files from your local `dist/` folder**:
   - `index.html`
   - `vite.svg`
   - The entire `assets/` folder

**To upload the `assets/` folder:**

1. In File Manager, while in `public_html`, click **+ Folder** at the top
2. Name it `assets`
3. Double-click into the `assets` folder
4. Click **Upload** and select all files from your local `dist/assets/` folder

### 5.5 Verify the structure

After uploading, `public_html/` should look like:

```
public_html/
├── .htaccess          ← You'll create this in Step 6
├── index.html
├── vite.svg
└── assets/
    ├── index-XXXXX.js
    └── index-XXXXX.css
```

---

## Step 6: Create the .htaccess File for the Frontend

The React app uses client-side routing (the `/admin` URL is handled by
JavaScript, not a real file). Apache needs to be told to serve `index.html`
for all routes that don't match a real file.

### 6.1 In File Manager, navigate to public_html

### 6.2 Create or edit .htaccess

If `.htaccess` already exists, click on it and then click **Edit** at the top.

If it doesn't exist:
1. Click **+ File** at the top
2. Name it `.htaccess` (with the dot at the beginning)
3. Click **Create New File**
4. Click on the new file, then click **Edit**

### 6.3 Paste this content

```apache
RewriteEngine On
RewriteBase /

# If the request is for a real file or directory, serve it directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Otherwise, serve index.html (for React Router)
RewriteRule ^ index.html [L]
```

### 6.4 Save the file

Click **Save Changes** at the top right.

### 6.5 Test

Open your browser and visit:

- `https://yourdomain.com` -- should show the members page
- `https://yourdomain.com/admin` -- should show the admin login page

> At this point the page will load but won't be able to connect to the
> backend yet (you'll see errors in the browser console). That's expected.

---

## Step 7: Upload the Backend Files

### 7.1 In File Manager, navigate to the API subdomain document root

This is the path you noted in Step 3.4, something like:

```
/home/youruser/api.yourdomain.com
```

Click on it in the left sidebar, or navigate there using the path bar.

### 7.2 Upload package.json and package-lock.json

1. Click **Upload**
2. Select `package.json` and `package-lock.json` from your local
   project root

### 7.3 Create the server folder

1. Click **+ Folder** at the top
2. Name it `server`
3. Double-click into the `server` folder

### 7.4 Upload the server files

Upload these files from your local `server/` folder:

- `start.mjs`
- `index.ts`

### 7.5 Create the middleware folder

1. Inside `server/`, click **+ Folder**, name it `middleware`
2. Double-click into `middleware/`
3. Upload `errorHandler.ts` from your local `server/middleware/`

### 7.6 Create the routes folder

1. Go back to `server/`
2. Click **+ Folder**, name it `routes`
3. Double-click into `routes/`
4. Upload all files from your local `server/routes/`:
   - `auth.ts`
   - `broadcast.ts`
   - `soniox.ts`

### 7.7 Create the services folder

1. Go back to `server/`
2. Click **+ Folder**, name it `services`
3. Double-click into `services/`
4. Upload all files from your local `server/services/`:
   - `broadcastServer.ts`
   - `sonioxService.ts`

### 7.8 Verify the structure

Your API subdomain document root should now look like:

```
api.yourdomain.com/
├── package.json
├── package-lock.json
└── server/
    ├── start.mjs
    ├── index.ts
    ├── middleware/
    │   └── errorHandler.ts
    ├── routes/
    │   ├── auth.ts
    │   ├── broadcast.ts
    │   └── soniox.ts
    └── services/
        ├── broadcastServer.ts
        └── sonioxService.ts
```

---

## Step 8: Create the Backend .env File

### 8.1 Navigate to the API subdomain root

In File Manager, go to `/home/youruser/api.yourdomain.com/`

### 8.2 Create the .env file

1. Click **+ File** at the top
2. Name it `.env`
3. Click **Create New File**
4. Click on the new `.env` file, then click **Edit**

### 8.3 Paste this content

```env
SONIOX_API_KEY=your_actual_soniox_api_key_here
SONIOX_API_URL=https://api.soniox.com
ADMIN_PASSWORD=your_secure_admin_password_here
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

> **IMPORTANT**: Replace the placeholder values:
> - `your_actual_soniox_api_key_here` → your real Soniox API key
> - `your_secure_admin_password_here` → the password you want for admin access
> - `yourdomain.com` → your actual domain name

### 8.4 Save the file

Click **Save Changes**.

---

## Step 9: Set Up the Node.js Application in cPanel

This is the most critical step. cPanel's **Node.js Selector** (also called
**Setup Node.js App**) will run your backend server.

### 9.1 Open Node.js Selector

In cPanel, find and click **Setup Node.js App** (it may be under
"Software" or "Exclusive for cPanel").

### 9.2 Click "Create Application"

Click the **+ Create Application** button.

### 9.3 Configure the application

Fill in these fields:

| Field | Value |
|-------|-------|
| **Node.js version** | `18` or higher (choose the highest available) |
| **Application mode** | `Production` |
| **Application root** | `api.yourdomain.com` (the path relative to your home directory) |
| **Application URL** | Select `api.yourdomain.com` from the dropdown |
| **Application startup file** | `server/start.mjs` |

> **Application root**: This is the path relative to your home directory,
> NOT the full path. If your files are in `/home/youruser/api.yourdomain.com/`,
> just enter `api.yourdomain.com`.

> **Application startup file**: Must be `server/start.mjs` -- this is the
> wrapper file that loads the TypeScript backend.

### 9.4 Click "Create"

cPanel will create the Node.js application. You'll see a success message
and a page showing the app details.

### 9.5 Note the important information

After creation, cPanel shows:

- **Virtual Environment path** -- something like
  `/home/youruser/nodevenv/api.yourdomain.com/18/`
- **Application URL** -- `https://api.yourdomain.com`

Write these down.

---

## Step 10: Install Backend Dependencies via cPanel

### 10.1 On the Node.js app page, find "Run NPM Install"

After creating the app in Step 9, you should still be on the app
configuration page. Look for a button or section that says:

**"Run NPM Install"** or **"Detected package.json — click to install"**

### 10.2 Click the NPM Install button

This installs all the dependencies listed in `package.json` directly on
the server. Wait for it to complete -- it may take 1-3 minutes.

### 10.3 Verify it succeeded

You should see a success message like "Packages installed successfully"
or a green checkmark.

> **If NPM Install fails**: Make sure `package.json` is in the application
> root folder (`api.yourdomain.com/`), not inside a subfolder.

### 10.4 Restart the application

After installing packages, click the **Restart** button (usually a
circular arrow icon) on the Node.js app page.

---

## Step 11: Configure the API Subdomain .htaccess

The cPanel Node.js Selector should have auto-generated an `.htaccess` file
in your API subdomain folder. If the app is set up correctly, this file
will already proxy all requests to the Node.js backend.

### 11.1 Check if it was auto-generated

In File Manager, navigate to `/home/youruser/api.yourdomain.com/`.

Look for `.htaccess`. If it exists and was created by cPanel, it will
contain Passenger-related directives. **Do not modify it** -- cPanel
manages this file.

### 11.2 If .htaccess was NOT auto-generated

Create it manually:

1. Click **+ File** → name it `.htaccess` → click **Create**
2. Click **Edit** and paste:

```apache
# DO NOT REMOVE. CLOUDLINUX/CPANEL NODEJS PASSTHROUGH
PassengerAppRoot "/home/youruser/api.yourdomain.com"
PassengerBaseURI "/"
PassengerNodejs "/home/youruser/nodevenv/api.yourdomain.com/18/bin/node"
PassengerAppType node
PassengerStartupFile server/start.mjs

# Enable WebSocket passthrough
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/ws [NC]
RewriteCond %{HTTP:Upgrade} =websocket [NC]
RewriteRule ^(.*)$ ws://127.0.0.1:5000/$1 [P,L]
```

> **IMPORTANT**: Replace:
> - `/home/youruser/` with your actual home directory path
> - `/18/` with your actual Node.js version
>
> You can find the exact paths on the Node.js Selector app page.

### 11.3 Save and close

---

## Step 12: Verify Everything Works

### 12.1 Test the backend

Open your browser and visit:

```
https://api.yourdomain.com/health
```

You should see:

```json
{"status":"ok","timestamp":"2024-...","sonioxConfigured":true}
```

**If you see this, the backend is running!**

**If you see an error:**
- Go back to Node.js Selector in cPanel and click **Restart**
- Check that the startup file is set to `server/start.mjs`
- Check that NPM Install completed successfully
- Verify the `.env` file exists and has the correct values

### 12.2 Test the frontend

Visit: `https://yourdomain.com`

You should see the Iglesia Adventista UNADECA members page with the
translation and transcription panels.

### 12.3 Test the admin panel

Visit: `https://yourdomain.com/admin`

You should see the admin login page. Enter the password you set in the
backend `.env` file.

### 12.4 Test live transcription

1. Log in to the admin panel
2. Click **Iniciar Transmision**
3. Allow microphone access when the browser asks
4. Speak into your microphone
5. Open `https://yourdomain.com` in another browser tab or on your phone
6. You should see the transcription and translation appearing live

### 12.5 Test WebSocket (optional)

On the members page, open browser DevTools (F12) → Console tab.
Look for:

```
[broadcast-client] connecting to wss://api.yourdomain.com/ws
[broadcast-client] connected
```

If you see "connected", WebSocket is working.

---

## Updating the App

When you make changes and want to update the deployed version:

### Update the frontend

1. On your local computer, make changes
2. Run `npm run build`
3. In cPanel File Manager, go to `public_html/`
4. Delete the old `assets/` folder
5. Upload the new files from `dist/`
   - Replace `index.html`
   - Upload new `assets/` folder contents

### Update the backend

1. In cPanel File Manager, go to `api.yourdomain.com/server/`
2. Upload the changed `.ts` files (replace existing ones)
3. In cPanel, go to **Setup Node.js App**
4. Click **Restart** on your application

### Update dependencies

If `package.json` changed:

1. Upload the new `package.json` and `package-lock.json` to `api.yourdomain.com/`
2. In Node.js Selector, click **Run NPM Install**
3. Click **Restart**

---

## Troubleshooting

### "502 Bad Gateway" or "503 Service Unavailable"

**Cause**: The Node.js backend is not running.

**Fix**:
1. Go to **Setup Node.js App** in cPanel
2. Check if the app is listed and its status
3. Click **Restart**
4. If it still fails, verify:
   - Startup file is `server/start.mjs`
   - Node.js version is 18+
   - NPM Install completed successfully

### Frontend loads but shows "Esperando traduccion..." forever

**Cause**: Frontend can't connect to the backend.

**Fix**:
1. Visit `https://api.yourdomain.com/health` -- does it respond?
2. If not, the backend isn't running. See above.
3. If it responds, check the frontend `.env.production` has the correct
   `VITE_BACKEND_API_URL` and rebuild.

### Admin login says "Error de autenticacion"

**Cause**: Wrong password or backend `.env` misconfigured.

**Fix**:
1. Check the `.env` file in `api.yourdomain.com/` via File Manager
2. Verify `ADMIN_PASSWORD` is set correctly
3. Restart the Node.js app after any `.env` changes

### CORS errors in browser console

**Cause**: The backend's `CORS_ORIGIN` doesn't match the frontend URL.

**Fix**:
1. Edit `.env` in `api.yourdomain.com/`
2. Make sure `CORS_ORIGIN` is exactly `https://yourdomain.com`
   (no trailing slash, correct protocol)
3. Restart the Node.js app

### Microphone not working / "NotAllowedError"

**Cause**: HTTPS is not enabled, or browser permissions denied.

**Fix**:
1. Make sure you're accessing via `https://` (not `http://`)
2. Check browser permissions -- click the lock icon in the address bar
3. Enable SSL certificate for your domain (Step 4)

### /admin shows 404 "Not Found"

**Cause**: Apache is not redirecting to `index.html` for unknown routes.

**Fix**:
1. Check `.htaccess` exists in `public_html/`
2. Verify it has the `RewriteRule ^ index.html [L]` line
3. Make sure `mod_rewrite` is enabled (it usually is by default on cPanel)

### Blank page / white screen

**Cause**: Frontend files not uploaded correctly.

**Fix**:
1. Check `public_html/index.html` exists
2. Check `public_html/assets/` contains `.js` and `.css` files
3. Open browser DevTools → Console for error messages
4. Common issue: `assets/` folder files have wrong paths. Make sure you
   uploaded the contents of `dist/`, not the `dist/` folder itself.

### "sonioxConfigured: false" on /health

**Cause**: The `SONIOX_API_KEY` is not set in the backend `.env`.

**Fix**:
1. Edit `.env` in `api.yourdomain.com/`
2. Add or fix the `SONIOX_API_KEY` line
3. Restart the Node.js app

### WebSocket won't connect / "WebSocket connection failed"

**Cause**: The hosting provider may not support WebSocket proxying, or
the `.htaccess` WebSocket rules are missing.

**Fix**:
1. Check with your hosting provider if WebSocket is supported
2. Verify `.htaccess` in the API subdomain has WebSocket rewrite rules
3. Some shared hosts require you to contact support to enable
   `mod_proxy_wstunnel`

**Alternative if WebSocket is not supported:**
Contact your hosting provider and ask them to enable WebSocket support
for your Node.js application. Most modern cPanel hosts support it through
Phusion Passenger, which handles WebSocket connections natively.

### Node.js Selector shows errors in the log

To view logs:
1. In **Setup Node.js App**, look for a **Log** or **View Logs** option
2. If not available, check `stderr.log` in your app root via File Manager

### Application restarts keep failing

Common causes:
- `start.mjs` has a syntax error -- re-upload it
- `package.json` is missing from the app root
- Node modules not installed -- click **Run NPM Install** again
- TypeScript files have errors -- test locally with `npm run dev:server`
  before uploading

---

## Quick Reference

| Component | URL |
|-----------|-----|
| Members page | `https://yourdomain.com` |
| Admin panel | `https://yourdomain.com/admin` |
| Backend health | `https://api.yourdomain.com/health` |
| Backend API | `https://api.yourdomain.com/api/...` |
| WebSocket | `wss://api.yourdomain.com/ws` |

---

## File Structure on the Server

After completing all steps, your server should look like:

```
/home/youruser/
├── public_html/                          ← Frontend (yourdomain.com)
│   ├── .htaccess                         ← SPA routing rules
│   ├── index.html                        ← React app entry
│   ├── vite.svg
│   └── assets/
│       ├── index-XXXXX.js
│       └── index-XXXXX.css
│
├── api.yourdomain.com/                   ← Backend (api.yourdomain.com)
│   ├── .htaccess                         ← Auto-generated by cPanel
│   ├── .env                             ← API keys & passwords
│   ├── package.json
│   ├── package-lock.json
│   ├── node_modules/                     ← Installed by NPM Install
│   └── server/
│       ├── start.mjs                     ← cPanel startup file
│       ├── index.ts
│       ├── middleware/
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── broadcast.ts
│       │   └── soniox.ts
│       └── services/
│           ├── broadcastServer.ts
│           └── sonioxService.ts
│
└── nodevenv/                             ← Auto-created by cPanel
    └── api.yourdomain.com/
        └── 18/                           ← Node.js virtual environment
```

---

## Security Checklist

Before going live, verify:

- [ ] HTTPS is enabled and forced for both domain and API subdomain
- [ ] `.env` file is not accessible publicly (test: visiting
      `https://api.yourdomain.com/.env` should NOT show the file contents)
- [ ] `ADMIN_PASSWORD` is strong (12+ characters, mixed case, numbers, symbols)
- [ ] `SONIOX_API_KEY` is not exposed anywhere in the frontend code
- [ ] `CORS_ORIGIN` is set to your exact domain only
- [ ] `/admin` URL is only shared with the church technical team
- [ ] Test from a different device (phone) to confirm everything works
- [ ] Test with multiple viewers to confirm broadcast works

---

## Summary of Steps

1. **Build frontend** locally → creates `dist/`
2. **Create `server/start.mjs`** locally → TypeScript loader for cPanel
3. **Create API subdomain** in cPanel → `api.yourdomain.com`
4. **Enable SSL** for both domains
5. **Upload frontend** to `public_html/`
6. **Create `.htaccess`** in `public_html/` for SPA routing
7. **Upload backend** to `api.yourdomain.com/`
8. **Create `.env`** in `api.yourdomain.com/` with API keys
9. **Create Node.js app** in cPanel pointing to `server/start.mjs`
10. **Run NPM Install** in cPanel Node.js Selector
11. **Configure API subdomain** `.htaccess` (usually auto-generated)
12. **Verify** everything works

Total time: approximately 20-30 minutes.

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section above
or contact your hosting provider's support team for cPanel-specific issues.
