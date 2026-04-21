import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ─── Connection Pool ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// ─── Test Connection ──────────────────────────────────────────────────────────
export const connectDB = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306} → ${process.env.DB_NAME || 'restaurant_db'}`);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', (error as Error).message);
    process.exit(1);
  }
};

export default pool;
