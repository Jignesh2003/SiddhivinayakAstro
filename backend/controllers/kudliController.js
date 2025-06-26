// src/controllers/kundliController.js

import axios from 'axios'
import { getProkeralaToken } from '../utils/prokerelaClient.js'

export const detailedKundli = async (req, res) => {
  try {
    // Destructure and apply defaults:
    //  • ayanamsa defaults to "1" (Lahiri)
    //  • la defaults to "en"
    //  • year_length defaults to "1"
    let { ayanamsa = '1', coordinates, datetime, la = 'en', year_length = '1' } = req.query

    // Validate required params
    if (!coordinates || !datetime) {
      return res
        .status(400)
        .json({ error: 'Missing required query params: coordinates, datetime' })
    }

    // Build the URL query string
    const params = new URLSearchParams({ ayanamsa, coordinates, datetime, la, year_length })

    // Fetch OAuth token & call Prokerala
    const token = await getProkeralaToken()
    const { data } = await axios.get(
      `${process.env.PROKERALA_API_KUNDLI_ADVANCED}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return res.json(data)

  } catch (err) {
    console.error('DetailedKundli Error:', err.response?.data || err.message)
    return res
      .status(err.response?.status || 500)
      .json({ error: 'Failed to fetch detailed kundli' })
  }
}
