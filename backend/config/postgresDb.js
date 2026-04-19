// knexDb.js
import { configDotenv } from 'dotenv';
import knex from 'knex';

configDotenv();

// Check if PostgreSQL is available
const isDev = process.env.NODE_ENV === 'development' || !process.env.POSTGRES_URI;

let KnexDb;

if (isDev) {
  // Mock knex for development without PostgreSQL
  console.warn("⚠️ Using mock PostgreSQL - database operations will be no-ops");
  
  const mockKnex = (table) => ({
    where: () => ({
      first: () => Promise.resolve(null),
      forUpdate: () => Promise.reject(new Error('No PostgreSQL DB')),
    }),
    insert: () => Promise.resolve([1]),
    update: () => Promise.resolve(1),
    delete: () => Promise.resolve(1),
    transaction: (cb) => Promise.reject(new Error('No PostgreSQL DB')),
    select: () => Promise.resolve([]),
    limit: () => Promise.resolve([]),
  });
  
  KnexDb = mockKnex;
} else {
  KnexDb = knex({
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
}

export default KnexDb;
