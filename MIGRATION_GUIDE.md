# API Migration Guide

## Overview

This guide provides instructions for migrating from the old monolithic API structure to the new modular content and communication API structure.

## Key Changes

### Before (Monolithic Structure)
```
/api/communication/
├── /contact        - Contact messages
├── /books         - Digital library
├── /news          - News management (MOVED)
├── /events        - Events management (MOVED)
├── /testimonials  - Testimonials management (MOVED)
└── /home-content  - Combined home content (MOVED)
```

### After (Modular Structure)
```
/api/content/
├── /stats          - System statistics
├── /news           - News management
├── /events         - Events management
├── /testimonials   - Testimonials management
├── /campus-life    - Campus life content
└── /home           - Combined home content (optimized)

/api/communication/
├── /contact        - Contact messages
└── /books         - Digital library
```

## Migration Steps

### 1. Update API Endpoints

Replace old endpoints with new ones:

#### News Management
```javascript
// OLD - Still works but deprecated
GET /api/communication/news
GET /api/communication/news/:id
POST /api/communication/news
PUT /api/communication/news/:id
DELETE /api/communication/news/:id

// NEW - Recommended
GET /api/content/news
GET /api/content/news/:id
POST /api/content/news
PUT /api/content/news/:id
DELETE /api/content/news/:id
```

#### Events Management
```javascript
// OLD - Still works but deprecated
GET /api/communication/events
POST /api/communication/events

// NEW - Recommended
GET /api/content/events
POST /api/content/events
```

#### Testimonials
```javascript
// OLD - Still works but deprecated
GET /api/communication/testimonials
POST /api/communication/testimonials

// NEW - Recommended
GET /api/content/testimonials
POST /api/content/testimonials
```

#### Home Content
```javascript
// OLD - Still works but deprecated
GET /api/communication/home-content

// NEW - Recommended
GET /api/content/home
```

### 2. Update Frontend Code

#### React Components

Update API calls in React components:

```javascript
// OLD - Deprecated
import { apiClient } from '../services/apiClient';

// Example old usage
const fetchNews = async () => {
  const response = await apiClient.get('/communication/news');
  return response.data;
};

// NEW - Recommended
const fetchNews = async () => {
  const response = await apiClient.get('/content/news');
  return response.data;
};
```

#### API Service Updates

Update `src/services/apiClient.js`:

```javascript
// Add new content API methods
export const contentAPI = {
  // News
  getNews: (params) => apiClient.get('/content/news', { params }),
  getNewsById: (id) => apiClient.get(`/content/news/${id}`),
  createNews: (data) => apiClient.post('/content/news', data),
  updateNews: (id, data) => apiClient.put(`/content/news/${id}`, data),
  deleteNews: (id) => apiClient.delete(`/content/news/${id}`),
  
  // Events
  getEvents: (params) => apiClient.get('/content/events', { params }),
  createEvent: (data) => apiClient.post('/content/events', data),
  
  // Testimonials
  getTestimonials: (params) => apiClient.get('/content/testimonials', { params }),
  createTestimonial: (data) => apiClient.post('/content/testimonials', data),
  
  // Home Content
  getHomeContent: () => apiClient.get('/content/home'),
  
  // Stats
  getStats: () => apiClient.get('/content/stats'),
  
  // Campus Life
  getCampusLife: () => apiClient.get('/content/campus-life')
};
```

### 3. Update React Components

#### News Components
```javascript
// Before
import { apiClient } from '../services/apiClient';

const NewsComponent = () => {
  const [news, setNews] = useState([]);
  
  useEffect(() => {
    const fetchNews = async () => {
      const response = await apiClient.get('/communication/news');
      setNews(response.data.data.news);
    };
    fetchNews();
  }, []);
  
  return (
    <div>
      {news.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
};

// After
import { contentAPI } from '../services/apiClient';

const NewsComponent = () => {
  const [news, setNews] = useState([]);
  
  useEffect(() => {
    const fetchNews = async () => {
      const response = await contentAPI.getNews();
      setNews(response.data.data.news);
    };
    fetchNews();
  }, []);
  
  return (
    <div>
      {news.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
};
```

#### Home Page Content
```javascript
// Before
const HomePage = () => {
  const [content, setContent] = useState({});
  
  useEffect(() => {
    const fetchHomeContent = async () => {
      const response = await apiClient.get('/communication/home-content');
      setContent(response.data.data);
    };
    fetchHomeContent();
  }, []);
  
  return (
    <div>
      <NewsSection news={content.news} />
      <EventsSection events={content.events} />
      <TestimonialsSection testimonials={content.testimonials} />
    </div>
  );
};

// After
const HomePage = () => {
  const [content, setContent] = useState({});
  
  useEffect(() => {
    const fetchHomeContent = async () => {
      const response = await contentAPI.getHomeContent();
      setContent(response.data.data);
    };
    fetchHomeContent();
  }, []);
  
  return (
    <div>
      <NewsSection news={content.news} />
      <EventsSection events={content.events} />
      <TestimonialsSection testimonials={content.testimonials} />
    </div>
  );
};
```

### 4. Test the Migration

After updating your code, test the following:

1. **News Management**
   - [ ] List news articles
   - [ ] View individual news article
   - [ ] Create new news article (admin only)
   - [ ] Update news article (admin only)
   - [ ] Delete news article (admin only)

2. **Events Management**
   - [ ] List events
   - [ ] Filter upcoming events
   - [ ] Create new event (admin only)

3. **Testimonials**
   - [ ] List approved testimonials
   - [ ] Create new testimonial (public)
   - [ ] Filter by rating

4. **Home Content**
   - [ ] Get combined home page content
   - [ ] Verify all sections load correctly

5. **Statistics**
   - [ ] Get system statistics
   - [ ] Verify all counts are accurate

## Deprecation Timeline

### Phase 1 (Current)
- New modular API is available
- Old endpoints still functional with deprecation warnings
- Recommended to migrate to new endpoints

### Phase 2 (3 months from now)
- Old endpoints will return enhanced deprecation warnings
- Performance monitoring of old endpoints
- Documentation updates

### Phase 3 (6 months from now)
- Old endpoints will be disabled by default
- Opt-in to continue using old endpoints
- Final migration deadline communicated

### Phase 4 (9 months from now)
- Old endpoints completely removed
- Only new modular API available

## Breaking Changes

### Response Format Changes

The new API maintains the same response format but with improved consistency:

```javascript
// Consistent response format across all endpoints
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

### Pagination Changes

Pagination now uses consistent parameter names:

```javascript
// Query parameters
{
  "page": 1,        // Page number (1-based)
  "limit": 10,      // Items per page
  "search": "text", // Search term (optional)
  "category": "cat" // Category filter (optional)
}

// Response includes pagination metadata
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **404 Errors**
   - Ensure you're using the correct endpoint path
   - Check that the endpoint exists in the new API

2. **Authentication Errors**
   - Verify JWT token is still valid
   - Check if the endpoint requires admin privileges

3. **Data Format Changes**
   - Review the API documentation for expected data structures
   - Update frontend code to handle new data formats

### Getting Help

- Check the API documentation at `/api/docs` (when available)
- Review console logs for detailed error messages
- Contact the development team for migration assistance

## Rollback Plan

If you need to rollback to the old API:

1. Revert frontend code changes
2. Update API endpoints back to `/communication/*`
3. Test all functionality
4. Report issues to the development team

**Note**: Rollback should only be temporary while addressing specific migration issues.
