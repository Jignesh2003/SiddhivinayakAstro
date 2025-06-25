import axios from 'axios';
import redisClient from '../utils/redisClient.js';
import { getProkeralaToken } from '../utils/prokerelaClient.js';

export const dailyPrediction = async (req, res) => {
  const sign = req.params.sign.toLowerCase();
  const now = new Date().toISOString();

  const url = `${process.env.PROKERALA_API}` +
              `?sign=${encodeURIComponent(sign)}` +
              `&type=general` + // <-- ADDED
              `&datetime=${encodeURIComponent(now)}`;

  const cacheKey = `horoscope:${sign}:${now.slice(0,10)}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const token = await getProkeralaToken();
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    await redisClient.setEx(cacheKey, 86400, JSON.stringify(data));
    res.json(data);
  } catch (err) {
    console.error('DailyPrediction Error:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Failed to fetch horoscope' });
  }
};
