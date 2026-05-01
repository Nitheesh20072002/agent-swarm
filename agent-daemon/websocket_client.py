
"""
WebSocket client for agent-backend communication
"""
import asyncio
from typing import Optional, Callable, Dict, Any
import socketio
from logger import logger
from config import settings


class WebSocketClient:
    """
    WebSocket client for real-time communication with backend
    """
    
    def __init__(self):
        self.sio = socketio.AsyncClient(
            logger=False,
            engineio_logger=False,
            reconnection=True,
            reconnection_attempts=0,  # Infinite retries
            reconnection_delay=1,
            reconnection_delay_max=5,
        )
        self.connected = False
        self.message_handlers: Dict[str, Callable] = {}
        
        # Setup event handlers
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        async def connect():
            """Handle connection event"""
            self.connected = True
            logger.info("Connected to backend WebSocket server")
            
            # Update agent status to online
            await self.emit('agent:status', {
                'agentId': settings.agent_id,
                'status': 'idle',
            })
        
        @self.sio.event
        async def disconnect():
            """Handle disconnection event"""
            self.connected = False
            logger.warning("Disconnected from backend WebSocket server")
        
        @self.sio.event
        async def connect_error(data):
            """Handle connection error"""
            logger.error(f"Connection error: {data}")
        
        @self.sio.event
        async def error(data):
            """Handle error event"""
            logger.error(f"WebSocket error: {data}")
        
        @self.sio.event
        async def connected(data):
            """Handle connected confirmation"""
            logger.info(f"Connection confirmed: {data}")
        
        @self.sio.on('message:new')
        async def on_message(data):
            """Handle new message event"""
            logger.info(f"Received new message: {data}")
            
            # Call registered handler if exists
            if 'message:new' in self.message_handlers:
                await self.message_handlers['message:new'](data)
        
        @self.sio.on('task:assigned')
        async def on_task_assigned(data):
            """Handle task assigned event"""
            logger.info(f"Task assigned: {data}")
            
            # Call registered handler if exists
            if 'task:assigned' in self.message_handlers:
                await self.message_handlers['task:assigned'](data)
        
        @self.sio.on('agent:command')
        async def on_agent_command(data):
            """Handle agent command"""
            logger.info(f"Agent command received: {data}")
            
            # Call registered handler if exists
            if 'agent:command' in self.message_handlers:
                await self.message_handlers['agent:command'](data)
    
    async def connect(self):
        """Connect to WebSocket server"""
        try:
            # Construct WebSocket URL
            ws_url = settings.websocket_url
            
            # Connect with authentication
            await self.sio.connect(
                ws_url,
                auth={'token': settings.agent_token},
                transports=['websocket', 'polling'],
            )
            
            logger.info(f"Connecting to WebSocket server at {ws_url}")
            
            # Wait for connection to establish
            await self.sio.wait()
            
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket server: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from WebSocket server"""
        if self.connected:
            await self.sio.disconnect()
            logger.info("Disconnected from WebSocket server")
    
    async def emit(self, event: str, data: Dict[str, Any]):
        """
        Emit an event to the server
        
        Args:
            event: Event name
            data: Event data
        """
        if not self.connected:
            logger.warning(f"Cannot emit event '{event}' - not connected")
            return
        
        try:
            await self.sio.emit(event, data)
            logger.debug(f"Emitted event '{event}': {data}")
        except Exception as e:
            logger.error(f"Failed to emit event '{event}': {e}")
    
    async def join_conversation(self, conversation_id: str):
        """
        Join a conversation room
        
        Args:
            conversation_id: Conversation ID to join
        """
        await self.emit('join:conversation', {
            'conversationId': conversation_id,
        })
        logger.info(f"Joined conversation: {conversation_id}")
    
    async def leave_conversation(self, conversation_id: str):
        """
        Leave a conversation room
        
        Args:
            conversation_id: Conversation ID to leave
        """
        await self.emit('leave:conversation', {
            'conversationId': conversation_id,
        })
        logger.info(f"Left conversation: {conversation_id}")
    
    async def send_message(self, conversation_id: str, content: str, role: str = 'agent'):
        """
        Send a message to a conversation
        
        Args:
            conversation_id: Conversation ID
            content: Message content
            role: Message role (agent, user, system)
        """
        await self.emit('message:send', {
            'conversationId': conversation_id,
            'content': content,
            'role': role,
        })
        logger.info(f"Sent message to conversation {conversation_id}")
    
    async def update_status(self, status: str, current_task: Optional[str] = None):
        """
        Update agent status
        
        Args:
            status: Agent status (idle, busy, offline)
            current_task: Current task description
        """
        data = {
            'agentId': settings.agent_id,
            'status': status,
        }
        
        if current_task:
            data['currentTask'] = current_task
        
        await self.emit('agent:status', data)
        logger.info(f"Updated agent status to: {status}")
    
    async def send_typing_indicator(self, conversation_id: str, is_typing: bool):
        """
        Send typing indicator
        
        Args:
            conversation_id: Conversation ID
            is_typing: Whether agent is typing
        """
        event = 'typing:start' if is_typing else 'typing:stop'
        await self.emit(event, {
            'conversationId': conversation_id,
        })
    
    def register_handler(self, event: str, handler: Callable):
        """
        Register a handler for an event
        
        Args:
            event: Event name
            handler: Async handler function
        """
        self.message_handlers[event] = handler
        logger.debug(f"Registered handler for event: {event}")
    
    def is_connected(self) -> bool:
        """Check if connected to server"""
        return self.connected
