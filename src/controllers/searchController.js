const { pool } = require('../config/database');

// @desc    Global search across all entities
// @route   GET /api/search/global
// @access  Private
const globalSearch = async (req, res) => {
  try {
    const { q: query, type, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const searchResults = {
      users: [],
      students: [],
      tutors: [],
      courses: [],
      assignments: [],
      news: [],
      events: [],
      books: []
    };

    // Search users
    if (!type || type === 'users') {
      const usersQuery = `
        SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role,
               'user' as type,
               CONCAT(u.first_name, ' ', u.last_name, ' (', u.username, ')') as display_name
        FROM users u
        WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.username ILIKE $1 OR u.email ILIKE $1)
        ORDER BY u.first_name, u.last_name
        LIMIT $2
      `;
      const users = await pool.query(usersQuery, [searchTerm, limit]);
      searchResults.users = users.rows;
    }

    // Search students
    if (!type || type === 'students') {
      const studentsQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email,
               sp.student_id,
               'student' as type,
               CONCAT(u.first_name, ' ', u.last_name, ' (', sp.student_id, ')') as display_name
        FROM users u
        INNER JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1)
        ORDER BY u.first_name, u.last_name
        LIMIT $2
      `;
      const students = await pool.query(studentsQuery, [searchTerm, limit]);
      searchResults.students = students.rows;
    }

    // Search tutors
    if (!type || type === 'tutors') {
      const tutorsQuery = `
        SELECT u.id, u.first_name, u.last_name, u.email,
               tp.tutor_id, tp.specialization,
               'tutor' as type,
               CONCAT(u.first_name, ' ', u.last_name, ' (', tp.tutor_id, ')') as display_name
        FROM users u
        INNER JOIN tutor_profiles tp ON u.id = tp.user_id
        WHERE u.role = 'tutor' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR tp.tutor_id ILIKE $1 OR tp.specialization ILIKE $1)
        ORDER BY u.first_name, u.last_name
        LIMIT $2
      `;
      const tutors = await pool.query(tutorsQuery, [searchTerm, limit]);
      searchResults.tutors = tutors.rows;
    }

    // Search courses
    if (!type || type === 'courses') {
      const coursesQuery = `
        SELECT c.id, c.title, c.description, c.credits,
               u.first_name || ' ' || u.last_name as tutor_name,
               'course' as type,
               c.title as display_name
        FROM courses c
        INNER JOIN users u ON c.tutor_id = u.id
        WHERE (c.title ILIKE $1 OR c.description ILIKE $1)
        ORDER BY c.title
        LIMIT $2
      `;
      const courses = await pool.query(coursesQuery, [searchTerm, limit]);
      searchResults.courses = courses.rows;
    }

    // Search assignments
    if (!type || type === 'assignments') {
      const assignmentsQuery = `
        SELECT a.id, a.title, a.description, a.due_date,
               c.title as course_title,
               'assignment' as type,
               a.title as display_name
        FROM assignments a
        INNER JOIN courses c ON a.course_id = c.id
        WHERE (a.title ILIKE $1 OR a.description ILIKE $1 OR c.title ILIKE $1)
        ORDER BY a.title
        LIMIT $2
      `;
      const assignments = await pool.query(assignmentsQuery, [searchTerm, limit]);
      searchResults.assignments = assignments.rows;
    }

    // Search news
    if (!type || type === 'news') {
      const newsQuery = `
        SELECT id, title, content, category, author, created_at,
               'news' as type,
               title as display_name
        FROM news
        WHERE published = true AND (title ILIKE $1 OR content ILIKE $1 OR category ILIKE $1)
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const news = await pool.query(newsQuery, [searchTerm, limit]);
      searchResults.news = news.rows;
    }

    // Search events
    if (!type || type === 'events') {
      const eventsQuery = `
        SELECT id, title, description, event_date, location, organizer, created_at,
               'event' as type,
               title as display_name
        FROM events
        WHERE (title ILIKE $1 OR description ILIKE $1 OR location ILIKE $1)
        ORDER BY event_date
        LIMIT $2
      `;
      const events = await pool.query(eventsQuery, [searchTerm, limit]);
      searchResults.events = events.rows;
    }

    // Search books
    if (!type || type === 'books') {
      const booksQuery = `
        SELECT id, title, author, isbn, category, description, available,
               'book' as type,
               CONCAT(title, ' by ', author) as display_name
        FROM books
        WHERE available = true AND (title ILIKE $1 OR author ILIKE $1 OR category ILIKE $1)
        ORDER BY title
        LIMIT $2
      `;
      const books = await pool.query(booksQuery, [searchTerm, limit]);
      searchResults.books = books.rows;
    }

    // Count total results
    const totalResults = Object.values(searchResults).reduce((sum, results) => sum + results.length, 0);

    res.json({
      success: true,
      data: {
        query: query.trim(),
        results: searchResults,
        total_results: totalResults,
        search_types: Object.keys(searchResults).filter(key => 
          !type || type === key || searchResults[key].length > 0
        )
      }
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
};

// @desc    Quick search for auto-complete
// @route   GET /api/search/quick
// @access  Private
const quickSearch = async (req, res) => {
  try {
    const { q: query, type = 'all', limit = 5 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const suggestions = [];

    // Quick user suggestions
    if (type === 'all' || type === 'users') {
      const usersQuery = `
        SELECT u.id, u.first_name, u.last_name, u.username, u.role,
               CONCAT(u.first_name, ' ', u.last_name, ' (', u.role, ')') as display_name,
               'user' as type
        FROM users u
        WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.username ILIKE $1)
        ORDER BY 
          CASE 
            WHEN u.first_name ILIKE $2 THEN 1
            WHEN u.last_name ILIKE $2 THEN 2
            ELSE 3
          END,
          u.first_name
        LIMIT $3
      `;
      const users = await pool.query(usersQuery, [searchTerm, `${query}%`, limit]);
      suggestions.push(...users.rows);
    }

    // Quick course suggestions
    if (type === 'all' || type === 'courses') {
      const coursesQuery = `
        SELECT c.id, c.title,
               CONCAT(c.title, ' (Course)') as display_name,
               'course' as type
        FROM courses c
        WHERE c.title ILIKE $1
        ORDER BY 
          CASE 
            WHEN c.title ILIKE $2 THEN 1
            ELSE 2
          END,
          c.title
        LIMIT $3
      `;
      const courses = await pool.query(coursesQuery, [searchTerm, `${query}%`, limit]);
      suggestions.push(...courses.rows);
    }

    // Quick assignment suggestions
    if (type === 'all' || type === 'assignments') {
      const assignmentsQuery = `
        SELECT a.id, a.title,
               CONCAT(a.title, ' (Assignment)') as display_name,
               'assignment' as type
        FROM assignments a
        WHERE a.title ILIKE $1
        ORDER BY 
          CASE 
            WHEN a.title ILIKE $2 THEN 1
            ELSE 2
          END,
          a.title
        LIMIT $3
      `;
      const assignments = await pool.query(assignmentsQuery, [searchTerm, `${query}%`, limit]);
      suggestions.push(...assignments.rows);
    }

    res.json({
      success: true,
      data: {
        query: query.trim(),
        suggestions: suggestions.slice(0, limit)
      }
    });
  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during quick search'
    });
  }
};

// @desc    Search students
// @route   GET /api/search/students
// @access  Private
const searchStudents = async (req, res) => {
  try {
    const { q: query, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;

    const studentsQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
             sp.student_id, sp.date_of_birth, sp.address,
             COUNT(DISTINCT e.course_id) as enrolled_courses
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN enrollments e ON u.id = e.student_id
      WHERE u.role = 'student' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1 OR u.email ILIKE $1)
      GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, sp.student_id, sp.date_of_birth, sp.address
      ORDER BY u.first_name, u.last_name
      LIMIT $2 OFFSET $3
    `;
    
    const students = await pool.query(studentsQuery, [searchTerm, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'student' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1 OR u.email ILIKE $1)
    `;
    
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalStudents = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        students: students.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalStudents,
          pages: Math.ceil(totalStudents / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during student search'
    });
  }
};

