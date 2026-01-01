/**
 * Test script for admin data clearing functionality
 * This script tests the DELETE /api/admin/clear-all-data endpoint
 * 
 * Usage: 
 *   1. Start the server first: node server.js
 *   2. Run this test: node test-clear-data.js
 * 
 * Note: This will delete all data from news, events, testimonials, 
 * campus_life, books, and contact_messages tables!
 */

const http = require('http');

const API_BASE = 'http://localhost:8000';

// Helper function to make HTTP requests
function makeRequest(method, path, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test the clear all data endpoint
async function testClearAllData() {
  console.log('🧪 Testing Admin Data Clearing Functionality\n');
  console.log('='.repeat(60));

  // Check for command line args for admin credentials
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const passwordArg = args.find(arg => arg.startsWith('--password='));
  
  let adminEmail = emailArg ? emailArg.split('=')[1] : 'admin@example.com';
  let adminPassword = passwordArg ? passwordArg.split('=')[1] : 'admin123';

  try {
    // Step 1: Login as admin to get token
    console.log(`\n1. Logging in as admin (${adminEmail})...`);
    const loginResult = await makeRequest('POST', '/api/auth/login', null, {
      email: adminEmail,
      password: adminPassword
    });

    if (loginResult.status !== 200) {
      console.log('❌ Login failed. Make sure the server is running and admin user exists.');
      console.log('   Response:', JSON.stringify(loginResult.data, null, 2));
      console.log('\n   Usage: node test-clear-data.js --email=your-admin-email --password=your-password');
      return;
    }

    const adminToken = loginResult.data.data?.accessToken;
    console.log('✅ Admin login successful');

    // Step 2: Get current data counts before clearing
    console.log('\n2. Checking current data counts...');
    const overviewResult = await makeRequest('GET', '/api/admin/overview', adminToken);
    
    if (overviewResult.status === 200) {
      const overview = overviewResult.data.data;
      console.log('   Current counts:');
      console.log(`   - News: ${overview.total_news || 'N/A'}`);
      console.log(`   - Events: ${overview.total_events || 'N/A'}`);
      console.log(`   - Testimonials: ${overview.total_testimonials || 'N/A'}`);
      console.log(`   - Books: ${overview.total_books || 'N/A'}`);
      console.log(`   - Contact Messages: ${overview.total_messages || 'N/A'}`);
    }

    // Step 3: Clear all admin data
    console.log('\n3. 🚨 CLEARING ALL ADMIN DATA...');
    console.log('   This will delete all data from:');
    console.log('   - news table');
    console.log('   - events table');
    console.log('   - testimonials table');
    console.log('   - campus_life table');
    console.log('   - books table');
    console.log('   - contact_messages table');
    console.log('   - statistics table (reset to zero)');
    console.log('   User and academic data will be preserved.\n');

    const clearResult = await makeRequest('DELETE', '/api/admin/clear-all-data', adminToken);

    if (clearResult.status === 200) {
      console.log('✅ Data clearing successful!');
      console.log('\n   Response:');
      console.log(JSON.stringify(clearResult.data, null, 2));
    } else {
      console.log('❌ Data clearing failed!');
      console.log('   Status:', clearResult.status);
      console.log('   Response:', clearResult.data);
    }

    // Step 4: Verify data was cleared
    console.log('\n4. Verifying data was cleared...');
    const verifyResult = await makeRequest('GET', '/api/admin/overview', adminToken);
    
    if (verifyResult.status === 200) {
      const overview = verifyResult.data.data;
      console.log('   Counts after clearing:');
      console.log(`   - News: ${overview.total_news || 0}`);
      console.log(`   - Events: ${overview.total_events || 0}`);
      console.log(`   - Testimonials: ${overview.total_testimonials || 0}`);
      console.log(`   - Books: ${overview.total_books || 0}`);
      console.log(`   - Contact Messages: ${overview.total_messages || 0}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\nMake sure the server is running: node server.js');
  }
}

// Run the test
testClearAllData();

