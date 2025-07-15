// postgresDb.js
import pg from 'pg';
const { Pool } = pg;


const pool = new Pool({
  connectionString: process.env.POSTGRES_URI, // or use individual params
  ssl: { rejectUnauthorized: false }, // required for services like Neon
});

pool.on("error", err => {
  console.error("Postgres idle client error", err);
});

pool.connect()
  .then(() => console.log("✅ Connected to Neon Postgres"))
  .catch((err) => console.error("❌ Postgres connection failed:", err));


  export default pool;