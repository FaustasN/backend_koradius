import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

db.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});