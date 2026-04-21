import { Response } from 'express';
import crypto from 'crypto';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { AuthenticatedRequest, RestaurantUserJwtPayload } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/tables
// @desc    Create a new table & generate QR token
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const createTable = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { table_number, capacity } = req.body;

    if (!table_number) {
      throw new AppError('table_number zaroori hai', 400);
    }

    // Check duplicate table for this restaurant
    const [existing] = await pool.execute(
      'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ?',
      [user.restaurant_id, table_number.trim()]
    );
    if ((existing as any[]).length > 0) {
      throw new AppError('Is table_number ki table pehle se maujood hai', 409);
    }

    const qrToken = crypto.randomBytes(16).toString('hex');
    const now = getNowIST();

    const [result] = await pool.execute(
      `INSERT INTO restaurant_tables
         (restaurant_id, table_number, capacity, qr_token, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [user.restaurant_id, table_number.trim(), capacity || 4, qrToken, now, now]
    );

    return res.status(201).json({
      success: true,
      message: 'Table successfully create ho gayi',
      data: {
        id: (result as any).insertId,
        restaurant_id: user.restaurant_id,
        table_number: table_number.trim(),
        capacity: capacity || 4,
        qr_token: qrToken,
        is_active: 1,
        created_at: now
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/tables
// @desc    Get all tables of the restaurant
// @access  Protected (Owner, Manager, Staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTables = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const [rows] = await pool.execute(
      `SELECT id, table_number, capacity, qr_code_url, qr_token, is_active, created_at, updated_at
       FROM restaurant_tables
       WHERE restaurant_id = ?
       ORDER BY created_at DESC`,
      [user.restaurant_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Tables list fetched successfully',
      data: rows
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/tables/:id
// @desc    Update table details or toggle active status
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTable = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;
    const { table_number, capacity, is_active, qr_code_url } = req.body;

    // Check if table belongs to this restaurant
    const [tableRows] = await pool.execute(
      'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
      [id, user.restaurant_id]
    );

    if ((tableRows as any[]).length === 0) {
      throw new AppError('Table nahi mili', 404);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (table_number) {
      // Check duplicate
      const [existing] = await pool.execute(
        'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ? AND id != ?',
        [user.restaurant_id, table_number.trim(), id]
      );
      if ((existing as any[]).length > 0) {
        throw new AppError('Naya table_number pehle se dusri table ko assigned hai', 409);
      }
      updates.push('table_number = ?');
      values.push(table_number.trim());
    }

    if (capacity !== undefined) {
      updates.push('capacity = ?');
      values.push(capacity);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (qr_code_url !== undefined) {
      updates.push('qr_code_url = ?');
      values.push(qr_code_url);
    }

    if (updates.length === 0) {
      throw new AppError('Update karne ke liye field bhejiye', 400);
    }

    const now = getNowIST();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id);
    values.push(user.restaurant_id);

    await pool.execute(
      `UPDATE restaurant_tables SET ${updates.join(', ')} WHERE id = ? AND restaurant_id = ?`,
      values
    );

    return res.status(200).json({
      success: true,
      message: 'Table successfully update ho gayi'
    });
  }
);
