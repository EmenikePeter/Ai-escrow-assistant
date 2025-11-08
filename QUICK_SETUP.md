# Quick Setup Guide

This guide provides a quick reference for setting up the AI Escrow Assistant application.

## For Local Development

### 1. Main Application (React Native)

Create `.env` file in the root directory:

```env
API_BASE_URL=http://localhost:4000
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 2. Backend Server

Create `server/.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/escrow
JWT_SECRET=your_local_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
OPENAI_API_KEY=your_openai_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### 3. Admin Portal

Create `Escrow assistant admin portal/admin-portal/.env` file:

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

### 4. Start Everything

```bash
# Terminal 1 - Backend
cd server
node server.js

# Terminal 2 - Mobile App
npx expo start

# Terminal 3 - Admin Portal
cd "Escrow assistant admin portal/admin-portal"
npm start
```

## For Vercel Deployment (Production)

### 1. Set Vercel Environment Variables

In your Vercel project dashboard (Settings → Environment Variables):

```
API_BASE_URL=http://3.211.217.228:4000
EXPO_PUBLIC_API_BASE_URL=http://3.211.217.228:4000
REACT_APP_API_BASE_URL=http://3.211.217.228:4000
```

**Recommended for production:** Use HTTPS with a domain:
```
API_BASE_URL=https://api.ai-escrowassistant.com
EXPO_PUBLIC_API_BASE_URL=https://api.ai-escrowassistant.com
REACT_APP_API_BASE_URL=https://api.ai-escrowassistant.com
```

### 2. Configure Backend on AWS EC2

SSH into your EC2 instance and create `server/.env`:

```env
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/escrow
JWT_SECRET=your_production_secret_key_change_this
STRIPE_SECRET_KEY=your_stripe_secret_key
OPENAI_API_KEY=your_openai_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=https://ai-escrowassistant.com
```

### 3. Update EC2 Security Group

Allow inbound traffic on:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 4000 (Backend API)

### 4. Start Backend Server with PM2

```bash
npm install -g pm2
cd /path/to/Ai-escrow-assistant
pm2 start server/server.js --name "escrow-backend"
pm2 save
pm2 startup
```

### 5. Redeploy on Vercel

After setting environment variables, redeploy your Vercel project to apply the changes.

## Verifying the Setup

### Test Backend API

```bash
curl http://3.211.217.228:4000/api/profile?email=test@example.com
```

### Check Vercel Deployment

1. Open https://ai-escrowassistant.com
2. Open browser developer console (F12)
3. Check for CORS errors or failed API requests
4. Verify socket connections in the Network tab

## Common Issues

### Issue: CORS errors in browser

**Solution:** Ensure `FRONTEND_URL` is set in backend `.env` to match your Vercel domain.

### Issue: Socket.IO not connecting

**Solution:** 
- Verify port 4000 is open in EC2 security group
- Check backend logs: `pm2 logs escrow-backend`
- Test WebSocket connection manually

### Issue: API requests failing

**Solution:**
- Verify backend is running: `pm2 status`
- Check environment variables are set in Vercel
- Test API endpoint directly with curl

## Need More Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including HTTPS setup, nginx configuration, and security best practices.
