import { Router } from 'express';
import { protectRestaurantUser, restrictTo } from '../middleware/auth.middleware';
import {
  getMyRestaurantProfile,
  updateMyRestaurantProfile,
  createStaff,
  getAllStaff,
  updateStaff
} from '../controllers/restaurant.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (Requires Restaurant User Token)
// ─────────────────────────────────────────────────────────────────────────────

router.use(protectRestaurantUser);

// ── Profile Management ──
// GET /api/v1/restaurants/profile -> Get all data of logged-in user's restaurant
router.get('/profile', getMyRestaurantProfile);

// PATCH /api/v1/restaurants/profile -> Update restaurant details (Logo, GST, Timings etc.) -> Only Owner
router.patch('/profile', restrictTo('owner'), updateMyRestaurantProfile);

// ── Staff Management ──
// POST /api/v1/restaurants/staff -> Create new staff (Owner/Manager)
router.post('/staff', restrictTo('owner', 'manager'), createStaff);

// GET /api/v1/restaurants/staff -> Get all staff list (Owner/Manager)
router.get('/staff', restrictTo('owner', 'manager'), getAllStaff);

// PATCH /api/v1/restaurants/staff/:id -> Update staff details/status (Owner/Manager)
router.patch('/staff/:id', restrictTo('owner', 'manager'), updateStaff);

export default router;
