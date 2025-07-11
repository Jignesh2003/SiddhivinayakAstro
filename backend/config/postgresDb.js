// config/db.js
import pkg from 'pg';

const { Pool } = pkg;

const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

export default pgPool