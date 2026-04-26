import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ─── Route Imports ────────────────────────────────────────────────────────────
import healthRoutes from './routes/health.routes';
import superAdminRoutes from './routes/superAdmin.routes';
import authRoutes from './routes/auth.routes';
import restaurantRoutes from './routes/restaurant.routes';
import tableRoutes from './routes/table.routes';
import menuRoutes from './routes/menu.routes';
// import orderRoutes from './routes/order.routes';

// ─── Error Middleware ─────────────────────────────────────────────────────────
import { notFound, errorHandler } from './middleware/error.middleware';

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/super-admin', superAdminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/tables', tableRoutes);
app.use('/api/v1/menu', menuRoutes);
// app.use('/api/v1/orders', orderRoutes);

// ─── 404 & Error Handlers ────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
