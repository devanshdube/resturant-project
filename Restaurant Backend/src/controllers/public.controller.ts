import { Request, Response } from 'express';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/public/menu/:slug
// @desc    Get restaurant info and full menu publicly
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const getPublicMenu = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    // 1. Get Restaurant details (check both slug or id)
    const [restaurantRows] = await pool.execute(
      'SELECT id, name, slug, logo_url, address, restaurant_type, service_type, currency FROM restaurants WHERE slug = ? OR id = ?',
      [slug, slug]
    );

    if ((restaurantRows as any[]).length === 0) {
      throw new AppError('Restaurant nahi mila', 404);
    }

    const restaurant = (restaurantRows as any[])[0];
    const restaurantId = restaurant.id;

    // 2. Get active Categories
    const [categoryRows] = await pool.execute(
      'SELECT id, name, sort_order FROM menu_categories WHERE restaurant_id = ? AND is_active = 1 ORDER BY sort_order ASC',
      [restaurantId]
    );

    // 3. Get all available Menu Items
    const [itemRows] = await pool.execute(
      'SELECT id, category_id, name, description, image_url, price, is_veg, is_available, prep_time_mins FROM menu_items WHERE restaurant_id = ? AND is_available = 1',
      [restaurantId]
    );

    // 4. Organize data: items inside categories
    const menu = (categoryRows as any[]).map(cat => ({
      ...cat,
      items: (itemRows as any[]).filter(item => item.category_id === cat.id)
    }));

    return res.status(200).json({
      success: true,
      data: {
        restaurant,
        menu
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/public/table/:id/:token
// @desc    Verify table QR token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const verifyTableToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, token } = req.params;

    const [rows] = await pool.execute(
      'SELECT id, table_number, restaurant_id FROM restaurant_tables WHERE id = ? AND qr_token = ? AND is_active = 1',
      [id, token]
    );

    if ((rows as any[]).length === 0) {
      throw new AppError('Invalid Table QR Code', 403);
    }

    return res.status(200).json({
      success: true,
      data: { valid: true, table: (rows as any[])[0] }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/public/session/start
// @desc    Start a new guest session for a table scan
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const startGuestSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { table_id, token } = req.body;

    if (!table_id || !token) {
      throw new AppError('table_id aur token zaroori hain', 400);
    }

    // 1. Verify the table and token are valid
    const [tableRows] = await pool.execute(
      'SELECT id, table_number, restaurant_id FROM restaurant_tables WHERE id = ? AND qr_token = ? AND is_active = 1',
      [table_id, token]
    );

    if ((tableRows as any[]).length === 0) {
      throw new AppError('Invalid QR Code. Please re-scan.', 403);
    }

    const table = (tableRows as any[])[0];
    const now = getNowIST();

    // 2. Generate a unique session ID: T{tableId}-S{randomHex}
    const sessionId = `T${table_id}-S${crypto.randomBytes(6).toString('hex')}`;

    // 3. Save session in DB
    await pool.execute(
      `INSERT INTO table_sessions (table_id, session_id, status, created_at) VALUES (?, ?, 'active', ?)`,
      [table_id, sessionId, now]
    );

    return res.status(201).json({
      success: true,
      message: 'Session start ho gayi!',
      data: {
        session_id: sessionId,
        table_id: table.id,
        table_number: table.table_number,
        restaurant_id: table.restaurant_id
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/public/order
// @desc    Place an order as a guest from QR menu
// @access  Public (needs table_id and token for security)
// ─────────────────────────────────────────────────────────────────────────────
export const createPublicOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { restaurant_id, table_id, token, session_id, items, special_notes } = req.body;

    if (!restaurant_id || !table_id || !token || !session_id || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Zaroori details missing hain (restaurant, table, session, items)', 400);
    }

    // 0. Validate session_id belongs to this table
    const [sessionRows] = await pool.execute(
      `SELECT id FROM table_sessions WHERE session_id = ? AND table_id = ? AND status = 'active'`,
      [session_id, table_id]
    );
    if ((sessionRows as any[]).length === 0) {
      throw new AppError('Invalid session. Please re-scan QR code.', 403);
    }

    // 1. Verify Table Token (Security)
    const [tableRows] = await pool.execute(
      'SELECT id FROM restaurant_tables WHERE id = ? AND qr_token = ? AND restaurant_id = ? AND is_active = 1',
      [table_id, token, restaurant_id]
    );

    if ((tableRows as any[]).length === 0) {
      throw new AppError('Invalid table session. Please re-scan QR.', 403);
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const now = getNowIST();
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // 2. Insert Order (with session_id)
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (restaurant_id, table_id, session_id, order_number, status, total_amount, tax_amount, grand_total, special_notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'pending', 0, 0, 0, ?, ?, ?)`,
        [restaurant_id, table_id, session_id, orderNumber, special_notes || '', now, now]
      );

      const orderId = (orderResult as any).insertId;
      let subtotal = 0;

      // 3. Insert Order Items
      for (const item of items) {
        const [menuItemRows] = await connection.execute(
          'SELECT id, name, price FROM menu_items WHERE id = ? AND restaurant_id = ? AND is_available = 1',
          [item.menu_item_id, restaurant_id]
        );

        if ((menuItemRows as any[]).length === 0) continue;
        const menuItem = (menuItemRows as any[])[0];

        const itemSubtotal = menuItem.price * item.quantity;
        subtotal += itemSubtotal;

        await connection.execute(
          `INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, special_notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, menuItem.id, menuItem.name, menuItem.price, item.quantity, itemSubtotal, item.notes || '', now]
        );
      }

      // 4. Update Order Totals (Simple logic: no tax for now, or fixed 5%)
      const taxAmount = subtotal * 0.05; 
      const grandTotal = subtotal + taxAmount;

      await connection.execute(
        'UPDATE orders SET total_amount = ?, tax_amount = ?, grand_total = ? WHERE id = ?',
        [subtotal, taxAmount, grandTotal, orderId]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Order place ho gaya!',
        data: { order_id: orderId, order_number: orderNumber }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/public/orders/:session_id
// @desc    Get all orders placed by the guest in current session
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const getGuestOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const { session_id } = req.params;

    if (!session_id) {
      throw new AppError('session_id zaroori hai', 400);
    }

    // 1. Get all orders for this session
    const [orders] = await pool.execute(
      `SELECT id, order_number, status, total_amount, tax_amount, grand_total, created_at
       FROM orders
       WHERE session_id = ?
       ORDER BY created_at DESC`,
      [session_id]
    );

    // 2. For each order, get items
    const ordersWithItems = await Promise.all((orders as any[]).map(async (order) => {
      const [items] = await pool.execute(
        `SELECT id, item_name, unit_price, quantity, subtotal, special_notes
         FROM order_items
         WHERE order_id = ?`,
        [order.id]
      );
      return { ...order, items };
    }));

    // 3. Check session status too
    const [session] = await pool.execute(
      'SELECT status FROM table_sessions WHERE session_id = ?',
      [session_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        session_status: (session as any[]).length > 0 ? (session as any[])[0].status : 'unknown',
        orders: ordersWithItems
      }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/public/session/complete
// @desc    Staff completes the guest session (after payment)
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const completeGuestSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { session_id } = req.body;

    if (!session_id) {
      throw new AppError('session_id zaroori hai', 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update session status
      await connection.execute(
        "UPDATE table_sessions SET status = 'completed' WHERE session_id = ?",
        [session_id]
      );

      // 2. Mark all orders in this session as completed
      await connection.execute(
        "UPDATE orders SET status = 'completed' WHERE session_id = ?",
        [session_id]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Session complete ho gayi hai.'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/public/session/request-bill
// @desc    Guest requests the bill
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const requestBill = asyncHandler(
  async (req: Request, res: Response) => {
    const { session_id, table_id } = req.body;

    if (!session_id || !table_id) {
      throw new AppError('session_id aur table_id zaroori hain', 400);
    }

    // Update session status to 'billing' (or just notify)
    // Note: You might need to add 'billing' to the ENUM if not present
    await pool.execute(
      "UPDATE table_sessions SET status = 'active' WHERE session_id = ? AND table_id = ?",
      [session_id, table_id]
    );

    // Create a notification for the restaurant staff
    const [tableRow] = await pool.execute('SELECT table_number, restaurant_id FROM restaurant_tables WHERE id = ?', [table_id]);
    if ((tableRow as any[]).length > 0) {
      const { table_number, restaurant_id } = (tableRow as any[])[0];
      const now = getNowIST();
      await pool.execute(
        `INSERT INTO notifications (restaurant_id, type, message, is_read, created_at)
         VALUES (?, 'bill_request', ?, 0, ?)`,
        [restaurant_id, `Table ${table_number} has requested the bill.`, now]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Bill request staff ko bhej di gayi hai.'
    });
  }
);
