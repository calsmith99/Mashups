# Mashup Discovery Tool - Portainer Deployment Guide

## Prerequisites

1. **Portainer** installed and running on your server
2. **Docker** and **Docker Compose** available
3. **API Keys** for Spotify and YouTube

## API Keys Setup

### Spotify API Keys
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your **Client ID** and **Client Secret**

### YouTube API Key
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Note your **API Key**

## Deployment Steps

### Option 1: Portainer Stack (Recommended)

1. **Login to Portainer**
2. **Go to Stacks**
3. **Click "Add stack"**
4. **Name**: `mashup-discovery-tool`
5. **Build method**: Upload
6. **Upload** this entire project folder
7. **Environment variables**:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   YOUTUBE_API_KEY=your_youtube_api_key
   ```
8. **Click "Deploy the stack"**

### Option 2: Manual Docker Commands

```bash
# 1. Clone/upload your project to the server
# 2. Create production environment file
cp env.production.template .env.production

# 3. Edit .env.production with your API keys
nano .env.production

# 4. Build and run
docker-compose up -d --build
```

## Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify API Client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify API Client Secret |
| `YOUTUBE_API_KEY` | Yes | YouTube Data API v3 Key |
| `NODE_ENV` | No | Set to `production` |
| `PORT` | No | Port to run on (default: 3000) |
| `HOSTNAME` | No | Hostname to bind (default: 0.0.0.0) |

### Port Mapping

- **Container Port**: 3000
- **Host Port**: 3000 (configurable)
- **Access URL**: `http://your-server-ip:3000`

### Reverse Proxy Setup (Optional)

If using Nginx/Traefik:

```nginx
server {
    listen 80;
    server_name mashup.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring & Maintenance

### Health Check
- **Endpoint**: `/api/health`
- **Method**: GET
- **Expected**: `{"status": "healthy"}`

### Logs
```bash
# View logs
docker logs mashup-discovery-tool

# Follow logs
docker logs -f mashup-discovery-tool
```

### Updates
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Common Issues

1. **API Keys Not Working**
   - Verify keys are correct in `.env.production`
   - Check Spotify app settings (redirect URIs)
   - Verify YouTube API is enabled

2. **Port Already in Use**
   - Change port mapping in `docker-compose.yml`
   - Use: `ports: - "8080:3000"`

3. **Build Fails**
   - Check Docker has enough space
   - Verify all files are present
   - Check `.dockerignore` doesn't exclude needed files

### Debug Commands
```bash
# Check container status
docker ps

# Enter container shell
docker exec -it mashup-discovery-tool sh

# Check environment variables
docker exec mashup-discovery-tool env

# Test health endpoint
curl http://localhost:3000/api/health
```

## Security Notes

- Keep API keys secure
- Use HTTPS in production
- Consider rate limiting
- Monitor API usage quotas
- Regular security updates

## Performance Optimization

- Set appropriate memory limits
- Use multi-stage Docker builds (already configured)
- Enable gzip compression in reverse proxy
- Monitor CPU/Memory usage
- Consider Redis for caching (future enhancement)