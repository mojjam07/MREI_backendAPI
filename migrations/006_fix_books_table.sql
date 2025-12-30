-- Migration: Add missing cover_image column to books table
-- Date: 2024
-- Description: Fixes the "column cover_image does not exist" error by adding the missing column

-- Step 1: Add cover_image column if it doesn't exist
ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_image VARCHAR(500);

-- Step 2: Add pdf_file column if it doesn't exist (also needed for book functionality)
ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_file VARCHAR(500);

-- Step 3: Add other missing columns that might be needed
ALTER TABLE books ADD COLUMN IF NOT EXISTS genre VARCHAR(100);
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_year INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_type VARCHAR(20) DEFAULT 'pdf';
ALTER TABLE books ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Step 4: Verify the books table has the expected structure
DO $$
BEGIN
    -- Check if the cover_image column was added
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'cover_image'
    ) THEN
        RAISE NOTICE '✅ cover_image column exists in books table';
    ELSE
        RAISE WARNING '⚠️ cover_image column still missing after migration';
    END IF;
END
$$;

-- Step 5: Add index for better performance on cover_image queries
CREATE INDEX IF NOT EXISTS idx_books_cover_image ON books(cover_image);

