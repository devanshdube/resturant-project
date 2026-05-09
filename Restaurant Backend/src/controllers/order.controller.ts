import { Response } from 'express';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { AuthenticatedRequest, RestaurantUserJwtPayload } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/orders
// @desc    Get all orders for the restaurant (with optional status filter)
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getOrders = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { status } = req.query;

    let query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_amount, o.grand_total,
        o.session_id, o.special_notes, o.created_at, o.updated_at,
        t.table_number,
        ts.status as session_status,
        COUNT(oi.id) as item_count
      FROM orders o
      JOIN restaurant_tables t ON t.id = o.table_id
      LEFT JOIN table_sessions ts ON ts.session_id = o.session_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = ?
    `;
    const params: any[] = [user.restaurant_id];

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`;

    const [rows] = await pool.execute(query, params);

    return res.status(200).json({ success: true, data: rows });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/orders/:id
// @desc    Get order details with all items
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;

    // Get order
    const [orderRows] = await pool.execute(
      `SELECT o.*, t.table_number
       FROM orders o
       JOIN restaurant_tables t ON t.id = o.table_id
       WHERE o.id = ? AND o.restaurant_id = ?`,
      [id, user.restaurant_id]
    );

    if ((orderRows as any[]).length === 0) throw new AppError('Order nahi mila', 404);

    const order = (orderRows as any[])[0];

    // Get order items
    const [itemRows] = await pool.execute(
      `SELECT oi.id, oi.item_name, oi.variant_name, oi.unit_price, oi.quantity, oi.subtotal, oi.special_notes
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: { ...order, items: itemRows }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/orders/:id/status
// @desc    Update order status (e.g. pending → confirmed → preparing → ready)
// @access  Protected (Owner, Manager, Staff)
// ─────────────────────────────────────────────────────────────────────────────
export const updateOrderStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Valid: ${validStatuses.join(', ')}`, 400);
    }

    const [result] = await pool.execute(
      'UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND restaurant_id = ?',
      [status, getNowIST(), id, user.restaurant_id]
    );

    if ((result as any).affectedRows === 0) throw new AppError('Order nahi mila', 404);

    return res.status(200).json({
      success: true,
      message: `Order status update ho gaya: ${status}`
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/orders/stats
// @desc    Get today's order stats for dashboard
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const getOrderStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const today = getNowIST().split(' ')[0]; // YYYY-MM-DD

    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status NOT IN ('cancelled') THEN grand_total ELSE 0 END) as total_revenue
       FROM orders
       WHERE restaurant_id = ? AND created_at LIKE ?`,
      [user.restaurant_id, `${today}%`]
    );

    return res.status(200).json({ success: true, data: (rows as any[])[0] });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/orders/analytics
// @desc    Get dashboard analytics (Total stats, popular items)
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const getAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    // 1. Overall Stats
    const [statsRows] = await pool.execute(
      `SELECT 
        COUNT(id) as total_orders,
        SUM(CASE WHEN status NOT IN ('cancelled') THEN grand_total ELSE 0 END) as total_revenue,
        COUNT(DISTINCT customer_id) as total_customers
       FROM orders
       WHERE restaurant_id = ?`,
      [user.restaurant_id]
    );
    const stats = (statsRows as any[])[0];

    // 2. Popular Items (Top 4)
    const [popularItemsRows] = await pool.execute(
      `SELECT 
        oi.menu_item_id,
        oi.item_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.restaurant_id = ? AND o.status != 'cancelled'
       GROUP BY oi.menu_item_id, oi.item_name
       ORDER BY total_sold DESC
       LIMIT 4`,
      [user.restaurant_id]
    );

    return res.status(200).json({ 
      success: true, 
      data: {
        stats: {
          total_orders: stats.total_orders || 0,
          total_revenue: stats.total_revenue || 0,
          total_customers: stats.total_customers || 0,
        },
        popular_items: popularItemsRows
      } 
    });
  }
);
