const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
             u.created_at, u.updated_at, u.last_login,
             sp.student_id,
             tp.tutor_id
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (role) {
      paramCount++;
      query += ` AND u.role = $${paramCount}`;
      queryParams.push(role);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const users = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM users u WHERE 1=1';
    const countParams = [];

    if (role) {
      countQuery += ' AND u.role = $1';
      countParams.push(role);
    }

    if (search) {
      countQuery += role ? ' AND' : '';
      countQuery += ` (u.first_name ILIKE $${countParams.length + 1} OR u.last_name ILIKE $${countParams.length + 1} OR u.username ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const userQuery = `
      SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, 
             u.created_at, u.updated_at, u.last_login,
             sp.student_id, sp.date_of_birth, sp.address, sp.emergency_contact,
             tp.tutor_id, tp.specialization, tp.qualification, tp.experience_years
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN tutor_profiles tp ON u.id = tp.user_id
      WHERE u.id = $1
    `;
    
    const user = await pool.query(userQuery, [id]);

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
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, phone } = req.body;

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailExists = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    if (email) {
      paramCount++;
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(email);
    }

    if (first_name) {
      paramCount++;
      updateFields.push(`first_name = $${paramCount}`);
      updateValues.push(first_name);
    }

    if (last_name) {
      paramCount++;
      updateFields.push(`last_name = $${paramCount}`);
      updateValues.push(last_name);
    }

    if (phone) {
      paramCount++;
      updateFields.push(`phone = $${paramCount}`);
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    paramCount++;
    updateFields.push(`updated_at = NOW()`);
    updateFields.push(`id = $${paramCount}`);
    updateValues.push(id);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, role, first_name, last_name, phone, updated_at`;

    const updatedUser = await pool.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser.rows[0]
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userExists = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Change password
// @route   PUT /api/users/:id/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await pool.query('SELECT id, password FROM users WHERE id = $1', [id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.rows[0].password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedNewPassword, id]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
};
