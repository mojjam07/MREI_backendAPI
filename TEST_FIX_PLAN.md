# API Test Fix Plan

## Issues Identified from Test Output

### 1. Health Check Test Failure
- **Issue**: Returns `"Server is healthy"` but test expects `"Server is running"`
- **File**: `server.js` line ~145
- **Fix**: Change message to "Server is running"

### 2. Registration Returns 400
- **Issue**: Test sends `firstName`, `lastName` (camelCase) but controller expects `first_name`, `last_name` (snake_case)
- **File**: `src/controllers/authController.js` register function
- **Fix**: Accept both camelCase and snake_case, or update test

### 3. Login Returns 401
- **Issue**: 
  - Response structure uses `access`/`refresh` but test expects `accessToken`/`refreshToken`
  - Test user doesn't exist in database
- **File**: `src/controllers/authController.js` login function
- **Fix**: Change response structure to match test expectations

### 4. Protected Endpoints Return 403
- **Issue**: Auth token validation/authorization failing
- **Files**: `src/middleware/auth.js`, test setup
- **Fix**: Ensure proper token generation and validation

### 5. Communication Endpoints Return 500 or Wrong Data Format
- **Issue**: Controllers return `{ data: { events: [...] } }` but tests expect `{ data: [...] }`
- **File**: `src/controllers/communicationController.js`
- **Fix**: Update response structure to match test expectations

### 6. Invalid Endpoints Return 500
- **Issue**: `notFound` middleware not setting 404 status properly
- **File**: `src/middleware/errorHandler.js`
- **Fix**: Ensure status code is properly set

### 7. Rate Limiting Affecting Tests
- **Issue**: Rapid tests hitting rate limit (429)
- **File**: `server.js`
- **Fix**: Increase rate limit or disable for tests

## Detailed Fix Plan

### Step 1: Fix Health Check Message
**File**: `server.js`
```javascript
// Change from "Server is healthy" to "Server is running"
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',  // Changed
    timestamp: new Date().toISOString()
  });
});
```

### Step 2: Fix Auth Controller Response Structure
**File**: `src/controllers/authController.js`

For login:
```javascript
// Change from access/refresh to accessToken/refreshToken
res.json({
  success: true,  // Add this
  message: 'Login successful',  // Add this
  data: {
    accessToken: token,
    refreshToken: refreshToken,
    user: userData
  }
});
```

For register:
```javascript
// Accept camelCase field names
const { username, email, password, role, firstName, lastName, first_name, last_name } = req.body;
const first_name_val = firstName || first_name;
const last_name_val = lastName || last_name;
```

### Step 3: Fix Communication Controller Response Format
**File**: `src/controllers/communicationController.js`

For getNews, getEvents, getBooks:
```javascript
// Return array directly instead of wrapped object
res.json({
  success: true,
  data: news.rows  // Changed from { news: news.rows, pagination: ... }
});
```

### Step 4: Fix Error Handler for 404
**File**: `src/middleware/errorHandler.js`
```javascript
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;  // Explicitly set status code
  next(error);
};
```

### Step 5: Fix Test File
**File**: `test/api.test.js`

Update test expectations:
- Login response: expect `data.accessToken` and `data.refreshToken`
- Communication endpoints: update data structure expectations
- Add proper beforeAll/beforeEach setup for test users

## Implementation Order

1. Fix server.js health check message
2. Fix authController.js login response structure
3. Fix authController.js register field names
4. Fix communicationController.js data format
5. Fix errorHandler.js notFound middleware
6. Update test file for correct expectations
7. Run tests to verify fixes

## Dependencies
- No new dependencies needed
- All fixes are in existing code

