-- Migration to add comprehensive campus life seed data with proper image URLs
-- This migration replaces the basic seed data with detailed campus life content

-- Clear existing campus life data
DELETE FROM campus_life;

-- Insert comprehensive campus life content with proper image URLs
INSERT INTO campus_life (title, content, image_url, category) VALUES
(
    'Modern Campus Library',
    'Our state-of-the-art library provides students with access to millions of books, digital resources, and quiet study spaces. The facility includes computer labs, group study rooms, and a cozy reading lounge.',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    'facilities'
),
(
    'Science Laboratory Complex',
    'Fully equipped laboratories for physics, chemistry, and biology students. Our modern facilities include advanced equipment, safety systems, and collaborative workspace areas.',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop',
    'facilities'
),
(
    'Sports and Recreation Center',
    'A comprehensive sports facility featuring basketball courts, swimming pool, gymnasium, and outdoor sports fields. Students can participate in various athletic programs and intramural sports.',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',
    'sports'
),
(
    'Student Activities and Events',
    'Join over 50 student organizations including academic clubs, cultural societies, and special interest groups. Regular events include festivals, competitions, and social gatherings.',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=400&h=300&fit=crop',
    'activities'
),
(
    'Campus Cafeteria and Dining',
    'Our modern dining facility offers diverse meal options including vegetarian, vegan, and international cuisines. The cafeteria features comfortable seating areas and regular themed dining events.',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'facilities'
),
(
    'Technology and Innovation Hub',
    'A cutting-edge facility featuring maker spaces, 3D printing labs, robotics workshops, and collaborative tech spaces. Students can work on innovative projects and startup ideas.',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop',
    'technology'
),
(
    'Arts and Culture Center',
    'Dedicated spaces for visual arts, music, and performing arts. The center includes art galleries, music practice rooms, and a theater for student performances and cultural events.',
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
    'arts'
),
(
    'Campus Green Spaces',
    'Beautiful landscaped gardens, courtyards, and green spaces throughout campus. These areas provide peaceful spots for relaxation, outdoor studying, and social gatherings.',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    'environment'
),
(
    'Student Housing and Residence Life',
    'Modern residence halls offering various accommodation options. Each building features common areas, study lounges, and recreational facilities to foster community living.',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=300&fit=crop',
    'housing'
),
(
    'Career Services and Alumni Center',
    'Professional development resources, career counseling, job placement services, and networking opportunities with our extensive alumni network across various industries.',
    'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=400&h=300&fit=crop',
    'career'
);
