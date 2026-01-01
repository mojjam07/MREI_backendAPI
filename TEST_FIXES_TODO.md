# Test Fixes TODO

## Issues to Fix
1. POST /api/auth/register - Returns 400 instead of 201
2. GET /api/academics/courses - Returns 500 with PostgreSQL error
3. GET /api/academics/assignments - Returns 500 with PostgreSQL error

## Plan
- [x] Analyze test failures and root causes
- [ ] Fix academicController.js - UUID parameter casting and pagination
- [ ] Add test cleanup for duplicate users
- [ ] Run tests to verify fixes

## Actions Taken
1. Analyzed academicController.js - Found issues with:
   - tutor_id and course_id being passed as strings to UUID columns
   - Pagination logic not handling cases when no filters are present

2. Identified authController.js issue:
   - Registration returns 400 due to duplicate users from previous test runs

## Fixes Needed
1. In academicController.js:
   - Cast tutor_id to UUID using ::UUID or pool.query with proper types
   - Cast course_id to UUID
   - Fix pagination parameter counting

2. In api.test.js:
   - Add beforeAll/afterAll cleanup to delete test users
   - Use unique usernames/emails per test run

