import axios from 'axios'
import { getProkeralaToken } from '../utils/prokerelaClient.js'
import redis from '../utils/redisClient.js'
import { v4 as uuidv4 } from "uuid";
import User from '../models/User.js';


export const detailedKundli = async (req, res) => {
  try {
    let { ayanamsa, coordinates, datetime, la, year_length = '1' } = req.query

    if (!coordinates || !datetime) {
      return res.status(400).json({
        error: 'Missing required query params: coordinates, datetime'
      })
    }

    // Create a unique cache key
    const cacheKey = `kundli:${coordinates}:${datetime}:${ayanamsa}:${la}`

    // Check Redis cache
    const cached = await redis.get(cacheKey)
    console.log('Frontend Redis key:', cacheKey);
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

export const premiumKundliOrder = async (req, res) => {
  const userId = req.user.id;

  const user = await User.findOne({_id :userId})
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { amount, customerName, customerEmail } = req.body;

  if (!amount || !customerName || !customerEmail) {
    return res.status(400).json({ message: "INAVLID DATA !!" })
  }

  if (amount < 599) {
    return res.status(400).json({ message: "INVALID AMOUNT !" })
  }

  // build unique orderId. Use UUID or custom logic in production
  const orderId = `PRE_KUNDLI_${user._id}_${Date.now()}`;

  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: "Cashfree credentials missing" });
  }

  const CASHFREE_API_URL = "https://sandbox.cashfree.com/pg/orders"
  try {
    const response = await axios.post(
      CASHFREE_API_URL,
      {
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: "INR",
        customer_details: {
          customer_id: String(userId),              // or a user id from your DB
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: user.phone,
        },
        order_note: "Kundli order",
        order_meta: {
          notify_url: process.env.CASHFREE_WEBHOOK_URL || "",
        },
        // Optionally add notify_url here for webhook
      },

      {
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-request-id": uuidv4(),

        },
      }
    );

    // Response contains 'order_id', 'payment_session_id', etc.
    res.json({
      orderId: response.data.order_id,
      token: response.data.payment_session_id,   // aka paymentSessionId
    });
  } catch (err) {
    res.status(500).json({
      message: err?.response?.data?.message || "Cashfree order creation failed",
      details: err?.response?.data || {},
    });
    console.log(err);

  }
};


export const detailedKundliMatching = async (req, res) => {
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

// controllers/panchang.js
export const detailedPanchang = async (req, res) => {
  try {
    let { ayanamsa, coordinates, datetime, la = "en" } = req.query;

    // Required
    if (!ayanamsa || !coordinates || !datetime) {
      return res.status(400).json({
        error: "Missing required query params: ayanamsa, coordinates, datetime",
      });
    }

    // coords must be "lat,lon" with 6 decimals
    const coordRe = /^-?\d{1,3}\.\d{6},-?\d{1,3}\.\d{6}$/;
    if (!coordRe.test(coordinates)) {
      return res.status(400).json({
        error: "Coordinates must be 'lat,lon' with 6 decimal places",
      });
    }

    // datetime must be ISO‑8601 like 2004-02-12T15:19:21+05:30 or ending with Z
    const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\+\d{2}:\d{2}|Z)$/;
    if (!isoRe.test(datetime)) {
      return res.status(400).json({
        error:
          "Datetime must be ISO 8601 (e.g. 2004-02-12T15:19:21+05:30 or ...Z)",
      });
    }

    const cacheKey = `panchang:${coordinates}:${datetime}:${ayanamsa}:${la}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log("🔁 Returning cached panchang data");
      return res.json(JSON.parse(cached));
    }

    // Build query string (no extra encodeURIComponent here!)
    const params = new URLSearchParams({ ayanamsa, coordinates, datetime, la });
    const token = await getProkeralaToken();
    const { data } = await axios.get(
      `${process.env.PROKERALA_PANCHANG_API}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // cache and return
    await redis.set(cacheKey, JSON.stringify(data), "EX", 6 * 3600);
    return res.json(data);
  } catch (err) {
    console.error("Detailed Panchang Error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: "Failed to fetch Panchang data",
    });
  }
};


