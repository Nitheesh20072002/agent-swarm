
"""
File System Tool - Read, write, list, and manipulate files
"""
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List
from .base import Tool, ToolResult, ToolStatus, ToolExecutionError
from logger import logger


class FileSystemTool(Tool):
    """
    Tool for file system operations
    """
    
    def __init__(self, workspace_path: str = None):
        super().__init__(
            name="file_system",
            description="Perform file system operations like read, write, list, create, delete files and directories"
        )
        self.workspace_path = Path(workspace_path or os.getcwd())
        self.max_file_size = 10 * 1024 * 1024  # 10 MB
        
        logger.info(f"FileSystemTool initialized with workspace: {self.workspace_path}")
    
    async def execute(self, **kwargs) -> ToolResult:
        """
        Execute file system operation
        
        Args:
            operation: Operation type (read, write, list, create_dir, delete, move, copy, exists)
            path: File/directory path (relative to workspace)
            content: Content for write operations (optional)
            destination: Destination path for move/copy operations (optional)
            recursive: Whether to perform recursive operations (optional)
            
        Returns:
            ToolResult: Result of the operation
        """
        try:
            operation = kwargs.get('operation')
            if not operation:
                raise ToolExecutionError("Operation parameter is required")
            
            # Map operations to methods
            operations = {
                'read': self._read_file,
                'write': self._write_file,
                'list': self._list_directory,
                'create_dir': self._create_directory,
                'delete': self._delete_path,
                'move': self._move_path,
                'copy': self._copy_path,
                'exists': self._check_exists,
                'get_info': self._get_file_info,
            }
            
            if operation not in operations:
                raise ToolExecutionError(f"Unknown operation: {operation}")
            
            result = await operations[operation](**kwargs)
            return result
            
        except ToolExecutionError as e:
            logger.error(f"File system operation error: {e}")
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=str(e),
            )
        except Exception as e:
            logger.error(f"Unexpected error in file system tool: {e}", exc_info=True)
            return ToolResult(
                status=ToolStatus.ERROR,
                output="",
                error=f"Unexpected error: {str(e)}",
            )
    
    def _resolve_path(self, path: str) -> Path:
        """
        Resolve and validate path
        
        Args:
            path: Relative path
            
        Returns:
            Absolute Path object
            
        Raises:
            ToolExecutionError: If path is invalid or outside workspace
        """
        if not path:
            raise ToolExecutionError("Path parameter is required")
        
        # Resolve path relative to workspace
        abs_path = (self.workspace_path / path).resolve()
        
        # Security check: ensure path is within workspace
        try:
            abs_path.relative_to(self.workspace_path)
        except ValueError:
            raise ToolExecutionError(f"Path {path} is outside workspace")
        
        return abs_path
    
    async def _read_file(self, **kwargs) -> ToolResult:
        """Read file content"""
        path = self._resolve_path(kwargs.get('path'))
        
        if not path.exists():
            raise ToolExecutionError(f"File not found: {path}")
        
        if not path.is_file():
            raise ToolExecutionError(f"Path is not a file: {path}")
        
        # Check file size
        if path.stat().st_size > self.max_file_size:
            raise ToolExecutionError(f"File too large (max {self.max_file_size} bytes)")
        
        try:
            content = path.read_text(encoding='utf-8')
            logger.info(f"Read file: {path} ({len(content)} chars)")
            return ToolResult(
                status=ToolStatus.SUCCESS,
                output=content,
                metadata={'path': str(path), 'size': len(content)},
            )
        except UnicodeDecodeError:
            # Try reading as binary
            content = path.read_bytes()
            return ToolResult(
                status=ToolStatus.SUCCESS,
                output=f"[Binary file, {len(content)} bytes]",
                metadata={'path': str(path), 'size': len(content), 'binary': True},
            )
    
    async def _write_file(self, **kwargs) -> ToolResult:
        """Write content to file"""
        path = self._resolve_path(kwargs.get('path'))
        content = kwargs.get('content', '')
        
        if not isinstance(content, str):
            raise ToolExecutionError("Content must be a string")
        
        # Create parent directories if needed
        path.parent.mkdir(parents=True, exist_ok=True)
        
        path.write_text(content, encoding='utf-8')
        logger.info(f"Wrote file: {path} ({len(content)} chars)")
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=f"File written successfully: {path}",
            metadata={'path': str(path), 'size': len(content)},
        )
    
    async def _list_directory(self, **kwargs) -> ToolResult:
        """List directory contents"""
        path = self._resolve_path(kwargs.get('path', '.'))
        recursive = kwargs.get('recursive', False)
        
        if not path.exists():
            raise ToolExecutionError(f"Directory not found: {path}")
        
        if not path.is_dir():
            raise ToolExecutionError(f"Path is not a directory: {path}")
        
        items = []
        
        if recursive:
            for item in path.rglob('*'):
                rel_path = item.relative_to(self.workspace_path)
                items.append({
                    'path': str(rel_path),
                    'type': 'file' if item.is_file() else 'directory',
                    'size': item.stat().st_size if item.is_file() else None,
                })
        else:
            for item in path.iterdir():
                rel_path = item.relative_to(self.workspace_path)
                items.append({
                    'path': str(rel_path),
                    'type': 'file' if item.is_file() else 'directory',
                    'size': item.stat().st_size if item.is_file() else None,
                })
        
        # Sort items
        items.sort(key=lambda x: (x['type'], x['path']))
        
        output = '\n'.join([
            f"{'[D]' if item['type'] == 'directory' else '[F]'} {item['path']}"
            for item in items
        ])
        
        logger.info(f"Listed directory: {path} ({len(items)} items)")
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=output,
            metadata={'path': str(path), 'count': len(items), 'items': items},
        )
    
    async def _create_directory(self, **kwargs) -> ToolResult:
        """Create directory"""
        path = self._resolve_path(kwargs.get('path'))
        
        path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created directory: {path}")
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=f"Directory created: {path}",
            metadata={'path': str(path)},
        )
    
    async def _delete_path(self, **kwargs) -> ToolResult:
        """Delete file or directory"""
        path = self._resolve_path(kwargs.get('path'))
        recursive = kwargs.get('recursive', False)
        
        if not path.exists():
            raise ToolExecutionError(f"Path not found: {path}")
        
        if path.is_file():
            path.unlink()
            logger.info(f"Deleted file: {path}")
            return ToolResult(
                status=ToolStatus.SUCCESS,
                output=f"File deleted: {path}",
                metadata={'path': str(path), 'type': 'file'},
            )
        elif path.is_dir():
            if not recursive and any(path.iterdir()):
                raise ToolExecutionError(f"Directory not empty. Use recursive=True to delete")
            
            shutil.rmtree(path)
            logger.info(f"Deleted directory: {path}")
            return ToolResult(
                status=ToolStatus.SUCCESS,
                output=f"Directory deleted: {path}",
                metadata={'path': str(path), 'type': 'directory'},
            )
        else:
            raise ToolExecutionError(f"Unknown path type: {path}")
    
    async def _move_path(self, **kwargs) -> ToolResult:
        """Move file or directory"""
        source = self._resolve_path(kwargs.get('path'))
        destination = self._resolve_path(kwargs.get('destination'))
        
        if not source.exists():
            raise ToolExecutionError(f"Source not found: {source}")
        
        # Create destination parent if needed
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        shutil.move(str(source), str(destination))
        logger.info(f"Moved: {source} -> {destination}")
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=f"Moved: {source} -> {destination}",
            metadata={'source': str(source), 'destination': str(destination)},
        )
    
    async def _copy_path(self, **kwargs) -> ToolResult:
        """Copy file or directory"""
        source = self._resolve_path(kwargs.get('path'))
        destination = self._resolve_path(kwargs.get('destination'))
        
        if not source.exists():
            raise ToolExecutionError(f"Source not found: {source}")
        
        # Create destination parent if needed
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        if source.is_file():
            shutil.copy2(str(source), str(destination))
        elif source.is_dir():
            shutil.copytree(str(source), str(destination))
        
        logger.info(f"Copied: {source} -> {destination}")
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=f"Copied: {source} -> {destination}",
            metadata={'source': str(source), 'destination': str(destination)},
        )
    
    async def _check_exists(self, **kwargs) -> ToolResult:
        """Check if path exists"""
        path = self._resolve_path(kwargs.get('path'))
        
        exists = path.exists()
        path_type = None
        
        if exists:
            if path.is_file():
                path_type = 'file'
            elif path.is_dir():
                path_type = 'directory'
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=f"Path {'exists' if exists else 'does not exist'}: {path}",
            metadata={'path': str(path), 'exists': exists, 'type': path_type},
        )
    
    async def _get_file_info(self, **kwargs) -> ToolResult:
        """Get file/directory information"""
        path = self._resolve_path(kwargs.get('path'))
        
        if not path.exists():
            raise ToolExecutionError(f"Path not found: {path}")
        
        stat = path.stat()
        info = {
            'path': str(path),
            'type': 'file' if path.is_file() else 'directory',
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'created': stat.st_ctime,
        }
        
        output = '\n'.join([f"{k}: {v}" for k, v in info.items()])
        
        return ToolResult(
            status=ToolStatus.SUCCESS,
            output=output,
            metadata=info,
        )
    
    def get_parameters_schema(self) -> Dict[str, Any]:
        """Get parameter schema"""
        return {
            'type': 'object',
            'properties': {
                'operation': {
                    'type': 'string',
                    'enum': ['read', 'write', 'list', 'create_dir', 'delete', 'move', 'copy', 'exists', 'get_info'],
                    'description': 'Operation to perform',
                },
                'path': {
                    'type': 'string',
                    'description': 'File or directory path (relative to workspace)',
                },
                'content': {
                    'type': 'string',
                    'description': 'Content for write operations',
                },
                'destination': {
                    'type': 'string',
                    'description': 'Destination path for move/copy operations',
                },
                'recursive': {
                    'type': 'boolean',
                    'description': 'Perform recursive operations',
                    'default': False,
                },
            },
            'required': ['operation'],
        }
