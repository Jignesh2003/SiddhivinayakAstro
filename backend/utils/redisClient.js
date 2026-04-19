import dotenv from "dotenv";

dotenv.config();

// Mock Redis client with all needed methods
const mockRedisClient = {
  isOpen: true,
  isReady: true,
  connect: async () => {
    console.warn("⚠️ Using mock Redis - development mode");
    return Promise.resolve();
  },
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
  incr: async () => 1,
  expire: async () => 1,
  ttl: async () => -1,
  on: () => {},
  off: () => {},
  quit: async () => {},
};

let client = mockRedisClient; // DEFAULT TO MOCK

// Only try real Redis if explicitly configured
if (process.env.REDIS_URL && process.env.NODE_ENV === "production") {
  try {
    const { createClient } = await import("redis");
    client = createClient({ url: process.env.REDIS_URL });
    
    client.on("error", (err) => console.error("Redis Client Error", err));
    
    // Connect async - don't block startup
    client.connect()
      .then(() => console.log("✅ Redis connected"))
      .catch((err) => {
        console.warn("⚠️ Redis connection failed, falling back to mock");
        client = mockRedisClient;
      });
  } catch (err) {
    console.warn("⚠️ Redis import failed, using mock");
    client = mockRedisClient;
  }
} else {
  console.warn("⚠️ Using mock Redis - REDIS_URL not configured or not in production");
}

export default client;