// @desc    Search tutors
// @route   GET /api/search/tutors
// @access  Private
const searchTutors = async (req, res) => {
  try {
    const { q: query, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;

    const tutorsQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
             tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years,
             COUNT(DISTINCT c.id) as total_courses
      FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN courses c ON u.id = c.tutor_id
      WHERE u.role = 'tutor' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR tp.tutor_id ILIKE $1 OR tp.specialization ILIKE $1)
      GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years
      ORDER BY u.first_name, u.last_name
      LIMIT $2 OFFSET $3
    `;
    
    const tutors = await pool.query(tutorsQuery, [searchTerm, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'tutor' AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR tp.tutor_id ILIKE $1 OR tp.specialization ILIKE $1)
    `;
    
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalTutors = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        tutors: tutors.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTutors,
          pages: Math.ceil(totalTutors / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search tutors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during tutor search'
    });
  }
};

// @desc    Search courses
// @route   GET /api/search/courses
// @access  Private
const searchCourses = async (req, res) => {
  try {
    const { q: query, limit = 10, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchTerm = `%${query.trim()}%`;

    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id,
             COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      WHERE (c.title ILIKE $1 OR c.description ILIKE $1)
      GROUP BY c.id, c.title, c.description, c.credits, c.created_at, u.first_name, u.last_name, tp.tutor_id
      ORDER BY c.title
      LIMIT $2 OFFSET $3
    `;
    
    const courses = await pool.query(coursesQuery, [searchTerm, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM courses c
      WHERE (c.title ILIKE $1 OR c.description ILIKE $1)
    `;
    
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalCourses = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        courses: courses.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCourses,
          pages: Math.ceil(totalCourses / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during course search'
    });
  }
};

module.exports = {
  globalSearch,
  quickSearch,
  searchStudents,
  searchTutors,
  searchCourses
};
