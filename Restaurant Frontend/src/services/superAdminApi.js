import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Super Admin API Service
// Base: /api/v1/super-admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Platform ke global stats fetch karo
 */
export const getPlatformStats = () =>
  api.get('/super-admin/stats');

/**
 * Saare restaurant owners fetch karo (with pagination, search, status filter)
 * @param {object} params - { page, limit, search, status }
 */
export const getAllOwners = (params = {}) =>
  api.get('/super-admin/owners', { params });

/**
 * Ek owner ki complete detail fetch karo
 * @param {number} id - Restaurant ID
 */
export const getOwnerById = (id) =>
  api.get(`/super-admin/owners/${id}`);

/**
 * Naya restaurant owner create karo
 * @param {object} data - { owner_name, hotel_name, email, mobile, address }
 */
export const createOwner = (data) =>
  api.post('/super-admin/owners/create', data);

/**
 * Owner ko block ya unblock karo
 * @param {number} id - Restaurant ID
 */
export const toggleOwnerStatus = (id) =>
  api.patch(`/super-admin/owners/${id}/toggle-status`);

/**
 * Existing subscription update karo
 * @param {number} id - Restaurant ID
 * @param {object} data - { plan, status, subscription_expires_at }
 */
export const updateSubscription = (id, data) =>
  api.patch(`/super-admin/owners/${id}/subscription`, data);

/**
 * Naya subscription assign karo
 * @param {number} id - Restaurant ID
 * @param {object} data - { plan, status, subscription_start_date, subscription_expires_at }
 */
export const assignSubscription = (id, data) =>
  api.post(`/super-admin/owners/${id}/subscription`, data);

/**
 * Kisi owner ka subscription detail fetch karo
 * @param {number} id - Restaurant ID
 */
export const getOwnerSubscription = (id) =>
  api.get(`/super-admin/owners/${id}/subscription`);
