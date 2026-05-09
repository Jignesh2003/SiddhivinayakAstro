import axios from "axios";
import redisClient from "../utils/redisClient.js";
import { getProkeralaToken } from "../utils/prokerelaClient.js";

const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
];

export const getPredictionBySign = async (req, res) => {
  try {
    const { sign } = req.params;
    const now = new Date();

    // Convert current time to Indian Standard Time (IST) (UTC+5:30).
    // Prokerala's daily horoscopes are strictly bound to IST days. 
    // If we use UTC, the cache key might switch to the next day 5.5 hours too early.
    const istOffset = 5.5 * 60; // minutes
    const ist = new Date(now.getTime() + istOffset * 60000);

    const dateKey = ist.toISOString().slice(0, 10); // Format: YYYY-MM-DD
    const baseUrl = process.env.PROKERALA_DAILY_API;

    if (!baseUrl) {
      return res.status(500).json({ error: "PROKERALA_DAILY_API not set" });
    }

    // Validate sign to prevent unnecessary API calls that will just fail and waste credits
    if (!ZODIAC_SIGNS.includes(sign.toLowerCase())) {
      return res.status(400).json({ error: "Invalid zodiac sign" });
    }

    // Unique cache key for each sign per day. 
    // This prevents hitting the Prokerala API multiple times a day for the same sign.
    const cacheKey = `horoscope:${sign.toLowerCase()}:general:${dateKey}`;

    // 1) Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${sign} general prediction`);
      return res.json(JSON.parse(cached));
    }

    // Get the OAuth token required for Prokerala API v2
    const token = await getProkeralaToken();

    // 2) Fetch specific sign from Prokerala.
    // Note: Prokerala v2 does NOT support fetching all signs at once (sign=all is invalid).
    // The frontend requests signs one-by-one to conserve API credits.
    const url = new URL(baseUrl);
    url.searchParams.set("sign", sign.toLowerCase());
    url.searchParams.set("type", "general");
    url.searchParams.set("datetime", ist.toISOString());

    const { data } = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 3) Calculate Time-to-Live (TTL) for the Redis cache.
    // The cache should expire exactly at the next IST midnight so fresh horoscopes 
    // are fetched the next day.
    const nextMidnight = new Date(ist);
    nextMidnight.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.floor((nextMidnight - ist) / 1000);

    // 4) Cache the response in Redis and return to frontend
    await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data));
    console.log(`Cached ${sign} general prediction for ${ttlSeconds} seconds`);

    return res.json(data);
  } catch (err) {
    console.error(
      "getPredictionBySign Error:",
      err.response?.data || err.message
    );

    // Optional fail-safe: If the Prokerala API is down or out of credits (403), 
    // try to return stale data from the cache to keep the frontend from breaking completely.
    try {
      const { sign } = req.params;
      const istFallback = new Date(Date.now() + 5.5 * 60 * 60000)
        .toISOString()
        .slice(0, 10);
      const cached = await redisClient.get(
        `horoscope:${sign.toLowerCase()}:general:${istFallback}`
      );
      if (cached) {
        console.warn(`Returning stale cache for ${sign} due to Prokerala fetch failure`);
        return res.json(JSON.parse(cached));
      }
    } catch (_) {
      // ignore cache reading errors during fallback
    }

    return res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch prediction" });
  }
};
