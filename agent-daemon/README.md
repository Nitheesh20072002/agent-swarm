
# Agent Daemon

Python-based autonomous agent daemon that connects to the AI Agent Swarm backend and processes user requests using LLM capabilities.

## Features

- **WebSocket Communication**: Real-time bidirectional communication with the backend
- **LLM Integration**: Support for both OpenAI and Anthropic models
- **Asynchronous Architecture**: Built with asyncio for efficient concurrent operations
- **Conversation Management**: Maintains conversation history and context
- **Graceful Shutdown**: Proper cleanup and connection management
- **Configurable**: Environment-based configuration for flexibility

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Daemon                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐ │
│  │   Main       │────▶│    Agent     │────│  LLM Client  │ │
│  │  (main.py)   │     │  (agent.py)  │    │(llm_client.py)│ │
│  └──────────────┘     └──────┬───────┘    └──────────────┘ │
│                              │                               │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                      │
│                    │  WebSocket       │                      │
│                    │  Client          │                      │
│                    │(websocket_client)│                      │
│                    └────────┬─────────┘                      │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                              ▼
                     Backend WebSocket Server
```

## Installation

1. **Create Python Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

Edit the `.env` file with your settings:

```env
# Agent Configuration
AGENT_ID=your-agent-id-here
AGENT_TOKEN=your-agent-jwt-token-here

# Backend Configuration
BACKEND_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3000

# LLM Configuration
LLM_PROVIDER=openai  # or anthropic
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Model Configuration
OPENAI_MODEL=gpt-4-turbo-preview
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Agent Workspace
WORKSPACE_PATH=/workspace
LOG_LEVEL=INFO
```

## Usage

### Start the Agent

```bash
python main.py
```

The agent will:
1. Connect to the backend WebSocket server
2. Authenticate using the provided token
3. Listen for incoming messages and tasks
4. Process user messages using the configured LLM
5. Send responses back via WebSocket

### Stopping the Agent

Press `Ctrl+C` or send a `SIGTERM` signal. The agent will:
1. Update status to offline
2. Disconnect from WebSocket
3. Cancel all running tasks
4. Exit gracefully

## Development

### Project Structure

```
agent-daemon/
├── main.py              # Entry point
├── agent.py             # Main Agent class
├── websocket_client.py  # WebSocket client
├── llm_client.py        # LLM abstraction layer
├── config.py            # Configuration management
├── logger.py            # Logging setup
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
└── README.md           # This file
```

### Adding New Capabilities

To add new agent capabilities:

1. **Create a new tool module** (e.g., `tools/file_system.py`)
2. **Register the tool** in `agent.py`
3. **Update the system prompt** to include the new capability
4. **Handle tool execution** in the message processing loop

### LLM Providers

#### OpenAI

```python
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

Supported models:
- `gpt-4-turbo-preview`
- `gpt-4`
- `gpt-3.5-turbo`

#### Anthropic

```python
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Supported models:
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`

## WebSocket Events

### Outgoing (Agent → Backend)

- `agent:status` - Update agent status (idle, busy, offline)
- `message:send` - Send a message to a conversation
- `typing:start` - Indicate agent is typing
- `typing:stop` - Stop typing indicator
- `join:conversation` - Join a conversation room
- `leave:conversation` - Leave a conversation room

### Incoming (Backend → Agent)

- `connected` - Connection established
- `message:new` - New message from user
- `task:assigned` - New task assigned to agent
- `agent:command` - Command from backend

## Logging

The agent uses colored console logging with configurable levels:

- `DEBUG` - Detailed debugging information
- `INFO` - General information (default)
- `WARNING` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical errors

Set log level in `.env`:
```env
LOG_LEVEL=INFO
```

## Error Handling

The agent includes comprehensive error handling:

- **Connection Errors**: Automatic reconnection with exponential backoff
- **LLM Errors**: Error messages sent to user with details
- **Processing Errors**: Logged and reported without crashing
- **Signal Handling**: Graceful shutdown on SIGTERM/SIGINT

## Performance

- **Asynchronous**: Non-blocking I/O operations
- **Streaming**: Support for streaming LLM responses
- **Connection Pooling**: Efficient WebSocket connection management
- **Memory Efficient**: Conversation history with configurable limits

## Security

- **JWT Authentication**: Secure token-based authentication
- **Environment Variables**: Sensitive data in environment, not code
- **API Key Management**: Secure storage of LLM provider keys
- **Workspace Isolation**: Agent operates in isolated workspace

## Troubleshooting

### Connection Issues

```bash
# Check backend is running
curl http://localhost:3000/health

# Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3000/socket.io/
```

### Authentication Errors

- Verify `AGENT_TOKEN` is valid and not expired
- Check `AGENT_ID` matches a registered agent in the backend
- Ensure the token has proper permissions

### LLM Errors

- Verify API keys are correct
- Check API quota and rate limits
- Ensure model names are correct
- Check internet connectivity

## Future Enhancements

- [ ] Tool execution framework (file system, git, terminal)
- [ ] Multi-step task planning and execution
- [ ] Code execution in sandboxed environment
- [ ] Persistent conversation storage
- [ ] Agent-to-agent communication
- [ ] Performance monitoring and metrics
- [ ] Advanced error recovery strategies

## License

MIT License - See main project LICENSE file
