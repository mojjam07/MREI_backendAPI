require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to postgres to create our database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 1,
  idleTimeoutMillis: 30000,
});

async function createDatabase() {
  const client = await pool.connect();
  
  try {
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      ['mrei_db']
    );
    
    if (result.rows.length === 0) {
      console.log('Creating database mrei_db...');
      await client.query('CREATE DATABASE mrei_db');
      console.log('✅ Database mrei_db created successfully!');
    } else {
      console.log('ℹ️ Database mrei_db already exists.');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createDatabase();
