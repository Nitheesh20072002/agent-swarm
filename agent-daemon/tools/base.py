
"""
Base Tool class and utilities
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional, List
from enum import Enum


class ToolExecutionError(Exception):
    """Exception raised when tool execution fails"""
    pass


class ToolStatus(str, Enum):
    """Tool execution status"""
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


@dataclass
class ToolResult:
    """Result of tool execution"""
    status: ToolStatus
    output: str
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'status': self.status.value,
            'output': self.output,
            'error': self.error,
            'metadata': self.metadata or {},
        }
    
    @property
    def is_success(self) -> bool:
        """Check if execution was successful"""
        return self.status == ToolStatus.SUCCESS
    
    @property
    def is_error(self) -> bool:
        """Check if execution resulted in error"""
        return self.status == ToolStatus.ERROR


class Tool(ABC):
    """
    Base class for all agent tools
    """
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self._enabled = True
    
    @abstractmethod
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute the tool with given parameters
        
        Args:
            **kwargs: Tool-specific parameters
            
        Returns:
            ToolResult: Result of tool execution
        """
        pass
    
    @abstractmethod
    def get_parameters_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for tool parameters
        
        Returns:
            Dict containing parameter schema
        """
        pass
    
    def validate_parameters(self, params: Dict[str, Any]) -> bool:
        """
        Validate parameters against schema
        
        Args:
            params: Parameters to validate
            
        Returns:
            bool: True if valid, False otherwise
        """
        # Basic validation - can be extended with jsonschema library
        schema = self.get_parameters_schema()
        required = schema.get('required', [])
        
        for param in required:
            if param not in params:
                return False
        
        return True
    
    def enable(self):
        """Enable the tool"""
        self._enabled = True
    
    def disable(self):
        """Disable the tool"""
        self._enabled = False
    
    @property
    def is_enabled(self) -> bool:
        """Check if tool is enabled"""
        return self._enabled
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert tool to dictionary representation"""
        return {
            'name': self.name,
            'description': self.description,
            'parameters': self.get_parameters_schema(),
            'enabled': self._enabled,
        }
