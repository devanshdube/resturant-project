import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { AuthenticatedRequest, RestaurantRow, RestaurantUserJwtPayload } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/restaurants/profile
// @desc    Get the profile details of the logged-in user's restaurant
// @access  Protected (Owner, Manager, Staff, Kitchen)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyRestaurantProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const [rows] = await pool.execute(
      `SELECT
         id, name, owner_name, slug, logo_url, address, phone, email,
         currency, timezone, restaurant_type, service_type,
         operating_hours_open, operating_hours_close,
         gst_enabled, gst_no, gst_percentage, is_active, created_at, updated_at
       FROM restaurants
       WHERE id = ?`,
      [user.restaurant_id]
    );

    const restaurant = (rows as any[])[0];

    if (!restaurant) {
      throw new AppError('Restaurant detail nahi mila', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Restaurant profile fetched successfully',
      data: restaurant,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/restaurants/profile
// @desc    Update restaurant profile (Logo, timings, GST, settings)
// @access  Protected (Owner only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyRestaurantProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const {
      logo_url,
      address,
      phone,
      email,
      currency,
      timezone,
      restaurant_type,
      service_type,
      operating_hours_open,
      operating_hours_close,
      gst_enabled,
      gst_no,
      gst_percentage
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    // Fields mapping
    const fields = {
      logo_url, address, phone, email, currency, timezone,
      restaurant_type, service_type, operating_hours_open, operating_hours_close,
      gst_enabled, gst_no, gst_percentage
    };

    // Construct dynamic update query
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new AppError('Koi data update karne ke liye nahi bheja', 400);
    }

    const now = getNowIST();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(user.restaurant_id); // WHERE class

    await pool.execute(
      `UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated data
    const [updatedRows] = await pool.execute(
      'SELECT id, name, owner_name, slug, logo_url, address, phone, email, currency, timezone, restaurant_type, service_type, operating_hours_open, operating_hours_close, gst_enabled, gst_no, gst_percentage, is_active FROM restaurants WHERE id = ?',
      [user.restaurant_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Restaurant profile successfully update ho gayi',
      data: (updatedRows as any[])[0]
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/restaurants/staff
// @desc    Create a new staff member (manager, staff, kitchen)
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const createStaff = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw new AppError('name, email, password, aur role zaroori hain', 400);
    }

    const validRoles = ['manager', 'staff', 'kitchen'];
    if (!validRoles.includes(role)) {
      throw new AppError(`role sirf ${validRoles.join(', ')} ho sakta hai`, 400);
    }

    // Checking if manager is creating another manager (Optional logic, standard is Owner creates Managers)
    if (user.role === 'manager' && role === 'manager') {
      throw new AppError('Manager ek naya manager create nahi kar sakta. Owner se contact karein.', 403);
    }

    // Check duplicate email (Across all restaurants or just this one? Email is UNIQUE usually per restaurant)
    // Actually, uniqueness is (restaurant_id, email) according to DB schema.
    const [existing] = await pool.execute(
      'SELECT id FROM restaurant_users WHERE restaurant_id = ? AND email = ?',
      [user.restaurant_id, email.toLowerCase().trim()]
    );
    if ((existing as any[]).length > 0) {
      throw new AppError('Yeh email aapke restaurant me pehle se registered hai', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const now = getNowIST();

    const [result] = await pool.execute(
      `INSERT INTO restaurant_users
         (restaurant_id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [user.restaurant_id, name.trim(), email.toLowerCase().trim(), password_hash, role, now, now]
    );

    return res.status(201).json({
      success: true,
      message: 'Staff successfully create ho gaya',
      data: {
        id: (result as any).insertId,
        restaurant_id: user.restaurant_id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        is_active: 1,
        created_at: now
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/restaurants/staff
// @desc    Get all staff members of the restaurant
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllStaff = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const [rows] = await pool.execute(
      `SELECT id, name, email, role, is_active, last_login_at, created_at
       FROM restaurant_users
       WHERE restaurant_id = ? AND role != 'owner'
       ORDER BY created_at DESC`,
      [user.restaurant_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Staff list fetched successfully',
      data: rows
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/restaurants/staff/:id
// @desc    Update staff details or block/unblock (name, role, is_active)
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const updateStaff = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;
    const { name, role, is_active } = req.body;

    const [existingRows] = await pool.execute(
      'SELECT * FROM restaurant_users WHERE id = ? AND restaurant_id = ?',
      [id, user.restaurant_id]
    );

    const staff = (existingRows as any[])[0];
    if (!staff) {
      throw new AppError('Staff member nahi mila', 404);
    }

    if (staff.role === 'owner') {
      throw new AppError('Owner ki details yaha se update nahi ho sakti', 403);
    }

    if (user.role === 'manager' && staff.role === 'manager') {
      throw new AppError('Manager dusre manager ko update nahi kar sakta', 403);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (role) {
      const validRoles = ['manager', 'staff', 'kitchen'];
      if (!validRoles.includes(role)) {
        throw new AppError(`role sirf ${validRoles.join(', ')} ho sakta hai`, 400);
      }
      updates.push('role = ?');
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      throw new AppError('Koi field update ke liye nahi di gayi', 400);
    }

    const now = getNowIST();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);
    values.push(user.restaurant_id);

    await pool.execute(
      `UPDATE restaurant_users SET ${updates.join(', ')} WHERE id = ? AND restaurant_id = ?`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Staff details successfully update ho gayi',
    });
  }
);
