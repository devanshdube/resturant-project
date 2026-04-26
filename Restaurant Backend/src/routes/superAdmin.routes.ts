import { Router } from 'express';
import { protectSuperAdmin } from '../middleware/auth.middleware';
import {
  registerSuperAdmin,
  loginSuperAdmin,
  createOwner,
  getAllOwners,
  getOwnerById,
  toggleOwnerStatus,
  assignSubscription,
  updateSubscription,
  getOwnerSubscription,
  getPlatformStats,
} from '../controllers/superAdmin.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES  (No auth required)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/super-admin/register
router.post('/register', registerSuperAdmin);

// POST /api/v1/super-admin/login
router.post('/login', loginSuperAdmin);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES  (JWT required — Super Admin only)
// ─────────────────────────────────────────────────────────────────────────────

// GET    /api/v1/super-admin/stats            → Global platform stats
router.get('/stats', protectSuperAdmin, getPlatformStats);

// POST   /api/v1/super-admin/owners/create   → Restaurant owner create karo
router.post('/owners/create', protectSuperAdmin, createOwner);

// GET    /api/v1/super-admin/owners          → Saare owners list
// Query: ?page=1&limit=10&search=name&status=active|inactive|all
router.get('/owners', protectSuperAdmin, getAllOwners);

// GET    /api/v1/super-admin/owners/:id      → Ek owner ka detail
router.get('/owners/:id', protectSuperAdmin, getOwnerById);

// PATCH  /api/v1/super-admin/owners/:id/toggle-status  → Block / Unblock
router.patch('/owners/:id/toggle-status', protectSuperAdmin, toggleOwnerStatus);

// POST   /api/v1/super-admin/owners/:id/subscription   → Naya subscription assign
router.post('/owners/:id/subscription', protectSuperAdmin, assignSubscription);

// PATCH  /api/v1/super-admin/owners/:id/subscription   → Subscription update
router.patch('/owners/:id/subscription', protectSuperAdmin, updateSubscription);

// GET    /api/v1/super-admin/owners/:id/subscription   → Subscription detail
router.get('/owners/:id/subscription', protectSuperAdmin, getOwnerSubscription);

export default router;
