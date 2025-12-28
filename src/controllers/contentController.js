const { pool } = require('../config/database');

// @desc    Get content overview
// @route   GET /api/content
// @access  Public
const getContentOverview = async (req, res) => {
  try {
    // Get overview statistics and counts
    const overviewQuery = `
      SELECT 
        (SELECT COUNT(*) FROM news WHERE published = true) as total_news,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events,
        (SELECT COUNT(*) FROM testimonials WHERE approved = true) as approved_testimonials,
        (SELECT COUNT(*) FROM campus_life) as campus_life_content,
        (SELECT COUNT(*) FROM books WHERE available = true) as available_books,
        (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') as new_messages
    `;
    
    const overview = await pool.query(overviewQuery);

    // Get recent items for preview
    const recentNewsQuery = `
      SELECT id, title, created_at 
      FROM news 
      WHERE published = true 
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    
    const upcomingEventsQuery = `
      SELECT id, title, event_date, location 
      FROM events 
      WHERE event_date >= CURRENT_DATE 
      ORDER BY event_date ASC 
      LIMIT 3
    `;
    
    const topTestimonialsQuery = `
      SELECT id, student_name, content, rating 
      FROM testimonials 
      WHERE approved = true 
      ORDER BY rating DESC, created_at DESC 
      LIMIT 2
    `;

    const [newsResult, eventsResult, testimonialsResult] = await Promise.all([
      pool.query(recentNewsQuery),
      pool.query(upcomingEventsQuery),
      pool.query(topTestimonialsQuery)
    ]);

    res.json({
      success: true,
      data: {
        overview: overview.rows[0],
        recent_news: newsResult.rows,
        upcoming_events: eventsResult.rows,
        featured_testimonials: testimonialsResult.rows,
        resources: {
          stats: '/api/content/stats',
          news: '/api/content/news',
          events: '/api/content/events', 
          testimonials: '/api/content/testimonials',
          campus_life: '/api/content/campus-life',
          home: '/api/content/home'
        },
        message: 'Content API overview - use specific endpoints for detailed data'
      }
    });
  } catch (error) {
    console.error('Get content overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all statistics
// @route   GET /api/content/stats
// @access  Public
const getStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as active_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as tutors,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM assignments) as total_assignments,
        (SELECT COUNT(*) FROM submissions) as total_submissions,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments,
        (SELECT COUNT(*) FROM news WHERE created_at >= NOW() - INTERVAL '30 days') as recent_news,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE) as upcoming_events,
        (SELECT COUNT(*) FROM contact_messages WHERE created_at >= NOW() - INTERVAL '7 days') as recent_messages,
        CASE 
          WHEN (SELECT COUNT(*) FROM submissions) > 0 
          THEN ROUND((SELECT COUNT(*) FROM submissions WHERE score >= 70) * 100.0 / (SELECT COUNT(*) FROM submissions), 0)
          ELSE 95 
        END as success_rate
    `;
    
    const stats = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all news
// @route   GET /api/content/news
// @access  Public
const getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, content, category, author, created_at, updated_at, published
      FROM news
      WHERE published = true
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category ILIKE $${paramCount}`;
      queryParams.push(`%${category}%`);
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination parameters
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const news = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM news WHERE published = true';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR content ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalNews = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        news: news.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalNews,
          pages: Math.ceil(totalNews / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get news by ID
// @route   GET /api/content/news/:id
// @access  Public
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const newsQuery = `
      SELECT id, title, content, category, author, created_at, updated_at, published
      FROM news
      WHERE id = $1 AND published = true
    `;
    
    const news = await pool.query(newsQuery, [id]);

    if (news.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      data: {
        news: news.rows[0]
      }
    });
  } catch (error) {
    console.error('Get news by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create news
// @route   POST /api/content/news
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
// @route   PUT /api/content/news/:id
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
// @route   DELETE /api/content/news/:id
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

// @desc    Get all events
// @route   GET /api/content/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, upcoming, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, description, event_date, location, organizer, created_at, updated_at
      FROM events
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (upcoming === 'true') {
      query += ` AND event_date >= CURRENT_DATE`;
    }

    if (search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination parameters
    query += ` ORDER BY event_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const events = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM events WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (upcoming === 'true') {
      countQuery += ` AND event_date >= CURRENT_DATE`;
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalEvents = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        events: events.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalEvents,
          pages: Math.ceil(totalEvents / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create event
// @route   POST /api/content/events
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

// @desc    Get all testimonials
// @route   GET /api/content/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, student_name, content, rating, position, company, created_at, approved
      FROM testimonials
      WHERE approved = true
    `;
    
    const queryParams = [];

    if (rating) {
      query += ` AND rating >= $1`;
      queryParams.push(rating);
    }

    // Add pagination
    query += ` ORDER BY rating DESC, created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const testimonials = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM testimonials WHERE approved = true';
    const countParams = [];

    if (rating) {
      countQuery += ` AND rating >= $1`;
      countParams.push(rating);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalTestimonials = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        testimonials: testimonials.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalTestimonials,
          pages: Math.ceil(totalTestimonials / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create testimonial
// @route   POST /api/content/testimonials
// @access  Public
const createTestimonial = async (req, res) => {
  try {
    const { student_name, content, rating, position, company, approved = false } = req.body;

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

// @desc    Get campus life content
// @route   GET /api/content/campus-life
// @access  Public
const getCampusLife = async (req, res) => {
  try {
    const { limit } = req.query;
    
    let query = `
      SELECT id, title, content, image_url, category, created_at, updated_at
      FROM campus_life
      ORDER BY created_at DESC
    `;
    
    const queryParams = [];
    
    // Add limit if specified
    if (limit) {
      query += ` LIMIT $1`;
      queryParams.push(parseInt(limit));
    }
    
    const campusLife = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        campus_life: campusLife.rows
      }
    });
  } catch (error) {
    console.error('Get campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get optimized home content
// @route   GET /api/content/home
// @access  Public
const getHomeContent = async (req, res) => {
  try {
    // Get recent news (last 30 days)
    const newsQuery = `
      SELECT id, title, content, created_at, updated_at
      FROM news
      WHERE published = true
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    // Get upcoming events (next 30 days)
    const eventsQuery = `
      SELECT id, title, description as content, event_date, location, created_at
      FROM events
      WHERE event_date >= CURRENT_DATE
      ORDER BY event_date ASC
      LIMIT 5
    `;

    // Get testimonials
    const testimonialsQuery = `
      SELECT id, student_name as name, content, rating, position, company
      FROM testimonials
      WHERE approved = true
      ORDER BY rating DESC, created_at DESC
      LIMIT 1
    `;

    // Get campus life content
    const campusLifeQuery = `
      SELECT id, title, content, image_url, category
      FROM campus_life
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const [newsResult, eventsResult, testimonialsResult, campusLifeResult] = await Promise.all([
      pool.query(newsQuery),
      pool.query(eventsQuery),
      pool.query(testimonialsQuery),
      pool.query(campusLifeQuery)
    ]);

    // Format the data to match frontend expectations
    const homeContent = {
      news: newsResult.rows.map(item => ({
        ...item,
        image: `/api/placeholder/400/250` // Default image
      })),
      events: eventsResult.rows.map(item => ({
        ...item,
        video_id: 'dQw4w9WgXcQ' // Default YouTube video
      })),
      testimonials: testimonialsResult.rows,
      campus_life: campusLifeResult.rows.map(item => ({
        ...item,
        image: item.image_url || '/api/placeholder/300/180'
      }))
    };

    res.json({
      success: true,
      data: homeContent
    });
  } catch (error) {
    console.error('Get home content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getContentOverview,
  getStats,
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getEvents,
  createEvent,
  getTestimonials,
  createTestimonial,
  getCampusLife,
  getHomeContent
};
