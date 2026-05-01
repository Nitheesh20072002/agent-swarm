# Deployment Guide

## Overview

This guide covers deploying the Agent Chat Application to production environments. The application consists of:
- **Backend:** Node.js/Express API server
- **Frontend:** Next.js React application
- **Database:** PostgreSQL
- **Optional:** Redis for caching (recommended for production)

---

## Prerequisites

### Required
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Domain name with SSL certificate
- At least 2GB RAM, 20GB disk space

### Recommended
- Redis 7+ for caching
- Reverse proxy (Nginx/Caddy)
- Process manager (PM2)
- Docker and Docker Compose (for containerized deployment)

### API Keys
- OpenRouter API key (for AI models)
- Anthropic API key (optional)
- OpenAI API key (optional)

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### 1. Prepare Environment

Create production `.env` file:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/agentchat
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=2000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI Models
OPENROUTER_API_KEY=sk-or-v1-your-production-key
ANTHROPIC_API_KEY=sk-ant-your-production-key
OPENAI_API_KEY=sk-your-production-key

# Context Management
MAX_CONTEXT_TOKENS=4000
COMPRESSION_THRESHOLD=0.8
DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# Performance & Caching
USE_ENHANCED_REGISTRY=true
CACHE_TTL=300000
ENABLE_PERFORMANCE_MONITORING=true

# CORS
CORS_ORIGIN=https://yourdomain.com

# Redis (if using)
REDIS_URL=redis://redis:6379
```

#### 2. Update Docker Compose

Ensure your `docker-compose.yml` is production-ready:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: agentchat
      POSTGRES_USER: agentuser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agentuser"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 3. Create Production Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src ./src
COPY database ./database

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

#### 4. Create Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

#### 5. Deploy

```bash
# Build and start services
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npm run migrate

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check health
curl http://localhost:3001/health
```

---

### Option 2: Manual Deployment (VPS/Cloud)

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Redis (optional)
sudo apt install -y redis-server
```

#### 2. Setup Database

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE agentchat;
CREATE USER agentuser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE agentchat TO agentuser;
\q
```

#### 3. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-repo/agent-chat.git
cd agent-chat

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Create .env file (use template above)
sudo nano .env

# Run migrations
npm run migrate

# Setup PM2
pm2 start dist/server.js --name agent-chat-api
pm2 startup
pm2 save
```

#### 4. Deploy Frontend

```bash
cd /var/www/agent-chat/frontend

# Install dependencies
npm ci --only=production

# Build
npm run build

# Start with PM2
pm2 start npm --name agent-chat-frontend -- start
pm2 save
```

#### 5. Configure Nginx

Create `/etc/nginx/sites-available/agent-chat`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/agent-chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

---

### Option 3: Platform as a Service (PaaS)

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis (optional)
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set OPENROUTER_API_KEY=your-key
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# Scale
heroku ps:scale web=2
```

#### Railway.app

1. Connect GitHub repository
2. Add PostgreSQL database
3. Configure environment variables
4. Deploy automatically on push

#### Render.com

1. Create new Web Service
2. Connect repository
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

---

## Post-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Review database permissions
- [ ] Secure API keys (use environment variables)
- [ ] Enable security headers
- [ ] Set up backup authentication

### Performance

- [ ] Enable gzip compression
- [ ] Configure Redis caching
- [ ] Set up CDN for static assets
- [ ] Optimize database indexes
- [ ] Configure connection pooling
- [ ] Enable HTTP/2
- [ ] Implement monitoring
- [ ] Set up log rotation

### Monitoring

- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry, Rollbar)
- [ ] Set up performance monitoring (New Relic, DataDog)
- [ ] Configure log aggregation (Loggly, Papertrail)
- [ ] Set up alerts for critical errors
- [ ] Monitor database performance
- [ ] Track API response times

### Backup

- [ ] Configure automated database backups
- [ ] Test backup restoration
- [ ] Set up off-site backup storage
- [ ] Document backup procedures
- [ ] Create disaster recovery plan

---

## Environment Variables Reference

### Required
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=your-api-key
CORS_ORIGIN=https://yourdomain.com
```

### Optional
```bash
ANTHROPIC_API_KEY=sk-ant-key
OPENAI_API_KEY=sk-key
REDIS_URL=redis://localhost:6379
MAX_CONTEXT_TOKENS=4000
COMPRESSION_THRESHOLD=0.8
DEFAULT_MODEL=anthropic/claude-3.5-sonnet
USE_ENHANCED_REGISTRY=true
DB_POOL_MAX=20
DB_POOL_MIN=5
CACHE_TTL=300000
```

---

## Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose with multiple backends
services:
  backend-1:
    # ... same config
  backend-2:
    # ... same config
  backend-3:
    # ... same config
  
  nginx-load-balancer:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

### Database Scaling

- **Read Replicas:** For read-heavy workloads
- **Connection Pooling:** PgBouncer for connection management
- **Partitioning:** Partition large tables by date
- **Indexing:** Create indexes on frequently queried columns

### Caching Strategy

```typescript
// Multi-layer caching
1. Browser cache (static assets)
2. Redis cache (API responses)
3. Database query cache
4. CDN cache (images, files)
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor performance metrics
- Review failed operations

**Weekly:**
- Review database performance
- Check disk space
- Update dependencies
- Review security logs

**Monthly:**
- Update system packages
- Review and optimize queries
- Database maintenance (VACUUM, ANALYZE)
- Test backups
- Security audit

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Build
npm run build

# Run migrations
npm run migrate

# Restart services
pm2 restart all

# Or with Docker
docker-compose pull
docker-compose up -d --build
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md:1) for detailed troubleshooting guide.

### Quick Fixes

**Service won't start:**
```bash
# Check logs
pm2 logs agent-chat-api
docker-compose logs backend

# Check port
netstat -tulpn | grep 3001
```

**Database connection error:**
```bash
# Test connection
psql -h localhost -U agentuser -d agentchat

# Check DATABASE_URL format
echo $DATABASE_URL
```

**High memory usage:**
```bash
# Check process memory
pm2 monit

# Restart services
pm2 restart all
```

---

## Rollback Procedure

```bash
# With Git
git log --oneline  # Find previous commit
git checkout <commit-hash>
npm ci
npm run build
npm run migrate  # Run any new migrations
pm2 restart all

# With Docker
docker-compose down
git checkout <commit-hash>
docker-compose up -d --build
```

---

## Support

For deployment issues:
1. Check logs for error messages
2. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md:1)
3. Check GitHub issues
4. Contact support team

---

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md:1)
- [Architecture Overview](ARCHITECTURE_DIAGRAMS.md:1)
- [Local Setup Guide](LOCAL_SETUP.md:1)
- [Implementation Guide](IMPLEMENTATION_GUIDE.md:1)
