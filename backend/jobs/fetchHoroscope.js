// src/jobs/fetchHoroscope.js
import axios from "axios";
import redisClient from "../utils/redisClient.js";
import { getProkeralaToken } from "../utils/prokerelaClient.js";

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

// ✅ Helper: Convert UTC → IST
function getISTDateTime(date = new Date()) {
  const istOffset = 5.5 * 60; // minutes
  const localOffset = date.getTimezoneOffset();
  return new Date(date.getTime() + (istOffset + localOffset) * 60000);
}

// ✅ Helper: Get YYYY-MM-DD in IST
function getISTDateString(date = new Date()) {
  return getISTDateTime(date).toISOString().slice(0, 10);
}

export async function fetchHoroscopes() {
  let token = await getProkeralaToken();
  const ist = getISTDateTime();
  const today = getISTDateString(ist); // YYYY-MM-DD in IST

  for (const sign of SIGNS) {
    const url =
      `${process.env.PROKERALA_DAILY_API}` +
      `?sign=${encodeURIComponent(sign)}` +
      `&type=general` +
      `&datetime=${encodeURIComponent(ist.toISOString())}`;

    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ TTL = seconds until next IST midnight
      const nextMidnight = new Date(ist);
      nextMidnight.setHours(24, 0, 0, 0);
      const ttlSeconds = Math.floor((nextMidnight - ist) / 1000);

      const cacheKey = `horoscope:${sign}:${today}`;
      await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(data));

      console.log(`✅ Cached ${sign} for ${today}`);
    } catch (e) {
      if (e.response?.status === 401) {
        console.warn("⚠️ Token expired, refreshing...");
        token = await getProkeralaToken();
        continue; // retry next sign
      }
      if (e.response?.status === 403) {
        console.error(`❌ Credits exhausted while fetching ${sign}`);
      } else {
        console.error(`Error fetching ${sign}:`, e.response?.data || e.message);
      }

      // ✅ Try yesterday’s IST cache if available
      const yesterdayIST = new Date(ist.getTime() - 86400000);
      const yesterdayKey = `horoscope:${sign}:${getISTDateString(
        yesterdayIST
      )}`;

      const fallback = await redisClient.get(yesterdayKey);
      if (fallback) {
        console.warn(`⚠️ Using yesterday's cached data for ${sign}`);
        await redisClient.setEx(
          `horoscope:${sign}:${today}`,
          3600, // short TTL (1h)
          fallback
        );
      }
    }
  }
}
