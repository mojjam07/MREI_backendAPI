const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Support both camelCase and snake_case field names
    const { username, email, password, role, firstName, lastName, first_name, last_name } = req.body;
    const first_name_val = firstName || first_name;
    const last_name_val = lastName || last_name;

    // Check if user already exists
    const userExistsQuery = 'SELECT id FROM users WHERE email = $1 OR username = $2';
    const userExists = await pool.query(userExistsQuery, [email, username]);
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertUserQuery = `
      INSERT INTO users (username, email, password, role, first_name, last_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, username, email, role, first_name, last_name, created_at
    `;
    
    const newUser = await pool.query(insertUserQuery, [
      username, email, hashedPassword, role, first_name_val, last_name_val
    ]);

    // Create profile based on role
    if (role === 'student') {
      const studentId = `STU${Date.now()}`;
      await pool.query(
        'INSERT INTO student_profiles (user_id, student_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [newUser.rows[0].id, studentId]
      );
    } else if (role === 'tutor') {
      const tutorId = `TUT${Date.now()}`;
      await pool.query(
        'INSERT INTO tutor_profiles (user_id, tutor_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [newUser.rows[0].id, tutorId]
      );
    } else if (role === 'alumni') {
      // Alumni profiles are automatically created by database triggers
      // But let's ensure the profile exists and get the alumni_id
      const alumniProfile = await pool.query(
        'SELECT alumni_id FROM alumni_profiles WHERE user_id = $1',
        [newUser.rows[0].id]
      );
      
      if (alumniProfile.rows.length === 0) {
        // Fallback: create alumni profile manually if trigger didn't work
        const alumniId = `ALU${Date.now()}`;
        await pool.query(
          'INSERT INTO alumni_profiles (user_id, alumni_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
          [newUser.rows[0].id, alumniId]
        );
      }
    }

    // Generate tokens
    const token = generateToken(newUser.rows[0]);
    const refreshToken = generateRefreshToken(newUser.rows[0]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser.rows[0],
        accessToken: token,
        refreshToken: refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userQuery = `
      SELECT u.*, 
        sp.student_id as student_profile_id,
        tp.tutor_id as tutor_profile_id,
        ap.alumni_id as alumni_profile_id
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE u.email = $1
    `;
    
    const user = await pool.query(userQuery, [email]);

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const userData = user.rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate tokens
    const token = generateToken(userData);
    const refreshToken = generateRefreshToken(userData);

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userData.id]);

    // Remove password from response
    delete userData.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: token,
        refreshToken: refreshToken,
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token (you'll need to implement JWT verification)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');

    // Get user data
    const userQuery = `
      SELECT u.*, 
        sp.student_id as student_profile_id,
        tp.tutor_id as tutor_profile_id
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.id = $1
    `;
    
    const user = await pool.query(userQuery, [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.rows[0]);
    const newRefreshToken = generateRefreshToken(user.rows[0]);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refresh_token: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/user
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const userQuery = `
      SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
             u.created_at, u.updated_at, u.last_login,
             sp.student_id as student_profile_id,
             tp.tutor_id as tutor_profile_id,
             ap.alumni_id as alumni_profile_id
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      LEFT JOIN alumni_profiles ap ON u.id = ap.user_id
      WHERE u.id = $1
    `;
    
    const user = await pool.query(userQuery, [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.rows[0]
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout
};
