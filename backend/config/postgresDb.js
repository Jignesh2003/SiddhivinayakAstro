// postgresDb.js
import pg from 'pg';
const { Pool } = pg;
// import dotenv from "dotenv";
// dotenv.config();
console.log("🔧 Connecting to:", process.env.POSTGRES_URI);

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI, // or use individual params
  ssl: { rejectUnauthorized: false }, // required for services like Neon
});

pool.connect()
  .then(() => console.log("✅ Connected to Neon Postgres"))
  .catch((err) => console.error("❌ Postgres connection failed:", err));


  export default pool;