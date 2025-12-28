#!/usr/bin/env node

/**
 * Backend API Endpoints Test Script
 * Tests both new content endpoints and existing communication endpoints
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = 'http://localhost:8000';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: responseData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('🚀 Starting Backend API Endpoints Test...\n');
  console.log(`📍 Testing API at: ${API_BASE_URL}\n`);

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  totalTests++;
  console.log('📋 Test 1: Health Check');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Health check passed\n');
      passedTests++;
    } else {
      console.log(`❌ Health check failed: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}\n`);
  }

  // Test 2: New Content Endpoints - Overview
  totalTests++;
  console.log('📋 Test 2: Content Overview Endpoint');
  try {
    const response = await makeRequest('GET', '/api/content');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Content overview endpoint passed');
      console.log('   - Data keys:', Object.keys(response.data.data));
      console.log('   - Message:', response.data.message);
      passedTests++;
    } else {
      console.log(`❌ Content overview failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Content overview error: ${error.message}`);
  }
  console.log('');

  // Test 3: New Content Endpoints - News
  totalTests++;
  console.log('📋 Test 3: News Endpoints');
  try {
    // Test getting news list
    const response = await makeRequest('GET', '/api/content/news?limit=2');
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ News list endpoint passed');
      console.log('   - Pagination keys:', Object.keys(response.data.data.pagination || {}));
      console.log('   - News count:', response.data.data.news?.length || 0);
      passedTests++;
    } else {
      console.log(`❌ News list failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ News list error: ${error.message}`);
  }
  console.log('');

  // Test 4: New Content Endpoints - Events
  totalTests++;
  console.log('📋 Test 4: Events Endpoints');
  try {
    const response = await makeRequest('GET', '/api/content/events?limit=2');
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ Events list endpoint passed');
      console.log('   - Events count:', response.data.data.events?.length || 0);
      passedTests++;
    } else {
      console.log(`❌ Events list failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Events list error: ${error.message}`);
  }
  console.log('');

  // Test 5: New Content Endpoints - Testimonials
  totalTests++;
  console.log('📋 Test 5: Testimonials Endpoints');
  try {
    const response = await makeRequest('GET', '/api/content/testimonials?limit=2');
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ Testimonials list endpoint passed');
      console.log('   - Testimonials count:', response.data.data.testimonials?.length || 0);
      passedTests++;
    } else {
      console.log(`❌ Testimonials list failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Testimonials list error: ${error.message}`);
  }
  console.log('');

  // Test 6: New Content Endpoints - Stats
  totalTests++;
  console.log('📋 Test 6: Stats Endpoint');
  try {
    const response = await makeRequest('GET', '/api/content/stats');
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ Stats endpoint passed');
      console.log('   - Stats keys:', Object.keys(response.data.data.statistics || {}));
      passedTests++;
    } else {
      console.log(`❌ Stats endpoint failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Stats endpoint error: ${error.message}`);
  }
  console.log('');

  // Test 7: Communication Endpoints Still Working
  totalTests++;
  console.log('📋 Test 7: Communication Overview (Refactored)');
  try {
    const response = await makeRequest('GET', '/api/communication');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Communication overview (refactored) passed');
      console.log('   - Resources:', Object.keys(response.data.data.resources || {}));
      console.log('   - Message:', response.data.message);
      passedTests++;
    } else {
      console.log(`❌ Communication overview failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Communication overview error: ${error.message}`);
  }
  console.log('');

  // Test 8: Communication Books Endpoint
  totalTests++;
  console.log('📋 Test 8: Communication Books Endpoint');
  try {
    const response = await makeRequest('GET', '/api/communication/books?limit=2');
    if (response.status === 200 && response.data.success && response.data.data) {
      console.log('✅ Books endpoint passed');
      console.log('   - Books count:', response.data.data.books?.length || 0);
      passedTests++;
    } else {
      console.log(`❌ Books endpoint failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Books endpoint error: ${error.message}`);
  }
  console.log('');

  // Test 9: Home Content Optimization
  totalTests++;
  console.log('📋 Test 9: Home Content Optimization');
  try {
    const response = await makeRequest('GET', '/api/content/home');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Home content optimization passed');
      console.log('   - Content keys:', Object.keys(response.data.data || {}));
      passedTests++;
    } else {
      console.log(`❌ Home content optimization failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Home content optimization error: ${error.message}`);
  }
  console.log('');

  // Test 10: Campus Life Endpoint
  totalTests++;
  console.log('📋 Test 10: Campus Life Endpoint');
  try {
    const response = await makeRequest('GET', '/api/content/campus-life');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Campus life endpoint passed');
      console.log('   - Campus life content count:', response.data.data.campus_life?.length || 0);
      passedTests++;
    } else {
      console.log(`❌ Campus life endpoint failed: ${response.status}`);
      console.log('   Response:', response.data);
    }
  } catch (error) {
    console.log(`❌ Campus life endpoint error: ${error.message}`);
  }
  console.log('');

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  console.log('═══════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Backend API refactoring successful.\n');
    console.log('📋 Summary of new endpoints:');
    console.log('   • /api/content/* - New modular content endpoints');
    console.log('   • /api/communication/* - Refactored communication endpoints');
    console.log('   • Proper separation of concerns achieved');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }

  console.log('🏁 Test suite completed.\n');
}

// Run the tests
runTests().catch(console.error);
