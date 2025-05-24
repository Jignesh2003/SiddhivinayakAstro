// src/pages/AdminDailyBlog.jsx
import { useState } from "react";
import axios from "axios";
import useAuthStore from "../../store/useAuthStore";

const AdminDailyBlog = () => {
     const zodiacSigns = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
      ];
  const [entries, setEntries] = useState(
    zodiacSigns.map((sign) => ({ zodiacSign: sign, content: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (index, value) => {
    const updated = [...entries];
    updated[index].content = value;
    setEntries(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const {token} = useAuthStore.getState()
console.log(token);

      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/bulk-update`, { entries }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(res.data.message || "Update successful!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🪐 Update Daily Astrology</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {entries.map((entry, index) => (
          <div key={entry.zodiacSign}>
            <label className="block font-semibold mb-1">{entry.zodiacSign}</label>
            <textarea
              rows="3"
              className="w-full p-2 border rounded"
              value={entry.content}
              onChange={(e) => handleChange(index, e.target.value)}
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Updating..." : "Submit All"}
        </button>

        {message && (
          <p className={`mt-4 font-medium ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AdminDailyBlog;
