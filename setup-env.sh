#!/bin/bash

# AI Agent Swarm - Environment Setup Script
# This script creates the .env file with secure defaults

echo "🔧 Setting up environment configuration..."

# Generate secure random secrets
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)

# Create .env file
cat > .env << EOF
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=ai_agent_swarm
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@ai-agent-postgres:5432/ai_agent_swarm

# Backend Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Agent Configuration
AGENT_ID=alice
AGENT_TOKEN=your_agent_jwt_token_here
BACKEND_URL=http://backend:3000
WEBSOCKET_URL=ws://backend:3000

# LLM Configuration (choose one)
LLM_PROVIDER=openai
# LLM_PROVIDER=anthropic

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Configuration  
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Agent Workspace
WORKSPACE_PATH=/workspace
LOG_LEVEL=INFO
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You must update the following values in .env:"
echo "   - OPENAI_API_KEY (if using OpenAI)"
echo "   - ANTHROPIC_API_KEY (if using Anthropic)"
echo "   - AGENT_TOKEN (generate a JWT token for agent authentication)"
echo ""
echo "📝 Generated secure values:"
echo "   - JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "   - POSTGRES_PASSWORD: ${DB_PASSWORD}"
echo ""
echo "🚀 To start the application:"
echo "   1. Edit .env and add your API keys"
echo "   2. Run: docker-compose up -d"
