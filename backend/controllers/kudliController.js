import axios from 'axios'
import { getProkeralaToken } from '../utils/prokerelaClient.js'
import redis from '../utils/redisClient.js'

export const detailedKundli = async (req, res) => {
  try {
    let { ayanamsa = '1', coordinates, datetime, la = 'en', year_length = '1' } = req.query

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
