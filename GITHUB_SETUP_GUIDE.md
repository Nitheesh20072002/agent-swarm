
# GitHub Setup Guide

## Step 1: Create Repository on GitHub

### Option A: Via GitHub Website (Easiest)

1. **Go to GitHub**: https://github.com
2. **Sign in** to your account
3. **Click the "+" icon** in the top-right corner
4. **Select "New repository"**
5. **Fill in the details**:
   - **Repository name**: `ai-agent-swarm` (or your preferred name)
   - **Description**: "Production-ready AI Agent Chat System with intelligent conversations, context management, and real-time interactions"
   - **Visibility**: 
     - ✅ **Public** (recommended for open source)
     - ⚠️ **Private** (if you want to keep it private)
   - ⚠️ **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. **Click "Create repository"**

### Option B: Via GitHub CLI (Advanced)

```bash
# Install GitHub CLI if you haven't
# macOS: brew install gh
# Linux: See https://github.com/cli/cli#installation

# Login to GitHub
gh auth login

# Create repository
gh repo create ai-agent-swarm --public --source=. --remote=origin --push
```

---

## Step 2: Initialize Git (If Not Already Done)

```bash
# Check if git is initialized
git status

# If you get "fatal: not a git repository", initialize it:
git init

# Set your identity (if not done globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## Step 3: Add Files to Git

```bash
# Add all files
git add .

# Check what will be committed (optional but recommended)
git status

# You should see all your files listed in green
# Files like .env, node_modules, logs should NOT appear (they're in .gitignore)
```

---

## Step 4: Create First Commit

```bash
# Create your first commit
git commit -m "Initial commit: AI Agent Swarm - Production Ready

Features:
- Beautiful landing page with hero section
- Complete AI agent chat system
- Context management with compression
- Real-time WebSocket communication
- Error handling with retry mechanisms
- Performance optimization with caching
- Complete API documentation
- Production deployment guides
- Troubleshooting documentation

Tech Stack:
- Backend: Node.js, TypeScript, Express, PostgreSQL
- Frontend: Next.js, React, TailwindCSS
- AI: OpenRouter, Multiple LLM support
- Deployment: Docker, Docker Compose
"
```

---

## Step 5: Add Remote and Push

After creating the repository on GitHub (Step 1), you'll see a page with instructions. Use these commands:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ai-agent-swarm.git

# Or if you prefer SSH (make sure you have SSH keys set up):
# git remote add origin git@github.com:YOUR_USERNAME/ai-agent-swarm.git

# Verify the remote was added
git remote -v

# Push to GitHub (use 'main' or 'master' depending on your default branch)
git branch -M main  # Rename to main if needed
git push -u origin main

# Or if your default branch is master:
# git push -u origin master
```

---

## Step 6: Verify on GitHub

1. Go to your repository URL: `https://github.com/YOUR_USERNAME/ai-agent-swarm`
2. You should see all your files
3. The README.md should display automatically

---

## Troubleshooting

### Issue: "Repository not found"

**Cause**: The repository doesn't exist on GitHub yet.

**Solution**: Complete Step 1 to create the repository on GitHub first.

### Issue: "Permission denied (publickey)"

**Cause**: SSH key is not set up or not added to GitHub.

**Solutions**:
1. **Use HTTPS instead**:
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/ai-agent-swarm.git
   ```

2. **Or set up SSH keys**:
   ```bash
   # Generate SSH key
   ssh-keygen -t ed25519 -C "your.email@example.com"
   
   # Copy public key
   cat ~/.ssh/id_ed25519.pub
   
   # Add to GitHub: Settings → SSH and GPG keys → New SSH key
   ```

### Issue: "Authentication failed"

**Cause**: Incorrect credentials or token.

**Solutions**:
1. **Use Personal Access Token** (recommended):
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Select scopes: `repo` (full control)
   - Copy the token
   - Use it as password when prompted

2. **Or use GitHub CLI**:
   ```bash
   gh auth login
   ```

### Issue: "Updates were rejected"

**Cause**: Remote has changes that you don't have locally.

**Solution**:
```bash
# Pull first
git pull origin main --rebase

# Then push
git push origin main
```

### Issue: "fatal: refusing to merge unrelated histories"

**Cause**: Repository was initialized with files (README, license, etc.)

**Solution**:
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## Best Practices

### 1. **Add a .gitignore** ✅ Already included

Make sure sensitive files are ignored:
- `.env` files (secrets)
- `node_modules/` (dependencies)
- `dist/`, `build/` (build artifacts)
- `logs/` (runtime logs)

### 2. **Protect Secrets**

Never commit:
- API keys
- Database passwords
- JWT secrets
- SSH keys
- AWS credentials

Always use `.env.example` for templates.

### 3. **Write Good Commit Messages**

```bash
# Good ✅
git commit -m "Add user authentication with JWT"
git commit -m "Fix: Resolve memory leak in context compression"
git commit -m "Docs: Update API documentation for new endpoints"

# Bad ❌
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

### 4. **Use Branches for Features**

```bash
# Create feature branch
git checkout -b feature/add-file-upload

# Make changes and commit
git add .
git commit -m "Add file upload functionality"

# Push branch
git push origin feature/add-file-upload

# Create Pull Request on GitHub
```

---

## Quick Reference

```bash
# Check status
git status

# Add files
git add .
git add specific-file.ts

# Commit
git commit -m "Your message"

# Push
git push origin main

# Pull
git pull origin main

# View remotes
git remote -v

# View branches
git branch -a

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- filename
git restore filename
```

---

## After Successful Push

Your repository is now on GitHub! Next steps:

1. **Add Topics/Tags** on GitHub:
   - Click "About" gear icon
   - Add: `ai`, `chatbot`, `agent`, `typescript`, `nodejs`, `nextjs`, `postgresql`, `docker`

2. **Enable GitHub Pages** (optional):
   - Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/docs` or `/` 

3. **Add Repository Badges** to README:
   ```markdown
   ![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/ai-agent-swarm)
   ![License](https://img.shields.io/github/license/YOUR_USERNAME/ai-agent-swarm)
   ![Issues](https://img.shields.io/github/issues/YOUR_USERNAME/ai-agent-swarm)
   ```

4. **Set up CI/CD** (optional):
   - GitHub Actions for automated testing
   - Deploy to Vercel/Netlify/Railway

5. **Add Contributing Guidelines**:
   - Create `CONTRIBUTING.md`
   - Add code of conduct
   - Set up issue templates

---

## Summary

1. ✅ Create repository on GitHub (via website or CLI)
2. ✅ Initialize git locally (`git init`)
3. ✅ Add files (`git add .`)
4. ✅ Create commit (`git commit -m "..."`)
5. ✅ Add remote (`git remote add origin ...`)
6. ✅ Push to GitHub (`git push -u origin main`)
7. ✅ Verify on GitHub website

---

**Need Help?**

- GitHub Docs: https://docs.github.com
- Git Guide: https://git-scm.com/book/en/v2
- GitHub Support: https://support.github.com

**Status**: Ready to push to GitHub! Follow Step 1 to create your repository first.
