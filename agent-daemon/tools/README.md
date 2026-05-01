
# Agent Tools

This directory contains the tool system for the AI agent, providing various capabilities for file system operations, terminal commands, Git version control, and code execution.

## Architecture

The tool system is built with a modular, extensible architecture:

```
tools/
├── __init__.py          # Package exports
├── base.py              # Base Tool class and interfaces
├── tool_manager.py      # Central tool coordination
├── file_system.py       # File and directory operations
├── terminal.py          # Shell command execution
├── git.py               # Git version control
└── code_execution.py    # Code snippet execution
```

## Base Components

### Tool Class

All tools inherit from the abstract `Tool` class which provides:

- **Name and Description**: Tool identification
- **Parameter Schema**: JSON schema for validation
- **Enable/Disable**: Runtime control of tool availability
- **Execute Method**: Async execution interface

### ToolResult

Standardized result format containing:
- `status`: SUCCESS, ERROR, TIMEOUT, or CANCELLED
- `output`: Tool output text
- `error`: Error message (if applicable)
- `metadata`: Additional context data

### ToolExecutionError

Custom exception for tool execution failures.

## Available Tools

### 1. FileSystemTool

Provides secure file system operations within the workspace.

**Operations:**
- `read`: Read file contents
- `write`: Write content to file
- `list`: List directory contents
- `create_dir`: Create directory
- `delete`: Delete file or directory
- `move`: Move file or directory
- `copy`: Copy file or directory
- `exists`: Check if path exists
- `get_info`: Get file/directory metadata

**Security Features:**
- Path validation (must be within workspace)
- File size limits (10MB max)
- Automatic directory creation
- Binary file detection

**Example:**
```python
result = await file_tool.execute(
    operation='read',
    path='src/config.json'
)
```

### 2. TerminalTool

Execute shell commands with timeout and resource controls.

**Features:**
- Async subprocess execution
- Configurable timeout (default: 30s)
- Working directory support
- Environment variable injection
- Shell and direct execution modes
- Stdout/stderr capture

**Example:**
```python
result = await terminal_tool.execute(
    command='npm install',
    cwd='/path/to/project',
    timeout=60
)
```

### 3. GitTool

Git version control operations.

**Operations:**
- `status`: Get repository status
- `add`: Stage files
- `commit`: Commit changes
- `push`: Push to remote
- `pull`: Pull from remote
- `branch`: List or create branches
- `checkout`: Switch branches
- `diff`: Show changes
- `log`: Show commit history
- `clone`: Clone repository
- `init`: Initialize repository
- `remote`: Manage remotes

**Example:**
```python
result = await git_tool.execute(
    operation='commit',
    message='Initial commit'
)
```

### 4. CodeExecutionTool

Execute code snippets in various languages.

**Supported Languages:**
- Python (python3)
- JavaScript (node)
- TypeScript (ts-node)
- Bash/Shell

**Features:**
- Temporary file execution
- Configurable timeout
- Command-line arguments
- Standard input support
- Clean temporary file handling

**Example:**
```python
result = await code_tool.execute(
    code='print("Hello, World!")',
    language='python',
    timeout=10
)
```

## Tool Manager

The `ToolManager` class coordinates all tools:

**Features:**
- Tool registration and initialization
- Unified execution interface
- Parameter validation
- Enable/disable control
- Tool chain execution
- LLM function calling format

**Usage:**
```python
from tools import ToolManager

manager = ToolManager(workspace_path='/workspace')

# Execute tool
result = await manager.execute_tool(
    tool_name='file_system',
    operation='read',
    path='README.md'
)

# Get tool info for LLM
tools_for_llm = manager.format_tools_for_llm()
```

## LLM Integration

Tools are designed to work seamlessly with LLM function calling:

1. **Tool Definitions**: Each tool provides a JSON schema
2. **Function Calling**: LLM can request tool execution
3. **Result Formatting**: Results are formatted for LLM consumption
4. **Iterative Loop**: Agent handles multi-step tool usage

**Flow:**
```
User Message → LLM with Tools → Tool Calls → Execute Tools → 
Add Results to Context → LLM with Tools → Final Response
```

## Security Considerations

### File System
- All paths validated against workspace root
- No access outside workspace directory
- File size limits enforced
- Dangerous operations require explicit confirmation

### Terminal
- Command timeout protection
- No interactive command support (yet)
- Environment isolation
- Signal handling for cleanup

### Code Execution
- Temporary file isolation
- Timeout enforcement
- No persistent state between executions
- Language-specific sandboxing planned

## Future Enhancements

### Planned Features
1. **Docker Integration**: Containerized execution
2. **Resource Limits**: CPU/memory constraints
3. **Interactive Commands**: Real-time I/O
4. **REPL Support**: Persistent execution context
5. **Jupyter Integration**: Notebook execution
6. **API Tools**: HTTP request capabilities
7. **Database Tools**: SQL query execution
8. **Cloud Tools**: AWS/GCP/Azure operations

### Safety Improvements
1. **Approval System**: Require user confirmation for dangerous operations
2. **Audit Logging**: Track all tool executions
3. **Rate Limiting**: Prevent abuse
4. **Sandboxing**: OS-level isolation
5. **Rollback**: Undo functionality for destructive operations

## Error Handling

All tools use consistent error handling:

```python
try:
    result = await tool.execute(**params)
    if result.is_error:
        # Handle tool-specific error
        logger.error(f"Tool failed: {result.error}")
except ToolExecutionError as e:
    # Handle execution error
    logger.error(f"Execution error: {e}")
except Exception as e:
    # Handle unexpected error
    logger.error(f"Unexpected error: {e}")
```

## Testing

Each tool should have comprehensive tests:

```python
# test_file_system.py
async def test_read_file():
    tool = FileSystemTool(workspace_path='/tmp/test')
    result = await tool.execute(
        operation='read',
        path='test.txt'
    )
    assert result.is_success
    assert result.output == expected_content
```

## Contributing

When adding new tools:

1. Inherit from `Tool` base class
2. Implement `execute()` and `get_parameters_schema()`
3. Add to `ToolManager` initialization
4. Update this documentation
5. Add comprehensive tests
6. Consider security implications

## License

Part of the AI Agent Swarm project.
