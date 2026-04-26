import { Router } from 'express';
import { loginRestaurantUser, refreshTokenHandler } from '../controllers/auth.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/login
router.post('/login', loginRestaurantUser);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', refreshTokenHandler);

export default router;
