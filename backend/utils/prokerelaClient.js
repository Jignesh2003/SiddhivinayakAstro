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
    if (cached) {
      console.log('✅ Token from cache');
      return cached;
    }
  }

  console.log('🔄 Fetching new Prokerala token...');

  try {
    const body = qs.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.PRODUCTION_PROKERALA_CLIENT_ID,
      client_secret: process.env.PRODUCTION_PROKERALA_CLIENT_SECRET
    });

    const res = await axios.post(
      'https://api.prokerala.com/token',
      body,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ Token received:', res.data?.access_token?.substring(0, 20) + '...');

    const { access_token, expires_in } = res.data;

    if (isProd) {
      await redisClient.setEx(TOKEN_KEY, expires_in - 60, access_token);
    }

    return access_token;
  } catch (error) {
    console.error('❌ Token fetch failed:', error.message);
    throw error;
  }
}
