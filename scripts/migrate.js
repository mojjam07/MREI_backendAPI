require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function runMigrations() {
  let client;
  
  try {
    console.log('🔄 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  Migrations directory not found, creating it...');
      fs.mkdirSync(migrationsDir, { recursive: true });
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found');
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      try {
        // Check if migration has already been executed
        const result = await client.query(
          'SELECT id FROM migrations WHERE filename = $1',
          [file]
        );

        if (result.rows.length > 0) {
          console.log(`⏭️  Skipping ${file} - already executed`);
          continue;
        }

        console.log(`🔄 Executing migration: ${file}`);

        // Read and execute migration file
        const migrationSQL = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );

        // Execute the migration in a transaction for safety
        await client.query('BEGIN');
        await client.query(migrationSQL);
        
        // Record migration as executed
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Successfully executed: ${file}`);
        
      } catch (fileError) {
        console.error(`❌ Failed to execute ${file}:`, fileError.message);
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${fileError.message}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Please check your database connection and environment variables');
    throw error;
  } finally {
    if (client) {
      client.release();
      console.log('🔌 Database connection released');
    }
    await pool.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
