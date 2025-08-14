import axios from 'axios';
// import redisClient from '../utils/redisClient.js';
import { getProkeralaToken } from '../utils/prokerelaClient.js';

export const allGeneralPredictions = async (req, res) => {
  const nowIso   = new Date().toISOString();
  const dateKey  = nowIso.slice(0,10);
  const baseUrl  = process.env.PROKERALA_DAILY_API;
  if (!baseUrl) {
    return res.status(500).json({ error: 'PROKERALA_DAILY_API not set' });
  }

  // single cache key for “all general” today
  const cacheKey = `horoscope:all:general:${dateKey}`;

  try {
    // 1) Try cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      // cached is already the full payload
      return res.json(JSON.parse(cached));
    }

    // 2) Build the “all general” URL
    const url = new URL(baseUrl);
    url.searchParams.set('sign', 'all');
    url.searchParams.set('type', 'general');
    url.searchParams.set('datetime', nowIso);

    // 3) Fetch
    const token = await getProkeralaToken();
    const { data } = await axios.get(url.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 4) Cache & respond
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(data));
    return res.json(data);

  } catch (err) {
    console.error('AllGeneralPredictions Error:', err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({ error: 'Failed to fetch predictions' });
  }
};
