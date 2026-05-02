
# 🤖 AI Agent Swarm

A distributed AI agent platform featuring persistent conversations, individual execution environments, real-time communication, and a Bring-Your-Own-Infrastructure (BYOI) model.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![Backend CI](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/docker-publish-backend.yml/badge.svg)](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/docker-publish-backend.yml)
[![Agent CI](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/docker-publish-agent.yml/badge.svg)](https://github.com/YOUR-USERNAME/YOUR-REPO/actions/workflows/docker-publish-agent.yml)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

AI Agent Swarm is a production-ready platform for deploying autonomous AI agents with:
- **Persistent Conversations**: Full chat history with PostgreSQL
- **Real-Time Communication**: WebSocket-based bidirectional messaging
- **Powerful Tools**: File system, terminal, Git, and code execution
- **LLM Agnostic**: Support for OpenAI and Anthropic
- **BYOI Model**: Deploy on any infrastructure
- **Docker Ready**: Portable containerized deployment

### Key Differentiators

- ✅ **No Vendor Lock-in**: Works with any infrastructure (AWS, GCP, Azure, self-hosted)
- ✅ **Raw SQL Performance**: Direct PostgreSQL queries, no ORM overhead
- ✅ **Function Calling**: Native LLM tool integration with iterative execution
- ✅ **Security First**: Workspace isolation, resource limits, audit logging
- ✅ **Production Ready**: Docker, health checks, graceful shutdown

## ✨ Features

### Core Capabilities

- **🔐 Authentication & Authorization**
  - JWT-based authentication
  - Bcrypt password hashing
  - Agent token authentication

- **💬 Conversation Management**
  - Persistent chat history with context compression
  - Multi-conversation support (direct and group)
  - Message threading
  - Automatic context management with AI-powered summarization
  - Token-aware compression at 80% capacity
  - Smart context window management

- **🔌 Real-Time Communication**
  - WebSocket with Socket.io
  - Real-time typing indicators
  - Presence tracking
  - Room-based messaging
  - Optimistic message updates
  - Error handling with retry functionality

- **🛠️ Agent Tools**
  - **File System**: Read, write, list, create, delete, move, copy
  - **Terminal**: Execute shell commands with timeout protection
  - **Git**: Complete version control operations
  - **Code Execution**: Run Python, JavaScript, TypeScript, Bash

- **🤖 LLM Integration**
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude 3.5 Sonnet)
  - OpenRouter support with 200+ models
  - Enhanced model registry with automatic fallbacks
  - Circuit breaker pattern for fault tolerance
  - Retry logic with exponential backoff
  - Function calling with tools
  - Streaming responses

- **⚡ Performance & Reliability**
  - In-memory caching with TTL
  - Database connection pooling
  - Performance monitoring and metrics
  - Health check endpoints
  - Rate limiting and error recovery
  - Comprehensive error handling

- **📢 Notifications**
  - Email notifications (configurable)
  - Webhook integrations
  - WebSocket push notifications

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│  Backend API     │────▶│   PostgreSQL    │
│   (Next.js)     │◀────│  (Node.js)       │◀────│   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │     ▲
                               │     │ WebSocket
                               ▼     │
                        ┌──────────────────┐
                        │  Agent Daemon    │
                        │    (Python)      │
                        └──────────────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │   LLM   │ │  Tools  │ │Workspace│
              │ OpenAI/ │ │FileSystem│ │  /tmp  │
              │Anthropic│ │ Terminal│ │         │
              └─────────┘ │   Git   │ └─────────┘
                          │  Code   │
                          └─────────┘
```

### Component Responsibilities

1. **Backend API**: RESTful API, authentication, conversation persistence
2. **WebSocket Server**: Real-time bidirectional communication
3. **Agent Daemon**: LLM orchestration, tool execution, task management
4. **PostgreSQL**: Persistent storage for users, agents, conversations
5. **Tools System**: Secure, isolated execution environment

## 🚀 Quick Start

### Option 1: Local Development (Recommended)

**Prerequisites:**
- Node.js >= 18.0.0
- Python 3.9+
- Docker (for PostgreSQL only)
- OpenAI or Anthropic API key

**One-Command Setup:**
```bash
# 1. Clone and setup
git clone <repository-url>
cd ai-agent-swarm

