const { pool } = require('../config/database');
const { 
  transformCampusLife, 
  transformBooks, 
  transformEvents, 
  transformTestimonials, 
  transformNews,
  transformContactMessages,
  transformStats
} = require('../utils/dataTransformer');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Run all count queries in parallel for performance
    const [
      totalStudents,
      totalTutors,
      totalNews,
      publishedNews,
      totalEvents,
      upcomingEvents,
      totalTestimonials,
      approvedTestimonials,
      pendingTestimonials,
      totalCampusLife,
      totalBooks,
      availableBooks,
      totalContactMessages,
      newMessages,
      repliedMessages
    ] = await Promise.all([
      // Total students
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      // Total tutors
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'tutor'"),
      // Total news
      pool.query("SELECT COUNT(*) FROM news"),
      // Published news
      pool.query("SELECT COUNT(*) FROM news WHERE published = true"),
      // Total events
      pool.query("SELECT COUNT(*) FROM events"),
      // Upcoming events
      pool.query("SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE"),
      // Total testimonials
      pool.query("SELECT COUNT(*) FROM testimonials"),
      // Approved testimonials
      pool.query("SELECT COUNT(*) FROM testimonials WHERE approved = true"),
      // Pending testimonials
      pool.query("SELECT COUNT(*) FROM testimonials WHERE approved = false"),
      // Total campus life content
      pool.query("SELECT COUNT(*) FROM campus_life"),
      // Total books
      pool.query("SELECT COUNT(*) FROM books"),
      // Available books
      pool.query("SELECT COUNT(*) FROM books WHERE available = true"),
      // Total contact messages
      pool.query("SELECT COUNT(*) FROM contact_messages"),
      // New/unread messages
      pool.query("SELECT COUNT(*) FROM contact_messages WHERE status = 'new'"),
      // Replied messages
      pool.query("SELECT COUNT(*) FROM contact_messages WHERE status = 'replied'")
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          users: {
            students: parseInt(totalStudents.rows[0].count) || 0,
            tutors: parseInt(totalTutors.rows[0].count) || 0,
            total: (parseInt(totalStudents.rows[0].count) || 0) + (parseInt(totalTutors.rows[0].count) || 0)
          },
          content: {
            news: {
              total: parseInt(totalNews.rows[0].count) || 0,
              published: parseInt(publishedNews.rows[0].count) || 0,
              unpublished: (parseInt(totalNews.rows[0].count) || 0) - (parseInt(publishedNews.rows[0].count) || 0)
            },
            events: {
              total: parseInt(totalEvents.rows[0].count) || 0,
              upcoming: parseInt(upcomingEvents.rows[0].count) || 0
            },
            testimonials: {
              total: parseInt(totalTestimonials.rows[0].count) || 0,
              approved: parseInt(approvedTestimonials.rows[0].count) || 0,
              pending: parseInt(pendingTestimonials.rows[0].count) || 0
            },
            campus_life: parseInt(totalCampusLife.rows[0].count) || 0,
            books: {
              total: parseInt(totalBooks.rows[0].count) || 0,
              available: parseInt(availableBooks.rows[0].count) || 0
            }
          },
          communication: {
            contact_messages: {
              total: parseInt(totalContactMessages.rows[0].count) || 0,
              new: parseInt(newMessages.rows[0].count) || 0,
              replied: parseInt(repliedMessages.rows[0].count) || 0
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all news for admin (including unpublished)
// @route   GET /api/dashboard/admin/news
// @access  Private/Admin
const getAdminNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, published } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, content, category, author, published, created_at, updated_at
      FROM news
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (published !== undefined && published !== '') {
      paramCount++;
      query += ` AND published = $${paramCount}`;
      queryParams.push(published === 'true');
    }

    // Add pagination parameters
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const news = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM news WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (published !== undefined && published !== '') {
      countParamCount++;
      countQuery += ` AND published = $${countParamCount}`;
      countParams.push(published === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalNews = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        news: transformNews(news.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalNews,
          pages: Math.ceil(totalNews / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create news
// @route   POST /api/dashboard/admin/news
// @access  Private/Admin
const createNews = async (req, res) => {
  try {
    const { title, content, category, author, published = true } = req.body;

    const insertQuery = `
      INSERT INTO news (title, content, category, author, published, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const newNews = await pool.query(insertQuery, [title, content, category, author, published]);

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: {
        news: newNews.rows[0]
      }
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update news
// @route   PUT /api/dashboard/admin/news/:id
// @access  Private/Admin
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, author, published } = req.body;

    const updateQuery = `
      UPDATE news 
      SET title = $1, content = $2, category = $3, author = $4, published = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const updatedNews = await pool.query(updateQuery, [title, content, category, author, published, id]);

    if (updatedNews.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      message: 'News updated successfully',
      data: {
        news: updatedNews.rows[0]
      }
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete news
// @route   DELETE /api/dashboard/admin/news/:id
// @access  Private/Admin
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM news WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all events for admin
// @route   GET /api/dashboard/admin/events
// @access  Private/Admin
const getAdminEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, upcoming } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, description, event_date, location, organizer, created_at, updated_at
      FROM events
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (upcoming === 'true') {
      query += ` AND event_date >= CURRENT_DATE`;
    }

    // Add pagination parameters
    query += ` ORDER BY event_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const events = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (upcoming === 'true') {
      countQuery += ` AND event_date >= CURRENT_DATE`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalEvents = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        events: transformEvents(events.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalEvents,
          pages: Math.ceil(totalEvents / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create event
// @route   POST /api/dashboard/admin/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, organizer } = req.body;

    const insertQuery = `
      INSERT INTO events (title, description, event_date, location, organizer, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const newEvent = await pool.query(insertQuery, [title, description, event_date, location, organizer]);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: newEvent.rows[0]
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update event
// @route   PUT /api/dashboard/admin/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, location, organizer } = req.body;

    const updateQuery = `
      UPDATE events 
      SET title = $1, description = $2, event_date = $3, location = $4, organizer = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const updatedEvent = await pool.query(updateQuery, [title, description, event_date, location, organizer, id]);

    if (updatedEvent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: updatedEvent.rows[0]
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/dashboard/admin/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM events WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all testimonials for admin (including unapproved)
// @route   GET /api/dashboard/admin/testimonials
// @access  Private/Admin
const getAdminTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, approved } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, student_name, content, rating, position, company, approved, created_at
      FROM testimonials
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (student_name ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (approved !== undefined && approved !== '') {
      paramCount++;
      query += ` AND approved = $${paramCount}`;
      queryParams.push(approved === 'true');
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const testimonials = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM testimonials WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (student_name ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (approved !== undefined && approved !== '') {
      countParamCount++;
      countQuery += ` AND approved = $${countParamCount}`;
      countParams.push(approved === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalTestimonials = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        testimonials: transformTestimonials(testimonials.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTestimonials,
          pages: Math.ceil(totalTestimonials / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create testimonial
// @route   POST /api/dashboard/admin/testimonials
// @access  Private/Admin
const createTestimonial = async (req, res) => {
  try {
    const { student_name, content, rating, position, company, approved = true } = req.body;

    const insertQuery = `
      INSERT INTO testimonials (student_name, content, rating, position, company, approved, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    
    const newTestimonial = await pool.query(insertQuery, [student_name, content, rating, position, company, approved]);

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: {
        testimonial: newTestimonial.rows[0]
      }
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update testimonial (approve/reject)
// @route   PUT /api/dashboard/admin/testimonials/:id
// @access  Private/Admin
const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, content, rating, position, company, approved } = req.body;

    const updateQuery = `
      UPDATE testimonials 
      SET student_name = $1, content = $2, rating = $3, position = $4, company = $5, approved = $6
      WHERE id = $7
      RETURNING *
    `;
    
    const updatedTestimonial = await pool.query(updateQuery, [student_name, content, rating, position, company, approved, id]);

    if (updatedTestimonial.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: {
        testimonial: updatedTestimonial.rows[0]
      }
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/dashboard/admin/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all campus life content for admin
// @route   GET /api/dashboard/admin/campus-life
// @access  Private/Admin
const getAdminCampusLife = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, content, image_url, category, created_at, updated_at
      FROM campus_life
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      query += ` AND category ILIKE $${paramCount}`;
      queryParams.push(`%${category}%`);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const campusLife = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM campus_life WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCampusLife = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        campus_life: transformCampusLife(campusLife.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCampusLife,
          pages: Math.ceil(totalCampusLife / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create campus life content
// @route   POST /api/dashboard/admin/campus-life
// @access  Private/Admin
const createCampusLife = async (req, res) => {
  try {
    const { title, content, image_url, category } = req.body;

    const insertQuery = `
      INSERT INTO campus_life (title, content, image_url, category, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const newCampusLife = await pool.query(insertQuery, [title, content, image_url, category]);

    res.status(201).json({
      success: true,
      message: 'Campus life content created successfully',
      data: {
        campus_life: newCampusLife.rows[0]
      }
    });
  } catch (error) {
    console.error('Create campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update campus life content
// @route   PUT /api/dashboard/admin/campus-life/:id
// @access  Private/Admin
const updateCampusLife = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url, category } = req.body;

    const updateQuery = `
      UPDATE campus_life 
      SET title = $1, content = $2, image_url = $3, category = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const updatedCampusLife = await pool.query(updateQuery, [title, content, image_url, category, id]);

    if (updatedCampusLife.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campus life content not found'
      });
    }

    res.json({
      success: true,
      message: 'Campus life content updated successfully',
      data: {
        campus_life: updatedCampusLife.rows[0]
      }
    });
  } catch (error) {
    console.error('Update campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete campus life content
// @route   DELETE /api/dashboard/admin/campus-life/:id
// @access  Private/Admin
const deleteCampusLife = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM campus_life WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campus life content not found'
      });
    }

    res.json({
      success: true,
      message: 'Campus life content deleted successfully'
    });
  } catch (error) {
    console.error('Delete campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all books for admin
// @route   GET /api/dashboard/admin/books
// @access  Private/Admin
const getAdminBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, available } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, author, isbn, category, description, cover_image, pdf_file, 
             available, genre, publication_year, file_type, file_size, created_at, updated_at
      FROM books
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (category) {
      paramCount++;
      query += ` AND category ILIKE $${paramCount}`;
      queryParams.push(`%${category}%`);
    }

    if (available !== undefined && available !== '') {
      paramCount++;
      query += ` AND available = $${paramCount}`;
      queryParams.push(available === 'true');
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const books = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM books WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR author ILIKE $${countParamCount} OR isbn ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (category) {
      countParamCount++;
      countQuery += ` AND category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
    }

    if (available !== undefined && available !== '') {
      countParamCount++;
      countQuery += ` AND available = $${countParamCount}`;
      countParams.push(available === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalBooks = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        books: transformBooks(books.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalBooks,
          pages: Math.ceil(totalBooks / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Validation for creating a book
const validateBook = (req, res, next) => {
  const { title, author } = req.body;
  if (!title || !author) {
    return res.status(400).json({
      success: false,
      message: 'Title and author are required'
    });
  }
  next();
};

// @desc    Create book
// @route   POST /api/dashboard/admin/books
// @access  Private/Admin
const createBook = async (req, res) => {
  try {
    const { 
      title, author, isbn, category, description, cover_image, pdf_file,
      available = true, genre, publication_year, file_type, file_size 
    } = req.body;

    const insertQuery = `
      INSERT INTO books (title, author, isbn, category, description, cover_image, pdf_file,
                         available, genre, publication_year, file_type, file_size, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    
    const newBook = await pool.query(insertQuery, [
      title, author, isbn, category, description, cover_image, pdf_file,
      available, genre, publication_year, file_type, file_size
    ]);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        book: newBook.rows[0]
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update book
// @route   PUT /api/dashboard/admin/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, author, isbn, category, description, cover_image, pdf_file,
      available, genre, publication_year, file_type, file_size 
    } = req.body;

    const updateQuery = `
      UPDATE books 
      SET title = $1, author = $2, isbn = $3, category = $4, description = $5, 
          cover_image = $6, pdf_file = $7, available = $8, genre = $9, 
          publication_year = $10, file_type = $11, file_size = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;
    
    const updatedBook = await pool.query(updateQuery, [
      title, author, isbn, category, description, cover_image, pdf_file,
      available, genre, publication_year, file_type, file_size, id
    ]);

    if (updatedBook.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: {
        book: updatedBook.rows[0]
      }
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/dashboard/admin/books/:id
// @access  Private/Admin
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM books WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all contact messages for admin
// @route   GET /api/dashboard/admin/contact-messages
// @access  Private/Admin
const getAdminContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, subject, message, status, replied_at, reply, created_at
      FROM contact_messages
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR subject ILIKE $${paramCount} OR message ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const messages = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contact_messages WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR email ILIKE $${countParamCount} OR subject ILIKE $${countParamCount} OR message ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalMessages = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        contact_messages: transformContactMessages(messages.rows),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admin contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reply to contact message
// @route   POST /api/dashboard/admin/contact-messages/:id/reply
// @access  Private/Admin
const replyContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required'
      });
    }

    const updateQuery = `
      UPDATE contact_messages 
      SET reply = $1, status = 'replied', replied_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const updatedMessage = await pool.query(updateQuery, [reply, id]);

    if (updatedMessage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // TODO: Send actual email to the message sender

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        contact_message: updatedMessage.rows[0]
      }
    });
  } catch (error) {
    console.error('Reply contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Archive contact message
// @route   PUT /api/dashboard/admin/contact-messages/:id/archive
// @access  Private/Admin
const archiveContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const updateQuery = `
      UPDATE contact_messages 
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const archivedMessage = await pool.query(updateQuery, [id]);

    if (archivedMessage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message archived successfully',
      data: {
        contact_message: archivedMessage.rows[0]
      }
    });
  } catch (error) {
    console.error('Archive contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/dashboard/admin/contact-messages/:id
// @access  Private/Admin
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM contact_messages WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export createValidation helper
const createValidation = validateBook;

module.exports = {
  getDashboardStats,
  getAdminNews,
  createNews,
  updateNews,
  deleteNews,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getAdminCampusLife,
  createCampusLife,
  updateCampusLife,
  deleteCampusLife,
  getAdminBooks,
  createBook,
  updateBook,
  deleteBook,
  getAdminContactMessages,
  replyContactMessage,
  archiveContactMessage,
  deleteContactMessage,
  createValidation
};

