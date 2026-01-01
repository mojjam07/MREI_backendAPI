# Jest Test Fixes - TODO List

## Issues Identified

1. **POST /api/auth/register** - Returns 400 instead of 201
2. **GET /api/users, /api/students, /api/tutors** - `response.body.data` is an object with pagination, but tests expect it to be an array
3. **GET /api/academics/courses & /api/academics/assignments** - PostgreSQL error "could not determine data type of parameter $1"
4. **CORS headers** - Missing `access-control-allow-origin` header

## Fixes to Implement

### 1. Fix academicController.js
- [ ] Fix count query parameter mismatch in `getCourses` function
- [ ] Fix count query parameter mismatch in `getAssignments` function

### 2. Fix userController.js
- [ ] Change response to return `data: users.rows` directly instead of wrapping in pagination object

### 3. Fix studentController.js
- [ ] Change response to return `data: students.rows` directly instead of wrapping in pagination object

### 4. Fix tutorController.js
- [ ] Change response to return `data: tutors.rows` directly instead of wrapping in pagination object

### 5. Fix server.js
- [ ] Add explicit CORS headers for test environment (when no Origin header is sent)

### 6. Fix authController.js
- [ ] Ensure registration handles DB constraints properly

### 7. Run tests to verify
- [ ] Run Jest tests to verify all fixes work

## Notes
- The tests expect `response.body.data` to be an array for GET /api/users, /api/students, /api/tutors
- The academic endpoints have a bug where the count query uses wrong parameter placeholders
- CORS headers need to be added when Origin header is missing (test environment)

