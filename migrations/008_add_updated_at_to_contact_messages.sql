-- Migration: Add updated_at column to contact_messages table
-- This fixes the error: column "updated_at" of relation "contact_messages" does not exist

-- Add updated_at column to contact_messages table
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have the updated_at column set to created_at
UPDATE contact_messages SET updated_at = created_at WHERE updated_at IS NULL;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_contact_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON contact_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contact_messages_updated_at_column();

