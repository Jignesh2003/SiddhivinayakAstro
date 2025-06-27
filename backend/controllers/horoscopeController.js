import axios from 'axios';
import redisClient from '../utils/redisClient.js';
import { getProkeralaToken } from '../utils/prokerelaClient.js';

const ALL_SIGNS = [
  'aries','taurus','gemini','cancer','leo','virgo',
  'libra','scorpio','sagittarius','capricorn','aquarius','pisces'
];

export const allGeneralPredictions = async (req, res) => {
  const nowIso   = new Date().toISOString();
  const dateKey  = nowIso.slice(0,10);
  const baseUrl  = process.env.PROKERALA_DAILY_API;
  if (!baseUrl) {
    return res.status(500).json({ error: 'PROKERALA_DAILY_API not set' });
  }

  try {
    const token = await getProkeralaToken();

    const results = await Promise.all(
      ALL_SIGNS.map(async sign => {
        const cacheKey = `horoscope:${sign}:general:${dateKey}`;
        // check cache
        const cached = await redisClient.get(cacheKey);
        if (cached) return { sign, data: JSON.parse(cached) };

        // fetch fresh
        const url = new URL(baseUrl);
        url.searchParams.set('sign', sign);
        url.searchParams.set('type', 'general');
        url.searchParams.set('datetime', nowIso);

        const { data } = await axios.get(url.toString(), {
          headers: { Authorization: `Bearer ${token}` }
        });
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(data));
        return { sign, data };
      })
    );

    const payload = Object.fromEntries(results.map(r => [r.sign, r.data]));
    return res.json({ data: payload });

  } catch (err) {
    console.error('AllGeneralPredictions Error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to fetch predictions' });
  }
};
