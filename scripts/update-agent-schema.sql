
-- Update Agent Schema Migration
-- This migration updates the agents table to support new fields

-- Drop old constraints if they exist
ALTER TABLE agents DROP COLUMN IF EXISTS model CASCADE;
ALTER TABLE agents DROP COLUMN IF EXISTS persona_old CASCADE;

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='description') THEN
        ALTER TABLE agents ADD COLUMN description TEXT DEFAULT '';
    END IF;

    -- Update persona to TEXT if it's not already
    ALTER TABLE agents ALTER COLUMN persona TYPE TEXT;

    -- Add skills array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='skills') THEN
        ALTER TABLE agents ADD COLUMN skills TEXT[] DEFAULT '{}';
    END IF;

    -- Add permissions array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='permissions') THEN
        ALTER TABLE agents ADD COLUMN permissions TEXT[] DEFAULT '{}';
    END IF;

    -- Add models array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='models') THEN
        ALTER TABLE agents ADD COLUMN models TEXT[] DEFAULT '{}';
    END IF;

    -- Add vms array
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='vms') THEN
        ALTER TABLE agents ADD COLUMN vms TEXT[] DEFAULT '{}';
    END IF;

    -- Add openrouter_api_key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='openrouter_api_key') THEN
        ALTER TABLE agents ADD COLUMN openrouter_api_key VARCHAR(500);
    END IF;

    -- Add vm_config as JSONB
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='agents' AND column_name='vm_config') THEN
        ALTER TABLE agents ADD COLUMN vm_config JSONB DEFAULT '{}';
    END IF;

    -- Update status column to use new enum values
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='agents' AND column_name='status') THEN
        -- Update existing status values
        UPDATE agents SET status = 'active' WHERE status NOT IN ('active', 'inactive', 'offline');
    ELSE
        ALTER TABLE agents ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;

END $$;

-- Ensure metadata column is JSONB
ALTER TABLE agents ALTER COLUMN metadata TYPE JSONB USING 
    CASE 
        WHEN metadata IS NULL THEN '{}'::jsonb
        WHEN metadata::text = '' THEN '{}'::jsonb
        ELSE metadata::jsonb
    END;

ALTER TABLE agents ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- Update existing records to have default values for new fields
UPDATE agents SET 
    description = COALESCE(description, ''),
    skills = COALESCE(skills, '{}'),
    permissions = COALESCE(permissions, '{}'),
    models = COALESCE(models, ARRAY['meta-llama/llama-3.1-8b-instruct:free', 'microsoft/phi-3-mini-128k-instruct:free', 'google/gemma-2-9b-it:free']),
    vms = COALESCE(vms, '{}'),
    vm_config = COALESCE(vm_config, '{}'::jsonb),
    status = COALESCE(status, 'active'),
    metadata = COALESCE(metadata, '{}'::jsonb)
WHERE id IS NOT NULL;

-- Create indexes for new array fields for better query performance
CREATE INDEX IF NOT EXISTS idx_agents_skills ON agents USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_agents_models ON agents USING GIN (models);
CREATE INDEX IF NOT EXISTS idx_agents_vms ON agents USING GIN (vms);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

COMMENT ON COLUMN agents.description IS 'Agent description';
COMMENT ON COLUMN agents.skills IS 'Array of agent skills/capabilities';
COMMENT ON COLUMN agents.permissions IS 'Array of agent permissions';
COMMENT ON COLUMN agents.models IS 'Array of AI models the agent can use';
COMMENT ON COLUMN agents.vms IS 'Array of VM identifiers the agent has access to';
COMMENT ON COLUMN agents.openrouter_api_key IS 'OpenRouter API key for accessing free models';
COMMENT ON COLUMN agents.vm_config IS 'VM access configuration (host, port, SSH keys, etc.)';
COMMENT ON COLUMN agents.status IS 'Agent status: active, inactive, or offline';
