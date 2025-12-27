const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '003_add_alumni_support.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Connect to database using environment variables
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mrei_db', // Using the correct database name
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '', // Will use the actual password from .env
    });
    
    console.log('Running migration: 003_add_alumni_support.sql');
    console.log(`Connecting to database: ${process.env.DB_NAME || 'mrei_db'}`);
    console.log(`User: ${process.env.DB_USER || 'postgres'}`);
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Close connection
    await pool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
