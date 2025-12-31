/**
 * Test file for dataTransformer.js
 * Verifies transformStudents and transformTutors functions work correctly
 */

const { transformStudents, transformTutors } = require('./src/utils/dataTransformer');

// Test data mimicking DB response
const mockStudents = [
  {
    id: '123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    student_id: 'STU001',
    is_active: true,
    date_of_birth: '2000-01-15',
    address: '123 Main St',
    emergency_contact: '555-1234',
    enrolled_courses: 5,
    total_submissions: 10,
    average_score: 85.5,
    created_at: new Date(),
    last_login: new Date()
  },
  {
    id: '456',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    student_id: 'STU002',
    is_active: false
  }
];

const mockTutors = [
  {
    id: 't1',
    first_name: 'Dr. Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    tutor_id: 'TUT001',
    specialization: 'Computer Science',
    qualification: 'PhD',
    experience_years: 10,
    is_active: true
  },
  {
    id: 't2',
    first_name: 'Prof. Michael',
    last_name: 'Brown',
    email: 'michael.brown@example.com',
    tutor_id: 'TUT002',
    specialization: 'Mathematics',
    qualification: 'PhD',
    experience_years: 15,
    is_active: false
  }
];

console.log('=== Testing transformStudents ===');
const students = transformStudents(mockStudents);
console.log(JSON.stringify(students, null, 2));

console.log('\n=== Testing transformTutors ===');
const tutors = transformTutors(mockTutors);
console.log(JSON.stringify(tutors, null, 2));

// Verify required fields
console.log('\n=== Verification ===');
console.log('Student 1 has name:', !!students[0].name, '- Value:', students[0].name);
console.log('Student 1 has status:', !!students[0].status, '- Value:', students[0].status);
console.log('Student 1 has program:', !!students[0].program, '- Value:', students[0].program);
console.log('Student 2 has status (inactive):', students[1].status === 'inactive', '- Value:', students[1].status);
console.log('Student 2 is_active matches status:', students[1].is_active === false);

console.log('\nTutor 1 has name:', !!tutors[0].name, '- Value:', tutors[0].name);
console.log('Tutor 1 has status:', !!tutors[0].status, '- Value:', tutors[0].status);
console.log('Tutor 1 is_active matches status:', tutors[0].is_active === true);
console.log('Tutor 2 has status (inactive):', tutors[1].status === 'inactive', '- Value:', tutors[1].status);
console.log('Tutor 2 is_active matches status:', tutors[1].is_active === false);

// Summary
console.log('\n=== Test Summary ===');
const allTestsPassed = 
  students[0].name === 'John Doe' &&
  students[0].status === 'active' &&
  students[1].status === 'inactive' &&
  tutors[0].name === 'Dr. Sarah Johnson' &&
  tutors[0].status === 'active' &&
  tutors[1].status === 'inactive';

if (allTestsPassed) {
  console.log('✅ All tests PASSED!');
  process.exit(0);
} else {
  console.log('❌ Some tests FAILED!');
  process.exit(1);
}

