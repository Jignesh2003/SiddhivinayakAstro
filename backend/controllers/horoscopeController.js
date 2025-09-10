import axios from "axios";
import redisClient from "../utils/redisClient.js";
import { getProkeralaToken } from "../utils/prokerelaClient.js";

export const allGeneralPredictions = async (req, res) => {
  try {
    const now = new Date();

    // Convert to IST for daily horoscopes (UTC+5:30)
    const istOffset = 5.5 * 60; // minutes
    const ist = new Date(now.getTime() + istOffset * 60000);

    const dateKey = ist.toISOString().slice(0, 10); // YYYY-MM-DD
    const baseUrl = process.env.PROKERALA_DAILY_API;

    if (!baseUrl) {
      return res.status(500).json({ error: "PROKERALA_DAILY_API not set" });
    }

    const cacheKey = `horoscope:all:general:${dateKey}`;

    // 1) Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit for all general predictions");
      return res.json(JSON.parse(cached));
    }

    // 2) Build the URL
    const url = new URL(baseUrl);
    url.searchParams.set("sign", "all");
    url.searchParams.set("type", "general");
    url.searchParams.set("datetime", ist.toISOString()); // ✅ correct

    // 3) Fetch from Prokerala
    const token = await getProkeralaToken();
    const { data } = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 4) Calculate TTL until next IST midnight
    const nextMidnight = new Date(ist);
    nextMidnight.setHours(24, 0, 0, 0);
    const ttlSeconds = Math.floor((nextMidnight - ist) / 1000);

    // 5) Cache & respond
    await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data));
    console.log(`Cached all general predictions for ${ttlSeconds} seconds`);

    return res.json(data);
  } catch (err) {
    console.error(
      "AllGeneralPredictions Error:",
      err.response?.data || err.message
    );

    // Optional: return stale cache if available
    try {
       const istFallback = new Date(Date.now() + 5.5 * 60 * 60000)
         .toISOString()
         .slice(0, 10);
          const cached = await redisClient.get(
            `horoscope:all:general:${istFallback}`
          );
      if (cached) {
        console.warn("Returning stale cache due to Prokerala fetch failure");
        return res.json(JSON.parse(cached));
      }
    } catch (_) {
      // ignore
    }

    return res
      .status(err.response?.status || 500)
      .json({ error: "Failed to fetch predictions" });
  }
};
