-- Migration: Add Alumni Support
-- Date: 2024
-- Description: Adds alumni role support and alumni profiles table

-- Step 1: Create alumni_profiles table
CREATE TABLE alumni_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumni_id VARCHAR(20) UNIQUE NOT NULL,
    graduation_year INTEGER,
    degree VARCHAR(100),
    current_position VARCHAR(200),
    company VARCHAR(200),
    linkedin_profile VARCHAR(300),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Update users table constraint to include 'alumni' role
-- First drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with alumni support
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('student', 'tutor', 'admin', 'alumni'));

-- Step 3: Create unique index for alumni_id
CREATE UNIQUE INDEX idx_alumni_profiles_alumni_id ON alumni_profiles(alumni_id);

-- Step 4: Create foreign key index for performance
CREATE INDEX idx_alumni_profiles_user_id ON alumni_profiles(user_id);

-- Step 5: Create updated_at trigger for alumni_profiles
CREATE TRIGGER update_alumni_profiles_updated_at 
BEFORE UPDATE ON alumni_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Update statistics table to include alumni count
-- First check if the column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'statistics' AND column_name = 'total_alumni'
    ) THEN
        ALTER TABLE statistics ADD COLUMN total_alumni INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Step 7: Update statistics row to include alumni count if it doesn't exist
UPDATE statistics SET total_alumni = (
    SELECT COUNT(*) FROM users WHERE role = 'alumni'
) WHERE id = (SELECT id FROM statistics LIMIT 1);

-- Step 8: Create function to automatically generate alumni ID
CREATE OR REPLACE FUNCTION generate_alumni_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        new_id := 'ALU' || TO_CHAR(NOW(), 'YYYY') || LPAD(counter::TEXT, 4, '0');
        
        -- Check if this ID already exists
        IF NOT EXISTS (SELECT 1 FROM alumni_profiles WHERE alumni_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        counter := counter + 1;
        
        -- Safety check to avoid infinite loop
        IF counter > 9999 THEN
            RAISE EXCEPTION 'Unable to generate unique alumni ID';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create function to update statistics when alumni are added/removed
CREATE OR REPLACE FUNCTION update_alumni_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics table
    UPDATE statistics SET 
        total_alumni = (SELECT COUNT(*) FROM users WHERE role = 'alumni'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = (SELECT id FROM statistics LIMIT 1);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create triggers to automatically update statistics
CREATE TRIGGER update_alumni_stats_insert
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.role = 'alumni')
EXECUTE FUNCTION update_alumni_statistics();

CREATE TRIGGER update_alumni_stats_delete
AFTER DELETE ON users
FOR EACH ROW
WHEN (OLD.role = 'alumni')
EXECUTE FUNCTION update_alumni_statistics();

-- Step 11: Create function to automatically create alumni profile
CREATE OR REPLACE FUNCTION create_alumni_profile()
RETURNS TRIGGER AS $$
DECLARE
    new_alumni_id TEXT;
BEGIN
    -- Only create profile if role is alumni
    IF NEW.role = 'alumni' THEN
        -- Generate unique alumni ID
        new_alumni_id := generate_alumni_id();
        
        -- Insert into alumni_profiles
        INSERT INTO alumni_profiles (user_id, alumni_id, created_at, updated_at)
        VALUES (NEW.id, new_alumni_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Create trigger to automatically create alumni profile on user insert
CREATE TRIGGER create_alumni_profile_trigger
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.role = 'alumni')
EXECUTE FUNCTION create_alumni_profile();

-- Step 13: Update existing alumni users (if any) to have profiles
-- First check if there are any existing alumni users without profiles
INSERT INTO alumni_profiles (user_id, alumni_id, created_at, updated_at)
SELECT 
    u.id,
    generate_alumni_id(),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
WHERE u.role = 'alumni' AND ap.user_id IS NULL;

-- Step 14: Insert initial statistics update
UPDATE statistics SET 
    total_alumni = (SELECT COUNT(*) FROM users WHERE role = 'alumni'),
    updated_at = CURRENT_TIMESTAMP
WHERE id = (SELECT id FROM statistics LIMIT 1);
