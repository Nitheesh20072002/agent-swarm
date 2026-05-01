
"""
Logging configuration for the agent daemon
"""
import logging
import colorlog
from config import settings


def setup_logger(name: str = "agent") -> logging.Logger:
    """
    Setup colored logger with proper formatting
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set log level from settings
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Create console handler with colored output
    handler = colorlog.StreamHandler()
    handler.setLevel(log_level)
    
    # Create formatter
    formatter = colorlog.ColoredFormatter(
        "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        log_colors={
            'DEBUG': 'cyan',
            'INFO': 'green',
            'WARNING': 'yellow',
            'ERROR': 'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


# Global logger instance
logger = setup_logger()
