#!/usr/bin/env node

/**
 * Phase 3 Final Testing and Validation Script
 * Tests the new content API endpoints and validates the refactoring
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';
const API_TIMEOUT = 10000;

class ContentAPITester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
    this.testResults.total++;
    
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      
      if (response.status === expectedStatus) {
        this.testResults.passed++;
        this.log(`${method.toUpperCase()} ${endpoint} - PASSED (Status: ${response.status})`, 'success');
        return { success: true, data: response.data, status: response.status };
      } else {
        this.testResults.failed++;
        this.log(`${method.toUpperCase()} ${endpoint} - FAILED (Expected: ${expectedStatus}, Got: ${response.status})`, 'error');
        return { success: false, error: `Status ${response.status}`, status: response.status };
      }

    } catch (error) {
      this.testResults.failed++;
      const errorMessage = error.response ? 
        `${error.response.status}: ${error.response.data?.message || error.message}` : 
        error.message;
      
      this.log(`${method.toUpperCase()} ${endpoint} - FAILED: ${errorMessage}`, 'error');
      this.errors.push(`${method.toUpperCase()} ${endpoint}: ${errorMessage}`);
      
      return { success: false, error: errorMessage };
    }
  }

  async validateResponseStructure(response, expectedFields = []) {
    if (!response.success || !response.data) {
      return false;
    }

    // Check if response has success flag
    if (response.data.success !== true) {
      return false;
    }

    // Check expected fields
    for (const field of expectedFields) {
      if (!response.data.hasOwnProperty(field)) {
        return false;
      }
    }

    return true;
  }

  async runContentEndpointTests() {
    this.log('Starting Content API Endpoint Tests', 'info');

    // Test 1: Content Overview
    const overviewResponse = await this.testEndpoint('GET', '/content');
    if (overviewResponse.success) {
      await this.validateResponseStructure(overviewResponse, ['data']);
    }

    // Test 2: Statistics
    const statsResponse = await this.testEndpoint('GET', '/content/stats');
    if (statsResponse.success) {
      await this.validateResponseStructure(statsResponse, ['data']);
    }

    // Test 3: News Endpoints
    const newsListResponse = await this.testEndpoint('GET', '/content/news');
    if (newsListResponse.success) {
      await this.validateResponseStructure(newsListResponse, ['data']);
    }

    const newsByIdResponse = await this.testEndpoint('GET', '/content/news/1');
    if (newsByIdResponse.success) {
      await this.validateResponseStructure(newsByIdResponse, ['data']);
    }

    // Test 4: Events Endpoints
    const eventsListResponse = await this.testEndpoint('GET', '/content/events');
    if (eventsListResponse.success) {
      await this.validateResponseStructure(eventsListResponse, ['data']);
    }

    // Test 5: Testimonials Endpoints
    const testimonialsResponse = await this.testEndpoint('GET', '/content/testimonials');
    if (testimonialsResponse.success) {
      await this.validateResponseStructure(testimonialsResponse, ['data']);
    }

    // Test 6: Campus Life
    const campusLifeResponse = await this.testEndpoint('GET', '/content/campus-life');
    if (campusLifeResponse.success) {
      await this.validateResponseStructure(campusLifeResponse, ['data']);
    }

    // Test 7: Home Content (Optimized)
    const homeContentResponse = await this.testEndpoint('GET', '/content/home');
    if (homeContentResponse.success) {
      await this.validateResponseStructure(homeContentResponse, ['data']);
    }

    // Test 8: Create Testimonial (Public endpoint)
    const createTestimonialData = {
      student_name: 'Test Student',
      content: 'This is a test testimonial',
      rating: 5,
      position: 'Software Developer',
      company: 'Test Company'
    };
    const createTestimonialResponse = await this.testEndpoint('POST', '/content/testimonials', createTestimonialData, 201);
  }

  async runCommunicationEndpointTests() {
    this.log('Starting Communication API Endpoint Tests', 'info');

    // Test 1: Communication Overview
    const commOverviewResponse = await this.testEndpoint('GET', '/communication');
    if (commOverviewResponse.success) {
      await this.validateResponseStructure(commOverviewResponse, ['data']);
    }

    // Test 2: Books (Public endpoint)
    const booksResponse = await this.testEndpoint('GET', '/communication/books');
    if (booksResponse.success) {
      await this.validateResponseStructure(booksResponse, ['data']);
    }

    // Test 3: Contact Message (Public endpoint)
    const contactData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      message: 'This is a test message'
    };
    const contactResponse = await this.testEndpoint('POST', '/communication/contact', contactData, 201);
  }

  async runDeprecationWarningTests() {
    this.log('Testing Deprecation Warnings', 'info');

    // Test that old endpoints return deprecation headers
    try {
      const response = await axios.get(`${BASE_URL}/content`, {
        timeout: API_TIMEOUT
      });

      const headers = response.headers;
      const deprecationHeaders = [
        'x-api-version',
        'x-api-deprecated',
        'x-api-deprecation-date'
      ];

      let hasDeprecationHeaders = true;
      for (const header of deprecationHeaders) {
        if (!headers[header]) {
          hasDeprecationHeaders = false;
          break;
        }
      }

      if (hasDeprecationHeaders) {
        this.testResults.passed++;
        this.log('Deprecation headers present - PASSED', 'success');
      } else {
        this.testResults.failed++;
        this.log('Missing deprecation headers - FAILED', 'error');
      }

    } catch (error) {
      this.testResults.failed++;
      this.log(`Deprecation header test failed: ${error.message}`, 'error');
    }
  }

  async runPerformanceTests() {
    this.log('Running Basic Performance Tests', 'info');

    // Test response times for key endpoints
    const endpoints = [
      '/content',
      '/content/stats',
      '/content/news',
      '/content/home'
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        await axios.get(`${BASE_URL}${endpoint}`, { timeout: API_TIMEOUT });
        const responseTime = Date.now() - startTime;

        if (responseTime < 1000) { // Less than 1 second
          this.testResults.passed++;
          this.log(`${endpoint} response time: ${responseTime}ms - PASSED`, 'success');
        } else {
          this.testResults.failed++;
          this.log(`${endpoint} response time: ${responseTime}ms - FAILED (too slow)`, 'warning');
        }

      } catch (error) {
        this.testResults.failed++;
        this.log(`${endpoint} performance test failed: ${error.message}`, 'error');
      }
    }
  }

  generateReport() {
    this.log('\n=== PHASE 3 TESTING REPORT ===', 'info');
    this.log(`Total Tests: ${this.testResults.total}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'success');
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    this.log(`Success Rate: ${successRate}%`, this.testResults.failed === 0 ? 'success' : 'warning');

    if (this.errors.length > 0) {
      this.log('\nErrors encountered:', 'error');
      this.errors.forEach(error => {
        this.log(`  - ${error}`, 'error');
      });
    }

    if (this.testResults.failed === 0) {
      this.log('\n🎉 All tests passed! Phase 3 implementation is successful!', 'success');
    } else {
      this.log('\n⚠️ Some tests failed. Please review the errors above.', 'warning');
    }

    return {
      total: this.testResults.total,
      passed: this.testResults.passed,
      failed: this.testResults.failed,
      successRate: parseFloat(successRate),
      errors: this.errors
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Phase 3 Final Testing and Validation', 'info');
    this.log('==============================================', 'info');

    try {
      // Test if server is running
      await axios.get('http://localhost:8000/health', { timeout: 5000 });
      this.log('✅ Backend server is running', 'success');
    } catch (error) {
      this.log('❌ Backend server is not running. Please start it first.', 'error');
      this.log('Run: cd backend-api && npm start', 'info');
      return;
    }

    // Run all test suites
    await this.runContentEndpointTests();
    await this.runCommunicationEndpointTests();
    await this.runDeprecationWarningTests();
    await this.runPerformanceTests();

    // Generate final report
    const report = this.generateReport();
    return report;
  }
}

// Main execution
if (require.main === module) {
  const tester = new ContentAPITester();
  tester.runAllTests().then(report => {
    process.exit(report.failed === 0 ? 0 : 1);
  }).catch(error => {
    console.error('Testing failed:', error);
    process.exit(1);
  });
}

module.exports = ContentAPITester;
