# Swarm API Reference

This document outlines all API endpoints required by the Swarm frontend application. The backend should implement these endpoints to work with the frontend.

## Base Configuration

```
API Base URL: process.env.NEXT_PUBLIC_API_URL (e.g., http://localhost:3001)
WebSocket URL: process.env.NEXT_PUBLIC_WS_URL (e.g., ws://localhost:3001)
Authentication: JWT Token in httpOnly Cookie
Content-Type: application/json
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}

Response: 201
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  },
  "token": "jwt-token"
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  },
  "token": "jwt-token"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response: 200
{
  "id": "string",
  "username": "string",
  "email": "string"
}
```

### Logout User
```http
POST /auth/logout
Authorization: Bearer {token}

Response: 200
{
  "message": "Logged out successfully"
}
```

## Agent Endpoints

### List All Agents
```http
GET /agents?page=1&limit=20&search=query
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "persona": "string",
      "skills": ["string"],
      "permissions": ["string"],
      "vms": ["string"],
      "models": ["string"],
      "status": "online|offline",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number"
  }
}
```

### Create Agent
```http
POST /agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "persona": "string",
  "skills": ["string"],
  "permissions": ["string"],
  "vms": ["string"],
  "models": ["string"]
}

Response: 201
{
  "id": "string",
  "name": "string",
  "description": "string",
  "persona": "string",
  "skills": ["string"],
  "permissions": ["string"],
  "vms": ["string"],
  "models": ["string"],
  "status": "offline",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Get Agent Details
```http
GET /agents/{id}
Authorization: Bearer {token}

Response: 200
{
  "id": "string",
  "name": "string",
  "description": "string",
  "persona": "string",
  "skills": ["string"],
  "permissions": ["string"],
  "vms": ["string"],
  "models": ["string"],
  "status": "online|offline",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Update Agent
```http
PUT /agents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "persona": "string",
  "skills": ["string"],
  "permissions": ["string"],
  "vms": ["string"],
  "models": ["string"]
}

Response: 200
{
  "id": "string",
  "name": "string",
  ...
}
```

### Delete Agent
```http
DELETE /agents/{id}
Authorization: Bearer {token}

Response: 204 (No Content)
```

## Conversation Endpoints

### List Conversations
```http
GET /conversations?type=direct|group&page=1&limit=20
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "type": "direct|group",
      "participants": [
        {
          "id": "string",
          "name": "string",
          "type": "user|agent"
        }
      ],
      "lastMessage": {
        "content": "string",
        "createdAt": "ISO-8601"
      },
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

### Create Conversation
```http
POST /conversations
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "direct|group",
  "participantIds": ["string"],
  "title": "string" (optional, for group)
}

Response: 201
{
  "id": "string",
  "type": "direct|group",
  "title": "string",
  "participants": ["string"],
  "createdAt": "ISO-8601"
}
```

### Get Conversation Messages
```http
GET /conversations/{id}/messages?page=1&limit=50
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "conversationId": "string",
      "senderId": "string",
      "senderName": "string",
      "content": "string",
      "read": true,
      "createdAt": "ISO-8601"
    }
  ]
}
```

### Send Message
```http
POST /conversations/{id}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "string"
}

Response: 201
{
  "id": "string",
  "conversationId": "string",
  "senderId": "string",
  "senderName": "string",
  "content": "string",
  "read": false,
  "createdAt": "ISO-8601"
}
```

### Search Messages
```http
GET /conversations/{id}/messages/search?query=search-term
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "conversationId": "string",
      "senderId": "string",
      "content": "string",
      "createdAt": "ISO-8601"
    }
  ]
}
```

## Task Endpoints

### List Tasks
```http
GET /tasks?status=todo|in_progress|in_review|done&priority=low|medium|high|urgent&assignedAgent={agentId}&page=1&limit=50
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "todo|in_progress|in_review|done",
      "priority": "low|medium|high|urgent",
      "assignedAgentId": "string",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

### Create Task
```http
POST /tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "assignedAgentId": "string" (optional)
}

Response: 201
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "todo",
  "priority": "low|medium|high|urgent",
  "assignedAgentId": "string",
  "createdAt": "ISO-8601"
}
```

### Get Task Details
```http
GET /tasks/{id}
Authorization: Bearer {token}

Response: 200
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "todo|in_progress|in_review|done",
  "priority": "low|medium|high|urgent",
  "assignedAgentId": "string",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

### Update Task
```http
PUT /tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "status": "todo|in_progress|in_review|done",
  "priority": "low|medium|high|urgent",
  "assignedAgentId": "string"
}

Response: 200
{
  "id": "string",
  ...
}
```

### Delete Task
```http
DELETE /tasks/{id}
Authorization: Bearer {token}

