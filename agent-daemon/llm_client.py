
"""
LLM Client abstraction for OpenAI and Anthropic
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncIterator, Union
import json
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from logger import logger
from config import settings


class Message:
    """Message class for LLM conversations"""
    
    def __init__(self, role: str, content: str):
        self.role = role
        self.content = content
    
    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}


class ToolCall:
    """Represents a tool/function call from the LLM"""
    
    def __init__(self, id: str, name: str, arguments: Dict[str, Any]):
        self.id = id
        self.name = name
        self.arguments = arguments
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "arguments": self.arguments,
        }


class LLMResponse:
    """Response from LLM that may contain text and/or tool calls"""
    
    def __init__(
        self,
        content: Optional[str] = None,
        tool_calls: Optional[List[ToolCall]] = None,
        finish_reason: Optional[str] = None,
    ):
        self.content = content
        self.tool_calls = tool_calls or []
        self.finish_reason = finish_reason
    
    @property
    def has_tool_calls(self) -> bool:
        return len(self.tool_calls) > 0
    
    @property
    def text(self) -> str:
        return self.content or ""


class LLMClient(ABC):
    """Abstract base class for LLM clients"""
    
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
    ) -> Union[str, LLMResponse]:
        """Generate a response from the LLM"""
        pass
    
    @abstractmethod
    async def generate_response_stream(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """Generate a streaming response from the LLM"""
        pass


class OpenAIClient(LLMClient):
    """OpenAI client implementation"""
    
    def __init__(self, api_key: str, model: str = "gpt-4-turbo-preview"):
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        logger.info(f"Initialized OpenAI client with model: {model}")
    
    async def generate_response(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
    ) -> Union[str, LLMResponse]:
        """Generate a response from OpenAI"""
        try:
            # Convert messages to OpenAI format
            formatted_messages = [msg.to_dict() for msg in messages]
            
            # Prepare kwargs
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": formatted_messages,
                "temperature": temperature,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            # Add tools if provided
            if tools:
                kwargs["tools"] = tools
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice
            
            if stream:
                # Use streaming (no tool support in streaming yet)
                response_text = ""
                async for chunk in await self.generate_response_stream(
                    messages, temperature, max_tokens
                ):
                    response_text += chunk
                return response_text
            else:
                # Non-streaming response
                response = await self.client.chat.completions.create(**kwargs)
                choice = response.choices[0]
                
                # Check if there are tool calls
                if choice.message.tool_calls:
                    tool_calls = []
                    for tc in choice.message.tool_calls:
                        tool_calls.append(ToolCall(
                            id=tc.id,
                            name=tc.function.name,
                            arguments=json.loads(tc.function.arguments),
                        ))
                    
                    return LLMResponse(
                        content=choice.message.content,
                        tool_calls=tool_calls,
                        finish_reason=choice.finish_reason,
                    )
                else:
                    # No tool calls, return text directly for backward compatibility
                    if tools:
                        return LLMResponse(
                            content=choice.message.content or "",
                            finish_reason=choice.finish_reason,
                        )
                    else:
                        return choice.message.content or ""
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def generate_response_stream(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """Generate a streaming response from OpenAI"""
        try:
            # Convert messages to OpenAI format
            formatted_messages = [msg.to_dict() for msg in messages]
            
            # Prepare kwargs
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": formatted_messages,
                "temperature": temperature,
                "stream": True,
            }
            
            if max_tokens:
                kwargs["max_tokens"] = max_tokens
            
            # Stream response
            stream = await self.client.chat.completions.create(**kwargs)
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            
        except Exception as e:
            logger.error(f"OpenAI streaming API error: {e}")
            raise


class AnthropicClient(LLMClient):
    """Anthropic client implementation"""
    
    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        if not api_key:
            raise ValueError("Anthropic API key is required")
        
        self.client = AsyncAnthropic(api_key=api_key)
        self.model = model
        logger.info(f"Initialized Anthropic client with model: {model}")
    
    def _convert_messages(self, messages: List[Message]) -> List[Dict[str, str]]:
        """Convert messages to Anthropic format"""
        # Anthropic requires alternating user/assistant messages
        # System messages need to be handled separately
        formatted_messages = []
        
        for msg in messages:
            if msg.role == "system":
                # System messages are handled separately in Anthropic API
                continue
            formatted_messages.append({
                "role": "user" if msg.role == "user" else "assistant",
                "content": msg.content,
            })
        
        return formatted_messages
    
    def _extract_system_message(self, messages: List[Message]) -> Optional[str]:
        """Extract system message if present"""
        for msg in messages:
            if msg.role == "system":
                return msg.content
        return None
    
    async def generate_response(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[Union[str, Dict[str, Any]]] = None,
    ) -> Union[str, LLMResponse]:
        """Generate a response from Anthropic"""
        try:
            # Convert messages to Anthropic format
            formatted_messages = self._convert_messages(messages)
            system_message = self._extract_system_message(messages)
            
            # Prepare kwargs
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": formatted_messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 4096,
            }
            
            if system_message:
                kwargs["system"] = system_message
            
            # Add tools if provided (Anthropic uses different format)
            if tools:
                # Convert OpenAI tool format to Anthropic format
                anthropic_tools = []
                for tool in tools:
                    if tool.get("type") == "function":
                        func = tool["function"]
                        anthropic_tools.append({
                            "name": func["name"],
                            "description": func["description"],
                            "input_schema": func["parameters"],
                        })
                kwargs["tools"] = anthropic_tools
                
                if tool_choice:
                    if isinstance(tool_choice, str):
                        if tool_choice == "auto":
                            kwargs["tool_choice"] = {"type": "auto"}
                        elif tool_choice == "any":
                            kwargs["tool_choice"] = {"type": "any"}
                    else:
                        kwargs["tool_choice"] = tool_choice
            
            if stream:
                # Use streaming (no tool support in streaming yet)
                response_text = ""
                async for chunk in self.generate_response_stream(
                    messages, temperature, max_tokens
                ):
                    response_text += chunk
                return response_text
            else:
                # Non-streaming response
                response = await self.client.messages.create(**kwargs)
                
                # Check for tool use
                tool_calls = []
                text_content = ""
                
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_calls.append(ToolCall(
                            id=content_block.id,
                            name=content_block.name,
                            arguments=content_block.input,
                        ))
                    elif content_block.type == "text":
                        text_content += content_block.text
                
                if tool_calls:
                    return LLMResponse(
                        content=text_content if text_content else None,
                        tool_calls=tool_calls,
                        finish_reason=response.stop_reason,
                    )
                else:
                    # No tool calls, return text for backward compatibility
                    if tools:
                        return LLMResponse(
                            content=text_content,
                            finish_reason=response.stop_reason,
                        )
                    else:
                        return text_content
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def generate_response_stream(
        self,
        messages: List[Message],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """Generate a streaming response from Anthropic"""
        try:
            # Convert messages to Anthropic format
            formatted_messages = self._convert_messages(messages)
            system_message = self._extract_system_message(messages)
            
            # Prepare kwargs
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": formatted_messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 4096,
            }
            
            if system_message:
                kwargs["system"] = system_message
            
            # Stream response
            async with self.client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text
            
        except Exception as e:
            logger.error(f"Anthropic streaming API error: {e}")
            raise


def create_llm_client() -> LLMClient:
    """
    Factory function to create LLM client based on configuration
    
    Returns:
        LLM client instance
    """
    provider = settings.llm_provider.lower()
    
    if provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        return OpenAIClient(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
    elif provider == "anthropic":
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        return AnthropicClient(
            api_key=settings.anthropic_api_key,
            model=settings.anthropic_model,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
