const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'university_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Helper function to generate random data
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Names and data arrays for realistic content
const firstNames = ['أحمد', 'محمد', 'علي', 'خالد', 'سارة', 'فاطمة', 'عائشة', 'خديجة', 'يوسف', 'إبراهيم', 'نور', 'ريم', 'لينا', 'مريم', 'عبد الله'];
const lastNames = ['العلي', 'المحمد', 'الزهراني', 'الغامدي', 'القرني', 'الحربي', 'القحطاني', 'الرشيد', 'الأزوري', 'الحكمي', 'الشهري', 'العتيبي', 'الدوسري'];
const universities = ['جامعة الملك سعود', 'جامعة الإمام محمد بن سعود', 'جامعة الملك عبدالعزيز', 'جامعة الملك فهد للبترول', 'جامعة الملك فيصل'];
const departments = ['علوم الحاسب', 'الهندسة', 'إدارة الأعمال', 'الطب', 'طب الأسنان', 'الصيدلة', 'التمريض', 'علوم', 'الآداب'];
const subjects = ['البرمجة', 'قواعد البيانات', 'الشبكات', 'الذكاء الاصطناعي', 'الأمن السيبراني', 'هندسة البرمجيات', 'التحليل', 'التصميم', 'الأنظمة'];
const newsCategories = ['أكاديمي', 'جامعي', 'اجتماعي', 'تقني', 'رياضي', 'ثقافي', 'مؤتمر', 'مسابقة'];
const eventLocations = ['القاعة الكبرى', 'مدرج 1', 'مدرج 2', 'مكتبة الجامعة', 'مبنى العلوم', 'مبنى الهندسة', 'ساحة الجامعة', 'النادي الرياضي'];
const testimonialContents = [
  'تجربة رائعة في الجامعة، التعليم ممتاز والأساتذة متعاونون جداً.',
  'جامعة متميزة توفر بيئة تعليمية محفزة ومختبرات حديثة.',
  'البرامج الأكاديمية متنوعة وتلبي احتياجات سوق العمل.',
  'الأجواء الجامعية جميلة والأنشطة الطلابية متنوعة.',
  'دعم كبير للطلاب والموارد التعليمية متاحة.',
  'خبرات عملية جيدة وفرص تدريبية ممتازة.',
  'بيئة متنوعة ومحفزة للتعلم والنمو.',
  'معدلات توظيف عالية للخريجين.',
  'برامج دراسات عليا متقدمة.',
  'تطوير مستمر للمهارات الشخصية والمهنية.'
];
const campusLifeCategories = ['الأنشطة', 'الخدمات', 'المرافق', 'النوادي', 'الفعاليات', 'الخدمات الطلابية'];
const contactSubjects = ['استفسار عن القبول', 'طلب معلومات أكاديمية', 'شكوى تقنية', 'اقتراح تطويري', 'طلب دعم أكاديمي', 'استفسار عن الرسوم'];
const bookCategories = ['برمجة', 'هندسة', 'إدارة', 'طب', 'علوم', 'أدب', 'تاريخ', 'فلسفة', 'رياضيات', 'فيزياء'];

async function clearExistingData(client) {
  console.log('🧹 Clearing existing data...');
  
  // Delete in reverse dependency order
  await client.query('DELETE FROM submissions');
  await client.query('DELETE FROM assignments');
  await client.query('DELETE FROM enrollments');
  await client.query('DELETE FROM attendance');
  await client.query('DELETE FROM books');
  await client.query('DELETE FROM contact_messages');
  await client.query('DELETE FROM campus_life');
  await client.query('DELETE FROM testimonials');
  await client.query('DELETE FROM events');
  await client.query('DELETE FROM news');
  await client.query('DELETE FROM courses');
  await client.query('DELETE FROM student_profiles');
  await client.query('DELETE FROM tutor_profiles');
  await client.query('DELETE FROM alumni_profiles');
  await client.query('DELETE FROM users');
  
  console.log('✅ Existing data cleared');
}

