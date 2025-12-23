-- Migration: Add Missing Unique Constraints for Seed Script
-- This migration adds the unique constraints required for ON CONFLICT clauses

-- Add UNIQUE constraint on user_id for tutor_profiles table
-- This allows ON CONFLICT (user_id) to work in the seed script
ALTER TABLE tutor_profiles ADD CONSTRAINT unique_tutor_profile_user_id UNIQUE (user_id);

-- Add UNIQUE constraint on user_id for student_profiles table  
-- This allows ON CONFLICT (user_id) to work in the seed script
ALTER TABLE student_profiles ADD CONSTRAINT unique_student_profile_user_id UNIQUE (user_id);

-- Add UNIQUE constraint on (title, tutor_id) for courses table
-- This prevents duplicate courses with same title by same tutor
ALTER TABLE courses ADD CONSTRAINT unique_course_title_tutor UNIQUE (title, tutor_id);

-- Add UNIQUE constraint on (title, course_id) for assignments table
-- This prevents duplicate assignments with same title in same course
ALTER TABLE assignments ADD CONSTRAINT unique_assignment_title_course UNIQUE (title, course_id);

-- Note: These constraints are necessary for the ON CONFLICT clauses in seed.js to work properly
-- The seed script expects these constraints to exist when using ON CONFLICT syntax
