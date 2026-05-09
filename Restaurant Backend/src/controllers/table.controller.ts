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
      `SELECT 
        rt.id, rt.table_number, rt.capacity, rt.qr_code_url, rt.qr_token, rt.is_active, rt.created_at, rt.updated_at,
        (SELECT COUNT(*) FROM table_sessions ts WHERE ts.table_id = rt.id AND ts.status = 'active') as active_session_count
       FROM restaurant_tables rt
       WHERE rt.restaurant_id = ?
       ORDER BY rt.created_at DESC`,
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

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/tables/:id/billing
// @desc    Get all active sessions and their orders for a table
// @access  Protected (Owner, Manager, Staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getTableBillingDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;

    // 1. Check if table belongs to this restaurant
    const [tableRows] = await pool.execute(
      'SELECT id, table_number FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
      [id, user.restaurant_id]
    );

    if ((tableRows as any[]).length === 0) {
      throw new AppError('Table nahi mili', 404);
    }
    const table = (tableRows as any[])[0];

    // 2. Get all active sessions for this table
    const [sessions] = await pool.execute(
      `SELECT id, session_id, created_at FROM table_sessions WHERE table_id = ? AND status = 'active'`,
      [id]
    );

    const activeSessions = sessions as any[];
    if (activeSessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: { table, sessions: [], grand_total: 0, items: [] }
      });
    }

    // 3. Get all orders for these sessions
    const sessionIds = activeSessions.map(s => s.session_id);
    const placeholders = sessionIds.map(() => '?').join(',');
    
    const [orders] = await pool.execute(
      `SELECT id, order_number, total_amount, tax_amount, grand_total, session_id 
       FROM orders 
       WHERE session_id IN (${placeholders}) AND status != 'cancelled'`,
      sessionIds
    );

    // 4. Get items for all these orders
    const orderIds = (orders as any[]).map(o => o.id);
    let items: any[] = [];
    if (orderIds.length > 0) {
      const orderPlaceholders = orderIds.map(() => '?').join(',');
      const [itemRows] = await pool.execute(
        `SELECT oi.id, oi.item_name, oi.variant_name, oi.unit_price, oi.quantity, oi.subtotal, o.session_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.id IN (${orderPlaceholders})`,
        orderIds
      );
      items = itemRows as any[];
    }

    const grandTotal = (orders as any[]).reduce((sum, o) => sum + Number(o.grand_total), 0);

    return res.status(200).json({
      success: true,
      data: {
        table,
        sessions: activeSessions,
        orders,
        items,
        grand_total: grandTotal
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/tables/:id/merge-complete
// @desc    Complete all active sessions and their orders on a table
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const mergeCompleteTableSessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Get all active sessions for this table
      const [sessions] = await connection.execute(
        `SELECT session_id FROM table_sessions WHERE table_id = ? AND status = 'active'`,
        [id]
      );
      const sessionIds = (sessions as any[]).map(s => s.session_id);

      if (sessionIds.length > 0) {
        const placeholders = sessionIds.map(() => '?').join(',');
        
        // 2. Mark all sessions as completed
        await connection.execute(
          `UPDATE table_sessions SET status = 'completed' WHERE session_id IN (${placeholders})`,
          sessionIds
        );

        // 3. Mark all related orders as completed
        await connection.execute(
          `UPDATE orders SET status = 'completed', updated_at = ? WHERE session_id IN (${placeholders})`,
          [getNowIST(), ...sessionIds]
        );
      }

      await connection.commit();
      return res.status(200).json({
        success: true,
        message: 'Table billing complete ho gayi aur saare sessions close kar diye gaye hain.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);
