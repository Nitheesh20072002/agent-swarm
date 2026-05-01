
"""
Terminal Tool - Execute shell commands
"""
import asyncio
import signal
from typing import Dict, Any, Optional
from .base import Tool, ToolResult, ToolStatus, ToolExecutionError
from logger import logger


class TerminalTool(Tool):
    """
    Tool for executing shell commands
    """
    
    def __init__(self, default_timeout: int = 30, shell: str = '/bin/bash'):
        super().__init__(
            name="terminal",
            description="Execute shell commands in the terminal"
        )
        self.default_timeout = default_timeout
        self.shell = shell
        self.active_processes = {}
        
        logger.info(f"TerminalTool initialized with shell: {shell}")
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute shell command
        
        Args:
            command: Command to execute
            timeout: Timeout in seconds (optional, default: 30)
            cwd: Working directory (optional)
            env: Environment variables (optional)
            shell: Use shell for execution (optional, default: True)
            
        Returns:
            ToolResult: Result of command execution
        """
        try:
            command = kwargs.get('command')
            if not command:
                raise ToolExecutionError("Command parameter is required")
            
            timeout = kwargs.get('timeout', self.default_timeout)
            cwd = kwargs.get('cwd')
            env = kwargs.get('env')
            use_shell = kwargs.get('shell', True)
            
            logger.info(f"Executing command: {command}")
            
            result = await self._run_command(
                command=command,
                timeout=timeout,
                cwd=cwd,
                env=env,
                use_shell=use_shell,
            )
            
            return result
            
        except ToolExecutionError as e:
            logger.error(f"Terminal command error: {e}")
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error in terminal tool: {e}", exc_info=True)
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=f"Unexpected error: {str(e)}",
            )
    
    async def _run_command(
        self,
        command: str,
        timeout: int,
        cwd: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
        use_shell: bool = True,
    ) -> ToolResult:
        """
        Run command using asyncio subprocess
        
        Args:
            command: Command to run
            timeout: Timeout in seconds
            cwd: Working directory
            env: Environment variables
            use_shell: Use shell for execution
            
        Returns:
            ToolResult: Command execution result
        """
        try:
            # Create subprocess
            if use_shell:
                process = await asyncio.create_subprocess_shell(
                    command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=cwd,
                    env=env,
                )
            else:
                # Split command into args
                args = command.split()
                process = await asyncio.create_subprocess_exec(
                    *args,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=cwd,
                    env=env,
                )
            
            # Wait for process with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout,
                )
                
                # Decode output
                stdout_text = stdout.decode('utf-8', errors='replace')
                stderr_text = stderr.decode('utf-8', errors='replace')
                
                # Combine output
                output = stdout_text
                if stderr_text:
                    output += f"\n--- STDERR ---\n{stderr_text}"
                
                # Check return code
                if process.returncode == 0:
                    logger.info(f"Command completed successfully (exit code: 0)")
                    return ToolResult(
                        status=ToolStatus.SUCCESS,
                        output=output,
                        metadata={
                            'exit_code': process.returncode,
                            'command': command,
                        },
                    )
                else:
                    logger.warning(f"Command failed with exit code: {process.returncode}")
                    return ToolResult(
                        status=ToolStatus.ERROR,
                        output=output,
                        error=f"Command exited with code {process.returncode}",
                        metadata={
                            'exit_code': process.returncode,
                            'command': command,
                        },
                    )
                    
            except asyncio.TimeoutError:
                logger.warning(f"Command timed out after {timeout} seconds")
                
                # Try to terminate process
                try:
                    process.terminate()
                    await asyncio.wait_for(process.wait(), timeout=5)
                except asyncio.TimeoutError:
                    # Force kill if terminate didn't work
                    process.kill()
                    await process.wait()
                
                return ToolResult(
                    status=ToolStatus.TIMEOUT,
                    output="",
                    error=f"Command timed out after {timeout} seconds",
                    metadata={
                        'timeout': timeout,
                        'command': command,
                    },
                )
                
        except FileNotFoundError:
            raise ToolExecutionError(f"Command not found: {command}")
        except PermissionError:
            raise ToolExecutionError(f"Permission denied: {command}")
    
    async def execute_interactive(
        self,
        command: str,
        input_callback=None,
        output_callback=None,
    ) -> ToolResult:
        """
        Execute command interactively with streaming I/O
        
        Args:
            command: Command to execute
            input_callback: Async callback to provide input
            output_callback: Async callback to handle output
            
        Returns:
            ToolResult: Command execution result
        """
        # TODO: Implement interactive command execution
        # This would allow for real-time interaction with commands
        # that require user input (e.g., interactive prompts)
        raise NotImplementedError("Interactive execution not yet implemented")
    
    def get_parameters_schema(self) -> Dict[str, Any]:
        """Get parameter schema"""
        return {
            'type': 'object',
            'properties': {
                'command': {
                    'type': 'string',
                    'description': 'Shell command to execute',
                },
                'timeout': {
                    'type': 'integer',
                    'description': 'Timeout in seconds',
                    'default': self.default_timeout,
                },
                'cwd': {
                    'type': 'string',
                    'description': 'Working directory',
                },
                'env': {
                    'type': 'object',
                    'description': 'Environment variables',
                },
                'shell': {
                    'type': 'boolean',
                    'description': 'Use shell for execution',
                    'default': True,
                },
            },
            'required': ['command'],
        }
