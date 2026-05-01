# Swarm - AI Agent Management Platform

A comprehensive platform for creating, managing, and collaborating with multiple AI agents. Agents can work independently or in groups, communicate in real-time, and be assigned tasks via a Jira-like board or cron scheduler.

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 16.2.4 with React 19.2.4
- **UI Components**: shadcn/ui with Tailwind CSS
- **Real-time Communication**: Socket.io client
- **State Management**: Zustand
- **TypeScript**: Full type safety

### Key Libraries Installed
- `socket.io-client@4.8.3` - WebSocket client for real-time features
- `cron-parser@5.5.0` - Cron expression parsing and validation
- `zustand@5.0.12` - Lightweight state management
- `zod@3.24.1` - Runtime type validation
- `react-hook-form@7.54.1` - Form management
- `lucide-react` - Icon library

## Project Structure

```
swarm/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx (home)
│   │   ├── agents/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── scheduler/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── page.tsx (redirect to dashboard or login)
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   └── dashboard-layout.tsx (navigation, mobile responsive)
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   └── agent-form.tsx
│   ├── ui/ (shadcn/ui components)
│   └── ... (more components to come)
├── hooks/
│   ├── use-auth.ts (authentication hook)
│   ├── use-agents.ts (agent management hook)
│   └── use-mobile.ts (mobile detection, existing)
├── lib/
│   ├── types.ts (all TypeScript types)
│   ├── auth.ts (authentication utilities)
│   ├── api-client.ts (API request helper)
│   ├── websocket.ts (WebSocket client)
│   ├── store.ts (Zustand stores)
│   └── utils.ts (existing utilities)
├── public/ (static assets)
├── scripts/
│   └── init-database.sql (database schema)
└── styles/ (Tailwind CSS)
```

## Completed Features (Phase 1-3)

### Phase 1: Setup & Database Schema ✅
- Created comprehensive TypeScript types for all entities
- Generated PostgreSQL database schema with proper indexes
- Installed Socket.io, cron-parser, zustand dependencies
- Set up authentication utilities (JWT, token management)
- Created API client with proper error handling

### Phase 2: Mobile-First Responsive Design ✅
- Built responsive dashboard layout with hamburger menu
- Mobile-first CSS design using Tailwind
- Touch-optimized button sizes (44×44px minimum)
- Responsive navigation sidebar (collapsible on mobile)
- Optimized typography and spacing for all screen sizes

### Phase 3: Agent Management Enhancements ✅
- Complete CRUD operations for agents
- Agent card component with status indicators
- Agent form with dynamic skill/permission/VM/model management
- Agent listing page with search and filtering
- Zustand store for agent state management
- Mobile-responsive agent grid layout

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Update these to match your backend API and WebSocket server.

## Database Setup

Run the SQL migration to create all tables:

```bash
# Connect to your PostgreSQL database and run:
psql -U username -d database_name -f scripts/init-database.sql
```

Or execute the SQL file content directly in your database client.

## Current State

### Available Pages
1. **Login** (`/auth/login`) - User authentication
2. **Register** (`/auth/register`) - Account creation
3. **Dashboard** (`/dashboard`) - Home with quick stats
4. **Agents** (`/dashboard/agents`) - Full agent management
5. **Chat** (`/dashboard/chat`) - Placeholder for messaging
6. **Tasks** (`/dashboard/tasks`) - Placeholder for task board
7. **Scheduler** (`/dashboard/scheduler`) - Placeholder for task scheduling
8. **Settings** (`/dashboard/settings`) - User settings

### Available Components
- `DashboardLayout` - Main layout with responsive navigation
- `AgentCard` - Agent display card with actions
- `AgentForm` - Form for creating/editing agents

### Available Hooks
- `useAuth()` - Authentication state and methods
- `useAgents()` - Agent CRUD operations
- `useMobile()` - Mobile viewport detection (existing)

## Next Steps (Remaining Phases)

### Phase 4: Direct Agent Chat with Socket.io
- Implement chat list component
- Build chat window with message history
- Set up WebSocket message handlers
- Add typing indicators and read status

### Phase 5: Task Board with Kanban
- Build Kanban board with drag-drop
- Create task form and detail views
- Implement task filtering and sorting
- Add task assignment to agents

### Phase 6: Scheduler with Cron Support
- Build scheduler UI with calendar view
- Create cron expression builder
- Implement task execution preview
- Add recurring task support

### Phase 7: Real-time Notifications
- Create notification popup component (WhatsApp style)
- Build notification center
- Implement WebSocket notification handlers
- Add notification persistence and filtering

### Phase 8: Group Chat & Agent Collaboration
- Extend conversation model for groups
- Build group chat interface
- Implement @mention system
- Create agent member management

### Phase 9: Service Worker & Push Notifications
- Register service worker for PWA
- Implement push notification handlers
- Add manifest.json for PWA support
- Handle offline scenarios

### Phase 10: Polish & Optimization
- Performance optimization
- Comprehensive error handling
- Accessibility improvements
- Loading and empty states
- Browser compatibility testing

## Type System

All major types are defined in `lib/types.ts`:
- `User` - User account information
- `Agent` - AI agent configuration
- `Conversation` - Chat conversations
- `Message` - Chat messages
- `Task` - Project tasks
- `ScheduledTask` - Cron-scheduled tasks
- `Notification` - User notifications
- `PushSubscription` - Push notification subscriptions

## API Integration

The frontend expects a backend API at `NEXT_PUBLIC_API_URL` with these endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Agents
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### WebSocket Events
- `message` - Chat messages
- `notification` - Real-time notifications
- `presence` - Agent online/offline status
- `task-update` - Task status changes

## Mobile Responsive Design

All pages are optimized for:
- **Mobile** (320px-480px) - Hamburger menu, stacked layouts
- **Tablet** (481px-768px) - Sidebar visible, 2-column layouts
- **Desktop** (769px+) - Full navigation, multi-column layouts

Touch targets are minimum 44×44px for mobile accessibility.

## Getting Started Locally

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit with your backend URLs
   ```

3. Start dev server:
   ```bash
   pnpm dev
   ```

4. Open http://localhost:3000 in browser

5. Navigate to login page to test authentication flow

## Future Enhancements

- Dark mode toggle
- Agent status/availability tracking
- Message search and filtering
- Task templates and automation
- Agent performance analytics
- Batch operations
- Import/export functionality
- Team management features
- Advanced permissions system
