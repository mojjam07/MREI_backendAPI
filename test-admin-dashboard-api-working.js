const axios = require('axios');

// Test the admin dashboard API endpoints
async function testAdminDashboardAPI() {
  const baseURL = 'http://localhost:8000/api';

  console.log('🧪 Testing Admin Dashboard API Endpoints...\n');

  try {
    // First, login to get a token (assuming admin credentials)
    console.log('1. Attempting admin login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@mrei.ac.in', // Adjust based on your admin user
      password: 'admin123' // Adjust based on your admin password
    });

    const token = loginResponse.data.data?.token;
    if (!token) {
      console.log('❌ Login failed - no token received');
      return;
    }
    console.log('✅ Admin login successful\n');

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test students endpoint
    console.log('2. Testing /api/dashboard/admin/students endpoint...');
    try {
      const studentsResponse = await axios.get(`${baseURL}/dashboard/admin/students`, { headers });
      console.log('✅ Students endpoint working');
      console.log(`   - Status: ${studentsResponse.status}`);
      console.log(`   - Total students: ${studentsResponse.data.data?.students?.length || 0}`);
    } catch (error) {
      console.log('❌ Students endpoint failed:', error.response?.status, error.response?.statusText);
    }

    // Test tutors endpoint
    console.log('\n3. Testing /api/dashboard/admin/tutors endpoint...');
    try {
      const tutorsResponse = await axios.get(`${baseURL}/dashboard/admin/tutors`, { headers });
      console.log('✅ Tutors endpoint working');
      console.log(`   - Status: ${tutorsResponse.status}`);
      console.log(`   - Total tutors: ${tutorsResponse.data.data?.tutors?.length || 0}`);
    } catch (error) {
      console.log('❌ Tutors endpoint failed:', error.response?.status, error.response?.statusText);
    }

    // Test dashboard stats endpoint
    console.log('\n4. Testing /api/dashboard/stats endpoint...');
    try {
      const statsResponse = await axios.get(`${baseURL}/dashboard/stats`, { headers });
      console.log('✅ Stats endpoint working');
      console.log(`   - Status: ${statsResponse.status}`);
      console.log(`   - Stats data:`, JSON.stringify(statsResponse.data.data?.statistics, null, 2));
    } catch (error) {
      console.log('❌ Stats endpoint failed:', error.response?.status, error.response?.statusText);
    }

    console.log('\n🎉 Admin Dashboard API testing completed!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testAdminDashboardAPI();
