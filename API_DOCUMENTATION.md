# Content Management API Documentation

## Overview

The Content Management API provides endpoints for managing various types of content including news, events, testimonials, and campus life content. This API has been refactored from a monolithic structure to a modular one for better maintainability and performance.

## Base URL

```
http://localhost:3000/api/content
```

## Authentication

Some endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Content Overview

#### GET /content

Provides an overview of all content types with counts and previews.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_news": 25,
      "upcoming_events": 8,
      "approved_testimonials": 15,
      "campus_life_content": 12,
      "available_books": 150,
      "new_messages": 3
    },
    "recent_news": [...],
    "upcoming_events": [...],
    "featured_testimonials": [...],
    "resources": {
      "stats": "/api/content/stats",
      "news": "/api/content/news",
      "events": "/api/content/events",
      "testimonials": "/api/content/testimonials",
      "campus_life": "/api/content/campus-life",
      "home": "/api/content/home"
    }
  }
}
```

### 2. Statistics

#### GET /content/stats

Returns comprehensive statistics about the system.

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "active_students": 450,
      "tutors": 25,
      "courses": 85,
      "total_assignments": 1200,
      "total_submissions": 2100,
      "total_enrollments": 3400,
      "recent_news": 12,
      "upcoming_events": 8,
      "recent_messages": 15,
      "success_rate": 87
    }
  }
}
```

### 3. News Management

#### GET /content/news

Get all published news with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `category` (string) - Filter by category
- `search` (string) - Search in title and content

**Response:**
```json
{
  "success": true,
  "data": {
    "news": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET /content/news/:id

Get a specific news item by ID.

**Parameters:**
- `id` (number) - News ID

**Response:**
```json
{
  "success": true,
  "data": {
    "news": {
      "id": 1,
      "title": "News Title",
      "content": "News content...",
      "category": "academic",
      "author": "Admin",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "published": true
    }
  }
}
```

#### POST /content/news

Create new news item. **Requires Admin authentication.**

**Request Body:**
```json
{
  "title": "News Title",
  "content": "News content...",
  "category": "academic",
  "author": "Admin User",
  "published": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "News created successfully",
  "data": {
    "news": {...}
  }
}
```

#### PUT /content/news/:id

Update existing news item. **Requires Admin authentication.**

#### DELETE /content/news/:id

Delete news item. **Requires Admin authentication.**

### 4. Events Management

#### GET /content/events

Get all events with filtering and pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `upcoming` (boolean) - Filter for upcoming events only
- `search` (string) - Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": {...}
  }
}
```

#### POST /content/events

Create new event. **Requires Admin authentication.**

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description...",
  "event_date": "2024-02-15T14:00:00Z",
  "location": "Main Auditorium",
  "organizer": "Academic Affairs"
}
```

### 5. Testimonials

#### GET /content/testimonials

Get approved testimonials with optional rating filter.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `rating` (number) - Minimum rating filter

**Response:**
```json
{
  "success": true,
  "data": {
    "testimonials": [...],
    "pagination": {...}
  }
}
```

#### POST /content/testimonials

Create new testimonial. **Public endpoint.**

**Request Body:**
```json
{
  "student_name": "John Doe",
  "content": "Great experience...",
  "rating": 5,
  "position": "Software Engineer",
  "company": "Tech Corp"
}
```

### 6. Campus Life

#### GET /content/campus-life

Get all campus life content.

**Response:**
```json
{
  "success": true,
  "data": {
    "campus_life": [...]
  }
}
```

### 7. Home Content

#### GET /content/home

Get optimized content for the home page including recent news, upcoming events, testimonials, and campus life.

**Response:**
```json
{
  "success": true,
  "data": {
    "news": [...],
    "events": [...],
    "testimonials": [...],
    "campus_life": [...]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### News
```javascript
{
  id: Number,
  title: String,
  content: Text,
  category: String,
  author: String,
  published: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Event
```javascript
{
  id: Number,
  title: String,
  description: Text,
  event_date: DateTime,
  location: String,
  organizer: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Testimonial
```javascript
{
  id: Number,
  student_name: String,
  content: Text,
  rating: Number (1-5),
  position: String,
  company: String,
  approved: Boolean,
  created_at: DateTime
}
```

### Campus Life
```javascript
{
  id: Number,
  title: String,
  content: Text,
  image_url: String,
  category: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Caching

Consider implementing caching for frequently accessed endpoints like `/stats` and `/home`.

## Security Considerations

1. All admin endpoints require JWT authentication
2. Input validation is performed on all endpoints
3. SQL injection protection through parameterized queries
4. XSS protection through proper input sanitization

## Migration from Old API

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.
