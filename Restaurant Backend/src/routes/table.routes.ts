import { Router } from 'express';
import { protectRestaurantUser, restrictTo } from '../middleware/auth.middleware';
import { createTable, getAllTables, updateTable } from '../controllers/table.controller';

const router = Router();

// Sabhi table routes pe authentication chahiye
router.use(protectRestaurantUser);

// GET /api/v1/tables -> Sabhi tables list karo
router.get('/', getAllTables);

// POST /api/v1/tables -> Nayi table banao (Owner, Manager only)
router.post('/', restrictTo('owner', 'manager'), createTable);

// PATCH /api/v1/tables/:id -> Table update/block karo (Owner, Manager only)
router.patch('/:id', restrictTo('owner', 'manager'), updateTable);

export default router;
