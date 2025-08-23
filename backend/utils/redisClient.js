import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log("✅ Redis connected");
  }
}

// Connect in all environments (recommended)
// You can conditionally connect if you ONLY want in production
if (process.env.NODE_ENV === "production") {
  connectRedis();
}

export default client;
