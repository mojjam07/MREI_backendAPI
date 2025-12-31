-- Add media columns to news and events tables
-- Migration: 007_add_media_columns

-- Add image_url column to news table
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Add video_url column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Update the updated_at trigger for news table (already exists, but ensuring consistency)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for news updated_at if not exists
DROP TRIGGER IF EXISTS update_news_updated_at ON news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for events updated_at if not exists
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

