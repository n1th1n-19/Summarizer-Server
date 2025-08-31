import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log(`🔌 Connecting to database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
});

// Test database connection
export const testDatabaseConnection = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ PostgreSQL connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1} failed:`, error);
      if (i < retries - 1) {
        console.log('🔄 Retrying connection...');
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  return false;
};

// Get a database client from pool
export const getDbClient = async () => {
  return await pool.connect();
};

// Execute query with automatic connection management
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('🔄 Shutting down PostgreSQL pool...');
  await pool.end();
  console.log('✅ PostgreSQL pool disconnected');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default pool;