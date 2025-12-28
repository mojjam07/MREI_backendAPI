require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'mrei_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  // Pool tuning
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // 🔐 REQUIRED for Render / managed PostgreSQL
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

async function resetMigration004() {
  let client;
  
  try {
    console.log('🔄 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Remove the failed migration 004 record
    const result = await client.query(
      'DELETE FROM migrations WHERE filename = $1',
      ['004_fix_admin_dashboard_schema.sql']
    );

    if (result.rowCount > 0) {
      console.log('✅ Removed failed migration record for 004_fix_admin_dashboard_schema.sql');
    } else {
      console.log('ℹ️  No failed migration record found for 004_fix_admin_dashboard_schema.sql');
    }

    console.log('🎉 Migration state reset successfully!');
    
  } catch (error) {
    console.error('❌ Failed to reset migration state:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
      console.log('🔌 Database connection released');
    }
    await pool.end();
  }
}

// Run the reset if called directly
if (require.main === module) {
  resetMigration004()
    .then(() => {
      console.log('Migration state reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration state reset failed:', error);
      process.exit(1);
    });
}

module.exports = { resetMigration004 };
