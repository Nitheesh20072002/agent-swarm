# Swarm - Development Guide

## Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Run Development Server
```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Architecture Overview

### Frontend Structure
- **Pages** (`app/`): Next.js App Router pages
- **Components** (`components/`): Reusable UI components organized by feature
- **Hooks** (`hooks/`): Custom React hooks for data fetching and state
- **Library** (`lib/`): Utilities, types, and constants
- **Styles** (`app/globals.css`): Global styles with Tailwind and custom animations

### Data Flow
```
User Action → Component → Hook (useAuth, useAgents, etc.)
                              ↓
                         API Client (lib/api-client.ts)
                              ↓
                         Backend API / WebSocket
                              ↓
                         Zustand Store (lib/store.ts)
                              ↓
                         Component Re-render
```

### State Management
- **Global State**: Zustand store for auth, notifications
- **Local State**: React hooks for component-level state
- **Server State**: API client caching for data fetching
- **WebSocket State**: Real-time updates via Socket.io

## Feature Development

### Adding a New Feature

1. **Create the Hook** (`hooks/use-feature.ts`)
   - Define data fetching logic
   - Handle state updates
   - Error handling

2. **Create Components** (`components/feature/`)
   - Form components for input
   - List/card components for display
   - Container components for coordination

3. **Create Pages** (`app/dashboard/feature/page.tsx`)
   - Import components
   - Use hooks for data
   - Handle user interactions

4. **Add Types** (update `lib/types.ts`)
   - Define TypeScript interfaces
   - Export from types file

### Example: Adding a Feature

```typescript
// 1. Add type to lib/types.ts
export interface Feature {
  id: string
  name: string
  createdAt: string
}

// 2. Create hook (hooks/use-feature.ts)
export function useFeature() {
  const [items, setItems] = useState<Feature[]>([])
  
  const fetchItems = async () => {
    const response = await apiClient.get('/features')
    setItems(response.data)
  }
  
  return { items, fetchItems }
}

// 3. Create component (components/feature/feature-card.tsx)
export function FeatureCard({ item }: { item: Feature }) {
  return <Card>...</Card>
}

// 4. Create page (app/dashboard/feature/page.tsx)
export default function FeaturePage() {
  const { items } = useFeature()
  
  return <FeatureCard items={items} />
}
```

## Component Guidelines

### Component Organization
- Small, focused components (single responsibility)
- Props-based interfaces
- Proper TypeScript typing
- Accessibility attributes (aria-*, role, etc.)

### Naming Conventions
- Components: PascalCase (`AgentCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAgents.ts`)
- Pages: kebab-case (`agents-page.tsx`) or PascalCase
- Utilities: camelCase (`formatDate.ts`)

### Component Template
```typescript
'use client'

import { ReactNode } from 'react'

interface ComponentProps {
  children?: ReactNode
  // ... other props
}

/**
 * Component description
 */
export function Component({ children, ...props }: ComponentProps) {
  return (
    <div>
      {children}
    </div>
  )
}
```

## API Integration

### Making API Calls
```typescript
import { apiClient } from '@/lib/api-client'

// GET
const response = await apiClient.get('/agents')
const data = response.data

// POST
const created = await apiClient.post('/agents', {
  name: 'New Agent',
  description: 'Agent description'
})

// PUT
const updated = await apiClient.put('/agents/123', {
  name: 'Updated Name'
})

// DELETE
await apiClient.delete('/agents/123')
```

### Error Handling
```typescript
try {
  const response = await apiClient.get('/agents')
  setAgents(response.data)
} catch (error) {
  console.error('Failed to fetch agents:', error)
  setError(error.message)
}
```

## Real-Time Communication (WebSocket)

### Using WebSocket
```typescript
import { getSocket } from '@/lib/websocket'

export function useFeature() {
  useEffect(() => {
    const socket = getSocket()
    
    socket.on('event-name', (data) => {
      // Handle event
    })
    
    return () => {
      socket.off('event-name')
    }
  }, [])
}
```

### Emitting Events
```typescript
const socket = getSocket()
socket.emit('event-name', { data: 'value' })
```

## Styling

### Tailwind CSS
- Use utility classes for styling
- Follow the spacing scale (4px increments)
- Use design tokens for colors
- Mobile-first approach

### Custom CSS
- Add to `app/globals.css`
- Use `@layer` for organization
- Prefix with semantic names

### Component Styling Example
```tsx
<div className="space-y-4 p-4 rounded-lg border border-border bg-card">
  <h3 className="font-semibold text-lg">Title</h3>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```

## Testing

### Manual Testing Checklist
- [ ] Component renders without errors
- [ ] Form inputs work correctly
- [ ] API calls succeed
- [ ] Error states display properly
- [ ] Responsive design works (test on mobile)
- [ ] WebSocket events work
- [ ] Loading states display
- [ ] Empty states display

## Debugging

### Enable Debug Logging
```typescript
// In component
console.log("[v0] Component rendered with props:", props)
console.log("[v0] State updated:", newState)
console.log("[v0] API response:", response)
```

### Check Network
- Open DevTools → Network tab
- Monitor API calls and WebSocket events
- Check request/response payloads

### Check State
- DevTools → React Components
- Inspect component state and props
- Check Zustand store state

## Build & Deployment

### Building for Production
```bash
pnpm build
pnpm start
```

### Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

### Vercel Deployment
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy

## Common Issues

### API Calls Failing
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend is running
- Check CORS configuration on backend
- Inspect network tab for error details

### WebSocket Connection Failing
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify Socket.io server is running
- Check browser console for connection errors

### Components Not Updating
- Ensure hooks are properly importing and using state
- Check if `useEffect` dependencies are correct
- Verify Zustand store is being used correctly

### Styles Not Applied
- Clear browser cache
- Rebuild project (`pnpm build`)
- Check for CSS conflicts
- Verify Tailwind classes are valid

## Performance Tips

1. **Lazy Load Components**: Use `React.lazy()` for route-based splitting
2. **Optimize Images**: Use Next.js `Image` component
3. **Memoize**: Use `React.memo()` for expensive renders
4. **Debounce**: Debounce API calls in search inputs
5. **Pagination**: Implement pagination for large lists
6. **Caching**: Leverage API client caching

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org)

## Contributing

1. Create a branch for your feature
2. Make your changes
3. Test thoroughly
4. Create a pull request
5. Code review and merge

## Contact

For questions or issues, please reach out to the development team.
