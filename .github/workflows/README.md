# GitHub Actions Workflows for Docker Images

This directory contains GitHub Actions workflows for automatically building and publishing Docker images to GitHub Container Registry (GHCR).

## Available Workflows

### 1. `docker-publish-backend.yml`
**Triggers:**
- Push to `main`, `master`, or `develop` branches (when backend-related files change)
- Pull requests to `main` or `master` branches
- Manual workflow dispatch

**Builds:** Backend Docker image (Node.js/Express API)

**Image Name:** `ghcr.io/<owner>/<repo>-backend`

### 2. `docker-publish-agent.yml`
**Triggers:**
- Push to `main`, `master`, or `develop` branches (when agent-related files change)
- Pull requests to `main` or `master` branches
- Manual workflow dispatch

**Builds:** Agent Docker image (Python daemon)

**Image Name:** `ghcr.io/<owner>/<repo>-agent`

### 3. `docker-publish-all.yml`
**Triggers:**
- Push to `main` or `master` branches
- Version tags (e.g., `v1.0.0`)
- Manual workflow dispatch

**Builds:** Both backend and agent images simultaneously

**Creates:** GitHub Release when triggered by a version tag

## Setup Instructions

### 1. Enable GitHub Container Registry

The workflows are already configured to use GitHub Container Registry (GHCR). No additional setup is required as they use the default `GITHUB_TOKEN`.

### 2. Configure Package Visibility

After the first successful build, you may want to make your packages public:

1. Go to your repository's "Packages" section
2. Select the package (backend or agent)
3. Click "Package settings"
4. Under "Danger Zone", change visibility to "Public" if desired

### 3. Workflow Permissions

Ensure your repository has the following workflow permissions enabled:

1. Go to repository **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## Using the Docker Images

### Pull Images

```bash
# Pull latest backend image
docker pull ghcr.io/<owner>/<repo>-backend:latest

# Pull latest agent image
docker pull ghcr.io/<owner>/<repo>-agent:latest

# Pull specific version
docker pull ghcr.io/<owner>/<repo>-backend:v1.0.0
docker pull ghcr.io/<owner>/<repo>-agent:v1.0.0
```

### Authentication

For private packages, authenticate with GHCR:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

### Using with Docker Compose

Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/<owner>/<repo>-backend:latest
    # ... rest of configuration

  agent:
    image: ghcr.io/<owner>/<repo>-agent:latest
    # ... rest of configuration
```

Then run:

```bash
docker-compose pull  # Pull latest images
docker-compose up -d # Start services
```

## Manual Workflow Triggers

You can manually trigger any workflow:

1. Go to **Actions** tab in your repository
2. Select the workflow you want to run
3. Click **Run workflow**
4. Select the branch
5. Click **Run workflow** button

## Automated Triggers

### On Code Changes

The workflows automatically trigger when relevant files change:

**Backend Workflow** triggers on changes to:
- `src/**`
- `database/**`
- `scripts/**`
- `Dockerfile.backend`
- `package*.json`
- `tsconfig.json`

**Agent Workflow** triggers on changes to:
- `agent-daemon/**`
- `Dockerfile.agent`

### On Version Tags

The `docker-publish-all.yml` workflow creates a GitHub release when you push a version tag:

```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This will:
1. Build both Docker images
2. Tag them with the version number
3. Create a GitHub release with image pull instructions

## Image Tags

The workflows automatically create multiple tags for each image:

- `latest` - Latest build from default branch
- `<branch>` - Latest build from specific branch (e.g., `main`, `develop`)
- `<branch>-<sha>` - Specific commit (e.g., `main-abc1234`)
- `v1.0.0` - Semantic version tags
- `v1.0` - Major.minor version tags
- `pr-123` - Pull request builds

## Multi-Architecture Support

Images are built for multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64/Apple Silicon)

Docker will automatically pull the correct architecture for your system.

## Build Caching

The workflows use GitHub Actions cache to speed up builds:
- Layer caching reduces build time for subsequent builds
- Cache is automatically managed by GitHub Actions

## Security Features

### Build Provenance

Images include attestations that provide:
- Source code reference
- Build environment details
- Dependency information
- Build process transparency

### Non-Root Containers

Both Docker images run as non-root users for enhanced security:
- Backend: `nodejs` user (UID 1001)
- Agent: `agent` user (UID 1001)

## Troubleshooting

### Build Failures

1. **Check workflow logs:**
   - Go to Actions tab → Select failed workflow → View logs

2. **Test locally:**
   ```bash
   docker build -f Dockerfile.backend -t test-backend .
   docker build -f Dockerfile.agent -t test-agent .
   ```

3. **Verify Dockerfile syntax:**
   ```bash
   docker build --dry-run -f Dockerfile.backend .
   ```

### Permission Errors

If you get permission errors:

1. Check repository workflow permissions (Settings → Actions → General)
2. Verify `GITHUB_TOKEN` has package write permissions
3. Ensure package visibility settings allow workflow access

### Image Pull Errors

If you can't pull images:

1. Check if package exists in repository Packages section
2. Verify package visibility (public vs private)
3. Authenticate with GHCR if package is private
4. Check image name format: `ghcr.io/<owner>/<repo>-<service>:<tag>`

## Best Practices

1. **Version Tagging:** Use semantic versioning for releases
2. **Branch Protection:** Require workflows to pass before merging PRs
3. **Image Scanning:** Add security scanning to workflows (optional)
4. **Size Optimization:** Keep images small by using multi-stage builds
5. **Regular Updates:** Keep base images and dependencies updated

## Additional Resources

- [GitHub Packages Documentation](https://docs.github.com/packages)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-Architecture Builds](https://docs.docker.com/build/building/multi-platform/)