# 2. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 3. Install dependencies
npm install
cd frontend && npm install && cd ..
cd agent-daemon && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd ..

# 4. Start everything (PostgreSQL in Docker, rest locally)
./start-local.sh
```

**Access:**
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend: http://localhost:3000
- ❤️ Health: http://localhost:3000/health

**Stop services:**
```bash
./stop-local.sh
```

See [QUICK_LOCAL_START.md](QUICK_LOCAL_START.md) for detailed local development setup.

### Option 2: Full Docker Deployment

**Prerequisites:**
- Docker & Docker Compose
- OpenAI or Anthropic API key
- 4GB RAM minimum

**Steps:**
```bash
# 1. Clone repository
git clone <repository-url>
cd ai-agent-swarm

# 2. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 3. Start all services in Docker
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Check health
curl http://localhost:3000/health
```

### Create First User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "name": "Admin User"
  }'
```

### Environment Configuration

Required variables in `.env`:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# Backend
JWT_SECRET=your_jwt_secret_key

# Agent
AGENT_TOKEN=your_agent_token
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

See [`.env.example`](.env.example) for full configuration options.

## 📚 Documentation

### Getting Started

- **[Quick Local Start](QUICK_LOCAL_START.md)** ⚡ - One-command local development setup
- **[Local Setup Guide](LOCAL_SETUP.md)** - Detailed local development instructions
- **[Setup Guide](SETUP.md)** - Initial environment setup

### Core Documentation

- **[Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md)** - System architecture and component interactions
- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Detailed implementation roadmap
- **[API Documentation](API_DOCUMENTATION.md)** 📚 - Complete REST API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** 🚀 - Production deployment instructions
- **[GitHub Actions Setup](GITHUB_ACTIONS_SETUP.md)** 🐳 - Automated Docker image builds
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** 🔧 - Common issues and solutions
- **[Tools Documentation](agent-daemon/tools/README.md)** - Agent tools reference

### Technical Documentation

