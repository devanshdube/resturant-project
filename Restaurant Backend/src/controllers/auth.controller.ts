import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { RestaurantUserRow, SuperAdminRow } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const generateAccessToken = (id: number, restaurant_id: number, email: string, role: string): string =>
  jwt.sign(
    { id, restaurant_id, email, role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

const generateRefreshToken = (id: number, role: string): string =>
  jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/auth/login
// @desc    Restaurant user (Owner, Manager, Staff) login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const loginRestaurantUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password)
      throw new AppError('email aur password daalein', 400);

    const [rows] = await pool.execute(
      'SELECT ru.*, r.name as restaurant_name, r.is_active as is_restaurant_active FROM restaurant_users ru JOIN restaurants r ON r.id = ru.restaurant_id WHERE ru.email = ?',
      [email.toLowerCase().trim()]
    );
    const user = (rows as (RestaurantUserRow & { is_restaurant_active: number, restaurant_name: string })[])[0];

    if (!user)
      throw new AppError('Email ya password galat hai', 401);

    if (!user.is_active)
      throw new AppError('Aapka account inactive hai. Owner / Admin se contact karein', 403);
      
    if (!user.is_restaurant_active)
      throw new AppError('Aapka restaurant block ho chuka hai. Super Admin se contact karein', 403);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      throw new AppError('Email ya password galat hai', 401);

    const accessToken = generateAccessToken(user.id, user.restaurant_id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    
    const now = getNowIST();
    const expiresAt = moment().tz('Asia/Kolkata').add(7, 'days').format('YYYY-MM-DD HH:mm:ss');

    // Remove old refresh tokens for this user to keep it clean (or just insert new)
    await pool.execute(
      'DELETE FROM refresh_tokens WHERE user_id = ? AND user_type = ?',
      [user.id, 'restaurant_user']
    );

    // Insert new refresh token
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, user_type, token, expires_at, created_at)
       VALUES (?, 'restaurant_user', ?, ?, ?)`,
      [user.id, refreshToken, expiresAt, now]
    );

    // Update last login
    await pool.execute(
      'UPDATE restaurant_users SET last_login_at = ?, updated_at = ? WHERE id = ?',
      [now, now, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          restaurant_id: user.restaurant_id,
          restaurant_name: user.restaurant_name,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        },
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/auth/refresh-token
// @desc    Access token refresh karna (for both Super Admin and Restaurant User)
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const refreshTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new AppError('Refresh token required', 400);
    }

    // 1. Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET as string);
    } catch (err) {
      throw new AppError('Refresh token invalid ya expire ho gaya hai', 401);
    }

    const { id, role } = decoded;
    const isSuperAdmin = role === 'super_admin';
    const userType = isSuperAdmin ? 'super_admin' : 'restaurant_user';

    // 2. Check token in DB
    const [tokenRows] = await pool.execute(
      'SELECT id FROM refresh_tokens WHERE token = ? AND user_id = ? AND user_type = ?',
      [refresh_token, id, userType]
    );

    if ((tokenRows as any[]).length === 0) {
      throw new AppError('Refresh token DB mein nahi mila. Please login again.', 401);
    }

    // 3. Issue new tokens
    let newAccessToken = '';
    const newRefreshToken = generateRefreshToken(id, role);

    if (isSuperAdmin) {
      const [adminRows] = await pool.execute('SELECT * FROM super_admins WHERE id = ?', [id]);
      const admin = (adminRows as SuperAdminRow[])[0];
      if (!admin || !admin.is_active) throw new AppError('Admin inactive ya exist nahi karta', 401);
      
      newAccessToken = jwt.sign(
        { id: admin.id, email: admin.email, role: 'super_admin' },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as jwt.SignOptions
      );
    } else {
      const [userRows] = await pool.execute('SELECT * FROM restaurant_users WHERE id = ?', [id]);
      const user = (userRows as RestaurantUserRow[])[0];
      if (!user || !user.is_active) throw new AppError('User inactive ya exist nahi karta', 401);
      
      newAccessToken = generateAccessToken(user.id, user.restaurant_id, user.email, user.role);
    }

    // 4. Update refresh token in DB
    const now = getNowIST();
    const expiresAt = moment().tz('Asia/Kolkata').add(7, 'days').format('YYYY-MM-DD HH:mm:ss');
    
    await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [refresh_token]);
    
    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, user_type, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, userType, newRefreshToken, expiresAt, now]
    );

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
          expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        }
      }
    });
  }
);
