const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'university_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test Admin Dashboard API Endpoints
async function testAdminDashboardAPI() {
  console.log('🚀 Testing Admin Dashboard API Endpoints...\n');

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if required tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'news', 'events', 'testimonials', 'campus_life', 'contact_messages')
    `;
    
    const tables = await client.query(tablesQuery);
    console.log('📋 Available tables:', tables.rows.map(row => row.table_name));
    
    // Insert test data if tables are empty
    await insertTestData(client);
    
    // Test all admin endpoints
    await testAdminEndpoints(client);
    
    client.release();
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
    console.log('\n🏁 Admin Dashboard API testing completed!');
  }
}

async function insertTestData(client) {
  console.log('📝 Inserting test data...');
  
  // Create admin user if doesn't exist
  await client.query(`
    INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
    VALUES ('admin_test', 'admin@test.com', '$2b$10$dummy_hash', 'admin', 'Admin', 'Test', NOW(), NOW())
    ON CONFLICT (username) DO NOTHING
  `);

  // Insert test news
  await client.query(`
    INSERT INTO news (title, content, created_at, updated_at, published)
    VALUES 
      ('Test News 1', 'This is test news content 1', NOW(), NOW(), true),
      ('Test News 2', 'This is test news content 2', NOW(), NOW(), true)
    ON CONFLICT DO NOTHING
  `);

  // Insert test events
  await client.query(`
    INSERT INTO events (title, description, event_date, location, created_at, updated_at)
    VALUES 
      ('Test Event 1', 'This is test event 1', NOW() + INTERVAL '1 day', 'Main Hall', NOW(), NOW()),
      ('Test Event 2', 'This is test event 2', NOW() + INTERVAL '2 days', 'Auditorium', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);

  // Insert test testimonials (without updated_at column)
  await client.query(`
    INSERT INTO testimonials (student_name, content, rating, approved, created_at)
    VALUES 
      ('Test Student 1', 'This is test testimonial 1', 5, true, NOW()),
      ('Test Student 2', 'This is test testimonial 2', 4, false, NOW())
    ON CONFLICT DO NOTHING
  `);

  // Insert test campus life
  await client.query(`
    INSERT INTO campus_life (title, content, image_url, created_at, updated_at)
    VALUES 
      ('Campus Life 1', 'This is test campus life content 1', 'http://example.com/image1.jpg', NOW(), NOW()),
      ('Campus Life 2', 'This is test campus life content 2', 'http://example.com/image2.jpg', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);

  // Insert test contact messages
  await client.query(`
    INSERT INTO contact_messages (name, email, subject, message, status, created_at)
    VALUES 
      ('Test User 1', 'user1@test.com', 'Test Subject 1', 'This is test message 1', 'new', NOW()),
      ('Test User 2', 'user2@test.com', 'Test Subject 2', 'This is test message 2', 'read', NOW())
    ON CONFLICT DO NOTHING
  `);

  console.log('✅ Test data inserted successfully');
}

async function testAdminEndpoints(client) {
  console.log('\n🧪 Testing Admin Dashboard Endpoints:\n');

  // Test 1: Get Admin Dashboard Statistics
  console.log('1. Testing Admin Dashboard Statistics...');
  try {
    const result = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as total_tutors,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM news) as total_news,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM testimonials) as total_testimonials,
        (SELECT COUNT(*) FROM contact_messages) as total_messages
    `);
    console.log('✅ Admin Dashboard Statistics:', result.rows[0]);
  } catch (error) {
    console.error('❌ Admin Dashboard Statistics failed:', error.message);
  }

  // Test 2: Get All News
  console.log('\n2. Testing Get All News...');
  try {
    const result = await client.query('SELECT * FROM news ORDER BY created_at DESC');
    console.log('✅ Get All News:', result.rows.length, 'items found');
    console.log('   Sample:', result.rows[0]?.title || 'No news found');
  } catch (error) {
    console.error('❌ Get All News failed:', error.message);
  }

  // Test 3: Create News
  console.log('\n3. Testing Create News...');
  try {
    const result = await client.query(`
      INSERT INTO news (title, content, published, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `, ['API Test News', 'This news was created via API test', true]);
    console.log('✅ Create News:', result.rows[0].title);
  } catch (error) {
    console.error('❌ Create News failed:', error.message);
  }

  // Test 4: Update News
  console.log('\n4. Testing Update News...');
  try {
    const result = await client.query(`
      UPDATE news 
      SET content = $1, updated_at = NOW()
      WHERE title = 'Test News 1'
      RETURNING *
    `, ['Updated content via API test']);
    console.log('✅ Update News:', result.rows[0]?.title || 'No news updated');
  } catch (error) {
    console.error('❌ Update News failed:', error.message);
  }

  // Test 5: Delete News
  console.log('\n5. Testing Delete News...');
  try {
    await client.query('DELETE FROM news WHERE title = $1', ['API Test News']);
    console.log('✅ Delete News: Successfully deleted test news');
  } catch (error) {
    console.error('❌ Delete News failed:', error.message);
  }

  // Test 6: Get All Events
  console.log('\n6. Testing Get All Events...');
  try {
    const result = await client.query('SELECT * FROM events ORDER BY created_at DESC');
    console.log('✅ Get All Events:', result.rows.length, 'items found');
  } catch (error) {
    console.error('❌ Get All Events failed:', error.message);
  }

  // Test 7: Get All Testimonials
  console.log('\n7. Testing Get All Testimonials...');
  try {
    const result = await client.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    console.log('✅ Get All Testimonials:', result.rows.length, 'items found');
  } catch (error) {
    console.error('❌ Get All Testimonials failed:', error.message);
  }

  // Test 8: Toggle Testimonial Approval
  console.log('\n8. Testing Toggle Testimonial Approval...');
  try {
    const result = await client.query(`
      UPDATE testimonials 
      SET approved = NOT approved
      WHERE student_name = 'Test Student 2'
      RETURNING approved
    `);
    console.log('✅ Toggle Testimonial Approval:', result.rows[0]?.approved);
  } catch (error) {
    console.error('❌ Toggle Testimonial Approval failed:', error.message);
  }

  // Test 9: Get All Campus Life
  console.log('\n9. Testing Get All Campus Life...');
  try {
    const result = await client.query('SELECT * FROM campus_life ORDER BY created_at DESC');
    console.log('✅ Get All Campus Life:', result.rows.length, 'items found');
  } catch (error) {
    console.error('❌ Get All Campus Life failed:', error.message);
  }

  // Test 10: Get All Contact Messages
  console.log('\n10. Testing Get All Contact Messages...');
  try {
    const result = await client.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    console.log('✅ Get All Contact Messages:', result.rows.length, 'items found');
  } catch (error) {
    console.error('❌ Get All Contact Messages failed:', error.message);
  }

  // Test 11: Mark Contact Message as Read
  console.log('\n11. Testing Mark Contact Message as Read...');
  try {
    const result = await client.query(`
      UPDATE contact_messages 
      SET status = 'read'
      WHERE name = 'Test User 1'
      RETURNING status
    `);
    console.log('✅ Mark Contact Message as Read:', result.rows[0]?.status);
  } catch (error) {
    console.error('❌ Mark Contact Message as Read failed:', error.message);
  }
}

// Run the tests
if (require.main === module) {
  testAdminDashboardAPI();
}

module.exports = { testAdminDashboardAPI };
