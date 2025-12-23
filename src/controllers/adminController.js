const { pool } = require('../config/database');

// @desc    Get all students for admin management
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login,
             sp.student_id, sp.date_of_birth, sp.address, sp.emergency_contact,
             COUNT(DISTINCT e.course_id) as enrolled_courses,
             COUNT(DISTINCT s.id) as total_submissions,
             AVG(s.score::numeric) as average_score
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN enrollments e ON u.id = e.student_id
      LEFT JOIN submissions s ON u.id = s.student_id
      WHERE u.role = 'student'
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR sp.student_id ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination
    paramCount++;
    query += ` GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login, sp.student_id, sp.date_of_birth, sp.address, sp.emergency_contact`;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const students = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u INNER JOIN student_profiles sp ON u.id = sp.user_id WHERE u.role = \'student\'';
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1 OR u.email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
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
    console.error('Get admin students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all tutors for admin management
// @route   GET /api/admin/tutors
// @access  Private/Admin
const getTutors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login,
             tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years,
             COUNT(DISTINCT c.id) as total_courses,
             COUNT(DISTINCT e.student_id) as total_students,
             COUNT(DISTINCT a.id) as total_assignments
      FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN courses c ON u.id = c.tutor_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      WHERE u.role = 'tutor'
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR tp.tutor_id ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (specialization) {
      paramCount++;
      query += ` AND tp.specialization ILIKE $${paramCount}`;
      queryParams.push(`%${specialization}%`);
    }

    // Add pagination
    paramCount++;
    query += ` GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login, tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years`;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const tutors = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u INNER JOIN tutor_profiles tp ON u.id = tp.user_id WHERE u.role = \'tutor\'';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.first_name ILIKE $${countParamCount} OR u.last_name ILIKE $${countParamCount} OR tp.tutor_id ILIKE $${countParamCount} OR u.email ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    if (specialization) {
      countParamCount++;
      countQuery += ` AND tp.specialization ILIKE $${countParamCount}`;
      countParams.push(`%${specialization}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
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
    console.error('Get admin tutors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update student status
// @route   PUT /api/admin/students/:id/status
// @access  Private/Admin
const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'active', 'inactive', 'suspended'

    // Check if student exists
    const studentExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'student\'', [id]);
    if (studentExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update student status (you might want to add a status field to the users table)
    const updateQuery = `
      UPDATE users 
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, updated_at
    `;
    
    const updatedStudent = await pool.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Student status updated successfully',
      data: {
        student: updatedStudent.rows[0]
      }
    });
  } catch (error) {
    console.error('Update student status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update tutor status
// @route   PUT /api/admin/tutors/:id/status
// @access  Private/Admin
const updateTutorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status: 'active', 'inactive', 'suspended'

    // Check if tutor exists
    const tutorExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'tutor\'', [id]);
    if (tutorExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Update tutor status
    const updateQuery = `
      UPDATE users 
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, updated_at
    `;
    
    const updatedTutor = await pool.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Tutor status updated successfully',
      data: {
        tutor: updatedTutor.rows[0]
      }
    });
  } catch (error) {
    console.error('Update tutor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get system overview
// @route   GET /api/admin/overview
// @access  Private/Admin
const getSystemOverview = async (req, res) => {
  try {
    const overviewQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as total_tutors,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM assignments) as total_assignments,
        (SELECT COUNT(*) FROM submissions) as total_submissions,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments,
        (SELECT COUNT(*) FROM news) as total_news,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM contact_messages) as total_messages,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_this_month,
        (SELECT COUNT(*) FROM submissions WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days') as submissions_this_month,
        (SELECT COUNT(*) FROM enrollments WHERE enrolled_at >= CURRENT_DATE - INTERVAL '30 days') as enrollments_this_month
    `;
    
    const overview = await pool.query(overviewQuery);

    // Get recent activities
    const recentActivitiesQuery = `
      SELECT 
        'user_registration' as type,
        u.created_at as timestamp,
        u.first_name || ' ' || u.last_name as description,
        u.role
      FROM users u
      WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'course_creation' as type,
        c.created_at as timestamp,
        'Course: ' || c.title as description,
        'course'
      FROM courses c
      WHERE c.created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'submission' as type,
        s.submitted_at as timestamp,
        'Submission by ' || u.first_name || ' ' || u.last_name as description,
        'submission'
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      WHERE s.submitted_at >= CURRENT_DATE - INTERVAL '7 days'
      
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    
    const recentActivities = await pool.query(recentActivitiesQuery);

    // Get course performance
    const coursePerformanceQuery = `
      SELECT c.id, c.title, c.created_at,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments,
             COUNT(DISTINCT s.id) as total_submissions,
             ROUND(AVG(s.score::numeric), 2) as average_score,
             COUNT(CASE WHEN s.score >= a.max_score * 0.8 THEN 1 END) as excellent_submissions
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      GROUP BY c.id, c.title, c.created_at
      ORDER BY enrolled_students DESC
      LIMIT 10
    `;
    
    const coursePerformance = await pool.query(coursePerformanceQuery);

    res.json({
      success: true,
      data: {
        overview: overview.rows[0],
        recent_activities: recentActivities.rows,
        course_performance: coursePerformance.rows
      }
    });
  } catch (error) {
    console.error('Get system overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const statsQuery = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as student_registrations,
        COUNT(CASE WHEN role = 'tutor' THEN 1 END) as tutor_registrations,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_registrations,
        COUNT(*) as total_registrations
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;
    
    const stats = await pool.query(statsQuery);

    res.json({
      success: true,
      data: {
        statistics: stats.rows,
        period: `${period} days`
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Moderate content
// @route   PUT /api/admin/moderate/:type/:id
// @access  Private/Admin
const moderateContent = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'flag'

    let tableName;
    switch (type) {
      case 'news':
        tableName = 'news';
        break;
      case 'testimonial':
        tableName = 'testimonials';
        break;
      case 'event':
        tableName = 'events';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid content type'
        });
    }

    let updateField;
    if (type === 'news') {
      updateField = 'published';
    } else if (type === 'testimonial') {
      updateField = 'approved';
    }

    const updateQuery = `
      UPDATE ${tableName} 
      SET ${updateField} = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const updatedContent = await pool.query(updateQuery, [action === 'approve', id]);

    if (updatedContent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: `Content ${action}d successfully`,
      data: {
        content: updatedContent.rows[0]
      }
    });
  } catch (error) {
    console.error('Moderate content error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getStudents,
  getTutors,
  updateStudentStatus,
  updateTutorStatus,
  getSystemOverview,
  getUserStats,
  moderateContent
};
