const { pool } = require('../config/database');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.created_at,
             sp.student_id, sp.date_of_birth, sp.address, sp.emergency_contact,
             sp.created_at as profile_created_at, sp.updated_at as profile_updated_at
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.role = 'student'
    `;
    
    const queryParams = [];

    if (search) {
      query += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const students = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u INNER JOIN student_profiles sp ON u.id = sp.user_id WHERE u.role = \'student\'';
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_id ILIKE $1)`;
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
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const studentQuery = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.created_at, u.updated_at,
             sp.student_id, sp.date_of_birth, sp.address, sp.emergency_contact,
             sp.created_at as profile_created_at, sp.updated_at as profile_updated_at
      FROM users u
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1 AND u.role = 'student'
    `;
    
    const student = await pool.query(studentQuery, [id]);

    if (student.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's courses
    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id
      FROM courses c
      INNER JOIN enrollments e ON c.id = e.course_id
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE e.student_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [id]);

    // Get recent assignments
    const assignmentsQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score, a.created_at,
             c.title as course_title
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY a.due_date ASC
      LIMIT 5
    `;
    
    const assignments = await pool.query(assignmentsQuery, [id]);

    res.json({
      success: true,
      data: {
        student: student.rows[0],
        courses: courses.rows,
        recent_assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, date_of_birth, address, emergency_contact } = req.body;

    // Check if student exists
    const studentExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'student\'', [id]);
    if (studentExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (student_id) {
      paramCount++;
      updateFields.push(`student_id = $${paramCount}`);
      updateValues.push(student_id);
    }

    if (date_of_birth) {
      paramCount++;
      updateFields.push(`date_of_birth = $${paramCount}`);
      updateValues.push(date_of_birth);
    }

    if (address) {
      paramCount++;
      updateFields.push(`address = $${paramCount}`);
      updateValues.push(address);
    }

    if (emergency_contact) {
      paramCount++;
      updateFields.push(`emergency_contact = $${paramCount}`);
      updateValues.push(emergency_contact);
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

    const updateQuery = `UPDATE student_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;

    const updatedStudent = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      data: {
        student: updatedStudent.rows[0]
      }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const studentExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'student\'', [id]);
    if (studentExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student's courses
// @route   GET /api/students/:id/courses
// @access  Private
const getStudentCourses = async (req, res) => {
  try {
    const { id } = req.params;

    const coursesQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at, c.updated_at,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id,
             e.enrolled_at,
             CASE WHEN a.id IS NOT NULL THEN true ELSE false END as has_assignments
      FROM courses c
      INNER JOIN enrollments e ON c.id = e.course_id
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN assignments a ON c.id = a.course_id
      WHERE e.student_id = $1
      GROUP BY c.id, c.title, c.description, c.credits, c.created_at, c.updated_at,
               u.first_name, u.last_name, tp.tutor_id, e.enrolled_at
      ORDER BY e.enrolled_at DESC
    `;
    
    const courses = await pool.query(coursesQuery, [id]);

    res.json({
      success: true,
      data: {
        courses: courses.rows
      }
    });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student's assignments
// @route   GET /api/students/:id/assignments
// @access  Private
const getStudentAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // 'pending', 'submitted', 'graded'

    let assignmentsQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score, a.created_at,
             c.title as course_title,
             s.id as submission_id, s.content as submission_content, s.submitted_at, s.score, s.feedback,
             CASE 
               WHEN s.id IS NULL THEN 'pending'
               WHEN s.score IS NULL THEN 'submitted'
               ELSE 'graded'
             END as assignment_status
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = e.student_id
      WHERE e.student_id = $1
    `;
    
    const queryParams = [id];

    if (status) {
      if (status === 'pending') {
        assignmentsQuery += ' AND s.id IS NULL';
      } else if (status === 'submitted') {
        assignmentsQuery += ' AND s.id IS NOT NULL AND s.score IS NULL';
      } else if (status === 'graded') {
        assignmentsQuery += ' AND s.id IS NOT NULL AND s.score IS NOT NULL';
      }
    }

    assignmentsQuery += ' ORDER BY a.due_date ASC';

    const assignments = await pool.query(assignmentsQuery, queryParams);

    res.json({
      success: true,
      data: {
        assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student's attendance
// @route   GET /api/students/:id/attendance
// @access  Private
const getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, start_date, end_date } = req.query;

    let attendanceQuery = `
      SELECT a.id, a.date, a.status, a.notes, a.created_at,
             c.title as course_title,
             u.first_name || ' ' || u.last_name as tutor_name
      FROM attendance a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN users u ON c.tutor_id = u.id
      WHERE a.student_id = $1
    `;
    
    const queryParams = [id];
    let paramCount = 1;

    if (course_id) {
      paramCount++;
      attendanceQuery += ` AND a.course_id = $${paramCount}`;
      queryParams.push(course_id);
    }

    if (start_date) {
      paramCount++;
      attendanceQuery += ` AND a.date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      attendanceQuery += ` AND a.date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    attendanceQuery += ' ORDER BY a.date DESC';

    const attendance = await pool.query(attendanceQuery, queryParams);

    // Calculate attendance statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as attendance_percentage
      FROM attendance
      WHERE student_id = $1
    `;
    
    const stats = await pool.query(statsQuery, [id]);

    res.json({
      success: true,
      data: {
        attendance: attendance.rows,
        statistics: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentCourses,
  getStudentAssignments,
  getStudentAttendance
};
