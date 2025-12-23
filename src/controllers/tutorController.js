const { pool } = require('../config/database');

// @desc    Get all tutors
// @route   GET /api/tutors
// @access  Private
const getTutors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, specialization } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.created_at,
             tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years,
             tp.created_at as profile_created_at, tp.updated_at as profile_updated_at
      FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'tutor'
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR tp.specialization ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (specialization) {
      paramCount++;
      query += ` AND tp.specialization ILIKE $${paramCount}`;
      queryParams.push(`%${specialization}%`);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const tutors = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u INNER JOIN tutor_profiles tp ON u.id = tp.user_id WHERE u.role = \'tutor\'';
    const countParams = [];
    let countParamCount = 0;

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.first_name ILIKE $${countParamCount} OR u.last_name ILIKE $${countParamCount} OR tp.specialization ILIKE $${countParamCount})`;
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
    console.error('Get tutors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor by ID
// @route   GET /api/tutors/:id
// @access  Private
const getTutorById = async (req, res) => {
  try {
    const { id } = req.params;

    const tutorQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.created_at, u.updated_at,
             tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years,
             tp.created_at as profile_created_at, tp.updated_at as profile_updated_at
      FROM users u
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.id = $1 AND u.role = 'tutor'
    `;
    
    const tutor = await pool.query(tutorQuery, [id]);

    if (tutor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Get tutor's courses
    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      WHERE c.tutor_id = $1
      GROUP BY c.id, c.title, c.description, c.credits, c.created_at
      ORDER BY c.created_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [id]);

    // Get recent submissions for tutor's assignments
    const submissionsQuery = `
      SELECT s.id, s.content, s.submitted_at, s.score, s.feedback,
             a.title as assignment_title, a.due_date,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE c.tutor_id = $1
      ORDER BY s.submitted_at DESC
      LIMIT 10
    `;
    
    const submissions = await pool.query(submissionsQuery, [id]);

    res.json({
      success: true,
      data: {
        tutor: tutor.rows[0],
        courses: courses.rows,
        recent_submissions: submissions.rows
      }
    });
  } catch (error) {
    console.error('Get tutor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update tutor profile
// @route   PUT /api/tutors/:id
// @access  Private
const updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { tutor_id, specialization, qualification, experience_years } = req.body;

    // Check if tutor exists
    const tutorExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'tutor\'', [id]);
    if (tutorExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (tutor_id) {
      paramCount++;
      updateFields.push(`tutor_id = $${paramCount}`);
      updateValues.push(tutor_id);
    }

    if (specialization) {
      paramCount++;
      updateFields.push(`specialization = $${paramCount}`);
      updateValues.push(specialization);
    }

    if (qualification) {
      paramCount++;
      updateFields.push(`qualification = $${paramCount}`);
      updateValues.push(qualification);
    }

    if (experience_years !== undefined) {
      paramCount++;
      updateFields.push(`experience_years = $${paramCount}`);
      updateValues.push(experience_years);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`user_id = $${paramCount}`);
    updateValues.push(id);

    const updateQuery = `UPDATE tutor_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;

    const updatedTutor = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Tutor profile updated successfully',
      data: {
        tutor: updatedTutor.rows[0]
      }
    });
  } catch (error) {
    console.error('Update tutor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete tutor
// @route   DELETE /api/tutors/:id
// @access  Private/Admin
const deleteTutor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tutor exists
    const tutorExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'tutor\'', [id]);
    if (tutorExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    // Delete tutor (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Tutor deleted successfully'
    });
  } catch (error) {
    console.error('Delete tutor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor's courses
// @route   GET /api/tutors/:id/courses
// @access  Private
const getTutorCourses = async (req, res) => {
  try {
    const { id } = req.params;

    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at, c.updated_at,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments,
             COUNT(DISTINCT s.id) as total_submissions
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.tutor_id = $1
      GROUP BY c.id, c.title, c.description, c.credits, c.created_at, c.updated_at
      ORDER BY c.created_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [id]);

    res.json({
      success: true,
      data: {
        courses: courses.rows
      }
    });
  } catch (error) {
    console.error('Get tutor courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor's students
// @route   GET /api/tutors/:id/students
// @access  Private
const getTutorStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const studentsQuery = `
      SELECT DISTINCT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
             sp.student_id,
             c.title as course_title,
             e.enrolled_at
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN enrollments e ON u.id = e.student_id
      INNER JOIN courses c ON e.course_id = c.id
      WHERE c.tutor_id = $1
      ORDER BY u.first_name, u.last_name
    `;
    
    const students = await pool.query(studentsQuery, [id]);

    res.json({
      success: true,
      data: {
        students: students.rows
      }
    });
  } catch (error) {
    console.error('Get tutor students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor's submissions
// @route   GET /api/tutors/:id/submissions
// @access  Private
const getTutorSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, course_id } = req.query; // 'pending', 'graded', 'all'

    let submissionsQuery = `
      SELECT s.id, s.content, s.submitted_at, s.score, s.feedback, s.created_at,
             a.title as assignment_title, a.due_date, a.max_score,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title,
             CASE 
               WHEN s.score IS NULL THEN 'pending'
               ELSE 'graded'
             END as submission_status
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE c.tutor_id = $1
    `;
    
    const queryParams = [id];
    let paramCount = 1;

    if (status === 'pending') {
      submissionsQuery += ` AND s.score IS NULL`;
    } else if (status === 'graded') {
      submissionsQuery += ` AND s.score IS NOT NULL`;
    }

    if (course_id) {
      paramCount++;
      submissionsQuery += ` AND c.id = $${paramCount}`;
      queryParams.push(course_id);
    }

    submissionsQuery += ' ORDER BY s.submitted_at DESC';

    const submissions = await pool.query(submissionsQuery, queryParams);

    res.json({
      success: true,
      data: {
        submissions: submissions.rows
      }
    });
  } catch (error) {
    console.error('Get tutor submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get tutor dashboard statistics
// @route   GET /api/tutors/:id/dashboard-stats
// @access  Private
const getTutorDashboardStats = async (req, res) => {
  try {
    const { id } = req.params;

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT s.id) as total_submissions,
        COUNT(DISTINCT CASE WHEN s.score IS NULL THEN s.id END) as pending_submissions,
        COUNT(DISTINCT CASE WHEN s.score IS NOT NULL THEN s.id END) as graded_submissions,
        AVG(s.score) as average_score
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE c.tutor_id = $1
    `;
    
    const stats = await pool.query(statsQuery, [id]);

    // Get recent activity
    const recentActivityQuery = `
      SELECT 
        'submission' as type,
        s.submitted_at as timestamp,
        u.first_name || ' ' || u.last_name as actor,
        a.title as details
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
        c.title as details
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.id
      INNER JOIN courses c ON e.course_id = c.id
      WHERE c.tutor_id = $1
      
      ORDER BY timestamp DESC
      LIMIT 10
    `;
    
    const recentActivity = await pool.query(recentActivityQuery, [id]);

    res.json({
      success: true,
      data: {
        statistics: stats.rows[0],
        recent_activity: recentActivity.rows
      }
    });
  } catch (error) {
    console.error('Get tutor dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getTutors,
  getTutorById,
  updateTutor,
  deleteTutor,
  getTutorCourses,
  getTutorStudents,
  getTutorSubmissions,
  getTutorDashboardStats
};
