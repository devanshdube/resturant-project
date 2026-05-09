import { Response } from 'express';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { AuthenticatedRequest, RestaurantUserJwtPayload } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/notifications
// @desc    Get latest notifications for the restaurant
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const [rows] = await pool.execute(
      `SELECT id, order_id, type, message, is_read, created_at 
       FROM notifications 
       WHERE restaurant_id = ? 
       ORDER BY id DESC LIMIT 50`,
      [user.restaurant_id]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;

    const [result] = await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND restaurant_id = ?`,
      [id, user.restaurant_id]
    );

    if ((result as any).affectedRows === 0) {
      throw new AppError('Notification not found', 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/notifications/read-all
// @desc    Mark all unread notifications as read for the restaurant
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const markAllAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    await pool.execute(
      `UPDATE notifications SET is_read = 1 WHERE restaurant_id = ? AND is_read = 0`,
      [user.restaurant_id]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  }
);
