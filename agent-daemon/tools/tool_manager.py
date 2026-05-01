
"""
Tool Manager - Manages and coordinates all agent tools
"""
from typing import Dict, List, Any, Optional
from .base import Tool, ToolResult, ToolStatus, ToolExecutionError
from .file_system import FileSystemTool
from .terminal import TerminalTool
from .git import GitTool
from .code_execution import CodeExecutionTool
from logger import logger


class ToolManager:
    """
    Manager class for all agent tools
    """
    
    def __init__(self, workspace_path: str = None):
        self.workspace_path = workspace_path
        self.tools: Dict[str, Tool] = {}
        
        # Initialize all tools
        self._initialize_tools()
        
        logger.info(f"ToolManager initialized with {len(self.tools)} tools")
    
    def _initialize_tools(self):
        """Initialize all available tools"""
        # File system tool
        self.tools['file_system'] = FileSystemTool(
            workspace_path=self.workspace_path
        )
        
        # Terminal tool
        self.tools['terminal'] = TerminalTool()
        
        # Git tool
        self.tools['git'] = GitTool(
            repo_path=self.workspace_path or '.'
        )
        
        # Code execution tool
        self.tools['code_execution'] = CodeExecutionTool()
        
        logger.info(f"Initialized tools: {', '.join(self.tools.keys())}")
    
    async def execute_tool(
        self,
        tool_name: str,
        **kwargs
    ) -> ToolResult:
        """
        Execute a tool by name
        
        Args:
            tool_name: Name of the tool to execute
            **kwargs: Tool-specific parameters
            
        Returns:
            ToolResult: Result of tool execution
        """
        try:
            # Get tool
            tool = self.get_tool(tool_name)
            if not tool:
                raise ToolExecutionError(f"Tool not found: {tool_name}")
            
            # Check if tool is enabled
            if not tool.is_enabled:
                raise ToolExecutionError(f"Tool is disabled: {tool_name}")
            
            # Validate parameters
            if not tool.validate_parameters(kwargs):
                raise ToolExecutionError(f"Invalid parameters for tool: {tool_name}")
            
            logger.info(f"Executing tool: {tool_name}")
            
            # Execute tool
            result = await tool.execute(**kwargs)
            
            logger.info(f"Tool execution completed: {tool_name} ({result.status.value})")
            
            return result
            
        except ToolExecutionError as e:
            logger.error(f"Tool execution error: {e}")
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error executing tool {tool_name}: {e}", exc_info=True)
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=f"Unexpected error: {str(e)}",
            )
    
    def get_tool(self, tool_name: str) -> Optional[Tool]:
        """
        Get tool by name
        
        Args:
            tool_name: Name of the tool
            
        Returns:
            Tool instance or None
        """
        return self.tools.get(tool_name)
    
    def list_tools(self) -> List[str]:
        """
        List all available tool names
        
        Returns:
            List of tool names
        """
        return list(self.tools.keys())
    
    def get_tools_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all tools
        
        Returns:
            List of tool information dictionaries
        """
        return [tool.to_dict() for tool in self.tools.values()]
    
    def enable_tool(self, tool_name: str):
        """Enable a tool"""
        tool = self.get_tool(tool_name)
        if tool:
            tool.enable()
            logger.info(f"Enabled tool: {tool_name}")
        else:
            logger.warning(f"Tool not found: {tool_name}")
    
    def disable_tool(self, tool_name: str):
        """Disable a tool"""
        tool = self.get_tool(tool_name)
        if tool:
            tool.disable()
            logger.info(f"Disabled tool: {tool_name}")
        else:
            logger.warning(f"Tool not found: {tool_name}")
    
    def get_tool_schema(self, tool_name: str) -> Optional[Dict[str, Any]]:
        """
        Get parameter schema for a tool
        
        Args:
            tool_name: Name of the tool
            
        Returns:
            Parameter schema or None
        """
        tool = self.get_tool(tool_name)
        if tool:
            return tool.get_parameters_schema()
        return None
    
    def get_all_schemas(self) -> Dict[str, Dict[str, Any]]:
        """
        Get parameter schemas for all tools
        
        Returns:
            Dictionary mapping tool names to their schemas
        """
        return {
            name: tool.get_parameters_schema()
            for name, tool in self.tools.items()
        }
    
    async def execute_tool_chain(
        self,
        chain: List[Dict[str, Any]]
    ) -> List[ToolResult]:
        """
        Execute a chain of tool operations
        
        Args:
            chain: List of tool operations, each with 'tool' and 'params' keys
            
        Returns:
            List of ToolResults
        """
        results = []
        
        for step in chain:
            tool_name = step.get('tool')
            params = step.get('params', {})
            
            if not tool_name:
                logger.warning("Skipping chain step: no tool specified")
                continue
            
            result = await self.execute_tool(tool_name, **params)
            results.append(result)
            
            # Stop chain if error occurred
            if result.is_error:
                logger.warning(f"Chain stopped due to error in {tool_name}")
                break
        
        return results
    
    def format_tools_for_llm(self) -> List[Dict[str, Any]]:
        """
        Format tools for LLM function calling
        
        Returns:
            List of tool definitions for LLM
        """
        tools_for_llm = []
        
        for tool_name, tool in self.tools.items():
            if not tool.is_enabled:
                continue
            
            tool_def = {
                'type': 'function',
                'function': {
                    'name': tool_name,
                    'description': tool.description,
                    'parameters': tool.get_parameters_schema(),
                }
            }
            tools_for_llm.append(tool_def)
        
        return tools_for_llm