Response: 204 (No Content)
```

## Scheduled Task Endpoints

### List Scheduled Tasks
```http
GET /scheduled-tasks?enabled=true|false&page=1&limit=20
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "taskId": "string",
      "agentId": "string",
      "isOneTime": false,
      "cronExpression": "* * * * *",
      "executeAt": null,
      "enabled": true,
      "lastExecuted": "ISO-8601",
      "createdAt": "ISO-8601"
    }
  ]
}
```

### Create Scheduled Task
```http
POST /scheduled-tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "taskId": "string",
  "agentId": "string",
  "isOneTime": false,
  "cronExpression": "* * * * *" (if !isOneTime),
  "executeAt": "ISO-8601" (if isOneTime)
}

Response: 201
{
  "id": "string",
  "taskId": "string",
  "agentId": "string",
  "isOneTime": false,
  "cronExpression": "* * * * *",
  "executeAt": null,
  "enabled": true,
  "createdAt": "ISO-8601"
}
```

### Update Scheduled Task
```http
PUT /scheduled-tasks/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "cronExpression": "* * * * *",
  "executeAt": "ISO-8601"
}

Response: 200
{
  "id": "string",
  ...
}
```

### Delete Scheduled Task
```http
DELETE /scheduled-tasks/{id}
Authorization: Bearer {token}

Response: 204 (No Content)
```

## Notification Endpoints

### List Notifications
```http
GET /notifications?read=true|false|all&type=agent_message|task_assigned|task_completed|group_mention|error|info&page=1&limit=50
Authorization: Bearer {token}

Response: 200
{
  "data": [
    {
      "id": "string",
      "userId": "string",
      "title": "string",
      "message": "string",
      "type": "agent_message|task_assigned|...",
      "read": false,
      "actionUrl": "string" (optional),
      "createdAt": "ISO-8601"
    }
  ]
}
```

### Mark Notification as Read
```http
PUT /notifications/{id}/read
Authorization: Bearer {token}

Response: 200
{
  "id": "string",
  "read": true
}
```

### Mark All Notifications as Read
```http
POST /notifications/mark-all-read
Authorization: Bearer {token}

Response: 200
{
  "message": "All notifications marked as read"
}
```

### Delete Notification
```http
DELETE /notifications/{id}
Authorization: Bearer {token}

Response: 204 (No Content)
```

### Delete All Notifications
```http
DELETE /notifications
Authorization: Bearer {token}

Response: 204 (No Content)
```

## WebSocket Events (Socket.io)

### Server -> Client Events

#### New Notification
```javascript
socket.on('notification', (data) => {
  // {
  //   id: string,
  //   userId: string,
  //   title: string,
  //   message: string,
  //   type: string,
  //   read: false,
  //   createdAt: ISO-8601
  // }
})
```

#### New Message
```javascript
socket.on('message', (data) => {
  // {
  //   id: string,
  //   conversationId: string,
  //   senderId: string,
  //   senderName: string,
  //   content: string,
  //   read: false,
  //   createdAt: ISO-8601
  // }
})
```

#### Agent Status Change
```javascript
socket.on('agent-status', (data) => {
  // {
  //   agentId: string,
  //   status: 'online' | 'offline',
  //   timestamp: ISO-8601
  // }
})
```

#### Task Update
```javascript
socket.on('task-update', (data) => {
  // {
  //   taskId: string,
  //   status: string,
  //   assignedAgentId: string,
  //   timestamp: ISO-8601
  // }
})
```

#### Typing Indicator
```javascript
socket.on('typing', (data) => {
  // {
  //   conversationId: string,
  //   senderId: string,
  //   senderName: string,
  //   isTyping: boolean
  // }
})
```

### Client -> Server Events

#### Send Message
```javascript
socket.emit('send-message', {
  conversationId: string,
  content: string
})
```

#### Mark Notification as Read
```javascript
socket.emit('mark-read', {
  notificationId: string
})
```

#### Send Typing Indicator
```javascript
socket.emit('typing', {
  conversationId: string,
  isTyping: boolean
})
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Status Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

### Common Error Codes
- `INVALID_INPUT` - Input validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `SERVER_ERROR` - Internal server error

## Rate Limiting

Recommended rate limits:
- API Endpoints: 100 requests per minute per user
- WebSocket Events: 10 events per second per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Notes

- All timestamps are in ISO-8601 format (UTC)
- All IDs are UUIDs or database-generated identifiers
- Pagination uses `page` (1-indexed) and `limit` parameters
- Empty arrays should be returned when no data exists
- All endpoints require authentication except /auth/register and /auth/login
- CORS headers should allow requests from frontend origin
- WebSocket connection should be established immediately after login
