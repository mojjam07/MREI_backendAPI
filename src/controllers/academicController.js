const { pool } = require('../config/database');

// @desc    Get all courses
// @route   GET /api/academics/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tutor_id } = req.query;
    const offset = (page - 1) * limit;
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);

    let query = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at, c.updated_at,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id,
             COUNT(DISTINCT e.student_id) as enrolled_students,
             COUNT(DISTINCT a.id) as total_assignments
      FROM courses c
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN assignments a ON c.id = a.course_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (tutor_id) {
      paramCount++;
      query += ` AND c.tutor_id = $${paramCount}::uuid`;
      queryParams.push(tutor_id);
    }

    // Add pagination - always add limit and offset as literals
    query += ` GROUP BY c.id, c.title, c.description, c.credits, c.created_at, c.updated_at, u.first_name, u.last_name, tp.tutor_id`;
    query += ` ORDER BY c.created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    const courses = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM courses c WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ` AND (c.title ILIKE $${countParams.length + 1} OR c.description ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    if (tutor_id) {
      countQuery += ` AND c.tutor_id = $${countParams.length + 1}::uuid`;
      countParams.push(tutor_id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCourses = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: courses.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCourses,
        pages: Math.ceil(totalCourses / limitInt)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get course by ID
// @route   GET /api/academics/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const courseQuery = `
      SELECT c.id, c.title, c.description, c.credits, c.created_at, c.updated_at,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id
      FROM courses c
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE c.id = $1
    `;
    
    const course = await pool.query(courseQuery, [id]);

    if (course.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get enrolled students
    const studentsQuery = `
      SELECT u.id, u.first_name, u.last_name, u.email, sp.student_id, e.enrolled_at
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE e.course_id = $1
      ORDER BY e.enrolled_at DESC
    `;
    
    const students = await pool.query(studentsQuery, [id]);

    // Get assignments
    const assignmentsQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score, a.created_at,
             COUNT(s.id) as total_submissions,
             COUNT(CASE WHEN s.score IS NOT NULL THEN 1 END) as graded_submissions
      FROM assignments a
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE a.course_id = $1
      GROUP BY a.id, a.title, a.description, a.due_date, a.max_score, a.created_at
      ORDER BY a.due_date ASC
    `;
    
    const assignments = await pool.query(assignmentsQuery, [id]);

    res.json({
      success: true,
      data: {
        course: course.rows[0],
        enrolled_students: students.rows,
        assignments: assignments.rows
      }
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create course
// @route   POST /api/academics/courses
// @access  Private/Tutor
const createCourse = async (req, res) => {
  try {
    const { title, description, credits, tutor_id } = req.body;

    // Verify tutor exists
    const tutorExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'tutor\'', [tutor_id]);
    if (tutorExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tutor not found'
      });
    }

    const insertQuery = `
      INSERT INTO courses (title, description, credits, tutor_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    
    const newCourse = await pool.query(insertQuery, [title, description, credits, tutor_id]);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course: newCourse.rows[0]
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update course
// @route   PUT /api/academics/courses/:id
// @access  Private/Tutor
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, credits } = req.body;

    // Check if course exists
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const updateQuery = `
      UPDATE courses 
      SET title = $1, description = $2, credits = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const updatedCourse = await pool.query(updateQuery, [title, description, credits, id]);

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course: updatedCourse.rows[0]
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/academics/courses/:id
// @access  Private/Tutor
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if course exists
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (courseExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete course (cascade will handle related records)
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all assignments
// @route   GET /api/academics/assignments
// @access  Private
const getAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, course_id, due_date } = req.query;
    const offset = (page - 1) * limit;
    const limitInt = parseInt(limit);
    const offsetInt = parseInt(offset);

    let query = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score, a.created_at, a.updated_at,
             c.title as course_title,
             u.first_name || ' ' || u.last_name as tutor_name,
             COUNT(s.id) as total_submissions,
             COUNT(CASE WHEN s.score IS NOT NULL THEN 1 END) as graded_submissions
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN users u ON c.tutor_id = u.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (course_id) {
      paramCount++;
      query += ` AND a.course_id = $${paramCount}::uuid`;
      queryParams.push(course_id);
    }

    if (due_date) {
      paramCount++;
      query += ` AND a.due_date = $${paramCount}`;
      queryParams.push(due_date);
    }

    // Add pagination - always add limit and offset as literals
    query += ` GROUP BY a.id, a.title, a.description, a.due_date, a.max_score, a.created_at, a.updated_at, c.title, u.first_name, u.last_name`;
    query += ` ORDER BY a.due_date ASC LIMIT ${limitInt} OFFSET ${offsetInt}`;

    const assignments = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM assignments a WHERE 1=1';
    const countParams = [];

    if (course_id) {
      countQuery += ` AND a.course_id = $${countParams.length + 1}::uuid`;
      countParams.push(course_id);
    }

    if (due_date) {
      countQuery += ` AND a.due_date = $${countParams.length + 1}`;
      countParams.push(due_date);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalAssignments = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: assignments.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAssignments,
        pages: Math.ceil(totalAssignments / limitInt)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get assignment by ID
// @route   GET /api/academics/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentQuery = `
      SELECT a.id, a.title, a.description, a.due_date, a.max_score, a.created_at, a.updated_at,
             c.id as course_id, c.title as course_title,
             u.first_name || ' ' || u.last_name as tutor_name
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN users u ON c.tutor_id = u.id
      WHERE a.id = $1
    `;
    
    const assignment = await pool.query(assignmentQuery, [id]);

    if (assignment.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Get submissions with student details
    const submissionsQuery = `
      SELECT s.id, s.content, s.submitted_at, s.score, s.feedback,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      WHERE s.assignment_id = $1
      ORDER BY s.submitted_at DESC
    `;
    
    const submissions = await pool.query(submissionsQuery, [id]);

    res.json({
      success: true,
      data: {
        assignment: assignment.rows[0],
        submissions: submissions.rows
      }
    });
  } catch (error) {
    console.error('Get assignment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create assignment
// @route   POST /api/academics/assignments
// @access  Private/Tutor
const createAssignment = async (req, res) => {
  try {
    const { title, description, course_id, due_date, max_score } = req.body;

    // Verify course exists
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [course_id]);
    if (courseExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course not found'
      });
    }

    const insertQuery = `
      INSERT INTO assignments (title, description, course_id, due_date, max_score, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const newAssignment = await pool.query(insertQuery, [title, description, course_id, due_date, max_score]);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        assignment: newAssignment.rows[0]
      }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all enrollments
// @route   GET /api/academics/enrollments
// @access  Private
const getEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, student_id, course_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.id, e.enrolled_at, e.created_at,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title,
             u2.first_name || ' ' || u2.last_name as tutor_name
      FROM enrollments e
      INNER JOIN users u ON e.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN users u2 ON c.tutor_id = u2.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (student_id) {
      paramCount++;
      query += ` AND e.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    if (course_id) {
      paramCount++;
      query += ` AND e.course_id = $${paramCount}`;
      queryParams.push(course_id);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY e.enrolled_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const enrollments = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM enrollments e WHERE 1=1';
    const countParams = [];

    if (student_id) {
      countQuery += ` AND e.student_id = $${countParams.length + 1}`;
      countParams.push(student_id);
    }

    if (course_id) {
      countQuery += ` AND e.course_id = $${countParams.length + 1}`;
      countParams.push(course_id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalEnrollments = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        enrollments: enrollments.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalEnrollments,
          pages: Math.ceil(totalEnrollments / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create enrollment
// @route   POST /api/academics/enrollments
// @access  Private
const createEnrollment = async (req, res) => {
  try {
    const { student_id, course_id } = req.body;

    // Verify student exists
    const studentExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'student\'', [student_id]);
    if (studentExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Verify course exists
    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [course_id]);
    if (courseExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [student_id, course_id]
    );
    
    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    const insertQuery = `
      INSERT INTO enrollments (student_id, course_id, enrolled_at, created_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    
    const newEnrollment = await pool.query(insertQuery, [student_id, course_id]);

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: {
        enrollment: newEnrollment.rows[0]
      }
    });
  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all submissions
// @route   GET /api/academics/submissions
// @access  Private
const getSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, assignment_id, student_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.id, s.content, s.submitted_at, s.score, s.feedback, s.created_at,
             a.title as assignment_title, a.due_date, a.max_score,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (assignment_id) {
      paramCount++;
      query += ` AND s.assignment_id = $${paramCount}`;
      queryParams.push(assignment_id);
    }

    if (student_id) {
      paramCount++;
      query += ` AND s.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY s.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const submissions = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM submissions s WHERE 1=1';
    const countParams = [];

    if (assignment_id) {
      countQuery += ` AND s.assignment_id = $${countParams.length + 1}`;
      countParams.push(assignment_id);
    }

    if (student_id) {
      countQuery += ` AND s.student_id = $${countParams.length + 1}`;
      countParams.push(student_id);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalSubmissions = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        submissions: submissions.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalSubmissions,
          pages: Math.ceil(totalSubmissions / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create submission
// @route   POST /api/academics/submissions
// @access  Private/Student
const createSubmission = async (req, res) => {
  try {
    const { assignment_id, student_id, content } = req.body;

    // Verify assignment exists
    const assignmentExists = await pool.query('SELECT id FROM assignments WHERE id = $1', [assignment_id]);
    if (assignmentExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify student exists and is enrolled in the course
    const enrollmentCheck = await pool.query(`
      SELECT e.id FROM enrollments e
      INNER JOIN assignments a ON e.course_id = a.course_id
      WHERE e.student_id = $1 AND a.id = $2
    `, [student_id, assignment_id]);
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Check if submission already exists
    const existingSubmission = await pool.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignment_id, student_id]
    );
    
    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission already exists for this assignment'
      });
    }

    const insertQuery = `
      INSERT INTO submissions (assignment_id, student_id, content, submitted_at, created_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    const newSubmission = await pool.query(insertQuery, [assignment_id, student_id, content]);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submission: newSubmission.rows[0]
      }
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all attendance records
// @route   GET /api/academics/attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, student_id, course_id, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.id, a.date, a.status, a.notes, a.created_at,
             u.first_name || ' ' || u.last_name as student_name,
             sp.student_id,
             c.title as course_title,
             u2.first_name || ' ' || u2.last_name as tutor_name
      FROM attendance a
      INNER JOIN users u ON a.student_id = u.id
      INNER JOIN student_profiles sp ON u.id = sp.user_id
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN users u2 ON c.tutor_id = u2.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (student_id) {
      paramCount++;
      query += ` AND a.student_id = $${paramCount}`;
      queryParams.push(student_id);
    }

    if (course_id) {
      paramCount++;
      query += ` AND a.course_id = $${paramCount}`;
      queryParams.push(course_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY a.date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const attendance = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM attendance a WHERE 1=1';
    const countParams = [];

    if (student_id) {
      countQuery += ` AND a.student_id = $${countParams.length + 1}`;
      countParams.push(student_id);
    }

    if (course_id) {
      countQuery += ` AND a.course_id = $${countParams.length + 1}`;
      countParams.push(course_id);
    }

    if (start_date) {
      countQuery += ` AND a.date >= $${countParams.length + 1}`;
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ` AND a.date <= $${countParams.length + 1}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalAttendance = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        attendance: attendance.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalAttendance,
          pages: Math.ceil(totalAttendance / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create attendance record
// @route   POST /api/academics/attendance
// @access  Private/Tutor
const createAttendance = async (req, res) => {
  try {
    const { student_id, course_id, date, status, notes } = req.body;

    // Verify student and course exist
    const studentExists = await pool.query('SELECT id FROM users WHERE id = $1 AND role = \'student\'', [student_id]);
    if (studentExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }

    const courseExists = await pool.query('SELECT id FROM courses WHERE id = $1', [course_id]);
    if (courseExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Course not found'
      });
    }

    const insertQuery = `
      INSERT INTO attendance (student_id, course_id, date, status, notes, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const newAttendance = await pool.query(insertQuery, [student_id, course_id, date, status, notes]);

    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: {
        attendance: newAttendance.rows[0]
      }
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student enrollments (for authenticated student)
// @route   GET /api/academics/enrollments/student
// @access  Private/Student
const getStudentEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a student
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const enrollmentsQuery = `
      SELECT e.id, e.enrolled_at, e.progress, e.grade, e.status,
             c.id as course_id, c.title as course_title, c.description, c.credits,
             u.first_name || ' ' || u.last_name as tutor_name,
             tp.tutor_id
      FROM enrollments e
      INNER JOIN courses c ON e.course_id = c.id
      INNER JOIN users u ON c.tutor_id = u.id
      INNER JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE e.student_id = $1
      ORDER BY e.enrolled_at DESC
    `;
    
    const enrollments = await pool.query(enrollmentsQuery, [userId]);

    res.json({
      success: true,
      data: enrollments.rows
    });
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student assignments (for authenticated student)
// @route   GET /api/academics/assignments/student
// @access  Private/Student
const getStudentAssignments = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a student
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const assignmentsQuery = `
      SELECT DISTINCT a.id, a.title, a.description, a.due_date, a.max_score, a.assignment_type, a.created_at,
             c.id as course_id, c.title as course_title,
             s.id as submission_id, s.content as submission_content, s.submitted_at, s.score, s.feedback,
             CASE 
               WHEN s.id IS NOT NULL THEN 'submitted'
               WHEN a.due_date < CURRENT_DATE THEN 'overdue'
               ELSE 'pending'
             END as status
      FROM assignments a
      INNER JOIN courses c ON a.course_id = c.id
      INNER JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = e.student_id
      WHERE e.student_id = $1
      ORDER BY a.due_date ASC
    `;
    
    const assignments = await pool.query(assignmentsQuery, [userId]);

    // Transform data to match frontend expectations
    const transformedAssignments = assignments.rows.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      max_score: assignment.max_score,
      assignment_type: assignment.assignment_type || 'general',
      created_at: assignment.created_at,
      course: {
        id: assignment.course_id,
        title: assignment.course_title
      },
      submissions: assignment.submission_id ? [{
        id: assignment.submission_id,
        content: assignment.submission_content,
        submitted_at: assignment.submitted_at,
        grade: assignment.score,
        feedback: assignment.feedback
      }] : []
    }));

    res.json({
      success: true,
      data: transformedAssignments
    });
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student attendance (for authenticated student)
// @route   GET /api/academics/attendance/student
// @access  Private/Student
const getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a student
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const attendanceQuery = `
      SELECT a.id, a.date, a.status, a.notes,
             c.title as course_title,
             cs.start_time, cs.end_time
      FROM attendance a
      INNER JOIN courses c ON a.course_id = c.id
      LEFT JOIN class_schedules cs ON c.id = cs.course_id AND a.date = cs.scheduled_date::date
      WHERE a.student_id = $1
      ORDER BY a.date DESC
    `;
    
    const attendance = await pool.query(attendanceQuery, [userId]);

    res.json({
      success: true,
      data: attendance.rows
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get student class schedules (for authenticated student)
// @route   GET /api/academics/class-schedules/student
// @access  Private/Student
const getStudentClassSchedules = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify user is a student
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const schedulesQuery = `
      SELECT cs.id, cs.scheduled_date, cs.start_time, cs.end_time, cs.room, cs.description,
             c.id as course_id, c.title as course_title, c.description as course_description,
             u.first_name || ' ' || u.last_name as tutor_name
      FROM class_schedules cs
      INNER JOIN courses c ON cs.course_id = c.id
      INNER JOIN enrollments e ON c.id = e.course_id
      INNER JOIN users u ON c.tutor_id = u.id
      WHERE e.student_id = $1
      ORDER BY cs.scheduled_date ASC, cs.start_time ASC
    `;
    
    const schedules = await pool.query(schedulesQuery, [userId]);

    res.json({
      success: true,
      data: schedules.rows
    });
  } catch (error) {
    console.error('Get student class schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getAssignments,
  getAssignmentById,
  createAssignment,
  getEnrollments,
  createEnrollment,
  getSubmissions,
  createSubmission,
  getAttendance,
  createAttendance,
  getStudentEnrollments,
  getStudentAssignments,
  getStudentAttendance,
  getStudentClassSchedules
};
