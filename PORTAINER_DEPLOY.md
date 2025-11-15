# Portainer Stack Deployment Guide

## Quick Deployment Steps

### 1. In Portainer:

1. **Navigate to Stacks**
2. **Add Stack**
3. **Name**: `mashup-discovery-tool`

### 2. Repository Method:

**Repository URL**: `https://github.com/calsmith99/Mashups`
**Compose path**: `portainer-stack.yml`

### 3. Environment Variables (REQUIRED):

Add these in Portainer's Environment Variables section:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here  
YOUTUBE_API_KEY=your_youtube_data_api_key_here
DOMAIN=yourdomain.com
```

### 4. Advanced Settings (Optional):

If using with Traefik, ensure these labels are correct:
- Traefik router rule
- Load balancer port

### 5. Deploy

Click **Deploy the stack**

## Getting Your API Keys

### Spotify API:
1. Go to: https://developer.spotify.com/dashboard
2. Create new app
3. Copy **Client ID** and **Client Secret**

### YouTube API:
1. Go to: https://console.developers.google.com/
2. Create project → Enable YouTube Data API v3
3. Create credentials → API Key
4. Copy **API Key**

## Alternative: Copy/Paste Method

If Git authentication fails, use this docker-compose content directly in Portainer:

```yaml
version: '3.8'

services:
  mashup-discovery:
    image: node:18-alpine
    container_name: mashup-discovery-tool
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
    command: >
      sh -c "
      apk add --no-cache git curl &&
      git clone https://github.com/calsmith99/Mashups.git . &&
      npm ci &&
      npm run build &&
      npm start"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
```

## Troubleshooting

### Issue: Repository Authentication
**Solution**: Make repository public or use personal access token

### Issue: Build Fails
**Solution**: Check environment variables are set correctly

### Issue: Health Check Fails
**Solution**: Check logs: `docker logs mashup-discovery-tool`

## Access Your App

Once deployed successfully:
- **Local**: `http://server-ip:3000`
- **Domain**: `http://mashup.yourdomain.com` (if Traefik configured)