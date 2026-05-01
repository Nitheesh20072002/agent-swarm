
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping AI Agent Swarm services...${NC}"
echo ""

# Check if tmux session exists
if tmux has-session -t ai-agent-swarm 2>/dev/null; then
    echo -e "${YELLOW}📺 Killing tmux session...${NC}"
    tmux kill-session -t ai-agent-swarm
    echo -e "${GREEN}✅ Tmux session stopped${NC}"
else
    # Stop services using PIDs
    if [ -d .pids ]; then
        echo -e "${YELLOW}🔪 Stopping background processes...${NC}"
        
        if [ -f .pids/backend.pid ]; then
            BACKEND_PID=$(cat .pids/backend.pid)
            kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✅ Backend stopped (PID: $BACKEND_PID)${NC}"
        fi
        
        if [ -f .pids/frontend.pid ]; then
            FRONTEND_PID=$(cat .pids/frontend.pid)
            kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✅ Frontend stopped (PID: $FRONTEND_PID)${NC}"
        fi
        
        if [ -f .pids/agent.pid ]; then
            AGENT_PID=$(cat .pids/agent.pid)
            kill $AGENT_PID 2>/dev/null && echo -e "${GREEN}✅ Agent stopped (PID: $AGENT_PID)${NC}"
        fi
        
        rm -rf .pids
    fi
fi

# Kill any remaining processes on ports
echo ""
echo -e "${YELLOW}🔍 Checking for remaining processes on ports...${NC}"

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing remaining process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Killing remaining process on port 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null
fi

# Stop PostgreSQL
echo ""
echo -e "${YELLOW}🐘 Stopping PostgreSQL...${NC}"
docker-compose stop postgres
echo -e "${GREEN}✅ PostgreSQL stopped${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  All services stopped successfully!    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}💡 To keep PostgreSQL data, it was only stopped (not removed)${NC}"
echo -e "${YELLOW}   To completely remove PostgreSQL data, run: docker-compose down -v${NC}"
echo ""
