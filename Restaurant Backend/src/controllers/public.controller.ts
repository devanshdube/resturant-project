import { Request, Response } from 'express';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';

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
// @route   POST /api/v1/public/order
// @desc    Place an order as a guest from QR menu
// @access  Public (needs table_id and token for security)
// ─────────────────────────────────────────────────────────────────────────────
export const createPublicOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { restaurant_id, table_id, token, items, special_notes } = req.body;

    if (!restaurant_id || !table_id || !token || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Zaroori details missing hain (restaurant, table, items)', 400);
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

      // 2. Insert Order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (restaurant_id, table_id, order_number, status, total_amount, tax_amount, grand_total, special_notes, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', 0, 0, 0, ?, ?, ?)`,
        [restaurant_id, table_id, orderNumber, special_notes || '', now, now]
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
