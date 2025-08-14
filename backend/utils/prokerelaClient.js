import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';
import redisClient from './redisClient.js';
dotenv.config();

const TOKEN_KEY = 'prokerala:token';

export async function getProkeralaToken() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const cached = await redisClient.get(TOKEN_KEY);
    if (cached) return cached;
  }

  const body = qs.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.PROKERALA_CLIENT_ID,
    client_secret: process.env.PROKERALA_CLIENT_SECRET
  });

  const res = await axios.post(
    'https://api.prokerala.com/token',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { access_token, expires_in } = res.data;

  if (isProd) {
    await redisClient.setEx(TOKEN_KEY, expires_in - 60, access_token);
  }

  return access_token;
}
