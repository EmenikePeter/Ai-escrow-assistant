# Deployment Guide: Connecting Vercel Frontend to AWS EC2 Backend

This guide explains how to configure your AI Escrow Assistant application to connect the Vercel-hosted frontend to your AWS EC2 backend server.

## Overview

- **Frontend**: Deployed on Vercel (ai-escrowassistant.com)
- **Backend**: Hosted on AWS EC2 (IP: 3.211.217.228)
- **Backend Port**: 4000

## Prerequisites

- Vercel account with deployed application
- AWS EC2 instance running the backend server
- Security group configured to allow traffic on ports 80, 443, and 4000

## Configuration Steps

### 1. Backend Configuration (AWS EC2)

#### Step 1.1: Create Environment File

SSH into your EC2 instance and create a `.env` file in the `server` directory:

```bash
cd /path/to/Ai-escrow-assistant/server
nano .env
```

Add the following configuration:

```env
# API Configuration
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/escrow

# JWT Secret Key (Change this to a secure random string)
JWT_SECRET=your_production_secret_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password_or_app_password

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Frontend URL (Vercel domain)
FRONTEND_URL=https://ai-escrowassistant.com
```

#### Step 1.2: Update Security Group Rules

Ensure your EC2 security group allows:
- **Port 22**: SSH access (for management)
- **Port 80**: HTTP (for web traffic)
- **Port 443**: HTTPS (for secure web traffic)
- **Port 4000**: Backend API (for application communication)

Add inbound rules for these ports from:
- Your IP (for SSH)
- 0.0.0.0/0 (for HTTP/HTTPS/API) or restrict to Vercel's IP ranges

#### Step 1.3: CORS Configuration

The backend has been updated to accept requests from:
- `https://ai-escrowassistant.com`
- `https://www.ai-escrowassistant.com`
- Custom frontend URL from `FRONTEND_URL` environment variable

The CORS configuration in `server/server.js` now includes domain validation.

#### Step 1.4: Start/Restart Backend Server

```bash
cd /path/to/Ai-escrow-assistant
npm install
cd server
node server.js
```

Or use a process manager like PM2:

```bash
npm install -g pm2
cd /path/to/Ai-escrow-assistant
pm2 start server/server.js --name "escrow-backend"
pm2 save
pm2 startup
```

### 2. Frontend Configuration (Vercel)

#### Step 2.1: Set Environment Variables in Vercel

Go to your Vercel project settings:

1. Navigate to: **Settings → Environment Variables**
2. Add the following variables:

**For React Native/Expo Web Build:**
```
API_BASE_URL=http://3.211.217.228:4000
EXPO_PUBLIC_API_BASE_URL=http://3.211.217.228:4000
```

**For Admin Portal:**
```
REACT_APP_API_BASE_URL=http://3.211.217.228:4000
```

> **Note**: If you have HTTPS configured on your EC2 instance (recommended), use `https://` instead of `http://`

#### Step 2.2: Configure for Production Use

For production, it's recommended to:

1. **Set up a domain for your backend** (e.g., `api.ai-escrowassistant.com`)
2. **Configure SSL/TLS** on your EC2 instance using Let's Encrypt
3. **Update environment variables** to use HTTPS URLs

Example production configuration:
```
API_BASE_URL=https://api.ai-escrowassistant.com
EXPO_PUBLIC_API_BASE_URL=https://api.ai-escrowassistant.com
REACT_APP_API_BASE_URL=https://api.ai-escrowassistant.com
```

#### Step 2.3: Redeploy on Vercel

After setting environment variables:
1. Go to **Deployments** in Vercel
2. Click **Redeploy** on the latest deployment
3. Ensure environment variables are applied

### 3. Setting Up HTTPS on EC2 (Recommended)

#### Step 3.1: Install Certbot (Let's Encrypt)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### Step 3.2: Configure Nginx as Reverse Proxy

Create nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/escrow-backend
```

Add:

```nginx
server {
    listen 80;
    server_name api.ai-escrowassistant.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/escrow-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 3.3: Obtain SSL Certificate

```bash
sudo certbot --nginx -d api.ai-escrowassistant.com
```

Follow the prompts to configure HTTPS.

### 4. Testing the Connection

#### Step 4.1: Test Backend API

```bash
curl http://3.211.217.228:4000/api/profile?email=test@example.com
```

Or if using HTTPS:

```bash
curl https://api.ai-escrowassistant.com/api/profile?email=test@example.com
```

#### Step 4.2: Test from Frontend

Open your Vercel deployment (`https://ai-escrowassistant.com`) and:
1. Try to log in
2. Check browser console for any CORS errors
3. Verify socket.io connections in Network tab

#### Step 4.3: Monitor Backend Logs

```bash
pm2 logs escrow-backend
```

Look for:
- Successful socket connections
- API requests from your Vercel domain
- Any CORS warnings or errors

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Verify `FRONTEND_URL` is set in backend `.env`
2. Check backend logs for blocked origins
3. Ensure both HTTP and HTTPS versions are allowed if needed

### Socket.IO Connection Failures

If socket connections fail:

1. Verify port 4000 is open in EC2 security group
2. Check if WebSocket traffic is allowed
3. Test socket connection manually:
   ```javascript
   const socket = io('http://3.211.217.228:4000');
   socket.on('connect', () => console.log('Connected!'));
   ```

### API Requests Failing

1. Verify backend server is running: `pm2 status`
2. Check backend logs: `pm2 logs escrow-backend`
3. Test API endpoint directly: `curl http://3.211.217.228:4000/api/profile?email=test@example.com`
4. Verify environment variables are set in Vercel

## Security Best Practices

1. **Use HTTPS**: Configure SSL/TLS on your backend
2. **Secure Environment Variables**: Never commit `.env` files to git
3. **Restrict CORS**: Only allow specific domains in production
4. **Use Strong Secrets**: Generate strong, random JWT secrets
5. **Keep Dependencies Updated**: Regularly update npm packages
6. **Monitor Logs**: Set up logging and monitoring for your backend
7. **Backup Database**: Regularly backup your MongoDB database

## Next Steps

1. Set up automatic SSL certificate renewal
2. Configure database backups
3. Set up monitoring and alerting
4. Implement rate limiting
5. Configure CDN for static assets
6. Set up CI/CD pipeline

## Support

For issues or questions:
- Check backend logs: `pm2 logs escrow-backend`
- Check Vercel deployment logs in Vercel dashboard
- Review browser console for frontend errors
