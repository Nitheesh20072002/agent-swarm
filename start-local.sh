
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  AI Agent Swarm - Local Development   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}   Please copy .env.example to .env and configure it${NC}"
    echo -e "${YELLOW}   Run: cp .env.example .env${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}⚠️  Port $1 is already in use. Killing existing process...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 2
}

# Check and clean up ports
echo -e "${YELLOW}🔍 Checking ports...${NC}"
if check_port 3000; then
    kill_port 3000
fi
if check_port 5173; then
    kill_port 5173
fi

# Start PostgreSQL
echo -e "${GREEN}🐘 Starting PostgreSQL in Docker...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is healthy
until docker exec ai-agent-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -e "${YELLOW}   Still waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Run migrations
echo -e "${GREEN}🗃️  Running database migrations...${NC}"
npm run db:migrate
echo ""

# Create tmux session or use separate terminal windows
if command -v tmux &> /dev/null; then
    echo -e "${GREEN}🚀 Starting services in tmux...${NC}"
    echo -e "${YELLOW}   Use 'tmux attach -t ai-agent-swarm' to view all services${NC}"
    echo -e "${YELLOW}   Use 'Ctrl+B then D' to detach from tmux${NC}"
    echo -e "${YELLOW}   Use './stop-local.sh' to stop all services${NC}"
    echo ""
    
    # Kill existing tmux session if it exists
    tmux kill-session -t ai-agent-swarm 2>/dev/null
    
    # Create new tmux session
    tmux new-session -d -s ai-agent-swarm -n backend
    
    # Window 0: Backend
    tmux send-keys -t ai-agent-swarm:backend "npm run dev" C-m
    
    # Window 1: Frontend
    tmux new-window -t ai-agent-swarm -n frontend
    tmux send-keys -t ai-agent-swarm:frontend "cd frontend && npm run dev" C-m
    
    # Window 2: Agent Daemon
    tmux new-window -t ai-agent-swarm -n agent
    tmux send-keys -t ai-agent-swarm:agent "cd agent-daemon && source venv/bin/activate && python main.py" C-m
    
    # Select backend window
    tmux select-window -t ai-agent-swarm:backend
    
    echo -e "${GREEN}✅ All services started in tmux!${NC}"
    echo ""
    echo -e "${GREEN}📋 Service URLs:${NC}"
    echo -e "   • Frontend:  ${GREEN}http://localhost:5173${NC}"
    echo -e "   • Backend:   ${GREEN}http://localhost:3000${NC}"
    echo -e "   • Health:    ${GREEN}http://localhost:3000/health${NC}"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo -e "   1. Visit http://localhost:5173 to access the frontend"
    echo -e "   2. Run 'tmux attach -t ai-agent-swarm' to view service logs"
    echo -e "   3. Run './stop-local.sh' when you're done"
    echo ""
else
    echo -e "${YELLOW}⚠️  tmux not found. Starting services in background...${NC}"
    echo -e "${YELLOW}   Install tmux for better terminal management: brew install tmux${NC}"
    echo ""
    
    # Start services in background
    echo -e "${GREEN}🚀 Starting backend...${NC}"
    npm run dev > logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    echo -e "${GREEN}🚀 Starting frontend...${NC}"
    cd frontend
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
    cd ..
    
    echo -e "${GREEN}🚀 Starting agent daemon...${NC}"
    cd agent-daemon
    source venv/bin/activate
    python main.py > ../logs/agent.log 2>&1 &
    AGENT_PID=$!
    echo "Agent PID: $AGENT_PID"
    cd ..
    
    # Save PIDs
    mkdir -p .pids
    echo $BACKEND_PID > .pids/backend.pid
    echo $FRONTEND_PID > .pids/frontend.pid
    echo $AGENT_PID > .pids/agent.pid
    
    echo ""
    echo -e "${GREEN}✅ All services started in background!${NC}"
    echo ""
    echo -e "${GREEN}📋 Service URLs:${NC}"
    echo -e "   • Frontend:  ${GREEN}http://localhost:5173${NC}"
    echo -e "   • Backend:   ${GREEN}http://localhost:3000${NC}"
    echo -e "   • Health:    ${GREEN}http://localhost:3000/health${NC}"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo -e "   • Backend:  tail -f logs/backend.log"
    echo -e "   • Frontend: tail -f logs/frontend.log"
    echo -e "   • Agent:    tail -f logs/agent.log"
    echo ""
    echo -e "${YELLOW}💡 Run './stop-local.sh' to stop all services${NC}"
    echo ""
fi
