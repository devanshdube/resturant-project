import { Router } from 'express';
import { loginRestaurantUser } from '../controllers/auth.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/auth/login
router.post('/login', loginRestaurantUser);

export default router;
