/**
 * Data transformation utilities for API responses
 * Ensures consistent data format between backend and frontend
 */

/**
 * Transform campus life data for frontend
 * Backend: content, image_url, no status field
 * Frontend: description, status
 */
const transformCampusLife = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.content || item.description || '',
    content: item.content || item.description || '',
    image_url: item.image_url || item.image || '',
    category: item.category || 'General',
    status: item.status || 'active',
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};

/**
 * Transform book data for frontend
 * Backend: available (boolean)
 * Frontend: status (string: 'available'/'unavailable')
 */
const transformBooks = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    title: item.title,
    author: item.author,
    isbn: item.isbn || '',
    category: item.category || 'General',
    description: item.description || '',
    cover_image: item.cover_image || item.image_url || '',
    pdf_file: item.pdf_file || '',
    status: item.available ? 'available' : (item.status || 'unavailable'),
    available: item.available,
    genre: item.genre || '',
    publication_year: item.publication_year || null,
    file_type: item.file_type || '',
    file_size: item.file_size || null,
    file_url: item.file_url || '',
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};

/**
 * Transform event data for frontend
 * Backend: event_date, image_url, video_url
 * Frontend: date, image, video_url, videoId (extracted from video_url)
 */
const transformEvents = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => {
    // Extract video ID from video_url if present
    let videoId = '';
    if (item.video_url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = item.video_url.match(regExp);
      videoId = (match && match[2].length === 11) ? match[2] : '';
    }
    
    return {
      id: item.id,
      title: item.title,
      description: item.description || '',
      date: item.event_date,
      event_date: item.event_date,
      location: item.location || 'TBD',
      organizer: item.organizer || '',
      image: item.image_url || item.image || '',
      image_url: item.image_url || item.image || '',
      video_url: item.video_url || '',
      videoId: videoId,
      status: item.status || (new Date(item.event_date) >= new Date() ? 'upcoming' : 'past'),
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  });
};

/**
 * Transform testimonial data for frontend
 * Backend: student_name, approved (boolean)
 * Frontend: name, status (string: 'approved'/'pending')
 */
const transformTestimonials = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    name: item.student_name || item.name || 'Anonymous',
    student_name: item.student_name,
    content: item.content || '',
    rating: item.rating || 5,
    position: item.position || '',
    company: item.company || '',
    image: item.image || item.image_url || '',
    status: item.approved ? 'approved' : (item.status || 'pending'),
    approved: item.approved,
    role: item.position || 'Student',
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};

/**
 * Transform news data for frontend
 * Backend: published (boolean), image_url
 * Frontend: status (string: 'published'/'draft'), image
 */
const transformNews = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    title: item.title,
    content: item.content || '',
    category: item.category || 'General',
    author: item.author || 'Admin',
    status: item.published ? 'published' : (item.status || 'draft'),
    published: item.published,
    image: item.image_url || item.image || '',
    image_url: item.image_url || item.image || '',
    created_at: item.created_at,
    updated_at: item.updated_at
  }));
};

/**
 * Transform contact message data for frontend
 * Backend: status, no is_read directly
 * Frontend: is_read field
 */
const transformContactMessages = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    name: item.name || 'Anonymous',
    email: item.email || '',
    subject: item.subject || '',
    message: item.message || '',
    phone: item.phone || '',
    is_read: item.status === 'replied' || item.is_read || false,
    status: item.status || 'new',
    replied_at: item.replied_at,
    reply: item.reply || '',
    created_at: item.created_at
  }));
};

/**
 * Transform statistics data for frontend
 * Ensures all expected fields are present with fallbacks
 */
const transformStats = (data) => {
  if (!data) return {};
  return {
    totalUsers: data.total_users || data.active_students || 0,
    totalStudents: data.active_students || data.totalStudents || 0,
    totalTutors: data.tutors || data.totalTutors || 0,
    totalNews: data.recent_news || data.totalNews || 0,
    totalEvents: data.upcoming_events || data.totalEvents || 0,
    totalTestimonials: data.approved_testimonials || data.totalTestimonials || 0,
    courses: data.courses || 0,
    totalAssignments: data.total_assignments || 0,
    totalSubmissions: data.total_submissions || 0,
    totalEnrollments: data.total_enrollments || 0,
    successRate: data.success_rate || data.successRate || 0,
    recentMessages: data.recent_messages || 0,
    newMessages: data.new_messages || 0
  };
};

/**
 * Transform student data for frontend
 * Backend: first_name, last_name, is_active
 * Frontend: name, status
 */
const transformStudents = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    name: item.first_name && item.last_name 
      ? `${item.first_name} ${item.last_name}` 
      : item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
    first_name: item.first_name,
    last_name: item.last_name,
    email: item.email || '',
    student_id: item.student_id || '',
    program: item.program || item.specialization || 'General',
    status: item.is_active ? 'active' : (item.status || 'inactive'),
    is_active: item.is_active,
    date_of_birth: item.date_of_birth,
    address: item.address || '',
    emergency_contact: item.emergency_contact || '',
    enrolled_courses: item.enrolled_courses || 0,
    total_submissions: item.total_submissions || 0,
    average_score: item.average_score ? parseFloat(item.average_score) : null,
    created_at: item.created_at,
    last_login: item.last_login
  }));
};

/**
 * Transform tutor data for frontend
 * Backend: first_name, last_name, is_active
 * Frontend: name, status
 */
const transformTutors = (data) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  return items.map(item => ({
    id: item.id,
    name: item.first_name && item.last_name 
      ? `${item.first_name} ${item.last_name}` 
      : item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown',
    first_name: item.first_name,
    last_name: item.last_name,
    email: item.email || '',
    tutor_id: item.tutor_id || '',
    specialization: item.specialization || '',
    qualification: item.qualification || '',
    experience_years: item.experience_years || 0,
    status: item.is_active ? 'active' : (item.status || 'inactive'),
    is_active: item.is_active,
    total_courses: item.total_courses || 0,
    total_students: item.total_students || 0,
    total_assignments: item.total_assignments || 0,
    created_at: item.created_at,
    last_login: item.last_login
  }));
};

module.exports = {
  transformCampusLife,
  transformBooks,
  transformEvents,
  transformTestimonials,
  transformNews,
  transformContactMessages,
  transformStats,
  transformStudents,
  transformTutors
};

