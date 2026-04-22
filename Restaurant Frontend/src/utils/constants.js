// ─────────────────────────────────────────────────────────────────────────────
// Application Constants
// ─────────────────────────────────────────────────────────────────────────────

export const APP_NAME = 'Restaurant MS';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// ─── User Roles ────────────────────────────────────────────────────────
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  STAFF: 'staff',
  WAITER: 'waiter',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen',
};

// ─── Table Status ──────────────────────────────────────────────────────
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance',
};

// ─── Order Status ──────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// ─── React Query Cache Keys (Query Keys) ──────────────────────────────
export const QUERY_KEYS = {
  MENU_CATEGORIES: 'menuCategories',
  MENU_ITEMS: 'menuItems',
  TABLES: 'tables',
  ORDERS: 'orders',
  RESTAURANT_PROFILE: 'restaurantProfile',
  STAFF: 'staff',
};
