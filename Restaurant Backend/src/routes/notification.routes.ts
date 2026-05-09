import { Router } from 'express';
import { protectRestaurantUser } from '../middleware/auth.middleware';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller';

const router = Router();

// Protect all notification routes
router.use(protectRestaurantUser);

// GET /api/v1/notifications -> Get latest notifications
router.get('/', getNotifications);

// PATCH /api/v1/notifications/read-all -> Mark all as read (must be before /:id/read to prevent param matching)
router.patch('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:id/read -> Mark specific notification as read
router.patch('/:id/read', markAsRead);

export default router;
