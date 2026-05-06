import { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AstrologerList = () => {
  const [astrologers, setAstrologers] = useState([]);
  const [requesting, setRequesting] = useState({});
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  // const logout = useAuthStore.getState.logout
  const navigate = useNavigate();

  useEffect(() => {
  let intervalId;

  const fetchAstrologers = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_ASTRO_URL}/list?isOnline=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 200) {
        setAstrologers(res.data);
        console.log(res);
      } else {
        console.error("Failed to fetch astrologers");
      }
    } catch (error) {
      console.error("Error fetching astrologers:", error.message);
    }
  };

  if (token) {
    // Fetch immediately once
    fetchAstrologers();
    // Then fetch every 5 seconds
    intervalId = setInterval(fetchAstrologers, 5000);
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [token]);


  const requestChat = async (astrologerId) => {
    if (!userId || !astrologerId) {
      console.error("❌ userId or astrologerId missing");
      return;
    }

    // Set requesting to true for this astrologer
    setRequesting((prev) => ({ ...prev, [astrologerId]: true }));

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_CHAT_URL}/request`,
        { userId, astrologerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const session = res.data.sessionData || res.data.session;
      if (session?._id) {
  navigate(`/chat-waiting/${session._id}`)
      } else {
        console.error("❌ No valid session data returned");
      }
    } catch (error) {
      console.error("❌ Failed to request chat:", error.response?.data?.message || error.message);
    } finally {
      // Optionally keep button disabled, or reset if you want to allow retry:
      // setRequesting((prev) => ({ ...prev, [astrologerId]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-4 text-center">Available Astrologers</h2>
      {astrologers.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No astrologers are currently online or available. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {astrologers.map((astro) => {
            const isRequesting = requesting[astro._id];
            return (
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
                  disabled={!userId || isRequesting}
                  className={`mt-4 ${
                    !userId || isRequesting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } text-white px-4 py-2 rounded-lg transition duration-200`}
                >
                  {!userId
                    ? "Loading..." 
                    : isRequesting 
                    ? "Requesting..."
                    : "Request Chat"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AstrologerList;
