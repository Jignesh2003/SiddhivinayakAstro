import { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AstrologerList = () => {
  const [astrologers, setAstrologers] = useState([]);
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_ASTRO_URL}/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          setAstrologers(res.data);
        } else {
          console.error("Failed to fetch astrologers");
        }
      } catch (error) {
        console.error("Error fetching astrologers:", error.message);
      }
    };

    if (token) fetchAstrologers();
  }, [token]);

  const requestChat = async (astrologerId) => {
    if (!userId || !astrologerId) {
      console.error("❌ userId or astrologerId missing");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_CHAT_URL}/request`,
        { userId, astrologerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Support both 'sessionData' and 'session' from backend
      const session = res.data.sessionData || res.data.session;
      if (session?._id) {
        navigate(`/astro-user-chat/${session._id}?new=true`);
      } else {
        console.error("❌ No valid session data returned");
      }
    } catch (error) {
      console.error("❌ Failed to request chat:", error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Available Astrologers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {astrologers.map((astro) => (
          <div
            key={astro._id}
            className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-semibold mb-1">
                {astro.firstName} {astro.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Expertise: <span className="font-medium">{astro.expertise || "N/A"}</span>
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Experience: <span className="font-medium">{astro.yearsOfExperience || 0} yrs</span>
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Price: <span className="font-medium">₹{astro.pricePerMinute || 0}/min</span>
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Languages:{" "}
                <span className="font-medium">
                  {astro.languagesSpoken?.join(", ") || "N/A"}
                </span>
              </p>
            </div>
            <button
              onClick={() => requestChat(astro._id)}
              disabled={!userId}
              className={`mt-4 ${
                userId ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"
              } text-white px-4 py-2 rounded-lg transition duration-200`}
            >
              {userId ? "Request Chat" : "Loading..."}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AstrologerList;
