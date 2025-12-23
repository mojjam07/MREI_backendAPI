# Express.js Backend API

A comprehensive REST API for a school management system built with Express.js, PostgreSQL, and JWT authentication.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user management system with students, tutors, and admins
- **Academic Management**: Courses, assignments, enrollments, submissions, and attendance tracking
- **Communication**: News, events, testimonials, and contact management
- **Dashboard**: Role-specific dashboard data and statistics
- **Search**: Global search functionality across all entities
- **Security**: Helmet, rate limiting, CORS, and input validation
- **Database**: PostgreSQL with comprehensive schema and relationships

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration:
   - Database connection details
   - JWT secrets
   - SMTP settings (optional)
   - Other configuration options

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb school_management
   
   # Run migrations
   psql school_management < migrations/001_initial_schema.sql
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Change password
- `DELETE /api/users/:id` - Delete user (Admin only)

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student profile
- `DELETE /api/students/:id` - Delete student (Admin only)
- `GET /api/students/:id/courses` - Get student's courses
- `GET /api/students/:id/assignments` - Get student's assignments
- `GET /api/students/:id/attendance` - Get student's attendance

### Tutors
- `GET /api/tutors` - Get all tutors
- `GET /api/tutors/:id` - Get tutor by ID
- `PUT /api/tutors/:id` - Update tutor profile
- `DELETE /api/tutors/:id` - Delete tutor (Admin only)
- `GET /api/tutors/:id/courses` - Get tutor's courses
- `GET /api/tutors/:id/students` - Get tutor's students
- `GET /api/tutors/:id/submissions` - Get tutor's submissions
- `GET /api/tutors/:id/dashboard-stats` - Get tutor dashboard stats

### Academics
- `GET /api/academics/courses` - Get all courses
- `POST /api/academics/courses` - Create course (Tutor/Admin)
- `GET /api/academics/courses/:id` - Get course by ID
- `PUT /api/academics/courses/:id` - Update course (Tutor/Admin)
- `DELETE /api/academics/courses/:id` - Delete course (Tutor/Admin)
- `GET /api/academics/assignments` - Get all assignments
- `POST /api/academics/assignments` - Create assignment (Tutor/Admin)
- `GET /api/academics/assignments/:id` - Get assignment by ID
- `GET /api/academics/enrollments` - Get all enrollments
- `POST /api/academics/enrollments` - Create enrollment
- `GET /api/academics/submissions` - Get all submissions
- `POST /api/academics/submissions` - Create submission (Student)
- `GET /api/academics/attendance` - Get all attendance records
- `POST /api/academics/attendance` - Create attendance (Tutor/Admin)

### Communication
- `GET /api/communication/news` - Get all news
- `POST /api/communication/news` - Create news (Admin)
- `GET /api/communication/news/:id` - Get news by ID
- `PUT /api/communication/news/:id` - Update news (Admin)
- `DELETE /api/communication/news/:id` - Delete news (Admin)
- `GET /api/communication/events` - Get all events
- `POST /api/communication/events` - Create event (Admin)
- `GET /api/communication/testimonials` - Get all testimonials
- `POST /api/communication/testimonials` - Create testimonial
- `GET /api/communication/campus-life` - Get campus life content
- `GET /api/communication/contact` - Get contact messages (Admin)
- `POST /api/communication/contact` - Create contact message
- `GET /api/communication/books` - Get all books
- `GET /api/communication/statistics` - Get system statistics
- `GET /api/communication/dashboard-stats` - Get dashboard stats

### Dashboard
- `GET /api/dashboard/student` - Get student dashboard
- `GET /api/dashboard/tutor` - Get tutor dashboard
- `GET /api/dashboard/admin` - Get admin dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Admin
- `GET /api/admin/students` - Get all students for admin management
- `GET /api/admin/tutors` - Get all tutors for admin management
- `PUT /api/admin/students/:id/status` - Update student status
- `PUT /api/admin/tutors/:id/status` - Update tutor status
- `GET /api/admin/overview` - Get system overview
- `GET /api/admin/stats` - Get user statistics
- `PUT /api/admin/moderate/:type/:id` - Moderate content

### Search
- `GET /api/search/global` - Global search across all entities
- `GET /api/search/quick` - Quick search for auto-complete
- `GET /api/search/students` - Search students
- `GET /api/search/tutors` - Search tutors
- `GET /api/search/courses` - Search courses

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```javascript
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
```

### User Roles
- **student**: Students can access their own data, submit assignments, view courses
- **tutor**: Tutors can manage their courses, students, and assignments
- **admin**: Admins have full access to all system data

## 🗄️ Database Schema

The API uses PostgreSQL with the following main entities:

- **users**: Base user information
- **student_profiles**: Additional student data
- **tutor_profiles**: Additional tutor data
- **courses**: Course information
- **assignments**: Course assignments
- **enrollments**: Student course enrollments
- **submissions**: Assignment submissions
- **attendance**: Attendance records
- **news**: System news and announcements
- **events**: School events
- **testimonials**: Student testimonials
- **books**: Digital bookshelf books
- **contact_messages**: Contact form submissions

## 🛡️ Security Features

- **Rate Limiting**: Prevents abuse with request limits
- **Helmet**: Security headers for protection
- **CORS**: Cross-origin resource sharing control
- **Input Validation**: Comprehensive request validation
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: Bcrypt for password security
- **Role-based Access**: Granular permission system

## 🚀 Development

### Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run lint       # Run ESLint
```

### Project Structure
```
backend-api/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── studentController.js
│   │   ├── tutorController.js
│   │   ├── academicController.js
│   │   ├── communicationController.js
│   │   ├── dashboardController.js
│   │   ├── adminController.js
│   │   └── searchController.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/          # Route definitions
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── students.js
│   │   ├── tutors.js
│   │   ├── academics.js
│   │   ├── communication.js
│   │   ├── dashboard.js
│   │   ├── admin.js
│   │   └── search.js
│   └── utils/           # Utility functions
├── migrations/          # Database migrations
│   └── 001_initial_schema.sql
├── .env.example        # Environment variables template
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
```bash
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=school_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_ALT=http://localhost:5174

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:8000/health

# Login example
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## 📝 Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🚀 Deployment

1. Set production environment variables
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "school-api"
   ```
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates
5. Configure database backups

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

# MREI_backendAPI
