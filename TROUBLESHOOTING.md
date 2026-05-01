# Troubleshooting Guide

## Overview

This guide covers common issues and their solutions for the Agent Chat Application. Issues are organized by category for easy navigation.

---

## Table of Contents

1. [Startup Issues](#startup-issues)
2. [Database Problems](#database-problems)
3. [API/Backend Issues](#apibackend-issues)
4. [Frontend Issues](#frontend-issues)
5. [AI Model Issues](#ai-model-issues)
6. [WebSocket Issues](#websocket-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)

---

## Startup Issues

### Application Won't Start

**Symptom:** Server exits immediately or shows error on startup

**Common Causes:**
1. Port already in use
2. Missing environment variables
3. Database connection failure
4. Missing dependencies

**Solutions:**

```bash
# Check if port is already in use
netstat -tulpn | grep 3001  # Linux/Mac
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess  # Windows

# Kill process using the port
kill -9 <PID>  # Linux/Mac
Stop-Process -Id <PID> -Force  # Windows

# Verify environment variables
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check for missing dependencies
npm install
npm audit fix

# Test database connection
psql $DATABASE_URL
```

### TypeScript Compilation Errors

**Symptom:** Build fails with type errors

**Solutions:**

```bash
# Clear build cache
rm -rf dist/
rm -rf node_modules/.cache

# Reinstall dependencies
rm -rf node_modules/
npm install

# Rebuild
npm run build

# Check TypeScript version
npx tsc --version
```

---

## Database Problems

### Connection Refused

**Symptom:** `Error: connect ECONNREFUSED` or `FATAL: password authentication failed`

**Solutions:**

```bash
# 1. Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list  # Mac

# 2. Start PostgreSQL if stopped
sudo systemctl start postgresql  # Linux
brew services start postgresql  # Mac

# 3. Verify DATABASE_URL format
# Correct format: postgresql://user:password@host:port/database
echo $DATABASE_URL

# 4. Test connection manually
psql postgresql://user:password@localhost:5432/agentchat

# 5. Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log  # Linux
tail -f /usr/local/var/log/postgres.log  # Mac

# 6. Verify user permissions
sudo -u postgres psql
\du  # List users
GRANT ALL PRIVILEGES ON DATABASE agentchat TO agentuser;
```

### Migration Failures

**Symptom:** Migrations fail to run or database schema mismatch

**Solutions:**

```bash
# Check migration status
npm run migrate:status

# Reset database (WARNING: Deletes all data)
npm run migrate:rollback
npm run migrate:latest

# Manual fix
psql $DATABASE_URL
\dt  # List tables
DROP TABLE IF EXISTS problematic_table CASCADE;
\q

# Re-run migrations
npm run migrate:latest

# Create new migration if needed
npm run migrate:create fix_schema
```

### Database Performance Issues

**Symptom:** Slow queries, timeouts

**Solutions:**

```sql
-- Check slow queries
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

-- Kill long-running query
SELECT pg_terminate_backend(pid);

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY correlation;
```

---

## API/Backend Issues

### 500 Internal Server Error

**Symptom:** API returns 500 errors

**Solutions:**

```bash
# 1. Check server logs
pm2 logs agent-chat-api --lines 100
# Or with Docker
docker-compose logs backend --tail 100

# 2. Enable debug mode
export DEBUG=*
npm run dev

# 3. Check for uncaught exceptions
# Look for error stack traces in logs

# 4. Verify environment variables
node -e "require('dotenv').config(); console.log(process.env)"

# 5. Test endpoint directly
curl -v http://localhost:3001/health
```

### Authentication Errors

**Symptom:** 401 Unauthorized or JWT errors

**Solutions:**

```bash
# 1. Verify JWT_SECRET is set
echo $JWT_SECRET

# 2. Check token expiration
# Use https://jwt.io to decode token

# 3. Clear browser localStorage
# In browser console:
localStorage.clear()
location.reload()

# 4. Regenerate token
# Login again to get fresh token

# 5. Check JWT configuration in code
# Verify JWT_SECRET matches between environments
```

### CORS Errors

**Symptom:** Browser shows CORS policy errors

**Solutions:**

```typescript
// In src/app.ts, verify CORS configuration:
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))

// Or allow all origins for development (not recommended for production):
app.use(cors({ origin: '*' }))
```

```bash
# Check CORS_ORIGIN environment variable
echo $CORS_ORIGIN

# Test CORS with curl
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  http://localhost:3001/api/v1/agents
```

---

## Frontend Issues

### Page Won't Load / Blank Screen

**Symptom:** Frontend shows blank page or loading forever

**Solutions:**

```bash
# 1. Check browser console for errors
# Open DevTools (F12) and check Console tab

# 2. Verify API URL
# In browser console:
console.log(process.env.NEXT_PUBLIC_API_URL)

# 3. Check if backend is running
curl http://localhost:3001/health

# 4. Clear Next.js cache
rm -rf .next/
npm run build
npm run dev

# 5. Check for JavaScript errors
# Look for syntax errors or import issues
```

### API Calls Failing

**Symptom:** Network errors in browser console

**Solutions:**

```javascript
// 1. Check API client configuration
// In browser console:
console.log(window.location.origin)

// 2. Verify CORS headers
// In Network tab, check response headers:
// - Access-Control-Allow-Origin
// - Access-Control-Allow-Credentials

// 3. Test API directly
fetch('http://localhost:3001/api/v1/agents', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)

// 4. Check for network issues
// Use Network tab in DevTools to see failed requests
```

### WebSocket Connection Failed

**Symptom:** Real-time updates not working

**Solutions:**

```javascript
// 1. Check WebSocket connection in browser
// In DevTools Network tab, filter by WS

// 2. Verify WebSocket URL
console.log(process.env.NEXT_PUBLIC_WS_URL)

// 3. Test WebSocket manually
const ws = new WebSocket('ws://localhost:3001')
ws.onopen = () => console.log('Connected')
ws.onerror = (err) => console.error('Error:', err)

// 4. Check for proxy issues
// Some proxies/load balancers block WebSocket connections
```

---

## AI Model Issues

### API Rate Limit Exceeded

**Symptom:** 429 Too Many Requests errors

**Solutions:**

```typescript
// 1. Implement exponential backoff (already done in retry.ts)
// Verify retry configuration:
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000

// 2. Use fallback models
// Enable enhanced registry in .env:
USE_ENHANCED_REGISTRY=true

// 3. Reduce request frequency
// Add delays between requests

// 4. Upgrade API plan
// Check your OpenRouter/Anthropic dashboard
```

### Model Not Responding

**Symptom:** Requests timeout or hang indefinitely

**Solutions:**

```bash
# 1. Check API key validity
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# 2. Test model directly
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 3. Check circuit breaker state
# Look for circuit breaker logs in application

# 4. Try different model
# Update DEFAULT_MODEL in .env
DEFAULT_MODEL=anthropic/claude-3.5-sonnet
```

### Context Too Large

**Symptom:** Errors about context exceeding token limits

**Solutions:**

```bash
# 1. Enable automatic compression
MAX_CONTEXT_TOKENS=4000
COMPRESSION_THRESHOLD=0.8

# 2. Manually compress context
curl -X POST http://localhost:3001/api/v1/conversations/{id}/context/compress \
  -H "Authorization: Bearer $TOKEN"

# 3. Clear old messages
# Delete messages older than certain date

# 4. Use models with larger context windows
DEFAULT_MODEL=anthropic/claude-3.5-sonnet  # 200k tokens
```

---

## WebSocket Issues

### Messages Not Arriving in Real-time

**Symptom:** Must refresh to see new messages

**Solutions:**

```javascript
// 1. Check WebSocket connection status
// Add to your WebSocket client:
wsClient.on('connect', () => console.log('WS Connected'))
wsClient.on('disconnect', () => console.log('WS Disconnected'))
wsClient.on('error', (err) => console.error('WS Error:', err))

// 2. Verify room joining
// Make sure conversation room is joined:
socket.emit('join_conversation', { conversationId })

// 3. Check server logs for WebSocket events
// Look for 'message' events being emitted

// 4. Test WebSocket with simple client
const io = require('socket.io-client')
const socket = io('http://localhost:3001')
socket.on('message', console.log)
```

### WebSocket Disconnecting Frequently

**Symptom:** Connection drops and reconnects constantly

**Solutions:**

```typescript
// 1. Increase timeout values
// In WebSocket server config:
const io = new Server(server, {
  pingTimeout: 60000,
  pingInterval: 25000
})

// 2. Check for network issues
// Use stable network connection

// 3. Implement reconnection logic
// In client:
const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
})

// 4. Check reverse proxy configuration
// Ensure proxy supports WebSocket (Upgrade header)
```

---

## Performance Issues

### Slow API Response Times

**Symptom:** API calls taking >2 seconds

**Solutions:**

```bash
# 1. Check performance metrics
curl http://localhost:3001/health/metrics

# 2. Enable caching
CACHE_TTL=300000  # 5 minutes
USE_ENHANCED_REGISTRY=true

# 3. Optimize database queries
# Check slow queries (see Database section)

# 4. Increase connection pool
DB_POOL_MAX=20
DB_POOL_MIN=5

# 5. Profile application
npm run dev
# Access /health/performance endpoint
```

### High Memory Usage

**Symptom:** Application using >1GB RAM

**Solutions:**

```bash
# 1. Check memory usage
pm2 monit

# 2. Look for memory leaks
node --inspect dist/server.js
# Use Chrome DevTools memory profiler

# 3. Reduce cache size
# Lower CACHE_TTL or implement cache limits

# 4. Increase available memory
# Update server/container memory limits

# 5. Restart application periodically
# Set up cron job or PM2 max_memory_restart
pm2 start dist/server.js --max-memory-restart 1G
```

### Database Connection Pool Exhausted

**Symptom:** Errors about max connections reached

**Solutions:**

```bash
# 1. Increase pool size
DB_POOL_MAX=30  # Increase from 20

# 2. Check for connection leaks
# Look for queries that don't release connections

# 3. Reduce connection timeout
DB_CONNECTION_TIMEOUT=2000

# 4. Check PostgreSQL max_connections
psql $DATABASE_URL
SHOW max_connections;
ALTER SYSTEM SET max_connections = 200;
# Restart PostgreSQL

# 5. Use connection pooler (PgBouncer)
```

---

## Deployment Issues

### Docker Container Exits Immediately

**Symptom:** Container starts then stops

**Solutions:**

```bash
# 1. Check container logs
docker logs <container-id>
docker-compose logs backend

# 2. Run container interactively
docker run -it <image-name> sh

# 3. Check Dockerfile CMD
# Ensure CMD runs a long-lived process

# 4. Verify environment variables
docker exec <container-id> env

# 5. Check health checks
docker inspect <container-id> | grep Health
```

### SSL Certificate Issues

**Symptom:** HTTPS not working or certificate errors

**Solutions:**

```bash
# 1. Check certificate files
ls -la /etc/nginx/ssl/

# 2. Test SSL configuration
openssl s_client -connect yourdomain.com:443

# 3. Renew Let's Encrypt certificates
sudo certbot renew
sudo systemctl reload nginx

# 4. Check certificate expiration
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# 5. Verify Nginx SSL configuration
sudo nginx -t
```

### Load Balancer Issues

**Symptom:** Some requests fail randomly

**Solutions:**

```bash
# 1. Check backend health
curl http://backend-1:3001/health
curl http://backend-2:3001/health

# 2. Verify load balancer configuration
# Check Nginx upstream config

# 3. Enable sticky sessions (if needed)
# Add to Nginx config:
ip_hash;

# 4. Check logs on all backends
# Look for errors on specific instances

# 5. Test with single backend
# Temporarily route all traffic to one instance
```

---

## Getting More Help

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=*
npm run dev

# Or specific modules
export DEBUG=express:*,socket.io:*
```

### Collect Diagnostic Information

```bash
# System information
uname -a
node --version
npm --version
psql --version

# Application status
pm2 list
pm2 info agent-chat-api

# Database status
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "SELECT count(*) FROM conversations;"

# Disk space
df -h

# Memory usage
free -m

# Network
netstat -tulpn | grep LISTEN
```

### Report an Issue

When reporting issues, include:

1. Error message (full stack trace)
2. Steps to reproduce
3. Environment information
4. Relevant logs
5. What you've already tried

---

## Prevention

### Regular Maintenance

```bash
# Weekly tasks
npm audit fix
npm outdated
docker system prune

# Monthly tasks
sudo apt update && sudo apt upgrade
sudo systemctl restart postgresql
```

### Monitoring Setup

- Set up health check monitoring (UptimeRobot)
- Configure error tracking (Sentry)
- Enable performance monitoring (New Relic)
- Set up log aggregation (Loggly)
- Configure alerts for critical errors

### Best Practices

1. **Always use environment variables** for configuration
2. **Never commit secrets** to version control
3. **Test in staging** before deploying to production
4. **Keep dependencies updated** regularly
5. **Monitor logs** for early warning signs
6. **Have a rollback plan** ready
7. **Document custom configurations**
8. **Regular backups** of database and configuration

---

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md:1)
- [Deployment Guide](DEPLOYMENT_GUIDE.md:1)
- [Architecture Overview](ARCHITECTURE_DIAGRAMS.md:1)
- [GitHub Issues](https://github.com/your-repo/issues)

---

## Still Need Help?

If you're still experiencing issues:

1. Search existing GitHub issues
2. Check the documentation again
3. Ask in community forums
4. Contact support team
5. Create a new GitHub issue with diagnostic information