async function createUsersAndProfiles(client) {
  console.log('👥 Creating users and profiles...');
  
  // Create admin users
  const adminUsers = [
    { username: 'admin1', email: 'admin1@university.edu.sa', first_name: 'مدير', last_name: 'عام' },
    { username: 'admin2', email: 'admin2@university.edu.sa', first_name: 'مديرة', last_name: 'الأكاديميات' },
    { username: 'admin3', email: 'admin3@university.edu.sa', first_name: 'مدير', last_name: 'الطلاب' }
  ];
  
  for (const admin of adminUsers) {
    await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, '$2b$10$dummy_hash', 'admin', $3, $4, NOW(), NOW())
    `, [admin.username, admin.email, admin.first_name, admin.last_name]);
  }
  
  // Create tutor users
  const tutorUsers = [];
  for (let i = 1; i <= 15; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const username = `tutor${i}`;
    const email = `${username}@university.edu.sa`;
    const specialization = randomChoice(subjects);
    const qualification = randomChoice(['بكالوريوس', 'ماجستير', 'دكتوراه']);
    const experienceYears = randomInt(1, 15);
    
    tutorUsers.push({
      id: null,
      username,
      email,
      firstName,
      lastName,
      specialization,
      qualification,
      experienceYears
    });
    
    const userResult = await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, '$2b$10$dummy_hash', 'tutor', $3, $4, NOW(), NOW())
      RETURNING id
    `, [username, email, firstName, lastName]);
    
    const userId = userResult.rows[0].id;
    tutorUsers[i-1].id = userId;
    
    await client.query(`
      INSERT INTO tutor_profiles (user_id, tutor_id, specialization, qualification, experience_years, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [userId, `T${String(i).padStart(4, '0')}`, specialization, qualification, experienceYears]);
  }
  
  // Create student users
  const studentUsers = [];
  for (let i = 1; i <= 50; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const username = `student${i}`;
    const email = `${username}@student.university.edu.sa`;
    const dateOfBirth = randomDate(new Date(2000, 0, 1), new Date(2005, 11, 31));
    const address = `${randomInt(100, 999)} شارع ${randomChoice(['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة'])}`;
    const emergencyContact = `+966${randomInt(500000000, 599999999)}`;
    
    studentUsers.push({
      id: null,
      username,
      email,
      firstName,
      lastName,
      dateOfBirth,
      address,
      emergencyContact
    });
    
    const userResult = await client.query(`
      INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, '$2b$10$dummy_hash', 'student', $3, $4, NOW(), NOW())
      RETURNING id
    `, [username, email, firstName, lastName]);
    
    const userId = userResult.rows[0].id;
    studentUsers[i-1].id = userId;
    
    await client.query(`
      INSERT INTO student_profiles (user_id, student_id, date_of_birth, address, emergency_contact, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [userId, `S${String(i).padStart(6, '0')}`, dateOfBirth, address, emergencyContact]);
  }
  
  console.log(`✅ Created ${adminUsers.length} admins, ${tutorUsers.length} tutors, ${studentUsers.length} students`);
  return { adminUsers, tutorUsers, studentUsers };
}

