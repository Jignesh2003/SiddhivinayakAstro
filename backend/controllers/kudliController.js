import axios from 'axios'
import { getProkeralaToken } from '../utils/prokerelaClient.js'
import redis from '../utils/redisClient.js'

export const detailedKundli = async (req, res) => {
  try {
    let { ayanamsa , coordinates, datetime, la , year_length = '1' } = req.query

    if (!coordinates || !datetime) {
      return res.status(400).json({
        error: 'Missing required query params: coordinates, datetime'
      })
    }

    // Create a unique cache key
    const cacheKey = `kundli:${coordinates}:${datetime}:${ayanamsa}:${la}`

    // Check Redis cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('🔁 Returning cached kundli data')
      return res.json(JSON.parse(cached))
    }

    // If not cached, call API
    const params = new URLSearchParams({ ayanamsa, coordinates, datetime, la, year_length })
    const token = await getProkeralaToken()

    const { data } = await axios.get(
      `${process.env.PROKERALA_KUNDLI_API}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // Save to Redis with TTL (e.g. 6 hours = 21600 seconds)
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 21600)

    return res.json(data)

  } catch (err) {
    console.error('DetailedKundli Error:', err.response?.data || err.message)
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch detailed kundli'
    })
  }
}

export const detailedKundliMatching = async (req,res)=>{
   try {
    const {
      ayanamsa,
      girl_coordinates,
      girl_dob,
      boy_coordinates,
      boy_dob,
      la = 'en',
    } = req.query;

    // Validate required
    if (
      !ayanamsa ||
      !girl_coordinates ||
      !girl_dob ||
      !boy_coordinates ||
      !boy_dob
    ) {
      return res.status(400).json({
        error:
          'Missing required query params: ayanamsa, girl_coordinates, girl_dob, boy_coordinates, boy_dob',
      });
    }

    // Build a cache key scoped to all inputs
    const cacheKey = [
      'match',
      ayanamsa,
      girl_coordinates,
      girl_dob,
      boy_coordinates,
      boy_dob,
      la,
    ].join(':');

    // Try Redis first
    const cached = await redis.get(cacheKey);
    if (cached) { 
      console.log('🔁 Returning cached compatibility data');
      return res.json(JSON.parse(cached));
    }

    // Not in cache → fetch from ProKerala
    const token = await getProkeralaToken();
    const params = new URLSearchParams({
      ayanamsa,
      girl_coordinates,
      girl_dob,
      boy_coordinates,
      boy_dob,
      la,
    });

    const prokRes = await axios.get(
      `${process.env.PROKERALA_MATCH_API}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Cache the full response body for 6h
    await redis.set(cacheKey, JSON.stringify(prokRes.data), 'EX', 6 * 3600);

    return res.json(prokRes.data);
  } catch (err) {
    console.error(
      'Compatibility Error:',
      err.response?.data || err.message
    );
    return res
      .status(err.response?.status || 500)
      .json({ error: 'Failed to fetch compatibility data' });
  }
}

export const detailedPanchang =async (req,res) =>{
   try {
    let { ayanamsa , coordinates, datetime, la } = req.query

    if (!coordinates || !datetime) {
      return res.status(400).json({
        error: 'Missing required query params: coordinates, datetime'
      })
    }

    // Create a unique cache key
    const cacheKey = `panchang:${coordinates}:${datetime}:${ayanamsa}:${la}`

    // Check Redis cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('🔁 Returning cached panchang data')
      return res.json(JSON.parse(cached))
    }

    // If not cached, call API
    const params = new URLSearchParams({ ayanamsa, coordinates, datetime, la })
    const token = await getProkeralaToken()

    const { data } = await axios.get(
      `${process.env.PROKERALA_PANCHANG_API}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // Save to Redis with TTL (e.g. 6 hours = 21600 seconds)
    await redis.set(cacheKey, JSON.stringify(data), 'EX', 21600)
    return res.json(data)

  } catch (err) {
    console.error('Detailed Panchang Error:', err.response?.data || err.message)
    return res.status(err.response?.status || 500).json({
      error: 'Failed to fetch detailed kundli'
    })
  }
}