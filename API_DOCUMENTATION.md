# API Documentation

## Overview

This document describes all available REST API endpoints for the Agent Chat Application. All endpoints return JSON responses and require authentication unless otherwise specified.

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Health & Metrics

### GET `/health`
Check application health status.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-30T17:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": 125829120,
    "total": 2147483648,
    "percentage": 5.86
  }
}
```

### GET `/health/metrics`
Get detailed performance metrics.

**Authentication:** Not required

**Response:**
```json
{
  "performance": {
    "averageResponseTime": 45.2,
    "slowOperations": [
      {
        "operation": "database_query",
        "duration": 250,
        "timestamp": "2026-04-30T17:00:00.000Z"
      }
    ]
  },
  "cache": {
    "size": 150,
    "hits": 450,
    "misses": 50,
    "hitRate": 90.0
  }
}
```

### GET `/health/performance`
Get performance monitoring data.

**Authentication:** Not required

**Response:**
```json
{
  "averageResponseTime": 45.2,
  "slowOperations": []
}
```

---

## Agents

### GET `/agents`
Get all agents for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "data": {
    "agents": [
      {
        "id": "agent-123",
        "userId": "user-456",
        "name": "Code Assistant",
        "description": "Helps with coding tasks",
        "persona": "Professional and helpful",
        "skills": ["coding", "debugging"],
        "permissions": ["read_files", "execute_commands"],
        "vms": [],
        "models": ["gpt-4"],
        "status": "active",
        "isOnline": true,
        "isActive": true,
        "state": "idle",
        "metadata": {},
        "createdAt": "2026-04-30T17:00:00.000Z",
        "updatedAt": "2026-04-30T17:00:00.000Z"
      }
    ]
  }
}
```

### POST `/agents`
Create a new agent.

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Code Assistant",
  "description": "Helps with coding tasks",
  "persona": "Professional and helpful",
  "skills": ["coding", "debugging"],
  "permissions": ["read_files"],
  "models": ["gpt-4"],
  "openrouterApiKey": "optional-key"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "agent": {
      "id": "agent-123",
      "name": "Code Assistant",
      // ... full agent object
    }
  }
}
```

### GET `/agents/:agentId`
Get a specific agent by ID.

**Authentication:** Required

**Parameters:**
- `agentId` (string): Agent UUID

**Response:**
```json
{
  "status": "success",
  "data": {
    "agent": {
      "id": "agent-123",
      // ... full agent object
    }
  }
}
```

### PUT `/agents/:agentId`
Update an existing agent.

**Authentication:** Required

**Parameters:**
- `agentId` (string): Agent UUID

**Request Body:** (partial update supported)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "inactive"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "agent": {
      "id": "agent-123",
      // ... updated agent object
    }
  }
}
```

### DELETE `/agents/:agentId`
Delete an agent.

**Authentication:** Required

**Parameters:**
- `agentId` (string): Agent UUID

**Response:**
```json
{
  "status": "success",
  "message": "Agent deleted successfully"
}
```

---

## Conversations

