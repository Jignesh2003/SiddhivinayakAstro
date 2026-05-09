import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const TOKEN_URL = "https://api.prokerala.com/token";
const DAILY_HOROSCOPE_URL = "https://api.prokerala.com/v2/horoscope/daily";
const KUNDLI_MATCHING_URL = "https://api.prokerala.com/v2/astrology/kundli-matching";
const PROKERALA_CLIENT_ID = process.env.PRODUCTION_PROKERALA_CLIENT_ID
const PROKERALA_CLIENT_SECRET = process.env.PRODUCTION_PROKERALA_CLIENT_SECRET
async function getAccessToken() {
  try {
    const requestBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: PROKERALA_CLIENT_ID,
      client_secret: PROKERALA_CLIENT_SECRET,
    });

    const response = await axios.post(TOKEN_URL, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Error getting token:", error.response?.data || error.message);
    throw error;
  }
}

async function getDailyHoroscope(token) {
  try {
    const response = await axios.get(DAILY_HOROSCOPE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        sign: "aries",
        datetime: new Date().toISOString(),
      },
    });

    console.log("\n🔮 Daily Horoscope Response:\n");
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error("❌ Error fetching horoscope:", error.response?.data || error.message);
  }
}

async function getKundliMatching(token) {
  try {
    const response = await axios.get(KUNDLI_MATCHING_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        // 👦 Boy
        boy_dob: "2004-02-01T15:19:21+05:30",
        boy_coordinates: "19.076090,72.877426", //Mumbai

        // 👧 Girl
        girl_dob: "2004-02-01T15:19:21+05:30",
        girl_coordinates: "19.076090,72.877426",

        // Required
        ayanamsa: 1,

        // optional
        la: "en",
      },
    });

    console.log("\n💑 Kundli Matching Response:\n");
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error(
      "❌ Error fetching kundli matching:",
      JSON.stringify(error.response?.data, null, 2) || error.message
    );
  }
}

async function main() {
  console.log("🚀 Fetching access token...");
  const token = await getAccessToken();

  console.log("✅ Token received\n");

  console.log("🔮 Fetching daily horoscope...\n");
  await getDailyHoroscope(token);

  /*console.log("\n💑 Fetching kundli matching...\n");
  await getKundliMatching(token);*/
}

main();