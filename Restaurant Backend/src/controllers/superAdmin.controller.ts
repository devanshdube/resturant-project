import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import moment from 'moment-timezone';
import pool from '../config/db';
import { asyncHandler, AppError } from '../utils/helpers';
import { getNowIST } from '../utils/datetime';
import { generateOwnerPassword, sendOwnerCredentials } from '../utils/mailer';
import {
  AuthenticatedRequest,
  SuperAdminRow,
} from '../types/index';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Naam se URL-friendly slug banao */
const buildSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/** Access token generate karo */
const generateAccessToken = (id: number, email: string): string =>
  jwt.sign(
    { id, email, role: 'super_admin' },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as jwt.SignOptions
  );

/** Refresh token generate karo */
const generateRefreshToken = (id: number): string =>
  jwt.sign(
    { id, role: 'super_admin' },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/super-admin/register
// @desc    Super Admin register karo
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const registerSuperAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      throw new AppError('name, email aur password zaroori hain', 400);
    if (password.length < 8)
      throw new AppError('Password kam se kam 8 characters ka hona chahiye', 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError('Valid email address daalein', 400);

    const [existing] = await pool.execute(
      'SELECT id FROM super_admins WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if ((existing as any[]).length > 0)
      throw new AppError('Yeh email pehle se registered hai', 409);

    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);
    const now = getNowIST();

    const [result] = await pool.execute(
      `INSERT INTO super_admins (name, email, password_hash, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [name.trim(), email.toLowerCase().trim(), password_hash, now, now]
    );

    const insertedId = (result as any).insertId;

    return res.status(201).json({
      success: true,
      message: 'Super Admin successfully register ho gaya',
      data: {
        id: insertedId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        is_active: 1,
        created_at: now,
        updated_at: now,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/super-admin/login
// @desc    Super Admin login — access + refresh token milega
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const loginSuperAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password)
      throw new AppError('email aur password daalein', 400);

    const [rows] = await pool.execute(
      'SELECT * FROM super_admins WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    const admin = (rows as SuperAdminRow[])[0];

    if (!admin)
      throw new AppError('Email ya password galat hai', 401);
    if (!admin.is_active)
      throw new AppError('Aapka account inactive hai. Admin se contact karein', 403);

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch)
      throw new AppError('Email ya password galat hai', 401);

    const accessToken = generateAccessToken(admin.id, admin.email);
    const refreshToken = generateRefreshToken(admin.id);
    const now = getNowIST();
    const expiresAt = moment().tz('Asia/Kolkata').add(7, 'days').format('YYYY-MM-DD HH:mm:ss');

    await pool.execute(
      `INSERT INTO refresh_tokens (user_id, user_type, token, expires_at, created_at)
       VALUES (?, 'super_admin', ?, ?, ?)`,
      [admin.id, refreshToken, expiresAt, now]
    );

    await pool.execute(
      'UPDATE super_admins SET updated_at = ? WHERE id = ?',
      [now, admin.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          is_active: admin.is_active,
          created_at: admin.created_at,
          updated_at: now,
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
// @route   POST /api/v1/super-admin/owners/create
// @desc    Restaurant owner + restaurant + default subscription ek saath create karo
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const createOwner = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { owner_name, hotel_name, mobile, address, email } = req.body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!owner_name || !hotel_name || !mobile || !email)
      throw new AppError('owner_name, hotel_name, mobile aur email zaroori hain', 400);

    if (!/^[0-9]{10}$/.test(mobile.trim()))
      throw new AppError('Mobile number 10 digits ka hona chahiye', 400);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError('Valid email address daalein', 400);

    if (owner_name.trim().length < 3)
      throw new AppError('owner_name kam se kam 3 characters ka hona chahiye', 400);

    // ── Check duplicate email ─────────────────────────────────────────────────
    const [emailCheck] = await pool.execute(
      'SELECT id FROM restaurant_users WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    if ((emailCheck as any[]).length > 0)
      throw new AppError('Yeh email pehle se kisi owner ke paas register hai', 409);

    // ── Auto-generate password: RAJ@1234 ─────────────────────────────────────
    const rawPassword = generateOwnerPassword(owner_name.trim(), mobile.trim());
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(rawPassword, salt);

    // ── Unique slug banana ────────────────────────────────────────────────────
    let baseSlug = buildSlug(hotel_name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM restaurants WHERE slug = ?',
        [slug]
      );
      if ((slugCheck as any[]).length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // ── IST timestamps ────────────────────────────────────────────────────────
    const now = getNowIST();
    const trialStart = now;
    const trialExpiry = moment().tz('Asia/Kolkata').add(3, 'days').format('YYYY-MM-DD HH:mm:ss');

    // ── DB Transaction ────────────────────────────────────────────────────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. restaurants table
      const [restResult] = await conn.execute(
        `INSERT INTO restaurants
           (name, owner_name, slug, phone, email, address,
            currency, timezone, restaurant_type, service_type,
            gst_enabled, gst_percentage, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'INR', 'Asia/Kolkata', 'both', 'both', 0, 0.00, 1, ?, ?)`,
        [
          hotel_name.trim(),
          owner_name.trim(),
          slug,
          mobile.trim(),
          email.toLowerCase().trim(),
          address?.trim() || null,
          now,
          now,
        ]
      );
      const restaurantId = (restResult as any).insertId;

      // 2. restaurant_users table (role: owner)
      const [userResult] = await conn.execute(
        `INSERT INTO restaurant_users
           (restaurant_id, name, email, password_hash, role, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'owner', 1, ?, ?)`,
        [restaurantId, owner_name.trim(), email.toLowerCase().trim(), password_hash, now, now]
      );
      const userId = (userResult as any).insertId;

      // 3. restaurant_subscriptions table (default: free / trial / 3 days)
      const [subResult] = await conn.execute(
        `INSERT INTO restaurant_subscriptions
           (restaurant_id, plan, status, subscription_start_date, subscription_expires_at, created_at, updated_at)
         VALUES (?, 'free', 'trial', ?, ?, ?, ?)`,
        [restaurantId, trialStart, trialExpiry, now, now]
      );
      const subscriptionId = (subResult as any).insertId;

      await conn.commit();

      // ── Send email (async — don't block response) ─────────────────────────
      sendOwnerCredentials(owner_name.trim(), hotel_name.trim(), email.toLowerCase().trim(), rawPassword)
        .catch((err: Error) => console.error('📧 Email send failed:', err.message));

      return res.status(201).json({
        success: true,
        message: `Restaurant owner successfully create ho gaya. Credentials ${email} pe bhej diye gaye hain.`,
        data: {
          restaurant: {
            id: restaurantId,
            name: hotel_name.trim(),
            slug,
            email: email.toLowerCase().trim(),
            phone: mobile.trim(),
            is_active: 1,
          },
          owner: {
            id: userId,
            name: owner_name.trim(),
            email: email.toLowerCase().trim(),
            role: 'owner',
            generated_password: rawPassword,   // Development me dikh raha hai, production mein hatana
          },
          subscription: {
            id: subscriptionId,
            plan: 'free',
            status: 'trial',
            subscription_start_date: trialStart,
            subscription_expires_at: trialExpiry,
          },
        },
      });

    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/super-admin/owners
// @desc    Saare restaurant owners list (pagination + filter + search)
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllOwners = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page   = Math.max(1, parseInt(req.query['page']   as string) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query['search'] as string || '').trim();
    const status = (req.query['status'] as string || 'all').trim(); // all | active | inactive

    // ── Build WHERE clause ────────────────────────────────────────────────────
    const conditions: string[] = [];
    const params: any[] = [];

    if (status === 'active') {
      conditions.push('r.is_active = 1');
    } else if (status === 'inactive') {
      conditions.push('r.is_active = 0');
    }

    if (search) {
      conditions.push('(r.name LIKE ? OR r.owner_name LIKE ? OR ru.email LIKE ? OR r.phone LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Count total ───────────────────────────────────────────────────────────
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total
       FROM restaurants r
       LEFT JOIN restaurant_users ru ON ru.restaurant_id = r.id AND ru.role = 'owner'
       ${whereClause}`,
      params
    );
    const total = (countRows as any[])[0].total;

    // ── Fetch paginated data ──────────────────────────────────────────────────
    const dataParams: any[] = [...params, limit, offset];
    const [rows] = await pool.execute(
      `SELECT
         r.id,
         r.name          AS hotel_name,
         r.owner_name,
         r.slug,
         r.phone,
         ru.email,
         r.address,
         r.is_active,
         r.created_at,
         rs.plan         AS sub_plan,
         rs.status       AS sub_status,
         rs.subscription_expires_at
       FROM restaurants r
       LEFT JOIN restaurant_users ru
         ON ru.restaurant_id = r.id AND ru.role = 'owner'
       LEFT JOIN restaurant_subscriptions rs
         ON rs.restaurant_id = r.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      dataParams
    );

    return res.status(200).json({
      success: true,
      message: 'Owners list successfully fetched',
      data: {
        owners: rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/super-admin/owners/:id
// @desc    Kisi ek owner ki complete detail
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getOwnerById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT
         r.id,
         r.name              AS hotel_name,
         r.owner_name,
         r.slug,
         r.phone,
         ru.email,
         r.address,
         r.currency,
         r.timezone,
         r.restaurant_type,
         r.service_type,
         r.operating_hours_open,
         r.operating_hours_close,
         r.gst_enabled,
         r.gst_no,
         r.gst_percentage,
         r.is_active,
         r.created_at,
         r.updated_at,
         rs.id               AS sub_id,
         rs.plan             AS sub_plan,
         rs.status           AS sub_status,
         rs.subscription_start_date,
         rs.subscription_expires_at
       FROM restaurants r
       LEFT JOIN restaurant_users ru
         ON ru.restaurant_id = r.id AND ru.role = 'owner'
       LEFT JOIN restaurant_subscriptions rs
         ON rs.restaurant_id = r.id
       WHERE r.id = ?`,
      [id]
    );

    const owner = (rows as any[])[0];
    if (!owner)
      throw new AppError('Owner nahi mila', 404);

    return res.status(200).json({
      success: true,
      message: 'Owner detail fetched',
      data: owner,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/super-admin/owners/:id/toggle-status
// @desc    Owner ko block ya unblock karo
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const toggleOwnerStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const now = getNowIST();

    // ── Restaurant exist check ────────────────────────────────────────────────
    const [rRows] = await pool.execute(
      'SELECT id, name, is_active FROM restaurants WHERE id = ?',
      [id]
    );
    const restaurant = (rRows as any[])[0];
    if (!restaurant)
      throw new AppError('Restaurant nahi mila', 404);

    const newStatus = restaurant.is_active ? 0 : 1;
    const action = newStatus === 0 ? 'Block' : 'Unblock';

    // ── Update restaurants + restaurant_users dono ────────────────────────────
    await pool.execute(
      'UPDATE restaurants SET is_active = ?, updated_at = ? WHERE id = ?',
      [newStatus, now, id]
    );
    await pool.execute(
      'UPDATE restaurant_users SET is_active = ?, updated_at = ? WHERE restaurant_id = ?',
      [newStatus, now, id]
    );

    return res.status(200).json({
      success: true,
      message: `Restaurant "${restaurant.name}" successfully ${action} kar diya gaya`,
      data: {
        restaurant_id: restaurant.id,
        hotel_name: restaurant.name,
        is_active: newStatus,
        updated_at: now,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/v1/super-admin/owners/:id/subscription
// @desc    Restaurant ko subscription assign karo (naya row insert)
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const assignSubscription = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { plan, status, subscription_start_date, subscription_expires_at } = req.body;

    if (!plan || !status)
      throw new AppError('plan aur status zaroori hain', 400);

    const validPlans = ['free', 'basic', 'pro'];
    const validStatus = ['trial', 'active', 'expired'];
    if (!validPlans.includes(plan))
      throw new AppError(`plan sirf: ${validPlans.join(', ')} ho sakta hai`, 400);
    if (!validStatus.includes(status))
      throw new AppError(`status sirf: ${validStatus.join(', ')} ho sakta hai`, 400);

    // ── Restaurant exist check ────────────────────────────────────────────────
    const [rRows] = await pool.execute('SELECT id FROM restaurants WHERE id = ?', [id]);
    if ((rRows as any[]).length === 0)
      throw new AppError('Restaurant nahi mila', 404);

    // ── Check existing subscription ───────────────────────────────────────────
    const [existing] = await pool.execute(
      'SELECT id FROM restaurant_subscriptions WHERE restaurant_id = ?',
      [id]
    );
    if ((existing as any[]).length > 0)
      throw new AppError('Iska subscription pehle se exist karta hai. Update karne ke liye PATCH use karein.', 409);

    const now = getNowIST();
    const startDate = subscription_start_date || now;

    const [result] = await pool.execute(
      `INSERT INTO restaurant_subscriptions
         (restaurant_id, plan, status, subscription_start_date, subscription_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, plan, status, startDate, subscription_expires_at || null, now, now]
    );

    return res.status(201).json({
      success: true,
      message: `Subscription assign ho gaya — Plan: ${plan}, Status: ${status}`,
      data: {
        id: (result as any).insertId,
        restaurant_id: parseInt(id as string),
        plan,
        status,
        subscription_start_date: startDate,
        subscription_expires_at: subscription_expires_at || null,
        created_at: now,
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/v1/super-admin/owners/:id/subscription
// @desc    Existing subscription update karo (plan / status / expiry)
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const updateSubscription = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { plan, status, subscription_expires_at } = req.body;

    const now = getNowIST();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (plan) {
      const validPlans = ['free', 'basic', 'pro'];
      if (!validPlans.includes(plan))
        throw new AppError(`plan sirf: ${validPlans.join(', ')} ho sakta hai`, 400);
      updates.push('plan = ?');
      values.push(plan);
    }

    if (status) {
      const validStatus = ['trial', 'active', 'expired'];
      if (!validStatus.includes(status))
        throw new AppError(`status sirf: ${validStatus.join(', ')} ho sakta hai`, 400);
      updates.push('status = ?');
      values.push(status);
    }

    if (subscription_expires_at !== undefined) {
      updates.push('subscription_expires_at = ?');
      values.push(subscription_expires_at || null);
    }

    if (updates.length === 1)
      throw new AppError('Update ke liye kuch fields daalein (plan, status, subscription_expires_at)', 400);

    values.push(id); // WHERE clause ke liye

    const [result] = await pool.execute(
      `UPDATE restaurant_subscriptions SET ${updates.join(', ')} WHERE restaurant_id = ?`,
      values
    );

    if ((result as any).affectedRows === 0)
      throw new AppError('Is restaurant ka subscription nahi mila. Pehle POST se assign karein.', 404);

    return res.status(200).json({
      success: true,
      message: 'Subscription successfully update ho gaya',
      data: {
        restaurant_id: parseInt(id as string),
        updated_fields: { plan, status, subscription_expires_at, updated_at: now },
      },
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/v1/super-admin/owners/:id/subscription
// @desc    Kisi restaurant ki subscription detail fetch karo
// @access  Protected (Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
export const getOwnerSubscription = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT
         rs.*,
         r.name  AS hotel_name,
         r.owner_name
       FROM restaurant_subscriptions rs
       JOIN restaurants r ON r.id = rs.restaurant_id
       WHERE rs.restaurant_id = ?`,
      [id]
    );

    const sub = (rows as any[])[0];
    if (!sub)
      throw new AppError('Subscription nahi mila', 404);

    return res.status(200).json({
      success: true,
      message: 'Subscription detail fetched',
      data: sub,
    });
  }
);
