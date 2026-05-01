
"""
Main Agent class - coordinates LLM interactions and tool execution
"""
import asyncio
from typing import List, Dict, Any, Optional, Union
from llm_client import create_llm_client, Message, LLMClient, LLMResponse, ToolCall
from websocket_client import WebSocketClient
from tools.tool_manager import ToolManager
from logger import logger
from config import settings


class Agent:
    """
    Main Agent class that processes messages and executes tasks
    """
    
    def __init__(self, workspace_path: str = None):
        self.llm_client: LLMClient = create_llm_client()
        self.ws_client: WebSocketClient = WebSocketClient()
        self.tool_manager: ToolManager = ToolManager(workspace_path=workspace_path)
        self.conversation_history: Dict[str, List[Message]] = {}
        self.current_conversation: Optional[str] = None
        self.is_processing = False
        self.max_tool_iterations = 10  # Prevent infinite loops
        
        logger.info("Agent initialized")
        logger.info(f"Available tools: {', '.join(self.tool_manager.list_tools())}")
    
    async def start(self):
        """Start the agent daemon"""
        logger.info("Starting agent daemon...")
        
        # Register WebSocket event handlers
        self.ws_client.register_handler('message:new', self.handle_new_message)
        self.ws_client.register_handler('task:assigned', self.handle_task_assigned)
        self.ws_client.register_handler('agent:command', self.handle_agent_command)
        
        # Connect to WebSocket server
        await self.ws_client.connect()
        
        logger.info("Agent daemon started successfully")
        logger.info(f"Agent ID: {settings.agent_id}")
        logger.info(f"LLM Provider: {settings.llm_provider}")
        
        # Keep the agent running
        while True:
            await asyncio.sleep(1)
            
            # Periodic health check
            if not self.ws_client.is_connected():
                logger.warning("WebSocket disconnected, attempting to reconnect...")
                try:
                    await self.ws_client.connect()
                except Exception as e:
                    logger.error(f"Reconnection failed: {e}")
    
    async def stop(self):
        """Stop the agent daemon"""
        logger.info("Stopping agent daemon...")
        
        # Update status to offline
        await self.ws_client.update_status('offline')
        
        # Disconnect WebSocket
        await self.ws_client.disconnect()
        
        logger.info("Agent daemon stopped")
    
    async def handle_new_message(self, data: Dict[str, Any]):
        """
        Handle new message from user
        
        Args:
            data: Message data containing conversationId, content, role, etc.
        """
        try:
            message = data.get('message', {})
            conversation_id = message.get('conversationId')
            content = message.get('content')
            role = message.get('role')
            
            logger.info(f"Received message in conversation {conversation_id}")
            
            # Only process user messages
            if role != 'user':
                return
            
            # Set current conversation
            self.current_conversation = conversation_id
            
            # Initialize conversation history if needed
            if conversation_id not in self.conversation_history:
                self.conversation_history[conversation_id] = []
            
            # Add user message to history
            self.conversation_history[conversation_id].append(
                Message(role='user', content=content)
            )
            
            # Process the message
            await self.process_message(conversation_id, content)
            
        except Exception as e:
            logger.error(f"Error handling new message: {e}", exc_info=True)
    
    async def process_message(self, conversation_id: str, user_message: str):
        """
        Process user message and generate response with tool support
        
        Args:
            conversation_id: Conversation ID
            user_message: User's message content
        """
        if self.is_processing:
            logger.warning("Agent is already processing a message")
            return
        
        try:
            self.is_processing = True
            
            # Update status to busy
            await self.ws_client.update_status('busy', f'Processing message in conversation {conversation_id}')
            
            # Send typing indicator
            await self.ws_client.send_typing_indicator(conversation_id, True)
            
            # Get conversation history
            history = self.conversation_history.get(conversation_id, [])
            
            # Add system message if this is the first message
            if len(history) == 1:  # Only user message
                system_message = self._get_system_prompt()
                history.insert(0, Message(role='system', content=system_message))
            
            # Process with tool support (iterative loop)
            response_text = await self._process_with_tools(conversation_id, history)
            
            # Add final assistant response to history
            self.conversation_history[conversation_id].append(
                Message(role='assistant', content=response_text)
            )
            
            # Stop typing indicator
            await self.ws_client.send_typing_indicator(conversation_id, False)
            
            # Send response back via WebSocket
            await self.ws_client.send_message(
                conversation_id=conversation_id,
                content=response_text,
                role='agent',
            )
            
            logger.info("Response sent successfully")
            
            # Update status back to idle
            await self.ws_client.update_status('idle')
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            
            # Send error message to user
            await self.ws_client.send_message(
                conversation_id=conversation_id,
                content=f"I encountered an error while processing your message: {str(e)}",
                role='agent',
            )
            
            # Update status back to idle
            await self.ws_client.update_status('idle')
        
        finally:
            self.is_processing = False
    
    async def _process_with_tools(
        self,
        conversation_id: str,
        history: List[Message],
    ) -> str:
        """
        Process message with tool support using iterative loop
        
        Args:
            conversation_id: Conversation ID
            history: Message history
            
        Returns:
            Final response text
        """
        # Get available tools
        tools = self.tool_manager.format_tools_for_llm()
        
        # Working copy of history for this processing loop
        working_history = history.copy()
        
        iteration = 0
        while iteration < self.max_tool_iterations:
            iteration += 1
            logger.info(f"Processing iteration {iteration}/{self.max_tool_iterations}")
            
            # Generate response from LLM with tools
            response = await self.llm_client.generate_response(
                messages=working_history,
                temperature=0.7,
                max_tokens=4096,
                tools=tools if tools else None,
                tool_choice="auto" if tools else None,
            )
            
            # Handle string response (backward compatibility)
            if isinstance(response, str):
                logger.info(f"Received text response ({len(response)} chars)")
                return response
            
            # Handle LLMResponse with potential tool calls
            if isinstance(response, LLMResponse):
                # If no tool calls, return the text
                if not response.has_tool_calls:
                    logger.info(f"No tool calls, returning text response")
                    return response.text
                
                # Process tool calls
                logger.info(f"Processing {len(response.tool_calls)} tool call(s)")
                
                # Add assistant message with tool calls to history
                if response.content:
                    working_history.append(Message(
                        role='assistant',
                        content=response.content
                    ))
                
                # Execute each tool call
                for tool_call in response.tool_calls:
                    await self._execute_tool_call(
                        conversation_id,
                        tool_call,
                        working_history,
                    )
                
                # Continue loop to get next response
                continue
        
        # Max iterations reached
        logger.warning(f"Max tool iterations ({self.max_tool_iterations}) reached")
        return "I've reached the maximum number of tool executions. Please try rephrasing your request."
    
    async def _execute_tool_call(
        self,
        conversation_id: str,
        tool_call: ToolCall,
        history: List[Message],
    ):
        """
        Execute a tool call and add result to history
        
        Args:
            conversation_id: Conversation ID
            tool_call: Tool call to execute
            history: Message history to update
        """
        logger.info(f"Executing tool: {tool_call.name}")
        logger.debug(f"Tool arguments: {tool_call.arguments}")
        
        try:
            # Execute the tool
            result = await self.tool_manager.execute_tool(
                tool_name=tool_call.name,
                **tool_call.arguments
            )
            
            # Format tool result
            result_message = f"Tool: {tool_call.name}\n"
            result_message += f"Status: {result.status.value}\n"
            
            if result.is_success:
                result_message += f"Output:\n{result.output}"
            else:
                result_message += f"Error: {result.error}"
            
            # Add tool result to history as a user message
            # (This simulates the tool response back to the LLM)
            history.append(Message(
                role='user',
                content=f"[Tool Result]\n{result_message}"
            ))
            
            logger.info(f"Tool execution completed: {result.status.value}")
            
            # Send progress update to user
            await self.ws_client.send_message(
                conversation_id=conversation_id,
                content=f"🔧 Executed: {tool_call.name}",
                role='system',
            )
            
        except Exception as e:
            logger.error(f"Error executing tool {tool_call.name}: {e}", exc_info=True)
            
            # Add error to history
            history.append(Message(
                role='user',
                content=f"[Tool Error]\nTool: {tool_call.name}\nError: {str(e)}"
            ))
            
            # Send error notification
            await self.ws_client.send_message(
                conversation_id=conversation_id,
                content=f"⚠️ Tool error: {tool_call.name} - {str(e)}",
                role='system',
            )
    
    async def handle_task_assigned(self, data: Dict[str, Any]):
        """
        Handle task assignment
        
        Args:
            data: Task data
        """
        logger.info(f"Task assigned: {data}")
        
        # TODO: Implement task execution logic
        # This will be expanded when we add tool execution capabilities
        
        task_id = data.get('taskId')
        task_type = data.get('type')
        task_input = data.get('input', {})
        
        logger.info(f"Processing task {task_id} of type {task_type}")
    
    async def handle_agent_command(self, data: Dict[str, Any]):
        """
        Handle agent command from backend
        
        Args:
            data: Command data
        """
        command = data.get('command')
        logger.info(f"Received agent command: {command}")
        
        if command == 'status':
            # Report current status
            await self.ws_client.update_status(
                'idle' if not self.is_processing else 'busy',
                f'Active conversations: {len(self.conversation_history)}',
            )
        elif command == 'clear_history':
            # Clear conversation history
            conversation_id = data.get('conversationId')
            if conversation_id and conversation_id in self.conversation_history:
                del self.conversation_history[conversation_id]
                logger.info(f"Cleared history for conversation {conversation_id}")
        else:
            logger.warning(f"Unknown command: {command}")
    
    def _get_system_prompt(self) -> str:
        """
        Get system prompt for the agent
        
        Returns:
            System prompt string
        """
        tools_description = "\n".join([
            f"- {tool['name']}: {tool['description']}"
            for tool in self.tool_manager.get_tools_info()
        ])
        
        return f"""You are Alice, a highly skilled full-stack developer AI agent. You have expertise in:
- Modern web development (React, Node.js, TypeScript, Python)
- Database design and optimization
- Cloud infrastructure (AWS, Docker, Kubernetes)
- DevOps and CI/CD
- Software architecture and design patterns
- Code review and best practices

Your personality traits:
- Professional and helpful
- Clear and concise in communication
- Proactive in suggesting improvements
- Patient when explaining complex concepts
- Focused on delivering high-quality solutions

When helping users:
1. Understand their requirements thoroughly
2. Ask clarifying questions when needed
3. Provide well-structured, production-ready code
4. Explain your reasoning and decisions
5. Suggest best practices and optimizations
6. Be honest about limitations or uncertainties

You are currently running as an autonomous agent with access to the following tools:
{tools_description}

Tool Usage Guidelines:
- Use tools proactively to accomplish tasks
- Always verify file contents before making changes
- Execute commands to test your work
- Use git for version control when appropriate
- Break complex tasks into smaller tool operations
- Explain what you're doing when using tools

Always prioritize security, code quality, and user satisfaction."""
    
    def get_conversation_count(self) -> int:
        """Get number of active conversations"""
        return len(self.conversation_history)
    
    def is_busy(self) -> bool:
        """Check if agent is currently processing"""
        return self.is_processing
