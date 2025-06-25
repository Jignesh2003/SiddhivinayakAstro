// src/utils/prokeralaClient.js
import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';
import redisClient from './redisClient.js';
dotenv.config();

const TOKEN_KEY = 'prokerala:token';

export async function getProkeralaToken() {
  // 1) check Redis cache
  const cached = await redisClient.get(TOKEN_KEY);
  if (cached) return cached;

  // 2) build the form body
  const body = qs.stringify({
    grant_type:    'client_credentials',
    client_id:     process.env.PROKERALA_CLIENT_ID,
    client_secret: process.env.PROKERALA_CLIENT_SECRET
  });

  // 3) request a new token
  const res = await axios.post(
    'https://api.prokerala.com/token',
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  // 4) cache it until shortly before it expires
  const { access_token, expires_in } = res.data;
  await redisClient.setEx(TOKEN_KEY, expires_in - 60, access_token);
  return access_token;
}
