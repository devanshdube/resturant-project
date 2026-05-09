import { Router } from 'express';
import { getPublicMenu, verifyTableToken, createPublicOrder, startGuestSession, getGuestOrders, requestBill, completeGuestSession } from '../controllers/public.controller';

const router = Router();

// GET /api/v1/public/menu/:slug
router.get('/menu/:slug', getPublicMenu);

// GET /api/v1/public/table/:id/:token
router.get('/table/:id/:token', verifyTableToken);

// GET /api/v1/public/orders/:session_id — Guest ke orders dekhne ke liye
router.get('/orders/:session_id', getGuestOrders);

// POST /api/v1/public/session/start  — Guest session banana (QR scan ke baad)
router.post('/session/start', startGuestSession);

// POST /api/v1/public/session/request-bill — Bill mangwane ke liye
router.post('/session/request-bill', requestBill);

// POST /api/v1/public/session/complete — Staff completes session
router.post('/session/complete', completeGuestSession);

// POST /api/v1/public/order
router.post('/order', createPublicOrder);

export default router;
