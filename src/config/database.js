const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// --------------------
// PostgreSQL Pool
// --------------------
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

// --------------------
// Connection events
// --------------------
// Only log in non-test environment to avoid Jest warnings
const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

pool.on('connect', () => {
  if (!isTest) {
    console.log('✅ PostgreSQL connected');
  }
});

pool.on('error', (err) => {
  if (!isTest) {
    console.error('❌ PostgreSQL pool error:', err);
  }
  // In test environment, don't exit - let tests handle cleanup
});

// --------------------
// Cleanup function for tests
// --------------------
const closePool = async () => {
  try {
    await pool.end();
    if (!isTest) {
      console.log('✅ PostgreSQL pool closed');
    }
  } catch (err) {
    if (!isTest) {
      console.error('❌ Error closing PostgreSQL pool:', err);
    }
  }
};

// --------------------
// Optional startup test
// --------------------
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW()');
    console.log('🔗 Database time:', rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

// --------------------
// Exports
// --------------------
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection,
  closePool,
};
