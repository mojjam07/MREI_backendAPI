const { pool } = require('../config/database');

// @desc    Get communication overview
// @route   GET /api/communication
// @access  Public
const getCommunicationOverview = async (req, res) => {
  try {
    // Get communication-specific statistics
    const overviewQuery = `
      SELECT 
        (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') as new_messages,
        (SELECT COUNT(*) FROM books WHERE available = true) as available_books,
        (SELECT COUNT(*) FROM contact_messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_messages
    `;
    
    const overview = await pool.query(overviewQuery);

    // Get recent contact messages
    const recentMessagesQuery = `
      SELECT id, name, email, subject, created_at, status
      FROM contact_messages 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const recentMessages = await pool.query(recentMessagesQuery);

    res.json({
      success: true,
      data: {
        overview: overview.rows[0],
        recent_messages: recentMessages.rows,
        resources: {
          contact: '/api/communication/contact',
          books: '/api/communication/books',
          overview: '/api/communication'
        },
        message: 'Communication API overview - focused on contact and digital library management'
      }
    });
  } catch (error) {
    console.error('Get communication overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get contact messages
// @route   GET /api/communication/contact
// @access  Private/Admin
const getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, subject, message, status, created_at, replied_at, reply
      FROM contact_messages
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const messages = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM contact_messages WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ` AND status = $1`;
      countParams.push(status);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalMessages = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalMessages,
          pages: Math.ceil(totalMessages / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create contact message
// @route   POST /api/communication/contact
// @access  Public
const createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const insertQuery = `
      INSERT INTO contact_messages (name, email, subject, message, status, created_at)
      VALUES ($1, $2, $3, $4, 'new', NOW())
      RETURNING *
    `;
    
    const newMessage = await pool.query(insertQuery, [name, email, subject, message]);

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      data: {
        message: newMessage.rows[0]
      }
    });
  } catch (error) {
    console.error('Create contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get books
// @route   GET /api/communication/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, title, author, isbn, category, description, cover_image, pdf_file, available, genre, publication_year, file_type, file_size, created_at, updated_at
      FROM books
      WHERE available = true
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
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination with correct parameter indices
    const limitParamIndex = paramCount + 1;
    const offsetParamIndex = paramCount + 2;
    query += ` ORDER BY title ASC LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const books = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM books WHERE available = true';
    const countParams = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (title ILIKE $${countParamCount} OR author ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalBooks = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        books: books.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalBooks,
          pages: Math.ceil(totalBooks / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create book
// @route   POST /api/communication/books
// @access  Private/Admin
const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, description, genre, publication_year } = req.body;
    
    // Handle file uploads if present
    let cover_image = null;
    let pdf_file = null;
    let file_type = 'pdf';
    let file_size = null;

    if (req.files) {
      if (req.files.cover_image) {
        cover_image = `/uploads/covers/${req.files.cover_image[0].filename}`;
      }
      if (req.files.pdf_file) {
        const pdfFile = req.files.pdf_file[0];
        pdf_file = `/uploads/documents/${pdfFile.filename}`;
        file_type = pdfFile.mimetype.includes('word') ? 'doc' : 'pdf';
        file_size = pdfFile.size;
      }
    }

    const insertQuery = `
      INSERT INTO books (title, author, isbn, category, description, cover_image, pdf_file, genre, publication_year, file_type, file_size, available, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
      RETURNING *
    `;
    
    const newBook = await pool.query(insertQuery, [
      title, author, isbn, category, description, 
      cover_image, pdf_file, genre, publication_year, file_type, file_size
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
// @route   PUT /api/communication/books/:id
// @access  Private/Admin
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, description, genre, publication_year, available } = req.body;

    // First, get current book data
    const currentBookQuery = 'SELECT * FROM books WHERE id = $1';
    const currentBook = await pool.query(currentBookQuery, [id]);
    
    if (currentBook.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Handle file uploads if present
    let cover_image = currentBook.rows[0].cover_image;
    let pdf_file = currentBook.rows[0].pdf_file;
    let file_type = currentBook.rows[0].file_type;
    let file_size = currentBook.rows[0].file_size;

    if (req.files) {
      if (req.files.cover_image) {
        cover_image = `/uploads/covers/${req.files.cover_image[0].filename}`;
      }
      if (req.files.pdf_file) {
        const pdfFile = req.files.pdf_file[0];
        pdf_file = `/uploads/documents/${pdfFile.filename}`;
        file_type = pdfFile.mimetype.includes('word') ? 'doc' : 'pdf';
        file_size = pdfFile.size;
      }
    }

    const updateQuery = `
      UPDATE books 
      SET title = $1, author = $2, isbn = $3, category = $4, description = $5, 
          cover_image = $6, pdf_file = $7, genre = $8, publication_year = $9, 
          file_type = $10, file_size = $11, available = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;
    
    const updatedBook = await pool.query(updateQuery, [
      title, author, isbn, category, description, 
      cover_image, pdf_file, genre, publication_year, 
      file_type, file_size, available, id
    ]);

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
// @route   DELETE /api/communication/books/:id
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

// @desc    Get dashboard stats
// @route   GET /api/communication/dashboard-stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as total_tutors,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM assignments) as total_assignments,
        (SELECT COUNT(*) FROM submissions) as total_submissions,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments,
        (SELECT COUNT(*) FROM news WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as news_this_week,
        (SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE AND event_date <= CURRENT_DATE + INTERVAL '7 days') as events_this_week,
        (SELECT COUNT(*) FROM contact_messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as messages_this_week
    `;
    
    const stats = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0]
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

// @desc    Get home content (news and events)
// @route   GET /api/communication/home-content
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
  getCommunicationOverview,
  getContactMessages,
  createContactMessage,
  getBooks,
  createBook,
  updateBook,
  deleteBook
};
