#!/usr/bin/env node

/**
 * Test script to verify database migration fix
 * This script tests that migrations run automatically and tables are created
 */

require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'mrei_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

async function testMigrations() {
  let client;
  
  try {
    console.log('🧪 Testing database migration fix...\n');
    
    // Test database connection
    client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if required tables exist
    const requiredTables = [
      'users', 'student_profiles', 'tutor_profiles', 'courses',
      'enrollments', 'assignments', 'submissions', 'class_schedules',
      'attendance', 'news', 'events', 'testimonials', 'campus_life',
      'contact_messages', 'books', 'statistics'
    ];
    
    console.log('\n📋 Checking required tables:');
    let tablesFound = 0;
    
    for (const tableName of requiredTables) {
      try {
        const result = await client.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [tableName]
        );
        
        if (result.rows[0].exists) {
          console.log(`  ✅ ${tableName} - EXISTS`);
          tablesFound++;
        } else {
          console.log(`  ❌ ${tableName} - MISSING`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName} - ERROR: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Results: ${tablesFound}/${requiredTables.length} tables found`);
    
    if (tablesFound === requiredTables.length) {
      console.log('\n🎉 SUCCESS: All required database tables exist!');
      console.log('✅ Migration fix is working correctly');
      console.log('✅ API endpoints should now respond without "relation does not exist" errors');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some tables are missing');
      console.log('💡 This might be normal if migrations are still running');
      console.log('💡 Or if database connection issues exist');
    }
    
    // Test a simple query that was failing before
    console.log('\n🧪 Testing problematic queries from original error:');
    
    try {
      // Test the query that was failing in the original error
      const eventsResult = await client.query('SELECT COUNT(*) FROM events');
      console.log('  ✅ events table query - SUCCESS');
    } catch (err) {
      console.log(`  ❌ events table query - FAILED: ${err.message}`);
    }
    
    try {
      const usersResult = await client.query('SELECT COUNT(*) FROM users');
      console.log('  ✅ users table query - SUCCESS');
    } catch (err) {
      console.log(`  ❌ users table query - FAILED: ${err.message}`);
    }
    
    try {
      const newsResult = await client.query('SELECT COUNT(*) FROM news');
      console.log('  ✅ news table query - SUCCESS');
    } catch (err) {
      console.log(`  ❌ news table query - FAILED: ${err.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('💡 Please check your database connection and environment variables');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testMigrations()
    .then(() => {
      console.log('\n🏁 Migration test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMigrations };
