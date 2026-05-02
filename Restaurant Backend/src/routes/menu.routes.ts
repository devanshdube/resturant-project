import { Router } from 'express';
import { protectRestaurantUser, restrictTo } from '../middleware/auth.middleware';
import {
  createCategory, getCategories, updateCategory, deleteCategory,
  createMenuItem, getMenuItems, updateMenuItem, deleteMenuItem,
  createVariant, getVariants
} from '../controllers/menu.controller';

const router = Router();

router.use(protectRestaurantUser);

// ── Categories ──
router.post('/categories', restrictTo('owner', 'manager'), createCategory);
router.get('/categories', getCategories);
router.patch('/categories/:id', restrictTo('owner', 'manager'), updateCategory);
router.delete('/categories/:id', restrictTo('owner', 'manager'), deleteCategory);

// ── Items ──
router.post('/items', restrictTo('owner', 'manager'), createMenuItem);
router.get('/items', getMenuItems);
router.patch('/items/:id', restrictTo('owner', 'manager'), updateMenuItem);
router.delete('/items/:id', restrictTo('owner', 'manager'), deleteMenuItem);

// ── item Variant ──
router.post('/items/:id/variants', restrictTo('owner', 'manager'), createVariant);
router.get('/items/:id/variants', getVariants);

export default router;
