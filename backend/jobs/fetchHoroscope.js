// src/jobs/fetchHoroscope.js
import axios from 'axios';
import redisClient from '../utils/redisClient.js';
import { getProkeralaToken } from '../utils/prokerelaClient.js';

const SIGNS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
];

export async function fetchHoroscopes() {
  const token = await getProkeralaToken();
  const now = new Date().toISOString();

  for (const sign of SIGNS) {
   const url = `${process.env.PROKERALA_DAILY_API}` +
            `?sign=${encodeURIComponent(sign)}` +
            `&type=general` + // <-- Already added
            `&datetime=${encodeURIComponent(now)}`;

    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Cache per‐sign+date
      const cacheKey = `horoscope:${sign}:${now.slice(0,10)}`;
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(data));
      console.log(`Cached ${sign} for ${now.slice(0,10)}`);
    } catch (e) {
      console.error(`Error fetching ${sign}:`, e.response?.data || e.message);
    }
  }
}
