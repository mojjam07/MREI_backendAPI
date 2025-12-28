-- Migration: Fix Admin Dashboard Schema Issues (Safe Approach)
-- This migration fixes the schema mismatches between frontend expectations and current database structure

-- STEP 1: Add new columns to existing tables (no data updates yet)

-- 1. Update testimonials table to match frontend expectations
ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS author VARCHAR(100);

ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS author_title VARCHAR(100);

ALTER TABLE testimonials 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- 2. Add missing video_id field to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS video_id VARCHAR(50);

-- 3. Update contact_messages table structure to match frontend expectations
ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

ALTER TABLE contact_messages 
ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT FALSE;

-- 4. Add image fields to existing tables for file uploads
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

ALTER TABLE campus_life 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- 5. Update statistics table to match frontend expectations
ALTER TABLE statistics 
ADD COLUMN IF NOT EXISTS active_students INTEGER DEFAULT 0;

ALTER TABLE statistics 
ADD COLUMN IF NOT EXISTS courses INTEGER DEFAULT 0;

ALTER TABLE statistics 
ADD COLUMN IF NOT EXISTS success_rate INTEGER DEFAULT 0;

ALTER TABLE statistics 
ADD COLUMN IF NOT EXISTS tutors INTEGER DEFAULT 0;

-- STEP 2: Create indexes for better performance (safe to do anytime)

CREATE INDEX IF NOT EXISTS idx_testimonials_author ON testimonials(author);
CREATE INDEX IF NOT EXISTS idx_testimonials_author_title ON testimonials(author_title);
CREATE INDEX IF NOT EXISTS idx_events_video_id ON events(video_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON contact_messages(read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_replied ON contact_messages(replied);
CREATE INDEX IF NOT EXISTS idx_news_image ON news(image);
CREATE INDEX IF NOT EXISTS idx_testimonials_image ON testimonials(image);
CREATE INDEX IF NOT EXISTS idx_campus_life_image ON campus_life(image);

-- STEP 3: Insert initial statistics data if not exists
INSERT INTO statistics (active_students, courses, success_rate, tutors, total_students, total_tutors, total_courses, total_assignments, total_submissions) 
SELECT 0, 0, 0, 0, 0, 0, 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM statistics LIMIT 1);
