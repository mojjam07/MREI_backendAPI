-- School Management System Database Schema
-- This file contains the complete database schema for the Express.js API

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (base user information)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Student profiles table
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor profiles table
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id VARCHAR(20) UNIQUE NOT NULL,
    specialization VARCHAR(200),
    qualification VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL CHECK (credits > 0),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Class schedules table
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id, date)
);

-- News table
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    author VARCHAR(100),
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(200),
    organizer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials table
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    position VARCHAR(100),
    company VARCHAR(100),
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campus life table
CREATE TABLE campus_life (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    replied_at TIMESTAMP,
    reply TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20),
    category VARCHAR(50),
    description TEXT,
    cover_image VARCHAR(500),
    pdf_file VARCHAR(500),
    available BOOLEAN DEFAULT TRUE,
    genre VARCHAR(100),
    publication_year INTEGER,
    file_type VARCHAR(20) DEFAULT 'pdf',
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Statistics table
CREATE TABLE statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_students INTEGER DEFAULT 0,
    total_tutors INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_assignments INTEGER DEFAULT 0,
    total_submissions INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_news_published ON news(published);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_testimonials_approved ON testimonials(approved);
CREATE INDEX idx_books_available ON books(available);

-- Insert initial data
INSERT INTO statistics (total_students, total_tutors, total_courses, total_assignments, total_submissions) 
VALUES (0, 0, 0, 0, 0);

-- Insert sample news
INSERT INTO news (title, content, category, author, published) VALUES
('Welcome to the New Semester', 'We are excited to welcome all students to the new semester!', 'announcement', 'Administration', true),
('Holiday Notice', 'The school will be closed on Friday for a public holiday.', 'announcement', 'Administration', true);

-- Insert sample events
INSERT INTO events (title, description, event_date, location, organizer) VALUES
('Parent-Teacher Meeting', 'Monthly parent-teacher meeting to discuss student progress.', '2024-02-15', 'Main Auditorium', 'School Administration'),
('Science Fair', 'Annual science fair showcasing student projects.', '2024-03-10', 'Science Building', 'Science Department');

-- Insert sample testimonials
INSERT INTO testimonials (student_name, content, rating, approved) VALUES
('John Doe', 'This school has provided me with excellent education and support.', 5, true),
('Jane Smith', 'The teachers are very dedicated and helpful.', 4, true);

-- Insert sample campus life content
INSERT INTO campus_life (title, content, category) VALUES
('Student Activities', 'Our school offers various extracurricular activities for student engagement.', 'activities'),
('Sports Programs', 'We have comprehensive sports programs for all skill levels.', 'sports');

-- Insert sample books with proper structure for frontend
INSERT INTO books (title, author, isbn, category, description, cover_image, pdf_file, available, genre, publication_year, file_type) VALUES
('Introduction to Computer Science', 'Dr. Sarah Johnson', '978-0-123456-78-9', 'Technology', 'A comprehensive guide to the fundamentals of computer science, covering algorithms, data structures, and programming paradigms.', '/images/book-cs-cover.jpg', '/documents/intro-to-cs.pdf', true, 'Computer Science', 2023, 'pdf'),
('Advanced Mathematics for Engineers', 'Prof. Michael Chen', '978-0-987654-32-1', 'Mathematics', 'An in-depth exploration of mathematical concepts essential for engineering applications, including calculus and linear algebra.', '/images/book-math-cover.jpg', '/documents/advanced-math.pdf', true, 'Mathematics', 2022, 'pdf'),
('Business Ethics and Corporate Responsibility', 'Dr. Emily Rodriguez', '978-0-555555-55-5', 'Business', 'Examining the principles of ethical business practices and the importance of corporate social responsibility in modern enterprises.', '/images/book-business-cover.jpg', '/documents/business-ethics.pdf', true, 'Business', 2023, 'pdf'),
('Environmental Science: A Global Perspective', 'Prof. David Thompson', '978-0-777777-77-7', 'Science', 'Understanding environmental issues from a global viewpoint, including climate change, biodiversity, and sustainable development.', '/images/book-env-cover.jpg', '/documents/environmental-science.pdf', true, 'Environmental Science', 2024, 'pdf'),
('Psychology: The Human Mind', 'Dr. Lisa Park', '978-0-888888-88-8', 'Psychology', 'An exploration of human psychology, covering cognitive processes, behavior, and mental health.', '/images/book-psych-cover.jpg', '/documents/psychology.pdf', true, 'Psychology', 2023, 'pdf'),
('History of Modern Art', 'Prof. Antonio Martinez', '978-0-999999-99-9', 'Arts', 'A journey through the evolution of modern art movements, from impressionism to contemporary art.', '/images/book-art-cover.jpg', '/documents/modern-art.pdf', true, 'Art History', 2022, 'pdf'),
('Introduction to Machine Learning', 'Dr. Alex Kim', '978-0-111111-11-1', 'Technology', 'A practical introduction to machine learning algorithms and their applications in real-world scenarios.', '/images/book-ml-cover.jpg', '/documents/machine-learning.pdf', true, 'Computer Science', 2024, 'pdf'),
('Creative Writing Workshop', 'Prof. Maria Gonzalez', '978-0-222222-22-2', 'Literature', 'A comprehensive guide to developing creative writing skills through practical exercises and examples.', '/images/book-writing-cover.jpg', '/documents/creative-writing.pdf', true, 'Literature', 2023, 'pdf');

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutor_profiles_updated_at BEFORE UPDATE ON tutor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_schedules_updated_at BEFORE UPDATE ON class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campus_life_updated_at BEFORE UPDATE ON campus_life FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_statistics_updated_at BEFORE UPDATE ON statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
