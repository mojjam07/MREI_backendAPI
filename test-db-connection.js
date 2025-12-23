const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
async function testConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log('=====================================');
  
  try {
    // Test basic connection
    console.log('📡 Attempting to connect to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    
    // Test query execution
    console.log('🔍 Testing query execution...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Query executed successfully!');
    console.log('📅 Current database time:', result.rows[0].current_time);
    console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Test database existence and schema check
    console.log('🔍 Checking database schema...');
    const schemaCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (schemaCheck.rows.length > 0) {
      console.log('✅ Database tables found:');
      schemaCheck.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️ No tables found in database. Database might need to be initialized.');
    }
    
    // Test specific table access (if tables exist)
    if (schemaCheck.rows.length > 0) {
      console.log('🔍 Testing table access...');
      const testTable = schemaCheck.rows[0].table_name;
      try {
        const tableTest = await client.query(`SELECT COUNT(*) as count FROM ${testTable} LIMIT 1`);
        console.log(`✅ Successfully accessed table '${testTable}'`);
      } catch (tableError) {
        console.log(`⚠️ Could not access table '${testTable}':`, tableError.message);
      }
    }
    
    // Test connection pool statistics
    console.log('📊 Connection Pool Statistics:');
    console.log(`   Total clients: ${pool.totalCount}`);
    console.log(`   Idle clients: ${pool.idleCount}`);
    console.log(`   Waiting clients: ${pool.waitingCount}`);
    
    client.release();
    
    console.log('\n🎉 Database connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error details:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    
    // Provide troubleshooting suggestions
    console.log('\n🛠️ Troubleshooting suggestions:');
    console.log('1. Check if PostgreSQL is running');
    console.log('2. Verify database credentials in .env file');
    console.log('3. Ensure database exists and is accessible');
    console.log('4. Check network connectivity');
    console.log('5. Verify database permissions');
    
    return false;
  } finally {
    await pool.end();
  }
}

// Test specific connection scenarios
async function testConnectionScenarios() {
  console.log('\n🔍 Testing Connection Scenarios...');
  console.log('=====================================');
  
  // Test connection with different timeouts
  const scenarios = [
    { name: 'Normal connection', timeout: 2000 },
    { name: 'Short timeout', timeout: 500 },
    { name: 'Long timeout', timeout: 5000 }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n📡 Testing ${scenario.name} (${scenario.timeout}ms timeout)...`);
    
    const testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      connectionTimeoutMillis: scenario.timeout,
    });
    
    try {
      const client = await testPool.connect();
      const result = await client.query('SELECT 1 as test');
      console.log(`✅ ${scenario.name} - Success`);
      client.release();
    } catch (error) {
      console.log(`❌ ${scenario.name} - Failed:`, error.message);
    } finally {
      await testPool.end();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Backend API Database Connection Test');
  console.log('========================================\n');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log('=====================================');
  console.log('DB_HOST:', process.env.DB_HOST || 'localhost (default)');
  console.log('DB_PORT:', process.env.DB_PORT || '5432 (default)');
  console.log('DB_NAME:', process.env.DB_NAME || 'postgres (default)');
  console.log('DB_USER:', process.env.DB_USER || 'postgres (default)');
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(empty)');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development (default)');
  
  const success = await testConnection();
  
  if (success) {
    await testConnectionScenarios();
    console.log('\n✅ All database connection tests passed!');
  } else {
    console.log('\n❌ Database connection tests failed!');
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