### GET `/conversations`
Get all conversations for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "status": "success",
  "data": {
    "conversations": [
      {
        "id": "conv-123",
        "userId": "user-456",
        "name": "Chat with Code Assistant",
        "type": "direct",
        "participants": ["agent-123"],
        "lastMessageAt": "2026-04-30T17:00:00.000Z",
        "createdAt": "2026-04-30T17:00:00.000Z",
        "updatedAt": "2026-04-30T17:00:00.000Z"
      }
    ]
  }
}
```

### POST `/conversations`
Create a new conversation.

**Authentication:** Required

**Request Body (Direct Chat):**
```json
{
  "agentId": "agent-123",
  "title": "Optional title"
}
```

**Request Body (Group Chat):**
```json
{
  "type": "group",
  "participants": ["agent-123", "agent-456"],
  "name": "Group chat name"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "conv-123",
      // ... full conversation object
    }
  }
}
```

### GET `/conversations/:conversationId`
Get a specific conversation by ID.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Response:**
```json
{
  "status": "success",
  "data": {
    "conversation": {
      "id": "conv-123",
      // ... full conversation object
    }
  }
}
```

### DELETE `/conversations/:conversationId`
Delete a conversation.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Response:**
```json
{
  "status": "success",
  "message": "Conversation deleted successfully"
}
```

---

## Messages

### GET `/conversations/:conversationId/messages`
Get all messages for a conversation.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Query Parameters:**
- `limit` (number, optional): Maximum messages to return (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "msg-123",
        "conversationId": "conv-123",
        "senderId": "user-456",
        "senderType": "user",
        "content": "Hello, can you help me?",
        "attachments": [],
        "mentionedAgents": ["agent-123"],
        "isRead": true,
        "createdAt": "2026-04-30T17:00:00.000Z",
        "updatedAt": "2026-04-30T17:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

### POST `/conversations/:conversationId/messages`
Send a new message in a conversation.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Request Body:**
```json
{
  "content": "Hello, can you help me?",
  "mentionedAgents": ["agent-123"]
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": {
      "id": "msg-123",
      "conversationId": "conv-123",
      "senderId": "user-456",
      "senderType": "user",
      "content": "Hello, can you help me?",
      "createdAt": "2026-04-30T17:00:00.000Z",
      "updatedAt": "2026-04-30T17:00:00.000Z"
    }
  }
}
```

**Note:** After sending a message, the agent will automatically generate a response. The agent's response will be broadcasted via WebSocket.

---

## Context Management

### GET `/conversations/:conversationId/context`
Get current context for a conversation.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Response:**
```json
{
  "status": "success",
  "data": {
    "context": {
      "id": "ctx-123",
      "conversationId": "conv-123",
      "rawContext": "Full conversation history...",
      "compressedContext": "Summarized: User asked about...",
      "tokenCount": 3500,
      "isCompressed": true,
      "lastCompressedAt": "2026-04-30T17:00:00.000Z",
      "createdAt": "2026-04-30T17:00:00.000Z",
      "updatedAt": "2026-04-30T17:00:00.000Z"
    }
  }
}
```

### POST `/conversations/:conversationId/context/compress`
Manually trigger context compression.

**Authentication:** Required

**Parameters:**
- `conversationId` (string): Conversation UUID

**Response:**
```json
{
  "status": "success",
  "data": {
    "compressed": true,
    "tokensBefore": 4500,
    "tokensAfter": 2000,
    "compressionRatio": 0.56,
    "context": {
      "id": "ctx-123",
      // ... full context object
    }
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "agentId",
      "message": "Agent ID is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "An unexpected error occurred",
  "error": "Detailed error message (only in development)"
}
```

---

## WebSocket Events

The application uses WebSocket for real-time updates. Connect to:

```
ws://localhost:3001
```

### Client -> Server Events

#### `join_conversation`
Join a conversation room to receive messages.

```javascript
socket.emit('join_conversation', {
  conversationId: 'conv-123'
})
```

#### `send_message`
Send a message (alternative to REST API).

```javascript
socket.emit('send_message', {
  conversationId: 'conv-123',
  content: 'Hello!',
  mentionedAgents: ['agent-123']
})
```

### Server -> Client Events

#### `message`
Receive a new message in a conversation.

```javascript
socket.on('message', (data) => {
  console.log('New message:', data.message)
})
```

**Data:**
```json
{
  "conversationId": "conv-123",
  "message": {
    "id": "msg-123",
    "content": "Hello!",
    // ... full message object
  }
}
```

#### `agent_typing`
Agent is typing a response.

```javascript
socket.on('agent_typing', (data) => {
  console.log('Agent typing:', data)
})
```

**Data:**
```json
{
  "conversationId": "conv-123",
  "agentId": "agent-123",
  "isTyping": true
}
```

#### `presence`
Agent online/offline status changed.

```javascript
socket.on('presence', (data) => {
  console.log('Agent presence:', data)
})
```

**Data:**
```json
{
  "agentId": "agent-123",
  "status": "online",
  "timestamp": "2026-04-30T17:00:00.000Z"
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authenticated endpoints:** 100 requests per minute per user
- **Unauthenticated endpoints:** 20 requests per minute per IP
- **Message sending:** 10 messages per minute per conversation

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1619827200
```

---

## Pagination

Endpoints that return lists support pagination via query parameters:

- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

Response includes pagination metadata:

```json
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Best Practices

1. **Always handle errors**: Check response status and handle error cases
2. **Use WebSocket for real-time**: Subscribe to WebSocket events for instant updates
3. **Respect rate limits**: Implement exponential backoff for retries
4. **Compress large payloads**: Use gzip compression for large requests
5. **Cache when possible**: Cache agent and conversation data to reduce API calls
6. **Validate input**: Always validate user input before sending to API
7. **Use pagination**: Don't load all messages at once, paginate for better performance

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import APIClient from '@/lib/api-client'

// Get all agents
const response = await APIClient.get('/api/v1/agents')
const agents = response.data.agents

// Create conversation
const conversation = await APIClient.post('/api/v1/conversations', {
  agentId: 'agent-123'
})

// Send message
const message = await APIClient.post(
  `/api/v1/conversations/${conversationId}/messages`,
  { content: 'Hello!' }
)
```

### cURL

```bash
# Get agents
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/v1/agents

# Create conversation
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-123"}' \
  http://localhost:3001/api/v1/conversations

# Send message
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!"}' \
  http://localhost:3001/api/v1/conversations/conv-123/messages
```

---

## Changelog

### Version 1.0.0 (2026-04-30)
- Initial API release
- Agent management endpoints
- Conversation and message endpoints
- Context management with compression
- WebSocket real-time updates
- Health and metrics endpoints
- Rate limiting and error handling
