import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/helpers';

// ─── Not Found Middleware ─────────────────────────────────────────────────────
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

// ─── Global Error Handler Middleware ─────────────────────────────────────────
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
