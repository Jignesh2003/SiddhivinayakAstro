// knexDb.js
import { configDotenv } from 'dotenv';
import knex from 'knex';

configDotenv();

const KnexDb = knex({
  client: 'pg',
  connection: process.env.POSTGRES_URI,
  ssl: { rejectUnauthorized: false },
  pool: { min: 2, max: 10 },
});

// Test connection on startup using async/await:
(async () => {
  try {
    const res = await KnexDb.raw('SELECT 1+1 as result');
    console.log('✅ Connected to Supabase Postgres via Knex:', res.rows ? res.rows : res);
  } catch (err) {
    console.error('❌ Knex connection failed:', err.message || err);
  }
})();

export default KnexDb;
