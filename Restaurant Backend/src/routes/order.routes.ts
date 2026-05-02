import { Router } from 'express';
import { protectRestaurantUser, restrictTo } from '../middleware/auth.middleware';
import {
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  getOrderStats,
  getAnalytics
} from '../controllers/order.controller';

const router = Router();

router.use(protectRestaurantUser);

// GET /api/v1/orders/stats  → today's stats (MUST be before /:id)
router.get('/stats', restrictTo('owner', 'manager'), getOrderStats);

// GET /api/v1/orders/analytics → dashboard analytics (MUST be before /:id)
router.get('/analytics', restrictTo('owner', 'manager'), getAnalytics);

// GET /api/v1/orders        → all orders (optionally filter by ?status=pending)
router.get('/', getOrders);

// GET /api/v1/orders/:id    → single order with items
router.get('/:id', getOrderDetails);

// PATCH /api/v1/orders/:id/status → update status
router.patch('/:id/status', updateOrderStatus);

export default router;
