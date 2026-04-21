import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/v1/health
export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Test DB ping
    await pool.query('SELECT 1');
    res.status(200).json({
      success: true,
      message: 'Restaurant API is running 🍽️',
      database: '✅ MySQL Connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Restaurant API is running but DB is not connected ❌',
      database: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
};