- **[Frontend Polish Summary](FRONTEND_POLISH_SUMMARY.md)** - UI/UX enhancements
- **[WebSocket Events](API_DOCUMENTATION.md#websocket-events)** - Real-time communication protocol
- **[Agent Tools](agent-daemon/tools/README.md)** - Tool system architecture
- **[Database Schema](migrations/)** - PostgreSQL schema and migrations
- **[Performance Optimization](NEXT_STEPS.md)** - Caching and performance features

## 📁 Project Structure

```
ai-agent-swarm/
├── src/                          # Backend Node.js/TypeScript
│   ├── controllers/              # Request handlers
│   ├── services/                 # Business logic
│   ├── repositories/             # Data access layer
│   ├── routes/                   # API routes
│   ├── middleware/               # Express middleware
│   ├── utils/                    # Utilities
│   └── index.ts                  # Application entry point
│
├── agent-daemon/                 # Python Agent Daemon
│   ├── tools/                    # Agent tools
│   │   ├── base.py              # Tool base classes
│   │   ├── file_system.py       # File operations
│   │   ├── terminal.py          # Command execution
│   │   ├── git.py               # Version control
│   │   ├── code_execution.py    # Code runner
│   │   └── tool_manager.py      # Tool coordinator
│   ├── agent.py                  # Main agent orchestrator
│   ├── llm_client.py            # LLM abstraction
│   ├── websocket_client.py      # WebSocket client
│   └── main.py                   # Agent entry point
│
├── migrations/                   # Database migrations
├── docker-compose.yml            # Docker orchestration
├── Dockerfile.backend            # Backend container
├── Dockerfile.agent              # Agent container
└── README.md                     # This file
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 20
- **Language**: TypeScript 5.0
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Real-Time**: Socket.io
- **Validation**: Zod
- **Authentication**: JWT + Bcrypt

### Agent Daemon
- **Language**: Python 3.11
- **Async**: asyncio
- **LLM**: OpenAI SDK, Anthropic SDK
- **WebSocket**: python-socketio
- **Config**: pydantic-settings

### DevOps
- **Containerization**: Docker, Docker Compose
- **Database**: PostgreSQL with raw SQL
- **Logging**: Winston (Node), colorlog (Python)
- **Health Checks**: Built-in endpoints

## 💻 Development

### Local Development Setup

```bash
# Backend
cd src
npm install
npm run dev

# Agent Daemon
cd agent-daemon
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python main.py

# Database
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_agent_swarm \
  postgres:15-alpine
```

### Running Tests

```bash
# Backend tests (coming soon)
npm test

# Agent tests (coming soon)
pytest
```

### Code Quality

```bash
# TypeScript linting
npm run lint

# Python linting
pylint agent-daemon/

# Type checking
npm run type-check
mypy agent-daemon/
```

## 🚢 Deployment

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

### Manual Docker

```bash
# Build images
docker build -f Dockerfile.backend -t ai-agent-backend .
docker build -f Dockerfile.agent -t ai-agent-daemon .

# Run containers
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=password \
  postgres:15-alpine

docker run -d --name backend \
  --link postgres \
  -e DATABASE_URL=postgresql://postgres:password@postgres:5432/ai_agent_swarm \
  ai-agent-backend

docker run -d --name agent \
  --link backend \
  -e BACKEND_URL=http://backend:3000 \
  ai-agent-daemon
```

### Cloud Providers

The BYOI model supports any infrastructure:
- **AWS**: EC2 + RDS
- **Google Cloud**: Compute Engine + Cloud SQL
- **Azure**: VMs + Azure Database for PostgreSQL
- **DigitalOcean**: Droplets + Managed Database
- **Self-Hosted**: Any Linux server

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📖 API Reference

### Authentication

```bash
# Register
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Agents

```bash
# Create Agent
POST /api/agents
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Alice",
  "description": "AI Assistant",
  "type": "general"
}

# List Agents
GET /api/agents
Authorization: Bearer <token>

# Get Agent
GET /api/agents/:id
Authorization: Bearer <token>
```

### Conversations

```bash
# Create Conversation
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json
{
  "agentId": "agent-uuid",
  "title": "New Chat"
}

# List Conversations
GET /api/conversations
Authorization: Bearer <token>

# Get Conversation
GET /api/conversations/:id
Authorization: Bearer <token>

# Send Message
POST /api/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json
{
  "content": "Hello!",
  "role": "user"
}
```

### WebSocket Events

```javascript
// Connect
const socket = io('ws://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

// Listen for messages
socket.on('message:new', (data) => {
  console.log('New message:', data);
});

// Send message
socket.emit('message:send', {
  conversationId: 'conv-uuid',
  content: 'Hello!'
});

// Typing indicator
socket.emit('typing:start', { conversationId: 'conv-uuid' });
socket.emit('typing:stop', { conversationId: 'conv-uuid' });
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Ensure Docker builds succeed
- Test with both OpenAI and Anthropic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Anthropic for Claude models
- The open-source community

## 📞 Support

- **Documentation**: See docs in this repository
- **Issues**: [GitHub Issues](https://github.com/your-org/ai-agent-swarm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ai-agent-swarm/discussions)

---

**Status**: ✅ Phase 1 MVP Complete (~85%)

**Next Steps**:
- [ ] Build React web UI
- [ ] Add comprehensive testing
- [ ] Performance optimization
- [ ] Advanced tool features (Docker execution, API tools)
- [ ] Multi-agent orchestration

Made with ❤️ by the AI Agent Swarm Team
