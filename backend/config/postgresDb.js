// config/db.js
import pkg from 'pg';

const { Pool } = pkg;

export const pgPool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});
