import { Response } from 'express';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { AuthenticatedRequest, RestaurantUserJwtPayload } from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/menu/categories
// @desc    Create a new menu category
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const createCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { name, description, image_url, sort_order } = req.body;

    if (!name) throw new AppError('Category name zaroori hai', 400);

    const now = getNowIST();

    const [result] = await pool.execute(
      `INSERT INTO menu_categories
         (restaurant_id, name, description, image_url, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [user.restaurant_id, name.trim(), description || null, image_url || null, sort_order || 0, now, now]
    );

    return res.status(201).json({
      success: true,
      message: 'Category successfully create ho gayi',
      data: { id: (result as any).insertId, name: name.trim() }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/menu/categories
// @desc    Get all categories for the restaurant
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getCategories = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;

    const [rows] = await pool.execute(
      `SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC, created_at DESC`,
      [user.restaurant_id]
    );

    return res.status(200).json({ success: true, data: rows });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/menu/categories/:id
// @desc    Update a menu category
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const updateCategory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;
    const { name, description, image_url, sort_order, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    const fields = { name, description, image_url, sort_order };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        updates.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) throw new AppError('Koi data update karne ke liye nahi bheja', 400);

    const now = getNowIST();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id, user.restaurant_id);

    const [result] = await pool.execute(
      `UPDATE menu_categories SET ${updates.join(', ')} WHERE id = ? AND restaurant_id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) throw new AppError('Category nahi mili', 404);

    return res.status(200).json({ success: true, message: 'Category update ho gayi' });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/menu/items
// @desc    Create a new menu item
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const createMenuItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const {
      category_id, name, description, image_url, price, discount_price,
      is_veg, is_available, is_featured, sort_order, prep_time_mins, tags
    } = req.body;

    if (!category_id || !name || price === undefined) {
      throw new AppError('category_id, name, aur price zaroori hain', 400);
    }

    // Checking if category exists and belongs to restaurant
    const [catRows] = await pool.execute(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?',
      [category_id, user.restaurant_id]
    );
    if ((catRows as any[]).length === 0) throw new AppError('Invalid category_id', 400);

    const now = getNowIST();

    const [result] = await pool.execute(
      `INSERT INTO menu_items
         (restaurant_id, category_id, name, description, image_url, price, discount_price, is_veg, is_available, is_featured, sort_order, prep_time_mins, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.restaurant_id, category_id, name.trim(), description || null, image_url || null,
        price, discount_price || null,
        is_veg !== undefined ? is_veg : 1,
        is_available !== undefined ? is_available : 1,
        is_featured !== undefined ? is_featured : 0,
        sort_order || 0,
        prep_time_mins || null,
        tags ? JSON.stringify(tags) : null,
        now, now
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu item create ho gaya',
      data: { id: (result as any).insertId, name: name.trim() }
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/menu/items
// @desc    Get all menu items (optional filter by category_id)
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getMenuItems = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const category_id = req.query.category_id;

    let query = `SELECT * FROM menu_items WHERE restaurant_id = ?`;
    const params: any[] = [user.restaurant_id];

    if (category_id) {
      query += ` AND category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY sort_order ASC, created_at DESC`;

    const [rows] = await pool.execute(query, params);

    return res.status(200).json({ success: true, data: rows });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/menu/items/:id
// @desc    Update a menu item
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMenuItem = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const { id } = req.params;
    const {
      category_id, name, description, image_url, price, discount_price,
      is_veg, is_available, is_featured, sort_order, prep_time_mins, tags
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    const fields = { category_id, name, description, image_url, price, discount_price, is_veg, is_available, is_featured, sort_order, prep_time_mins };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        updates.push(`${k} = ?`);
        values.push(v);
      }
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(tags ? JSON.stringify(tags) : null);
    }

    if (updates.length === 0) throw new AppError('Koi data update karne ke liye nahi bheja', 400);

    const now = getNowIST();
    updates.push('updated_at = ?');
    values.push(now);

    values.push(id, user.restaurant_id);

    const [result] = await pool.execute(
      `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND restaurant_id = ?`,
      values
    );

    if ((result as any).affectedRows === 0) throw new AppError('Menu item nahi mila', 404);

    return res.status(200).json({ success: true, message: 'Menu item update ho gaya' });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/menu/items/:id/variants
// @desc    Add a variant to a menu item (e.g. Large, Medium, Spicy)
// @access  Protected (Owner, Manager)
// ─────────────────────────────────────────────────────────────────────────────
export const createVariant = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const menu_item_id = req.params.id;
    const { name, extra_price } = req.body;

    if (!name || extra_price === undefined) throw new AppError('name aur extra_price zaroori hain', 400);

    // Verify item belongs to restaurant
    const [item] = await pool.execute('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?', [menu_item_id, user.restaurant_id]);
    if ((item as any[]).length === 0) throw new AppError('Menu item nahi mila', 404);

    const now = getNowIST();
    const [result] = await pool.execute(
      `INSERT INTO menu_item_variants (menu_item_id, name, extra_price, is_available, created_at) VALUES (?, ?, ?, 1, ?)`,
      [menu_item_id, name.trim(), extra_price, now]
    );

    return res.status(201).json({ success: true, message: 'Variant add ho gaya', data: { id: (result as any).insertId, name } });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/menu/items/:id/variants
// @desc    Get variants for an item
// @access  Protected (All staff)
// ─────────────────────────────────────────────────────────────────────────────
export const getVariants = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user as RestaurantUserJwtPayload;
    const menu_item_id = req.params.id;

    // Verify item belongs to restaurant
    const [item] = await pool.execute('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?', [menu_item_id, user.restaurant_id]);
    if ((item as any[]).length === 0) throw new AppError('Menu item nahi mila', 404);

    const [rows] = await pool.execute('SELECT * FROM menu_item_variants WHERE menu_item_id = ?', [menu_item_id]);

    return res.status(200).json({ success: true, data: rows });
  }
);
