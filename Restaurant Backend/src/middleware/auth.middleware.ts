import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, SuperAdminJwtPayload, RestaurantUserJwtPayload } from '../types/index';
import { AppError } from '../utils/helpers';

// ─────────────────────────────────────────────────────────────────────────────
// protectSuperAdmin — JWT access token verify karega (Super Admin Only)
// ─────────────────────────────────────────────────────────────────────────────
export const protectSuperAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. Token required.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access denied. Token missing.', 401);
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as SuperAdminJwtPayload | RestaurantUserJwtPayload;

    if (decoded.role !== 'super_admin') {
      throw new AppError('Access denied. Super Admin only.', 403);
    }

    req.user = decoded as SuperAdminJwtPayload;
    next();

  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token. Please login again.', 401));
    } else if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired. Please login again.', 401));
    } else {
      next(err);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// protectRestaurantUser — JWT access token verify karega (Owner / Manager / Staff etc)
// ─────────────────────────────────────────────────────────────────────────────
export const protectRestaurantUser = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. Token required.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as SuperAdminJwtPayload | RestaurantUserJwtPayload;

    // Check if it's super admin by mistake
    if (decoded.role === 'super_admin') {
      throw new AppError('Access denied. Restaurant user token required.', 403);
    }

    req.user = decoded as RestaurantUserJwtPayload;
    next();

  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token. Please login again.', 401));
    } else if (err instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired. Please login again.', 401));
    } else {
      next(err);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// restrictTo — Role-based access control (e.g. restrictTo('owner', 'manager'))
// ─────────────────────────────────────────────────────────────────────────────
export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
