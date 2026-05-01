
"""
Configuration module for the agent daemon
Loads environment variables and provides configuration objects
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Agent daemon settings"""
    
    # Agent Configuration
    agent_id: str = Field(..., description="Unique agent identifier")
    agent_token: str = Field(..., description="JWT token for authentication")
    
    # Backend Configuration
    backend_url: str = Field(default="http://localhost:3000", description="Backend API URL")
    websocket_url: str = Field(default="ws://localhost:3000", description="WebSocket server URL")
    
    # LLM Configuration
    llm_provider: str = Field(default="openai", description="LLM provider (openai or anthropic)")
    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key")
    anthropic_api_key: Optional[str] = Field(default=None, description="Anthropic API key")
    
    # Model Configuration
    openai_model: str = Field(default="gpt-4-turbo-preview", description="OpenAI model to use")
    anthropic_model: str = Field(default="claude-3-5-sonnet-20241022", description="Anthropic model to use")
    
    # Agent Workspace
    workspace_path: str = Field(default="/workspace", description="Agent workspace directory")
    log_level: str = Field(default="INFO", description="Logging level")
    
    # Execution Configuration
    max_retries: int = Field(default=3, description="Maximum number of retries for operations")
    timeout: int = Field(default=300, description="Timeout for operations in seconds")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


def get_settings() -> Settings:
    """Get settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
