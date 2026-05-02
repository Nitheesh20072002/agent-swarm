# GitHub Actions Setup Guide

This guide explains how to set up and use the GitHub Actions workflows for automatically building and publishing Docker images.

## Overview

The repository includes three GitHub Actions workflows:

1. **docker-publish-backend.yml** - Builds backend Docker image on code changes
2. **docker-publish-agent.yml** - Builds agent Docker image on code changes  
3. **docker-publish-all.yml** - Builds both images on main branch or version tags

## Prerequisites

- GitHub repository with this codebase
- GitHub account with repository admin access
- Git installed locally

## Quick Setup

### Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/<your-username>/<your-repo>.git

# Add all files
git add .

# Commit changes
git commit -m "Add GitHub Actions workflows for Docker image building"

# Push to GitHub
git push -u origin main
```

### Step 2: Enable Workflow Permissions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Scroll to "Workflow permissions"
4. Select **Read and write permissions**
5. Check **Allow GitHub Actions to create and approve pull requests**
6. Click **Save**

### Step 3: Verify Workflows

1. Go to the **Actions** tab in your repository
2. You should see three workflows listed:
   - Build and Push Backend Docker Image
   - Build and Push Agent Docker Image
   - Build and Push All Docker Images

### Step 4: Trigger First Build

**Option A: Automatic trigger (recommended)**
```bash
# Make a small change and push to trigger workflow
git commit --allow-empty -m "Trigger initial Docker build"
git push origin main
```

**Option B: Manual trigger**
1. Go to **Actions** tab
2. Select "Build and Push All Docker Images"
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

### Step 5: Monitor Build Progress

1. Go to **Actions** tab
2. Click on the running workflow
3. Click on the job name (e.g., "Build Backend Image")
4. View real-time logs

The build typically takes 3-5 minutes for each image.

### Step 6: Verify Published Images

After successful build:

1. Go to repository homepage
2. Look for **Packages** section in the right sidebar
3. You should see:
   - `<repo>-backend`
   - `<repo>-agent`

## Using the Published Images

### Pull Images Locally

```bash
# Pull backend image
docker pull ghcr.io/<your-username>/<your-repo>-backend:latest

# Pull agent image  
docker pull ghcr.io/<your-username>/<your-repo>-agent:latest

# List pulled images
docker images | grep ghcr.io
```

### Update Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ai-agent-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-ai_agent_swarm}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ai-agent-network

  backend:
    image: ghcr.io/<your-username>/<your-repo>-backend:latest
    container_name: ai-agent-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-ai_agent_swarm}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    networks:
      - ai-agent-network

  agent:
    image: ghcr.io/<your-username>/<your-repo>-agent:latest
    container_name: ai-agent-daemon
    environment:
      AGENT_ID: ${AGENT_ID:-alice}
      AGENT_TOKEN: ${AGENT_TOKEN}
      BACKEND_URL: http://backend:3000
      WEBSOCKET_URL: ws://backend:3000
      LLM_PROVIDER: ${LLM_PROVIDER:-openai}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      WORKSPACE_PATH: /workspace
    volumes:
      - agent_workspace:/workspace
    depends_on:
      - backend
    networks:
      - ai-agent-network

volumes:
  postgres_data:
  agent_workspace:

networks:
  ai-agent-network:
    driver: bridge
```

### Deploy with Published Images

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Version Releases

### Creating a Release

To create a versioned release:

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This automatically:
1. Builds both Docker images
2. Tags them with `v1.0.0`, `v1.0`, and `latest`
3. Creates a GitHub Release with instructions

### Using Specific Versions

```bash
# Pull specific version
docker pull ghcr.io/<your-username>/<your-repo>-backend:v1.0.0
docker pull ghcr.io/<your-username>/<your-repo>-agent:v1.0.0

# In docker-compose.prod.yml, use specific versions:
# backend:
#   image: ghcr.io/<your-username>/<your-repo>-backend:v1.0.0
# agent:
#   image: ghcr.io/<your-username>/<your-repo>-agent:v1.0.0
```

## Workflow Triggers

