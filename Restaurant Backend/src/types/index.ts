import { Request } from 'express';

// ─── Generic API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
  status?: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────
export interface SuperAdminJwtPayload {
  id: number;
  email: string;
  role: 'super_admin';
  iat?: number;
  exp?: number;
}

export interface RestaurantUserJwtPayload {
  id: number;
  restaurant_id: number;
  email: string;
  role: 'owner' | 'manager' | 'staff' | 'kitchen';
  iat?: number;
  exp?: number;
}

// ─── Extended Request (authenticated) ────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
  user?: SuperAdminJwtPayload | RestaurantUserJwtPayload;
}

// ─── Restaurant Owner Create Body ─────────────────────────────────────────────
export interface RestaurantOwnerCreateBody {
  owner_name: string;       // Owner ka personal naam
  hotel_name: string;       // Restaurant ka naam
  mobile: string;           // 10-digit mobile number
  address?: string;         // Restaurant address (optional)
  email: string;            // Login email
  // password auto-generate hoga: FIRST3@MOBILE4
}

// ─── Subscription Body ────────────────────────────────────────────────────────
export interface SubscriptionBody {
  plan: 'free' | 'basic' | 'pro';
  status: 'trial' | 'active' | 'expired';
  subscription_start_date?: string;  // IST string, default: now
  subscription_expires_at?: string;  // IST string, null = no expiry
}

// ─── DB Row Types ─────────────────────────────────────────────────────────────
export interface SuperAdminRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  is_active: number;
  created_at: string;
  updated_at: string | null;
}

export interface RestaurantRow {
  id: number;
  name: string;
  owner_name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface RestaurantUserRow {
  id: number;
  restaurant_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  is_active: number;
}

export interface SubscriptionRow {
  id: number;
  restaurant_id: number;
  plan: string;
  status: string;
  subscription_start_date: string;
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
