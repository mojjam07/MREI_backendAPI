#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BASE_URL = 'http://localhost:8000/api';

// Test users (from seeding)
const TEST_USERS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  tutor: { username: 'tutor', password: 'tutor123', role: 'tutor' },
  student: { username: 'student', password: 'student123', role: 'student' }
};

// Store tokens for each user
const userTokens = {};
const userProfiles = {};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Helper function to log test results
function logTest(testName, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : '❌';
  const statusColor = status === 'PASS' ? chalk.green : chalk.red;
  
  console.log(`${statusIcon} ${testName}: ${statusColor(status)} ${details}`);
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push(`${testName}: ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

// Helper function to make API requests
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 5000
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (error.response) {
      return { 
        success: false, 
        status: error.response.status, 
        data: error.response.data,
        error: error.response.statusText 
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'No response received',
        details: error.message 
      };
    } else {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

// Phase 1: Test server health
async function testServerHealth() {
  console.log('\n' + chalk.blue.bold('=== PHASE 1: SERVER HEALTH TESTS ==='));
  
  // Test health endpoint
  const healthResult = await makeRequest('GET', '/health');
  if (healthResult.success && healthResult.data.success) {
    logTest('Health Check', 'PASS', 'Server is responding correctly');
  } else {
    logTest('Health Check', 'FAIL', healthResult.error || 'Unexpected response');
  }
}

// Phase 2: Authentication tests
async function testAuthentication() {
  console.log('\n' + chalk.blue.bold('=== PHASE 2: AUTHENTICATION TESTS ==='));
  
  // Test login for each user type
  for (const [userType, credentials] of Object.entries(TEST_USERS)) {
    console.log(`\nTesting ${userType} login...`);
    
    const loginResult = await makeRequest('POST', '/auth/login', credentials);
    
    if (loginResult.success && loginResult.data.token) {
      userTokens[userType] = loginResult.data.token;
      userProfiles[userType] = loginResult.data.user;
      
      logTest(`${userType} Login`, 'PASS', `Token received: ${loginResult.data.token.substring(0, 20)}...`);
    } else {
      logTest(`${userType} Login`, 'FAIL', loginResult.error || 'No token received');
    }
    
    // Test invalid login
    const invalidLogin = await makeRequest('POST', '/auth/login', {
      username: credentials.username,
      password: 'wrongpassword'
    });
    
    if (!invalidLogin.success && invalidLogin.status === 401) {
      logTest(`${userType} Invalid Login`, 'PASS', 'Correctly rejected invalid credentials');
    } else {
      logTest(`${userType} Invalid Login`, 'FAIL', 'Should have rejected invalid credentials');
    }
  }
}

// Phase 3: Protected endpoints tests
async function testProtectedEndpoints() {
  console.log('\n' + chalk.blue.bold('=== PHASE 3: PROTECTED ENDPOINTS TESTS ==='));
  
  const protectedEndpoints = [
    '/auth/user',
    '/dashboard',
    '/students',
    '/tutors',
    '/academics',
    '/communication',
    '/admin',
    '/search',
    '/users'
  ];
  
  // Test with valid tokens
  for (const [userType, token] of Object.entries(userTokens)) {
    console.log(`\nTesting ${userType} access to protected endpoints...`);
    
    for (const endpoint of protectedEndpoints) {
      const authHeader = { 'Authorization': `Bearer ${token}` };
      const result = await makeRequest('GET', endpoint, null, authHeader);
      
      if (result.success) {
        logTest(`${userType} ${endpoint}`, 'PASS', `Status: ${result.status}`);
      } else {
        // Some endpoints might require specific roles, so we expect some failures
        const isExpectedFailure = (
          (userType === 'student' && endpoint === '/admin') ||
          (userType === 'tutor' && endpoint === '/admin') ||
          (userType === 'student' && endpoint === '/tutors') ||
          (userType === 'student' && endpoint === '/users')
        );
        
        if (isExpectedFailure && (result.status === 403 || result.status === 404)) {
          logTest(`${userType} ${endpoint}`, 'PASS', `Expected role-based access denied (${result.status})`);
        } else {
          logTest(`${userType} ${endpoint}`, 'FAIL', `Status: ${result.status || 'No response'}`);
        }
      }
    }
  }
  
  // Test with invalid/missing tokens
  console.log('\nTesting endpoint access without valid tokens...');
  
  const invalidToken = 'invalid.jwt.token';
  const authHeader = { 'Authorization': `Bearer ${invalidToken}` };
  
  const unauthorizedResult = await makeRequest('GET', '/auth/user', null, authHeader);
  
  if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
    logTest('Invalid Token Protection', 'PASS', 'Correctly rejected invalid token');
  } else {
    logTest('Invalid Token Protection', 'FAIL', 'Should have rejected invalid token');
  }
  
  // Test without authorization header
  const noAuthResult = await makeRequest('GET', '/auth/user');
  
  if (!noAuthResult.success && noAuthResult.status === 401) {
    logTest('No Token Protection', 'PASS', 'Correctly rejected request without token');
  } else {
    logTest('No Token Protection', 'FAIL', 'Should have rejected request without token');
  }
}

// Phase 4: Token refresh tests
async function testTokenRefresh() {
  console.log('\n' + chalk.blue.bold('=== PHASE 4: TOKEN REFRESH TESTS ==='));
  
  // Test token refresh for admin user
  const adminToken = userTokens.admin;
  if (adminToken) {
    const refreshResult = await makeRequest('POST', '/auth/refresh', {
      token: adminToken
    });
    
    if (refreshResult.success && refreshResult.data.token) {
      logTest('Token Refresh', 'PASS', 'New token received');
    } else {
      logTest('Token Refresh', 'FAIL', refreshResult.error || 'No new token received');
    }
  }
}

// Phase 5: Logout tests
async function testLogout() {
  console.log('\n' + chalk.blue.bold('=== PHASE 5: LOGOUT TESTS ==='));
  
  // Test logout for admin user
  const adminToken = userTokens.admin;
  if (adminToken) {
    const authHeader = { 'Authorization': `Bearer ${adminToken}` };
    const logoutResult = await makeRequest('POST', '/auth/logout', null, authHeader);
    
    if (logoutResult.success) {
      logTest('Logout', 'PASS', 'Successfully logged out');
    } else {
      logTest('Logout', 'FAIL', logoutResult.error || 'Logout failed');
    }
    
    // Try to use the token after logout
    const afterLogoutResult = await makeRequest('GET', '/auth/user', null, authHeader);
    
    if (!afterLogoutResult.success && afterLogoutResult.status === 401) {
      logTest('Post-Logout Token Validation', 'PASS', 'Token correctly invalidated after logout');
    } else {
      logTest('Post-Logout Token Validation', 'FAIL', 'Token should be invalid after logout');
    }
  }
}

// Phase 6: Registration tests
async function testRegistration() {
  console.log('\n' + chalk.blue.bold('=== PHASE 6: REGISTRATION TESTS ==='));
  
  // Test user registration
  const newUser = {
    username: 'testuser_' + Date.now(),
    password: 'testpass123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'student'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', newUser);
  
  if (registerResult.success && registerResult.data.user) {
    logTest('User Registration', 'PASS', `User created: ${registerResult.data.user.username}`);
  } else {
    logTest('User Registration', 'FAIL', registerResult.error || 'Registration failed');
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n' + chalk.blue.bold('=== COMPREHENSIVE TEST REPORT ==='));
  
  const totalTests = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / totalTests) * 100).toFixed(2);
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Passed: ${chalk.green(testResults.passed)}`);
  console.log(`Failed: ${chalk.red(testResults.failed)}`);
  console.log(`Pass Rate: ${chalk.yellow(passRate)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n' + chalk.red.bold('Failed Tests:'));
    testResults.errors.forEach(error => {
      console.log(`  ❌ ${error}`);
    });
  }
  
  console.log('\n' + chalk.blue.bold('User Authentication Summary:'));
  for (const [userType, profile] of Object.entries(userProfiles)) {
    console.log(`  ${userType}: ${profile.username} (${profile.role}) - Token: ${userTokens[userType]?.substring(0, 20)}...`);
  }
  
  // Save detailed results to file
  const fs = require('fs');
  const reportData = {
    summary: {
      totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      passRate: `${passRate}%`
    },
    userTokens: Object.keys(userTokens).reduce((acc, key) => {
      acc[key] = `${userTokens[key].substring(0, 20)}...`;
      return acc;
    }, {}),
    userProfiles,
    testDetails: testResults.details,
    errors: testResults.errors,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync('/home/ubuntu/MahduGrandFinal/backend-api/test-results.json', JSON.stringify(reportData, null, 2));
  console.log('\n📄 Detailed test results saved to test-results.json');
}

// Main test execution
async function runAllTests() {
  console.log(chalk.blue.bold('🚀 Starting Comprehensive API Testing...'));
  console.log(chalk.yellow(`Base URL: ${BASE_URL}`));
  console.log(chalk.yellow('Test Users:'));
  Object.entries(TEST_USERS).forEach(([type, user]) => {
    console.log(`  ${type}: ${user.username} / ${user.password}`);
  });
  
  try {
    // Phase 1: Server Health
    await testServerHealth();
    
    // Phase 2: Authentication
    await testAuthentication();
    
    // Phase 3: Protected Endpoints
    await testProtectedEndpoints();
    
    // Phase 4: Token Refresh
    await testTokenRefresh();
    
    // Phase 5: Logout
    await testLogout();
    
    // Phase 6: Registration
    await testRegistration();
    
    // Generate final report
    generateTestReport();
    
  } catch (error) {
    console.error(chalk.red.bold('Test execution failed:'), error.message);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, makeRequest };
