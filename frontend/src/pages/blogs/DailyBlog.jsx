// src/pages/DailyBlog.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const DailyBlog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAstrology = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/daily-zodiac`);
      setEntries(res.data); // array of { zodiacSign, content }
    } catch (err) {
      setError("Could not load daily astrology.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAstrology();
  }, []);

  const formattedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }); // e.g., 10 May 2025

  if (loading) return <p className="p-4 text-center">Loading daily astrology...</p>;
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">🪐 Daily Astrology</h1>
      <p className="text-center text-gray-500 mb-8">{formattedDate}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {entries.map(({ zodiacSign, content }) => (
          <motion.div
            key={zodiacSign}
            className="p-4 border rounded-lg shadow-sm bg-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-2">{zodiacSign}</h2>
            <p className="text-gray-700">{content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DailyBlog;
