-- Add image_url column to events table
-- This migration adds support for event images

-- Add image_url column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Add video_url column if it doesn't exist (for consistency)
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_image_url ON events(image_url);

-- Add updated_at column if it doesn't exist (some tables might be missing it)
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have updated_at = created_at if null
UPDATE events SET updated_at = created_at WHERE updated_at IS NULL;

COMMENT ON COLUMN events.image_url IS 'URL to event cover image';
COMMENT ON COLUMN events.video_url IS 'URL to event video (e.g., YouTube embed URL)';