### Backend Workflow Triggers On:
- Changes to backend code (`src/`, `database/`, `scripts/`)
- Changes to `Dockerfile.backend`
- Changes to `package*.json` or `tsconfig.json`
- Pull requests to `main`/`master`
- Manual workflow dispatch

### Agent Workflow Triggers On:
- Changes to agent code (`agent-daemon/`)
- Changes to `Dockerfile.agent`
- Pull requests to `main`/`master`
- Manual workflow dispatch

### All Images Workflow Triggers On:
- Push to `main`/`master` branch
- Version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

## Authentication

### For Private Repositories

If your repository/packages are private, authenticate before pulling:

```bash
# Create a Personal Access Token (PAT) with 'read:packages' scope
# Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
# Generate new token with 'read:packages' permission

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u <your-username> --password-stdin

# Now you can pull images
docker pull ghcr.io/<your-username>/<your-repo>-backend:latest
```

### In CI/CD or Server

```bash
# Store token securely
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"

# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Use in docker-compose
docker-compose -f docker-compose.prod.yml pull
```

## Managing Package Visibility

### Make Packages Public

1. Go to repository homepage
2. Click on package name in "Packages" section
3. Click **Package settings**
4. Under "Danger Zone", click **Change visibility**
5. Select **Public**
6. Type package name to confirm
7. Click **I understand the consequences, change package visibility**

### Link Package to Repository

1. In package settings
2. Under "Connect repository"
3. Select your repository
4. Click **Connect repository**

## Monitoring and Troubleshooting

### View Build Logs

1. Go to **Actions** tab
2. Click on workflow run
3. Click on job name
4. Expand steps to view logs

### Failed Builds

If build fails:

```bash
# Test locally first
docker build -f Dockerfile.backend -t test-backend .
docker build -f Dockerfile.agent -t test-agent .

# Check for errors
docker run --rm test-backend node --version
docker run --rm test-agent python --version
```

### Common Issues

**Issue: Permission denied**
- Solution: Check workflow permissions in Settings → Actions

**Issue: Image not found**
- Solution: Verify package visibility and authentication

**Issue: Build timeout**
- Solution: Check Dockerfile for inefficiencies, use layer caching

**Issue: Platform not supported**
- Solution: Images support linux/amd64 and linux/arm64

## Advanced Configuration

### Add Image Scanning

Add to workflow after build step:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

### Add Build Notifications

Add to workflow:

```yaml
- name: Send notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Docker build completed'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Multi-Registry Publishing

Publish to both GHCR and Docker Hub:

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: |
      ghcr.io/${{ github.repository }}
      ${{ secrets.DOCKERHUB_USERNAME }}/${{ github.repository }}
```

## Best Practices

1. **Always test locally** before pushing
   ```bash
   docker build -f Dockerfile.backend .
   docker build -f Dockerfile.agent .
   ```

2. **Use version tags** for production deployments
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. **Keep images updated**
   - Rebuild regularly for security patches
   - Update base images in Dockerfiles
   - Monitor for vulnerabilities

4. **Use specific versions** in production
   ```yaml
   # Good - specific version
   image: ghcr.io/user/repo-backend:v1.0.0
   
   # Avoid in production - latest tag
   image: ghcr.io/user/repo-backend:latest
   ```

5. **Optimize build time**
   - Use `.dockerignore` to exclude unnecessary files
   - Leverage Docker layer caching
   - Order Dockerfile commands efficiently

## Next Steps

1. ✅ Set up workflows (completed)
2. ✅ Enable permissions (completed)
3. ✅ Trigger first build
4. ✅ Verify images published
5. 🔄 Update deployment to use published images
6. 🔄 Create version release
7. 🔄 Set up automatic deployments

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Docker Documentation](https://docs.docker.com/)
- [Workflow README](.github/workflows/README.md)

## Support

If you encounter issues:

1. Check [Troubleshooting section](#monitoring-and-troubleshooting)
2. View [workflow logs](#view-build-logs)
3. Test [builds locally](#failed-builds)
4. Review [GitHub Actions status](https://www.githubstatus.com/)