async function createCourses(client, tutorUsers) {
  console.log('📚 Creating courses...');
  
  const courses = [];
  
  // Extended course templates to ensure variety
  const courseTemplates = [
    { title: 'أساسيات البرمجة', description: 'مقدمة شاملة في علوم الحاسب والبرمجة', credits: 3 },
    { title: 'قواعد البيانات', description: 'تصميم وإدارة قواعد البيانات', credits: 4 },
    { title: 'الشبكات والحاسوب', description: 'أساسيات شبكات الحاسوب والإنترنت', credits: 3 },
    { title: 'الذكاء الاصطناعي', description: 'مقدمة في الذكاء الاصطناعي والتعلم الآلي', credits: 4 },
    { title: 'الأمن السيبراني', description: 'مبادئ وأسس الأمن السيبراني', credits: 3 },
    { title: 'هندسة البرمجيات', description: 'منهجية تطوير البرمجيات', credits: 4 },
    { title: 'التحليل والتصميم', description: 'تحليل وتصميم الأنظمة', credits: 3 },
    { title: 'أنظمة التشغيل', description: 'مبادئ وأنظمة التشغيل', credits: 4 },
    { title: 'البرمجة المتقدمة', description: 'تقنيات البرمجة المتقدمة', credits: 3 },
    { title: 'علم البيانات', description: 'مقدمة في علم البيانات والتحليل', credits: 4 },
    // Additional courses to ensure variety
    { title: 'تطوير المواقع الإلكترونية', description: 'تطوير المواقع باستخدام تقنيات الويب الحديثة', credits: 3 },
    { title: 'برمجة التطبيقات المحمولة', description: 'تطوير تطبيقات الهواتف الذكية', credits: 4 },
    { title: 'أساسيات الرياضيات للحاسب', description: 'الرياضيات الأساسية لعلوم الحاسب', credits: 3 },
    { title: 'إدارة المشاريع التقنية', description: 'منهجية إدارة المشاريع التقنية', credits: 3 },
    { title: 'التصميم الجرافيكي', description: 'مبادئ التصميم الجرافيكي والإبداعي', credits: 3 },
    { title: 'التجارة الإلكترونية', description: 'أساسيات التجارة الإلكترونية والتسويق الرقمي', credits: 3 },
    { title: 'التشفير وأمن المعلومات', description: 'تقنيات التشفير وحماية المعلومات', credits: 4 },
    { title: 'الحوسبة السحابية', description: 'مقدمة في الحوسبة السحابية وخدماتها', credits: 4 },
    { title: 'تطوير الألعاب', description: 'أساسيات تطوير الألعاب الإلكترونية', credits: 3 },
    { title: 'الإنترنت الأشياء', description: 'مقدمة في إنترنت الأشياء وتطبيقاته', credits: 4 }
  ];
  
  // Track assigned course titles per tutor to avoid duplicates
  const tutorAssignedCourses = {};
  
  // Initialize tracking for each tutor
  tutorUsers.forEach(tutor => {
    tutorAssignedCourses[tutor.id] = new Set();
  });
  
  let createdCourses = 0;
  const targetCourses = 25;
  
  while (createdCourses < targetCourses) {
    const tutor = randomChoice(tutorUsers);
    
    // Get available course templates that this tutor hasn't been assigned yet
    const availableCourses = courseTemplates.filter(template => 
      !tutorAssignedCourses[tutor.id].has(template.title)
    );
    
    // If all courses are assigned to this tutor, move to next tutor
    if (availableCourses.length === 0) {
      continue;
    }
    
    const courseTemplate = randomChoice(availableCourses);
    
    try {
      const courseResult = await client.query(`
        INSERT INTO courses (title, description, credits, tutor_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `, [courseTemplate.title, courseTemplate.description, courseTemplate.credits, tutor.id]);
      
      // Track that this tutor has been assigned this course title
      tutorAssignedCourses[tutor.id].add(courseTemplate.title);
      
      courses.push({
        id: courseResult.rows[0].id,
        title: courseTemplate.title,
        credits: courseTemplate.credits,
        tutorId: tutor.id
      });
      
      createdCourses++;
      
      // If we've assigned all available courses to all tutors, break to avoid infinite loop
      if (createdCourses >= tutorUsers.length * courseTemplates.length) {
        break;
      }
      
    } catch (error) {
      // If there's a database constraint error, skip this course
      if (error.code === '23505') {
        console.log(`⚠️  Skipping duplicate course: ${courseTemplate.title} for tutor ${tutor.id}`);
        // Mark this course as assigned to avoid trying again
        tutorAssignedCourses[tutor.id].add(courseTemplate.title);
      } else {
        // For other errors, log and continue
        console.error(`⚠️  Error creating course ${courseTemplate.title}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Created ${courses.length} courses`);
  return courses;
}

async function createEnrollments(client, studentUsers, courses) {
  console.log('📝 Creating enrollments...');
  
  let enrollmentCount = 0;
  
  // Track enrollments to avoid duplicates
  const studentEnrollments = {};
  
  // Initialize tracking for each student
  studentUsers.forEach(student => {
    studentEnrollments[student.id] = new Set();
  });
  
  for (const student of studentUsers) {
    // Each student enrolls in 3-6 courses
    const numCourses = randomInt(3, 6);
    
    // Get available courses (not yet enrolled by this student)
    const availableCourses = courses.filter(course => 
      !studentEnrollments[student.id].has(course.id)
    );
    
    for (let i = 0; i < numCourses && availableCourses.length > 0; i++) {
      // Remove already enrolled courses from available courses
      const remainingCourses = courses.filter(course => 
        !studentEnrollments[student.id].has(course.id)
      );
      
      if (remainingCourses.length === 0) break;
      
      const course = randomChoice(remainingCourses);
      
      try {
        await client.query(`
          INSERT INTO enrollments (student_id, course_id, enrolled_at)
          VALUES ($1, $2, NOW() - INTERVAL '${randomInt(1, 180)} days')
        `, [student.id, course.id]);
        
        // Track this enrollment
        studentEnrollments[student.id].add(course.id);
        enrollmentCount++;
        
      } catch (error) {
        // Skip if already enrolled or other constraint violations
        if (error.code === '23505') {
          console.log(`⚠️  Skipping duplicate enrollment: student ${student.id} in course ${course.id}`);
          // Track this enrollment to avoid trying again
          studentEnrollments[student.id].add(course.id);
        } else {
          console.error(`⚠️  Error creating enrollment for student ${student.id}:`, error.message);
        }
      }
    }
  }
  
  console.log(`✅ Created ${enrollmentCount} enrollments`);
}

async function createAssignments(client, courses) {
  console.log('📋 Creating assignments...');
  
  const assignmentTypes = ['واجب', 'مشروع', 'امتحان', 'تقرير', 'عرض'];
  let assignmentCount = 0;
  
  for (const course of courses) {
    // Each course has 4-8 assignments
    const numAssignments = randomInt(4, 8);
    
    for (let i = 1; i <= numAssignments; i++) {
      const assignmentType = randomChoice(assignmentTypes);
      const dueDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
      
      await client.query(`
        INSERT INTO assignments (title, description, course_id, due_date, max_score, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        `${assignmentType} رقم ${i}`,
        `وصف ${assignmentType} رقم ${i} لمادة ${course.title}`,
        course.id,
        dueDate,
        randomInt(50, 100)
      ]);
      assignmentCount++;
    }
  }
  
  console.log(`✅ Created ${assignmentCount} assignments`);
}

async function createSubmissionsAndAttendance(client, studentUsers, courses) {
  console.log('📤 Creating submissions and attendance...');
  
  // Get assignments
  const assignmentsResult = await client.query('SELECT * FROM assignments');
  const assignments = assignmentsResult.rows;
  
  let submissionCount = 0;
  let attendanceCount = 0;
  
  for (const student of studentUsers) {
    // Create attendance records for past 30 days
    for (let day = 0; day < 30; day++) {
      const attendanceDate = new Date();
      attendanceDate.setDate(attendanceDate.getDate() - day);
      
      // Student attends 80-95% of classes
      if (Math.random() < 0.9) {
        const status = Math.random() < 0.85 ? 'present' : (Math.random() < 0.5 ? 'late' : 'absent');
        
        try {
          await client.query(`
            INSERT INTO attendance (student_id, course_id, date, status, created_at)
            VALUES ($1, $2, $3, $4, NOW())
          `, [student.id, randomChoice(courses).id, attendanceDate, status]);
          attendanceCount++;
        } catch (error) {
          // Skip if record exists
        }
      }
    }
    
    // Create submissions for some assignments
    const studentEnrollments = await client.query(
      'SELECT * FROM enrollments WHERE student_id = $1',
      [student.id]
    );
    
    for (const enrollment of studentEnrollments.rows) {
      const courseAssignments = assignments.filter(a => a.course_id === enrollment.course_id);
      
      for (const assignment of courseAssignments) {
        // 70-90% of students submit assignments
        if (Math.random() < 0.8) {
          const submittedAt = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
          
          let score = null;
          let feedback = null;
          
          // 80% of submissions get graded
          if (Math.random() < 0.8) {
            score = randomInt(Math.floor(assignment.max_score * 0.5), assignment.max_score);
            feedback = score >= assignment.max_score * 0.8 ? 'ممتاز' : 
                     score >= assignment.max_score * 0.6 ? 'جيد جداً' : 
                     score >= assignment.max_score * 0.4 ? 'جيد' : 'يحتاج تحسين';
          }
          
          await client.query(`
            INSERT INTO submissions (assignment_id, student_id, content, submitted_at, score, feedback, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
          `, [
            assignment.id,
            student.id,
            `إجابة ${assignment.title}`,
            submittedAt,
            score,
            feedback
          ]);
          submissionCount++;
        }
      }
    }
  }
  
  console.log(`✅ Created ${submissionCount} submissions and ${attendanceCount} attendance records`);
}

async function createNews(client) {
  console.log('📰 Creating news...');
  
  const newsItems = [
    {
      title: 'بداية الفصل الدراسي الجديد',
      content: 'نعلن عن بداية الفصل الدراسي الجديد ونتمنى لجميع الطلاب عاماً مليئاً بالنجاح والإنجازات.',
      category: 'أكاديمي',
      author: 'إدارة الجامعة',
      published: true
    },
    {
      title: 'مؤتمر التقنية السنوي',
      content: 'يستضيف الجامعة مؤتمر التقنية السنوي بمشاركة خبراء من مختلف أنحاء العالم.',
      category: 'مؤتمر',
      author: 'كلية الحاسب',
      published: true
    },
    {
      title: 'افتتاح مختبر الذكاء الاصطناعي الجديد',
      content: 'تم افتتاح مختبر الذكاء الاصطناعي الجديد المجهز بأحدث التقنيات.',
      category: 'تقني',
      author: 'إدارة كلية الحاسب',
      published: true
    },
    {
      title: 'مسابقة أفضل مشروع تخرج',
      content: 'تنطلق مسابقة أفضل مشروع تخرج لهذا العام بمشاركة جميع التخصصات.',
      category: 'مسابقة',
      author: 'عمادة شؤون الطلاب',
      published: true
    },
    {
      title: 'ورشة تطوير المهارات الشخصية',
      content: 'تنظم الجامعة ورشة تدريبية لتطوير المهارات الشخصية والمهنية للطلاب.',
      category: 'تدريبي',
      author: 'مركز التطوير المهني',
      published: true
    },
    {
      title: 'توقيع اتفاقية شراكة مع شركة تقنية',
      content: 'تم توقيع اتفاقية شراكة مع إحدى الشركات الرائدة في مجال التقنية.',
      category: 'جامعي',
      author: 'الإدارة العليا',
      published: true
    },
    {
      title: 'احتفال باليوم الوطني',
      content: 'تحتفل الجامعة باليوم الوطني بفعاليات متنوعة ومميزة.',
      category: 'ثقافي',
      author: 'نادي الطلاب',
      published: true
    },
    {
      title: 'إطلاق برنامج التبادل الطلابي',
      content: 'تم إطلاق برنامج التبادل الطلابي مع جامعات دولية مرموقة.',
      category: 'أكاديمي',
      author: 'عمادة العلاقات الدولية',
      published: true
    }
  ];
  
  for (const news of newsItems) {
    await client.query(`
      INSERT INTO news (title, content, category, author, published, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${randomInt(1, 30)} days', NOW())
    `, [news.title, news.content, news.category, news.author, news.published]);
  }
  
  console.log(`✅ Created ${newsItems.length} news articles`);
}

async function createEvents(client) {
  console.log('🎯 Creating events...');
  
  const events = [
    {
      title: 'مؤتمر التقنية السنوي 2024',
      description: 'مؤتمر سنوي يجمع خبراء التقنية والطلاب لمناقشة أحدث التطورات.',
      location: 'القاعة الكبرى',
      organizer: 'كلية الحاسب الآلي',
      event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'ورشة التطوير المهني',
      description: 'ورشة تدريبية لتطوير مهارات البحث عن عمل وكتابة السيرة الذاتية.',
      location: 'مدرج 1',
      organizer: 'مركز التطوير المهني',
      event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'يوم المعلومات المهني',
      description: 'يوم توظيف سنوي يجمع الطلاب مع الشركات الرائدة في السوق.',
      location: 'ساحة الجامعة',
      organizer: 'عمادة شؤون الطلاب',
      event_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'معرض المشاريع التقنية',
      description: 'معرض لعرض مشاريع تخرج الطلاب ومبتكراتهم التقنية.',
      location: 'مبنى الهندسة',
      organizer: 'نادي هندسة البرمجيات',
      event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'مسابقة الهاكاثون',
      description: 'مسابقة برمجة مكثفة على مدى 24 ساعة لحل مشاكل واقعية.',
      location: 'مختبر الحاسوب',
      organizer: 'نادي البرمجة',
      event_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    },
    {
      title: 'ندوة الأمن السيبراني',
      description: 'ندوة متخصصة في أساسيات الأمن السيبراني وحماية البيانات.',
      location: 'مكتبة الجامعة',
      organizer: 'قسم أمن المعلومات',
      event_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
    }
  ];
  
  for (const event of events) {
    await client.query(`
      INSERT INTO events (title, description, event_date, location, organizer, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${randomInt(1, 15)} days', NOW())
    `, [event.title, event.description, event.event_date, event.location, event.organizer]);
  }
  
  console.log(`✅ Created ${events.length} events`);
}

async function createTestimonials(client, studentUsers) {
  console.log('⭐ Creating testimonials...');
  
  const testimonials = [];
  
  // Create testimonials from random students
  for (let i = 0; i < 20; i++) {
    const student = randomChoice(studentUsers);
    const content = randomChoice(testimonialContents);
    const rating = randomInt(4, 5);
    const approved = Math.random() < 0.8; // 80% approved
    
    testimonials.push({
      student_name: `${student.firstName} ${student.lastName}`,
      content: content,
      rating: rating,
      position: 'طالب',
      company: student.university,
      approved: approved,
      author: 'عمادة شؤون الطلاب',
      author_title: 'مدير العمادة',
      created_at: randomDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date())
    });
  }
  
  for (const testimonial of testimonials) {
    await client.query(`
      INSERT INTO testimonials (student_name, content, rating, position, company, approved, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      testimonial.student_name,
      testimonial.content,
      testimonial.rating,
      testimonial.position,
      testimonial.company,
      testimonial.approved,
      testimonial.created_at
    ]);
  }
  
  console.log(`✅ Created ${testimonials.length} testimonials`);
}

async function createCampusLife(client) {
  console.log('🏫 Creating campus life content...');
  
  const campusLifeItems = [
    {
      title: 'النوادي الطلابية',
      content: 'تضم الجامعة أكثر من 20 نادياً طلابياً في مختلف المجالات الثقافية والرياضية والتقنية.',
      category: 'النوادي',
      image_url: 'https://example.com/clubs.jpg'
    },
    {
      title: 'الخدمات الطلابية',
      content: 'نقدم خدمات شاملة للطلاب تشمل الاستشارات الأكاديمية والمهنية والدعم النفسي.',
      category: 'الخدمات',
      image_url: 'https://example.com/services.jpg'
    },
    {
      title: 'المرافق الرياضية',
      content: 'ملاعب رياضية متطورة وصالة رياضية حديثة لنشاطات الطلاب المتنوعة.',
      category: 'المرافق',
      image_url: 'https://example.com/sports.jpg'
    },
    {
      title: 'المكتبة الرقمية',
      content: 'مكتبة رقمية حديثة تحتوي على آلاف المراجع والكتب الإلكترونية.',
      category: 'المرافق',
      image_url: 'https://example.com/library.jpg'
    },
    {
      title: 'مختبرات الحاسوب',
      content: 'مختبرات حاسوب مجهزة بأحدث التقنيات والبرمجيات.',
      category: 'المرافق',
      image_url: 'https://example.com/labs.jpg'
    },
    {
      title: 'الأنشطة الثقافية',
      content: 'فعاليات ثقافية متنوعة تشمل الأمسيات الشعرية والمسرحية والموسيقية.',
      category: 'الفعاليات',
      image_url: 'https://example.com/culture.jpg'
    },
    {
      title: 'برنامج الإرشاد الأكاديمي',
      content: 'برنامج إرشاد أكاديمي يساعد الطلاب في اختيار المسار المناسب.',
      category: 'الخدمات',
      image_url: 'https://example.com/guidance.jpg'
    },
    {
      title: 'مركز ريادة الأعمال',
      content: 'مركز متخصص في دعم ريادة الأعمال وريادة الأعمال الطلابية.',
      category: 'الخدمات',
      image_url: 'https://example.com/entrepreneurship.jpg'
    }
  ];
  
  for (const item of campusLifeItems) {
    await client.query(`
      INSERT INTO campus_life (title, content, category, image_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${randomInt(1, 60)} days', NOW())
    `, [item.title, item.content, item.category, item.image_url]);
  }
  
  console.log(`✅ Created ${campusLifeItems.length} campus life items`);
}

async function createContactMessages(client) {
  console.log('📬 Creating contact messages...');
  
  const messages = [
    {
      name: 'أحمد محمد العلي',
      email: 'ahmed.ali@student.university.edu.sa',
      subject: 'استفسار عن القبول',
      message: 'أود الاستفسار عن متطلبات القبول في برنامج الماجستير في علوم الحاسب.',
      status: 'new'
    },
    {
      name: 'فاطمة أحمد الزهراني',
      email: 'fatima.zahrani@gmail.com',
      subject: 'طلب معلومات أكاديمية',
      message: 'هل يمكن الحصول على المزيد من المعلومات حول مناهج كلية الحاسب الآلي؟',
      status: 'read'
    },
    {
      name: 'خالد سعد الغامدي',
      email: 'khalid.ghamdi@company.com',
      subject: 'شراكة تدريبية',
      message: 'نحن مهتمون بإقامة شراكة تدريبية مع جامعتكم الموقرة.',
      status: 'replied'
    },
    {
      name: 'سارة عبدالله القرني',
      email: 'sara.qarni@student.university.edu.sa',
      subject: 'شكوى تقنية',
      message: 'أواجه مشاكل في الوصول إلى النظام الأكاديمي الإلكتروني.',
      status: 'new'
    },
    {
      name: 'محمد عبدالرحمن الحربي',
      email: 'mohammed.harbi@outlook.com',
      subject: 'اقتراح تطويري',
      message: 'أقترح إنشاء تطبيق إلكتروني لتحسين التواصل بين الطلاب والأساتذة.',
      status: 'read'
    },
    {
      name: 'عائشة محمد القحطاني',
      email: 'aisha.qahtani@yahoo.com',
      subject: 'طلب دعم أكاديمي',
      message: 'أحتاج إلى دعم أكاديمي في مادة الرياضيات المتقدمة.',
      status: 'new'
    },
    {
      name: 'علي حسن الدوسري',
      email: 'ali.dosari@gmail.com',
      subject: 'استفسار عن الرسوم',
      message: 'أود معرفة تفاصيل الرسوم الدراسية للفصل الحالي.',
      status: 'replied'
    },
    {
      name: 'نور سالم العتيبي',
      email: 'noor.otaibi@hotmail.com',
      subject: 'استفسار عن القبول',
      message: 'ما هي المواعيد النهائية لتقديم طلبات القبول؟',
      status: 'read'
    }
  ];
  
  for (const message of messages) {
    await client.query(`
      INSERT INTO contact_messages (name, email, subject, message, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${randomInt(1, 30)} days')
    `, [message.name, message.email, message.subject, message.message, message.status]);
  }
  
  console.log(`✅ Created ${messages.length} contact messages`);
}

async function createBooks(client) {
  console.log('📚 Creating books...');
  
  const books = [
    { title: 'أساسيات البرمجة بـ Python', author: 'د. أحمد محمد', category: 'برمجة', isbn: '978-1234567890' },
    { title: 'تصميم قواعد البيانات', author: 'م. فاطمة الزهراني', category: 'قواعد البيانات', isbn: '978-1234567891' },
    { title: 'الشبكات الأساسية', author: 'د. خالد الغامدي', category: 'شبكات', isbn: '978-1234567892' },
    { title: 'الذكاء الاصطناعي للمبتدئين', author: 'د. سارة القرني', category: 'ذكاء اصطناعي', isbn: '978-1234567893' },
    { title: 'الأمن السيبراني الحديث', author: 'م. محمد الحربي', category: 'أمن سيبراني', isbn: '978-1234567894' },
    { title: 'هندسة البرمجيات العملية', author: 'د. عائشة القحطاني', category: 'هندسة برمجيات', isbn: '978-1234567895' },
    { title: 'تحليل وتصميم الأنظمة', author: 'د. علي الدوسري', category: 'تحليل أنظمة', isbn: '978-1234567896' },
    { title: 'أنظمة التشغيل المتقدمة', author: 'م. نور العتيبي', category: 'أنظمة تشغيل', isbn: '978-1234567897' },
    { title: 'علم البيانات والتحليل', author: 'د. يوسف الشهري', category: 'علم بيانات', isbn: '978-1234567898' },
    { title: 'إدارة المشاريع التقنية', author: 'م. ريم الحكمي', category: 'إدارة مشاريع', isbn: '978-1234567899' }
  ];
  
  for (const book of books) {
    await client.query(`
      INSERT INTO books (title, author, category, isbn, description, cover_url, pdf_url, available, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [
      book.title, 
      book.author, 
      book.category, 
      book.isbn, 
      `كتاب ${book.title} للمؤلف ${book.author}`,
      `https://example.com/covers/${book.title.toLowerCase().replace(/\s+/g, '-')}.jpg`,
      `https://example.com/books/${book.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      true
    ]);
  }
  
  console.log(`✅ Created ${books.length} books`);
}

async function runComprehensiveSeed() {
  console.log('🌱 Starting comprehensive database seeding...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data
    await clearExistingData(client);
    
    // Create users and profiles
    const { tutorUsers, studentUsers } = await createUsersAndProfiles(client);
    
    // Create courses
    const courses = await createCourses(client, tutorUsers);
    
    // Create enrollments
    await createEnrollments(client, studentUsers, courses);
    
    // Create assignments
    await createAssignments(client, courses);
    
    // Create submissions and attendance
    await createSubmissionsAndAttendance(client, studentUsers, courses);
    
    // Create content
    await createNews(client);
    await createEvents(client);
    await createTestimonials(client, studentUsers);
    await createCampusLife(client);
    await createContactMessages(client);
    await createBooks(client);
    
    await client.query('COMMIT');
    console.log('\n🎉 Comprehensive database seeding completed successfully!');
    
    // Print summary statistics
    console.log('\n📊 Database Summary:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as admins,
        (SELECT COUNT(*) FROM users WHERE role = 'tutor') as tutors,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as students,
        (SELECT COUNT(*) FROM courses) as courses,
        (SELECT COUNT(*) FROM assignments) as assignments,
        (SELECT COUNT(*) FROM submissions) as submissions,
        (SELECT COUNT(*) FROM news) as news,
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM testimonials) as testimonials,
        (SELECT COUNT(*) FROM contact_messages) as messages,
        (SELECT COUNT(*) FROM books) as books
    `);
    
    console.log('Admins:', stats.rows[0].admins);
    console.log('Tutors:', stats.rows[0].tutors);
    console.log('Students:', stats.rows[0].students);
    console.log('Courses:', stats.rows[0].courses);
    console.log('Assignments:', stats.rows[0].assignments);
    console.log('Submissions:', stats.rows[0].submissions);
    console.log('News:', stats.rows[0].news);
    console.log('Events:', stats.rows[0].events);
    console.log('Testimonials:', stats.rows[0].testimonials);
    console.log('Contact Messages:', stats.rows[0].messages);
    console.log('Books:', stats.rows[0].books);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
if (require.main === module) {
  runComprehensiveSeed()
    .then(() => {
      console.log('\n✅ Database seeding script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Database seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveSeed };
