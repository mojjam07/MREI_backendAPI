const { pool } = require('../config/database');

// @desc    Get student dashboard
// @route   GET /api/dashboard/student
// @access  Private/Student
const getStudentDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student basic info
    const studentInfoQuery = `
      SELECT u.first_name, u.last_name, sp.student_id
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1
    `;
    
    const studentInfo = await pool.query(studentInfoQuery, [userId]);

    if (studentInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get enrolled courses
    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id,
             e.enrolled_at
      FROM courses c
      INNER JOIN enrollments e ON c.id = e.course_id
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [userId]);

    // Get upcoming assignments
    const upcomingAssignmentsQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score,
             c.title as course_title,
             CASE 
               WHEN s.id IS NOT NULL THEN 'submitted'
               ELSE 'pending'
             END as submission_status
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = e.student_id
      WHERE e.student_id = $1 AND a.due_date >= CURRENT_DATE
      ORDER BY a.due_date ASC
      LIMIT 5
    `;
    
    const upcomingAssignments = await pool.query(upcomingAssignmentsQuery, [userId]);

    // Get recent submissions
    const recentSubmissionsQuery = `
      SELECT s.id, s.submitted_at, s.score, s.feedback,
             a.title as assignment_title,
             c.title as course_title
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = $1
      ORDER BY s.submitted_at DESC
      LIMIT 5
    `;
    
    const recentSubmissions = await pool.query(recentSubmissionsQuery, [userId]);

    // Get attendance summary
    const attendanceQuery = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_percentage
      FROM attendance
      WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const attendance = await pool.query(attendanceQuery, [userId]);

    // Get grade summary
    const gradeSummaryQuery = `
      SELECT 
        COUNT(s.id) as total_submissions,
        AVG(s.score::numeric) as average_score,
        COUNT(CASE WHEN s.score IS NOT NULL THEN 1 END) as graded_submissions,
        COUNT(CASE WHEN s.score >= a.max_score * 0.8 THEN 1 END) as excellent_grades
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = $1 AND s.score IS NOT NULL
    `;
    
    const gradeSummary = await pool.query(gradeSummaryQuery, [userId]);

    res.json({
      success: true,
      data: {
        student_info: studentInfo.rows[0],
        enrolled_courses: courses.rows,
        upcoming_assignments: upcomingAssignments.rows,
        recent_submissions: recentSubmissions.rows,
        attendance_summary: attendance.rows[0],
        grade_summary: gradeSummary.rows[0]
      }
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor dashboard
// @route   GET /api/dashboard/tutor
// @access  Private/Tutor
const getTutorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tutor basic info
    const tutorInfoQuery = `
      SELECT u.first_name, u.last_name, tp.tutor_id, tp.specialization
      FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.id = $1
    `;
    
    const tutorInfo = await pool.query(tutorInfoQuery, [userId]);

    if (tutorInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor profile not found'
      });
    }

    // Get courses with enrollment counts
    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments,
             COUNT(DISTINCT s.id) as total_submissions
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.tutor_id = $1
      GROUP BY c.id, c.title, c.description, c.credits, c.created_at
      ORDER BY c.created_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [userId]);

    // Get pending submissions
    const pendingSubmissionsQuery = `
      SELECT s.id, s.content, s.submitted_at,
             a.title as assignment_title, a.due_date, a.max_score,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE c.tutor_id = $1 AND s.score IS NULL
      ORDER BY s.submitted_at ASC
      LIMIT 10
    `;
    
    const pendingSubmissions = await pool.query(pendingSubmissionsQuery, [userId]);

    // Get upcoming assignments due
    const upcomingAssignmentsQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score,
             c.title as course_title,
             COUNT(s.id) as submission_count,
             COUNT(CASE WHEN s.score IS NOT NULL THEN 1 END) as graded_count
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.tutor_id = $1 AND a.due_date >= CURRENT_DATE AND a.due_date <= CURRENT_DATE + INTERVAL '7 days'
      GROUP BY a.id, a.title, a.description, a.due_date, a.max_score, c.title
      ORDER BY a.due_date ASC
    `;
    
    const upcomingAssignments = await pool.query(upcomingAssignmentsQuery, [userId]);

    // Get recent activity
    const recentActivityQuery = `
      SELECT 
        'submission' as type,
        s.submitted_at as timestamp,
        u.first_name || ' ' || u.last_name as actor,
        a.title as details,
        c.title as course
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE c.tutor_id = $1
      
      UNION ALL
      
      SELECT 
        'enrollment' as type,
        e.enrolled_at as timestamp,
        u.first_name || ' ' || u.last_name as actor,
        'enrolled in ' || c.title as details,
        c.title as course
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.id
      INNER JOIN courses c ON e.course_id = c.id
      WHERE c.tutor_id = $1
      
      ORDER BY timestamp DESC
      LIMIT 10
    `;
    
    const recentActivity = await pool.query(recentActivityQuery, [userId]);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.score IS NULL THEN s.id END) as pending_submissions,
        ROUND(AVG(s.score::numeric), 2) as average_score
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.tutor_id = $1
    `;
    
    const stats = await pool.query(statsQuery, [userId]);

    res.json({
      success: true,
      data: {
        tutor_info: tutorInfo.rows[0],
        courses: courses.rows,
        pending_submissions: pendingSubmissions.rows,
        upcoming_assignments: upcomingAssignments.rows,
        recent_activity: recentActivity.rows,
        statistics: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get tutor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



// @desc    Get dashboard statistics
// @route   GET /api/dashboard-stats
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
        (SELECT COUNT(*) FROM enrollments) as total_enrollments
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

// @desc    Get system statistics for admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Get comprehensive statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as active_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as tutors,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM news WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as news_count,
        (SELECT COUNT(*) FROM testimonials WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as testimonials_count,
        (SELECT COUNT(*) FROM contact_messages WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as messages_count,
        ROUND(
          (SELECT COUNT(*) * 100.0 / NULLIF((
            SELECT COUNT(*) FROM assignments
          ), 0)
          FROM submissions s
          INNER JOIN assignments a ON s.assignment_id = a.id
          WHERE s.score >= a.max_score * 0.8
          ), 2
        ) as success_rate
    `;
    
    const stats = await pool.query(statsQuery);

    // Get recent activities
    const recentActivitiesQuery = `
      SELECT 
        'news' as type,
        title,
        author,
        created_at
      FROM news
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'event' as type,
        title,
        organizer as author,
        created_at
      FROM events
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'testimonial' as type,
        student_name as title,
        author_title as author,
        created_at
      FROM testimonials
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const recentActivities = await pool.query(recentActivitiesQuery);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0],
        recent_activities: recentActivities.rows
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// NEWS MANAGEMENT ENDPOINTS

// @desc    Get all news
// @route   GET /api/admin/news
// @access  Private/Admin
const getAllNews = async (req, res) => {
  try {
    const newsQuery = `
      SELECT * FROM news
      ORDER BY created_at DESC
    `;
    
    const news = await pool.query(newsQuery);

    res.json({
      success: true,
      data: news.rows
    });
  } catch (error) {
    console.error('Get all news error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create news
// @route   POST /api/admin/news
// @access  Private/Admin
const createNews = async (req, res) => {
  try {
    const { title, content, category, author, published, image } = req.body;

    const newsQuery = `
      INSERT INTO news (title, content, category, author, published, image)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const news = await pool.query(newsQuery, [
      title, content, category, author, published, image
    ]);

    res.status(201).json({
      success: true,
      data: news.rows[0]
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
// @route   PUT /api/admin/news/:id
// @access  Private/Admin
const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, author, published, image } = req.body;

    const newsQuery = `
      UPDATE news 
      SET title = $1, content = $2, category = $3, author = $4, published = $5, image = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const news = await pool.query(newsQuery, [
      title, content, category, author, published, image, id
    ]);

    if (news.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      data: news.rows[0]
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
// @route   DELETE /api/admin/news/:id
// @access  Private/Admin
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM news WHERE id = $1 RETURNING *';
    const deletedNews = await pool.query(deleteQuery, [id]);

    if (deletedNews.rows.length === 0) {
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

// EVENTS MANAGEMENT ENDPOINTS

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private/Admin
const getAllEvents = async (req, res) => {
  try {
    const eventsQuery = `
      SELECT * FROM events
      ORDER BY event_date DESC
    `;
    
    const events = await pool.query(eventsQuery);

    res.json({
      success: true,
      data: events.rows
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create event
// @route   POST /api/admin/events
// @access  Private/Admin
const createEvent = async (req, res) => {
  try {
    const { title, description, event_date, location, organizer, video_id } = req.body;

    const eventQuery = `
      INSERT INTO events (title, description, event_date, location, organizer, video_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const event = await pool.query(eventQuery, [
      title, description, event_date, location, organizer, video_id
    ]);

    res.status(201).json({
      success: true,
      data: event.rows[0]
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
// @route   PUT /api/admin/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, location, organizer, video_id } = req.body;

    const eventQuery = `
      UPDATE events 
      SET title = $1, description = $2, event_date = $3, location = $4, organizer = $5, video_id = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;
    
    const event = await pool.query(eventQuery, [
      title, description, event_date, location, organizer, video_id, id
    ]);

    if (event.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event.rows[0]
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
// @route   DELETE /api/admin/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM events WHERE id = $1 RETURNING *';
    const deletedEvent = await pool.query(deleteQuery, [id]);

    if (deletedEvent.rows.length === 0) {
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

// TESTIMONIALS MANAGEMENT ENDPOINTS

// @desc    Get all testimonials
// @route   GET /api/admin/testimonials
// @access  Private/Admin
const getAllTestimonials = async (req, res) => {
  try {
    const testimonialsQuery = `
      SELECT * FROM testimonials
      ORDER BY created_at DESC
    `;
    
    const testimonials = await pool.query(testimonialsQuery);

    res.json({
      success: true,
      data: testimonials.rows
    });
  } catch (error) {
    console.error('Get all testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create testimonial
// @route   POST /api/admin/testimonials
// @access  Private/Admin
const createTestimonial = async (req, res) => {
  try {
    const { student_name, content, rating, position, company, approved, author, author_title, image } = req.body;

    const testimonialQuery = `
      INSERT INTO testimonials (student_name, content, rating, position, company, approved, author, author_title, image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const testimonial = await pool.query(testimonialQuery, [
      student_name, content, rating, position, company, approved, author, author_title, image
    ]);

    res.status(201).json({
      success: true,
      data: testimonial.rows[0]
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update testimonial
// @route   PUT /api/admin/testimonials/:id
// @access  Private/Admin
const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_name, content, rating, position, company, approved, author, author_title, image } = req.body;

    const testimonialQuery = `
      UPDATE testimonials 
      SET student_name = $1, content = $2, rating = $3, position = $4, company = $5, approved = $6, author = $7, author_title = $8, image = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    
    const testimonial = await pool.query(testimonialQuery, [
      student_name, content, rating, position, company, approved, author, author_title, image, id
    ]);

    if (testimonial.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      data: testimonial.rows[0]
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
// @route   DELETE /api/admin/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM testimonials WHERE id = $1 RETURNING *';
    const deletedTestimonial = await pool.query(deleteQuery, [id]);

    if (deletedTestimonial.rows.length === 0) {
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

// @desc    Approve testimonial
// @route   PUT /api/admin/testimonials/:id/approve
// @access  Private/Admin
const approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const approveQuery = `
      UPDATE testimonials 
      SET approved = TRUE
      WHERE id = $1
      RETURNING *
    `;
    
    const testimonial = await pool.query(approveQuery, [id]);

    if (testimonial.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      data: testimonial.rows[0],
      message: 'Testimonial approved successfully'
    });
  } catch (error) {
    console.error('Approve testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle testimonial approval
// @route   PUT /api/admin/testimonials/:id/toggle-approval
// @access  Private/Admin
const toggleTestimonialApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const toggleQuery = `
      UPDATE testimonials 
      SET approved = NOT approved
      WHERE id = $1
      RETURNING *
    `;
    
    const testimonial = await pool.query(toggleQuery, [id]);

    if (testimonial.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    const action = testimonial.rows[0].approved ? 'approved' : 'unapproved';

    res.json({
      success: true,
      data: testimonial.rows[0],
      message: `Testimonial ${action} successfully`
    });
  } catch (error) {
    console.error('Toggle testimonial approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// CAMPUS LIFE MANAGEMENT ENDPOINTS

// @desc    Get all campus life content
// @route   GET /api/admin/campus-life
// @access  Private/Admin
const getAllCampusLife = async (req, res) => {
  try {
    const campusLifeQuery = `
      SELECT * FROM campus_life
      ORDER BY created_at DESC
    `;
    
    const campusLife = await pool.query(campusLifeQuery);

    res.json({
      success: true,
      data: campusLife.rows
    });
  } catch (error) {
    console.error('Get all campus life error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create campus life content
// @route   POST /api/admin/campus-life
// @access  Private/Admin
const createCampusLife = async (req, res) => {
  try {
    const { title, content, category, image_url } = req.body;

    const campusLifeQuery = `
      INSERT INTO campus_life (title, content, category, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const campusLife = await pool.query(campusLifeQuery, [
      title, content, category, image_url
    ]);

    res.status(201).json({
      success: true,
      data: campusLife.rows[0]
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
// @route   PUT /api/admin/campus-life/:id
// @access  Private/Admin
const updateCampusLife = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, image_url } = req.body;

    const campusLifeQuery = `
      UPDATE campus_life 
      SET title = $1, content = $2, category = $3, image_url = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const campusLife = await pool.query(campusLifeQuery, [
      title, content, category, image_url, id
    ]);

    if (campusLife.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Campus life content not found'
      });
    }

    res.json({
      success: true,
      data: campusLife.rows[0]
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
// @route   DELETE /api/admin/campus-life/:id
// @access  Private/Admin
const deleteCampusLife = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM campus_life WHERE id = $1 RETURNING *';
    const deletedCampusLife = await pool.query(deleteQuery, [id]);

    if (deletedCampusLife.rows.length === 0) {
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

// CONTACT MESSAGES MANAGEMENT ENDPOINTS

// @desc    Get all contact messages
// @route   GET /api/admin/contact-messages
// @access  Private/Admin
const getAllContactMessages = async (req, res) => {
  try {
    const messagesQuery = `
      SELECT * FROM contact_messages
      ORDER BY created_at DESC
    `;
    
    const messages = await pool.query(messagesQuery);

    res.json({
      success: true,
      data: messages.rows
    });
  } catch (error) {
    console.error('Get all contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update contact message
// @route   PUT /api/admin/contact-messages/:id
// @access  Private/Admin
const updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    const updateQuery = `
      UPDATE contact_messages 
      SET status = $1, reply = $2, replied_at = CASE WHEN $1 = 'replied' THEN CURRENT_TIMESTAMP ELSE replied_at END
      WHERE id = $3
      RETURNING *
    `;
    
    const message = await pool.query(updateQuery, [status, reply, id]);

    if (message.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data: message.rows[0]
    });
  } catch (error) {
    console.error('Update contact message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark contact message as read
// @route   PUT /api/admin/contact-messages/:id/read
// @access  Private/Admin
const markContactMessageRead = async (req, res) => {
  try {
    const { id } = req.params;

    const markReadQuery = `
      UPDATE contact_messages 
      SET status = 'read'
      WHERE id = $1
      RETURNING *
    `;
    
    const message = await pool.query(markReadQuery, [id]);

    if (message.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.json({
      success: true,
      data: message.rows[0],
      message: 'Contact message marked as read'
    });
  } catch (error) {
    console.error('Mark contact message read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/admin/contact-messages/:id
// @access  Private/Admin
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM contact_messages WHERE id = $1 RETURNING *';
    const deletedMessage = await pool.query(deleteQuery, [id]);

    if (deletedMessage.rows.length === 0) {
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

module.exports = {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard,
  getDashboardStats,
  // Admin management functions
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  approveTestimonial,
  toggleTestimonialApproval,
  getAllCampusLife,
  createCampusLife,
  updateCampusLife,
  deleteCampusLife,
  getAllContactMessages,
  updateContactMessage,
  markContactMessageRead,
  deleteContactMessage
};
