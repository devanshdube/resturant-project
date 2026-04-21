import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { RestaurantUserRow } from '../types/index';

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
      'SELECT ru.*, r.is_active as is_restaurant_active FROM restaurant_users ru JOIN restaurants r ON r.id = ru.restaurant_id WHERE ru.email = ?',
      [email.toLowerCase().trim()]
    );
    const user = (rows as (RestaurantUserRow & { is_restaurant_active: number })[])[0];

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
