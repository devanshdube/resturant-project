import { Router } from 'express';
import { getPublicMenu, verifyTableToken, createPublicOrder } from '../controllers/public.controller';

const router = Router();

// GET /api/v1/public/menu/:slug
router.get('/menu/:slug', getPublicMenu);

// GET /api/v1/public/table/:id/:token
router.get('/table/:id/:token', verifyTableToken);

// POST /api/v1/public/order
router.post('/order', createPublicOrder);

export default router;
