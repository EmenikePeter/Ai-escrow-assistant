# Admin Portal Production Deployment Guide

This guide walks through preparing and deploying the admin React SPA to production.

## 1. Prerequisites
- Node.js 20.x and npm 10.x on your workstation
- Access to the EC2 host that serves `https://escroassistant.com`
- SSH key `escrow-assist-key.pem` placed locally
- `scp` (ships with the Windows OpenSSH client in PowerShell)

## 2. Configure environment variables
1. Create a dedicated production env file:
   ```powershell
   Copy-Item .env .env.production -Force
   ```
2. Edit `.env.production` to expose only the values required by the frontend. Keep
   secrets (Stripe, SMTP, OpenAI, etc.) **out** of frontend config; they must stay on the server.
   ```properties
   REACT_APP_API_BASE_URL=https://escroassistant.com
   ```
3. For local development retain `.env` (ignored by git) with any localhost overrides.

## 3. Build
```powershell
npm ci
npm run build -- --dotenv .env.production
```
This produces the optimized bundle in `build/`.

## 4. Upload to the server
1. SSH into the EC2 instance and temporarily set ownership so you can upload:
   ```powershell
   ssh -i "C:\Users\Sanyu\Documents\Downloads\escrow-assist-key.pem" ubuntu@3.211.217.228
   sudo chown -R ubuntu:ubuntu /var/www/escrow-admin
   exit
   ```
2. Copy the build output from Windows to the server:
   ```powershell
   scp -i "C:\Users\Sanyu\Documents\Downloads\escrow-assist-key.pem" -r "$(Get-Location)\build\." ubuntu@3.211.217.228:/var/www/escrow-admin/
   ```
3. Restore permissions and reload nginx:
   ```powershell
   ssh -i "C:\Users\Sanyu\Documents\Downloads\escrow-assist-key.pem" ubuntu@3.211.217.228
   sudo chown -R www-data:www-data /var/www/escrow-admin
   sudo chmod -R 755 /var/www/escrow-admin
   sudo systemctl reload nginx
   exit
   ```

## 5. Smoke test
- Visit `https://escroassistant.com` and hard-refresh (Ctrl+Shift+R)
- Confirm static assets load (no 404s in dev tools)
- Verify WebSocket connects to `wss://escroassistant.com/socket.io`
- Exercise key screens (login, chat, payouts)

## 6. Routine maintenance
- Re-run the build and upload steps after any UI change
- Monitor certificate expiry: `sudo certbot renew --dry-run`
- Keep `build/` off git history (`.gitignore` already covers it)

Following these steps keeps the admin portal reproducible and safe for production use.
