-- Migration: Add updated_at column to testimonials table
-- This fixes the error: column "updated_at" does not exist in testimonials table

-- Add updated_at column to testimonials table
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have the updated_at column set to created_at
UPDATE testimonials SET updated_at = created_at WHERE updated_at IS NULL;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_testimonials_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON testimonials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_testimonials_updated_at_column();

