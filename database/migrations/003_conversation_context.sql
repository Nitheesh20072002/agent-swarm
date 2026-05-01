
-- Phase 2: Context Management Schema
-- Migration 003: Add context management tables and columns
-- Created: 2026-04-30

-- Add context-related columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS context_summary TEXT,
ADD COLUMN IF NOT EXISTS context_token_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS context_updated_at TIMESTAMP WITH TIME ZONE;

-- Create conversation_contexts table for storing context state
CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Context messages stored as JSONB array
    -- Format: [{ role: 'user'|'agent', content: string, timestamp: string }]
    context_messages JSONB DEFAULT '[]'::jsonb,
    
    -- Token tracking
    total_tokens INTEGER DEFAULT 0,
    max_tokens INTEGER DEFAULT 4000,
    
    -- Summary of compressed context
    summary TEXT,
    
    -- Compression state
    is_compressed BOOLEAN DEFAULT false,
    last_compressed_at TIMESTAMP WITH TIME ZONE,
    compression_ratio DECIMAL(5,2), -- e.g., 0.65 means 65% of original size
    
    -- Metadata for debugging and optimization
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_conversation_id 
    ON conversation_contexts(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_updated_at 
    ON conversation_contexts(updated_at);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_is_compressed 
    ON conversation_contexts(is_compressed);

CREATE INDEX IF NOT EXISTS idx_conversations_context_updated_at 
    ON conversations(context_updated_at);

-- Add trigger for updated_at on conversation_contexts
CREATE TRIGGER update_conversation_contexts_updated_at 
    BEFORE UPDATE ON conversation_contexts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize context for new conversations
CREATE OR REPLACE FUNCTION initialize_conversation_context()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO conversation_contexts (conversation_id, max_tokens)
    VALUES (NEW.id, 4000)
    ON CONFLICT (conversation_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create context when conversation is created
CREATE TRIGGER auto_initialize_conversation_context
    AFTER INSERT ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION initialize_conversation_context();

-- Create function to update conversation's context metadata when context changes
CREATE OR REPLACE FUNCTION sync_conversation_context_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        context_token_count = NEW.total_tokens,
        context_updated_at = NEW.updated_at,
        context_summary = NEW.summary
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep conversation metadata in sync
CREATE TRIGGER sync_context_to_conversation
    AFTER UPDATE ON conversation_contexts
    FOR EACH ROW
    EXECUTE FUNCTION sync_conversation_context_metadata();

-- Add comments for documentation
COMMENT ON TABLE conversation_contexts IS 'Stores conversation context state for AI model context management';
COMMENT ON COLUMN conversation_contexts.context_messages IS 'Array of recent messages for context window';
COMMENT ON COLUMN conversation_contexts.total_tokens IS 'Current estimated token count of context';
COMMENT ON COLUMN conversation_contexts.max_tokens IS 'Maximum tokens allowed in context window';
COMMENT ON COLUMN conversation_contexts.summary IS 'Compressed summary of older messages';
COMMENT ON COLUMN conversation_contexts.is_compressed IS 'Whether context has been compressed';
COMMENT ON COLUMN conversation_contexts.compression_ratio IS 'Ratio of compressed size to original';

-- Insert initial context for existing conversations
INSERT INTO conversation_contexts (conversation_id, max_tokens)
SELECT id, 4000 FROM conversations
ON CONFLICT (conversation_id) DO NOTHING;

-- Migration complete
SELECT 'Migration 003: Context management schema created successfully' AS status;
