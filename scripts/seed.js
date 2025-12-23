require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mrei_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, ['admin', 'admin@mrei.edu', adminPassword, 'admin', 'System', 'Administrator', '+1234567890']);

    let adminId = adminResult.rows[0]?.id;
    
    // If admin wasn't created (already exists), get existing admin ID
    if (!adminId) {
      const existingAdmin = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      adminId = existingAdmin.rows[0]?.id;
    }

    // Create default tutor user
    const tutorPassword = await bcrypt.hash('tutor123', 10);
    const tutorResult = await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, ['tutor', 'tutor@mrei.edu', tutorPassword, 'tutor', 'John', 'Teacher', '+1234567891']);

    let tutorId = tutorResult.rows[0]?.id;
    
    // If tutor wasn't created (already exists), get existing tutor ID
    if (!tutorId) {
      const existingTutor = await client.query('SELECT id FROM users WHERE username = $1', ['tutor']);
      tutorId = existingTutor.rows[0]?.id;
    }

    // Create default student user
    const studentPassword = await bcrypt.hash('student123', 10);
    const studentResult = await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `, ['student', 'student@mrei.edu', studentPassword, 'student', 'Jane', 'Student', '+1234567892']);

    let studentId = studentResult.rows[0]?.id;
    
    // If student wasn't created (already exists), get existing student ID
    if (!studentId) {
      const existingStudent = await client.query('SELECT id FROM users WHERE username = $1', ['student']);
      studentId = existingStudent.rows[0]?.id;
    }

    // Create tutor profile if it doesn't exist
    if (tutorId) {
      await client.query(`
        INSERT INTO tutor_profiles (user_id, tutor_id, specialization, qualification, experience_years)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO NOTHING
      `, [tutorId, 'TUT001', 'Mathematics', 'M.Sc. Mathematics', 5]);
    }

    // Create student profile if it doesn't exist
    if (studentId) {
      await client.query(`
        INSERT INTO student_profiles (user_id, student_id, date_of_birth, address, emergency_contact)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO NOTHING
      `, [studentId, 'STU001', '2000-01-01', '123 Student St', 'Emergency Contact']);
    }

    // Create sample courses if none exist
    const courseResult = await client.query(`
      INSERT INTO courses (title, description, credits, tutor_id)
      VALUES
      ($1, $2, $3, $4),
      ($5, $6, $7, $8)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [
      'Introduction to Mathematics', 'Basic mathematics concepts and problem solving', 3, tutorId,
      'Advanced Algebra', 'Advanced algebraic concepts and applications', 4, tutorId
    ]);

    // Create sample assignments if none exist
    if (courseResult.rows.length > 0) {
      const courseId = courseResult.rows[0].id;
      await client.query(`
        INSERT INTO assignments (title, description, course_id, due_date, max_score)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [
        'Math Quiz 1', 'First mathematics quiz covering basic concepts', 
        courseId, '2024-02-15', 100
      ]);
    }

    // Update statistics
    await client.query(`
      UPDATE statistics 
      SET 
        total_students = (SELECT COUNT(*) FROM users WHERE role = 'student'),
        total_tutors = (SELECT COUNT(*) FROM users WHERE role = 'tutor'),
        total_courses = (SELECT COUNT(*) FROM courses),
        total_assignments = (SELECT COUNT(*) FROM assignments),
        total_submissions = (SELECT COUNT(*) FROM submissions),
        updated_at = CURRENT_TIMESTAMP
    `);

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('🔑 Default credentials:');
    console.log('   Admin:   admin / admin123');
    console.log('   Tutor:   tutor / tutor123');
    console.log('   Student: student / student123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
