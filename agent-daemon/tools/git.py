
"""
Git Tool - Version control operations
"""
from typing import Dict, Any, List, Optional
from .base import Tool, ToolResult, ToolStatus, ToolExecutionError
from .terminal import TerminalTool
from logger import logger


class GitTool(Tool):
    """
    Tool for Git version control operations
    """
    
    def __init__(self, repo_path: str = '.'):
        super().__init__(
            name="git",
            description="Perform Git version control operations"
        )
        self.repo_path = repo_path
        self.terminal = TerminalTool()
        
        logger.info(f"GitTool initialized for repo: {repo_path}")
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute Git operation
        
        Args:
            operation: Git operation (status, add, commit, push, pull, branch, checkout, diff, log, clone)
            files: Files to add (for add operation)
            message: Commit message (for commit operation)
            branch: Branch name (for branch/checkout operations)
            remote: Remote name (for push/pull operations)
            url: Repository URL (for clone operation)
            all: Stage all changes (for add operation)
            
        Returns:
            ToolResult: Result of Git operation
        """
        try:
            operation = kwargs.get('operation')
            if not operation:
                raise ToolExecutionError("Operation parameter is required")
            
            # Map operations to methods
            operations = {
                'status': self._git_status,
                'add': self._git_add,
                'commit': self._git_commit,
                'push': self._git_push,
                'pull': self._git_pull,
                'branch': self._git_branch,
                'checkout': self._git_checkout,
                'diff': self._git_diff,
                'log': self._git_log,
                'clone': self._git_clone,
                'init': self._git_init,
                'remote': self._git_remote,
            }
            
            if operation not in operations:
                raise ToolExecutionError(f"Unknown operation: {operation}")
            
            result = await operations[operation](**kwargs)
            return result
            
        except ToolExecutionError as e:
            logger.error(f"Git operation error: {e}")
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error in git tool: {e}", exc_info=True)
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=f"Unexpected error: {str(e)}",
            )
    
    async def _run_git_command(self, command: str) -> ToolResult:
        """
        Run git command using terminal tool
        
        Args:
            command: Git command (without 'git' prefix)
            
        Returns:
            ToolResult: Command result
        """
        full_command = f"git {command}"
        result = await self.terminal.execute(
            command=full_command,
            cwd=self.repo_path,
            timeout=60,
        )
        return result
    
    async def _git_status(self, **kwargs) -> ToolResult:
        """Get git status"""
        return await self._run_git_command("status")
    
    async def _git_add(self, **kwargs) -> ToolResult:
        """Add files to staging"""
        files = kwargs.get('files', [])
        add_all = kwargs.get('all', False)
        
        if add_all:
            command = "add -A"
        elif files:
            if isinstance(files, str):
                files = [files]
            files_str = ' '.join(f'"{f}"' for f in files)
            command = f"add {files_str}"
        else:
            raise ToolExecutionError("Either 'files' or 'all=True' must be specified")
        
        return await self._run_git_command(command)
    
    async def _git_commit(self, **kwargs) -> ToolResult:
        """Commit changes"""
        message = kwargs.get('message')
        if not message:
            raise ToolExecutionError("Commit message is required")
        
        # Escape quotes in message
        message = message.replace('"', '\\"')
        command = f'commit -m "{message}"'
        
        return await self._run_git_command(command)
    
    async def _git_push(self, **kwargs) -> ToolResult:
        """Push changes to remote"""
        remote = kwargs.get('remote', 'origin')
        branch = kwargs.get('branch')
        
        if branch:
            command = f"push {remote} {branch}"
        else:
            command = f"push {remote}"
        
        return await self._run_git_command(command)
    
    async def _git_pull(self, **kwargs) -> ToolResult:
        """Pull changes from remote"""
        remote = kwargs.get('remote', 'origin')
        branch = kwargs.get('branch')
        
        if branch:
            command = f"pull {remote} {branch}"
        else:
            command = f"pull {remote}"
        
        return await self._run_git_command(command)
    
    async def _git_branch(self, **kwargs) -> ToolResult:
        """List or create branches"""
        branch_name = kwargs.get('branch')
        
        if branch_name:
            # Create new branch
            command = f"branch {branch_name}"
        else:
            # List branches
            command = "branch -a"
        
        return await self._run_git_command(command)
    
    async def _git_checkout(self, **kwargs) -> ToolResult:
        """Checkout branch or commit"""
        branch = kwargs.get('branch')
        create = kwargs.get('create', False)
        
        if not branch:
            raise ToolExecutionError("Branch name is required")
        
        if create:
            command = f"checkout -b {branch}"
        else:
            command = f"checkout {branch}"
        
        return await self._run_git_command(command)
    
    async def _git_diff(self, **kwargs) -> ToolResult:
        """Show diff"""
        staged = kwargs.get('staged', False)
        files = kwargs.get('files')
        
        command = "diff"
        if staged:
            command += " --staged"
        if files:
            if isinstance(files, str):
                files = [files]
            files_str = ' '.join(f'"{f}"' for f in files)
            command += f" {files_str}"
        
        return await self._run_git_command(command)
    
    async def _git_log(self, **kwargs) -> ToolResult:
        """Show commit log"""
        count = kwargs.get('count', 10)
        oneline = kwargs.get('oneline', True)
        
        command = f"log -n {count}"
        if oneline:
            command += " --oneline"
        
        return await self._run_git_command(command)
    
    async def _git_clone(self, **kwargs) -> ToolResult:
        """Clone repository"""
        url = kwargs.get('url')
        destination = kwargs.get('destination')
        
        if not url:
            raise ToolExecutionError("Repository URL is required")
        
        command = f"clone {url}"
        if destination:
            command += f' "{destination}"'
        
        return await self._run_git_command(command)
    
    async def _git_init(self, **kwargs) -> ToolResult:
        """Initialize git repository"""
        return await self._run_git_command("init")
    
    async def _git_remote(self, **kwargs) -> ToolResult:
        """Manage remotes"""
        action = kwargs.get('action', 'list')  # list, add, remove
        name = kwargs.get('name')
        url = kwargs.get('url')
        
        if action == 'list':
            command = "remote -v"
        elif action == 'add':
            if not name or not url:
                raise ToolExecutionError("Remote name and URL are required")
            command = f'remote add {name} {url}'
        elif action == 'remove':
            if not name:
                raise ToolExecutionError("Remote name is required")
            command = f'remote remove {name}'
        else:
            raise ToolExecutionError(f"Unknown remote action: {action}")
        
        return await self._run_git_command(command)
    
    def get_parameters_schema(self) -> Dict[str, Any]:
        """Get parameter schema"""
        return {
            'type': 'object',
            'properties': {
                'operation': {
                    'type': 'string',
                    'enum': ['status', 'add', 'commit', 'push', 'pull', 'branch', 'checkout', 'diff', 'log', 'clone', 'init', 'remote'],
                    'description': 'Git operation to perform',
                },
                'files': {
                    'type': ['array', 'string'],
                    'description': 'Files to operate on',
                },
                'message': {
                    'type': 'string',
                    'description': 'Commit message',
                },
                'branch': {
                    'type': 'string',
                    'description': 'Branch name',
                },
                'remote': {
                    'type': 'string',
                    'description': 'Remote name',
                    'default': 'origin',
                },
                'url': {
                    'type': 'string',
                    'description': 'Repository URL',
                },
                'all': {
                    'type': 'boolean',
                    'description': 'Stage all changes',
                    'default': False,
                },
                'create': {
                    'type': 'boolean',
                    'description': 'Create new branch',
                    'default': False,
                },
                'staged': {
                    'type': 'boolean',
                    'description': 'Show staged changes',
                    'default': False,
                },
                'count': {
                    'type': 'integer',
                    'description': 'Number of log entries',
                    'default': 10,
                },
                'oneline': {
                    'type': 'boolean',
                    'description': 'Show log in oneline format',
                    'default': True,
                },
                'action': {
                    'type': 'string',
                    'enum': ['list', 'add', 'remove'],
                    'description': 'Remote action',
                    'default': 'list',
                },
                'name': {
                    'type': 'string',
                    'description': 'Remote or branch name',
                },
                'destination': {
                    'type': 'string',
                    'description': 'Clone destination directory',
                },
            },
            'required': ['operation'],
        }
