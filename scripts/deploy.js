#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment process...');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('📦 Production environment detected');

  // Run database migrations if in production
  try {
    console.log('🗄️ Running database migrations...');
    execSync('node scripts/migrate.js', { stdio: 'inherit' });

    console.log('🌱 Seeding database...');
    execSync('node scripts/seed.js', { stdio: 'inherit' });

    console.log('✅ Database setup complete');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('🏠 Development environment - skipping database setup');
}

console.log('🎉 Deployment preparation complete!');
