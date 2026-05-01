
"""
Agent Daemon - Main entry point
"""
import asyncio
import signal
import sys
from agent import Agent
from logger import logger
from config import settings


# Global agent instance
agent: Agent = None


async def shutdown(sig=None):
    """
    Graceful shutdown handler
    
    Args:
        sig: Signal received
    """
    if sig:
        logger.info(f"Received signal {sig.name}, initiating graceful shutdown...")
    else:
        logger.info("Initiating graceful shutdown...")
    
    if agent:
        await agent.stop()
    
    # Cancel all running tasks
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    
    logger.info("Shutdown complete")
    sys.exit(0)


def handle_signal(sig):
    """
    Signal handler wrapper
    
    Args:
        sig: Signal received
    """
    asyncio.create_task(shutdown(sig))


async def main():
    """Main function"""
    global agent
    
    try:
        logger.info("=" * 60)
        logger.info("AI Agent Swarm - Agent Daemon")
        logger.info("=" * 60)
        logger.info(f"Agent ID: {settings.agent_id}")
        logger.info(f"Backend URL: {settings.backend_url}")
        logger.info(f"WebSocket URL: {settings.websocket_url}")
        logger.info(f"LLM Provider: {settings.llm_provider}")
        logger.info(f"Workspace: {settings.workspace_path}")
        logger.info("=" * 60)
        
        # Create and start agent
        agent = Agent(workspace_path=settings.workspace_path)
        await agent.start()
        
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        await shutdown()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        await shutdown()


if __name__ == "__main__":
    # Setup signal handlers
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, lambda s=sig: handle_signal(s))
    
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()
