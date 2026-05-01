
"""
Code Execution Tool - Execute code snippets safely
"""
import asyncio
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Optional
from .base import Tool, ToolResult, ToolStatus, ToolExecutionError
from .terminal import TerminalTool
from logger import logger


class CodeExecutionTool(Tool):
    """
    Tool for executing code in various languages
    Supports: Python, JavaScript (Node.js), TypeScript, Bash
    """
    
    def __init__(self, timeout: int = 30):
        super().__init__(
            name="code_execution",
            description="Execute code snippets in various programming languages"
        )
        self.timeout = timeout
        self.terminal = TerminalTool(default_timeout=timeout)
        
        # Language configurations
        self.language_configs = {
            'python': {
                'extension': '.py',
                'command': 'python3',
                'interpreter': True,
            },
            'javascript': {
                'extension': '.js',
                'command': 'node',
                'interpreter': True,
            },
            'typescript': {
                'extension': '.ts',
                'command': 'ts-node',
                'interpreter': True,
            },
            'bash': {
                'extension': '.sh',
                'command': 'bash',
                'interpreter': True,
            },
            'shell': {
                'extension': '.sh',
                'command': 'bash',
                'interpreter': True,
            },
        }
        
        logger.info("CodeExecutionTool initialized")
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute code snippet
        
        Args:
            code: Code to execute
            language: Programming language (python, javascript, typescript, bash)
            timeout: Execution timeout in seconds (optional)
            args: Command line arguments (optional)
            stdin: Standard input (optional)
            
        Returns:
            ToolResult: Execution result
        """
        try:
            code = kwargs.get('code')
            language = kwargs.get('language', 'python').lower()
            timeout = kwargs.get('timeout', self.timeout)
            args = kwargs.get('args', [])
            stdin = kwargs.get('stdin')
            
            if not code:
                raise ToolExecutionError("Code parameter is required")
            
            if language not in self.language_configs:
                raise ToolExecutionError(
                    f"Unsupported language: {language}. "
                    f"Supported: {', '.join(self.language_configs.keys())}"
                )
            
            logger.info(f"Executing {language} code ({len(code)} chars)")
            
            result = await self._execute_code(
                code=code,
                language=language,
                timeout=timeout,
                args=args,
                stdin=stdin,
            )
            
            return result
            
        except ToolExecutionError as e:
            logger.error(f"Code execution error: {e}")
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error in code execution: {e}", exc_info=True)
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=f"Unexpected error: {str(e)}",
            )
    
    async def _execute_code(
        self,
        code: str,
        language: str,
        timeout: int,
        args: list = None,
        stdin: str = None,
    ) -> ToolResult:
        """
        Execute code in temporary file
        
        Args:
            code: Code to execute
            language: Programming language
            timeout: Timeout in seconds
            args: Command line arguments
            stdin: Standard input
            
        Returns:
            ToolResult: Execution result
        """
        config = self.language_configs[language]
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix=config['extension'],
            delete=False,
        ) as tmp_file:
            tmp_file.write(code)
            tmp_path = tmp_file.name
        
        try:
            # Build command
            command = f"{config['command']} {tmp_path}"
            
            if args:
                args_str = ' '.join(str(arg) for arg in args)
                command += f" {args_str}"
            
            # Handle stdin
            if stdin:
                command = f"echo '{stdin}' | {command}"
            
            # Execute code
            result = await self.terminal.execute(
                command=command,
                timeout=timeout,
            )
            
            # Add metadata
            if result.metadata is None:
                result.metadata = {}
            
            result.metadata.update({
                'language': language,
                'code_length': len(code),
            })
            
            logger.info(f"Code execution completed: {result.status.value}")
            
            return result
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file: {e}")
    
    async def execute_jupyter_cell(self, code: str, kernel: str = 'python3') -> ToolResult:
        """
        Execute code in Jupyter notebook cell
        
        Args:
            code: Code to execute
            kernel: Jupyter kernel (default: python3)
            
        Returns:
            ToolResult: Execution result
        """
        # TODO: Implement Jupyter integration
        # This would require jupyter-client or nbclient
        raise NotImplementedError("Jupyter execution not yet implemented")
    
    async def execute_repl(
        self,
        code: str,
        language: str = 'python',
        context: Dict[str, Any] = None,
    ) -> ToolResult:
        """
        Execute code in REPL context with persistent state
        
        Args:
            code: Code to execute
            language: Programming language
            context: Execution context/variables
            
        Returns:
            ToolResult: Execution result
        """
        # TODO: Implement REPL execution with persistent context
        # This would maintain state between executions
        raise NotImplementedError("REPL execution not yet implemented")
    
    def get_parameters_schema(self) -> Dict[str, Any]:
        """Get parameter schema"""
        return {
            'type': 'object',
            'properties': {
                'code': {
                    'type': 'string',
                    'description': 'Code to execute',
                },
                'language': {
                    'type': 'string',
                    'enum': list(self.language_configs.keys()),
                    'description': 'Programming language',
                    'default': 'python',
                },
                'timeout': {
                    'type': 'integer',
                    'description': 'Execution timeout in seconds',
                    'default': self.timeout,
                },
                'args': {
                    'type': 'array',
                    'description': 'Command line arguments',
                    'items': {'type': 'string'},
                },
                'stdin': {
                    'type': 'string',
                    'description': 'Standard input',
                },
            },
            'required': ['code'],
        }


class SafeCodeExecutor:
    """
    Safe code execution with sandboxing and resource limits
    """
    
    def __init__(self):
        self.base_executor = CodeExecutionTool()
    
    async def execute_with_limits(
        self,
        code: str,
        language: str,
        memory_limit_mb: int = 512,
        cpu_time_limit: int = 10,
        timeout: int = 30,
    ) -> ToolResult:
        """
        Execute code with resource limits
        
        Args:
            code: Code to execute
            language: Programming language
            memory_limit_mb: Memory limit in MB
            cpu_time_limit: CPU time limit in seconds
            timeout: Wall clock timeout
            
        Returns:
            ToolResult: Execution result
        """
        # TODO: Implement resource limits using cgroups or similar
        # For now, just use basic timeout
        return await self.base_executor.execute(
            code=code,
            language=language,
            timeout=timeout,
        )
    
    async def execute_in_container(
        self,
        code: str,
        language: str,
        image: str = 'python:3.11-slim',
    ) -> ToolResult:
        """
        Execute code in Docker container for isolation
        
        Args:
            code: Code to execute
            language: Programming language
            image: Docker image to use
            
        Returns:
            ToolResult: Execution result
        """
        # TODO: Implement Docker-based execution
        # This would provide better isolation and security
        raise NotImplementedError("Container execution not yet implemented")
