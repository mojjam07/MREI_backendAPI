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

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    // Get system statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as total_tutors,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM courses) as total_courses,
        (SELECT COUNT(*) FROM assignments) as total_assignments,
        (SELECT COUNT(*) FROM submissions) as total_submissions,
        (SELECT COUNT(*) FROM enrollments) as total_enrollments,
        (SELECT COUNT(*) FROM news WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as news_this_month,
        (SELECT COUNT(*) FROM contact_messages WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as messages_this_month
    `;
    
    const stats = await pool.query(statsQuery);

    // Get recent registrations
    const recentRegistrationsQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.created_at,
             CASE WHEN sp.student_id IS NOT NULL THEN sp.student_id
                  WHEN tp.tutor_id IS NOT NULL THEN tp.tutor_id
                  ELSE NULL END as profile_id
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY u.created_at DESC
      LIMIT 10
    `;
    
    const recentRegistrations = await pool.query(recentRegistrationsQuery);

    // Get recent submissions
    const recentSubmissionsQuery = `
      SELECT s.id, s.submitted_at, s.score,
             a.title as assignment_title,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE s.submitted_at >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;
    
    const recentSubmissions = await pool.query(recentSubmissionsQuery);

    // Get course enrollment stats
    const courseStatsQuery = `
      SELECT c.id, c.title, c.created_at,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments,
             COUNT(DISTINCT s.id) as total_submissions
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      GROUP BY c.id, c.title, c.created_at
      ORDER BY enrolled_students DESC, c.created_at DESC
      LIMIT 10
    `;
    
    const courseStats = await pool.query(courseStatsQuery);

    // Get pending contact messages
    const pendingMessagesQuery = `
      SELECT id, name, email, subject, message, created_at
      FROM contact_messages
      WHERE status = 'new'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const pendingMessages = await pool.query(pendingMessagesQuery);

    // Get system activity summary
    const activitySummaryQuery = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as registrations
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('day', submitted_at) as date,
        COUNT(*) as submissions
      FROM submissions
      WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', submitted_at)
      ORDER BY date DESC
    `;
    
    const activitySummary = await pool.query(activitySummaryQuery);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0],
        recent_registrations: recentRegistrations.rows,
        recent_submissions: recentSubmissions.rows,
        course_statistics: courseStats.rows,
        pending_messages: pendingMessages.rows,
        activity_summary: activitySummary.rows
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

module.exports = {
  getStudentDashboard,
  getTutorDashboard,
  getAdminDashboard,
  getDashboardStats
};
