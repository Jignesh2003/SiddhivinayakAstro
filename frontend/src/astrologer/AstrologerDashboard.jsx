import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import AstrologerSidebar from "./AstrologerSidebar";
import assets from "../assets/assets";
import axios from "axios";

const AstrologerDashboard = () => {
  const userId = useAuthStore((s) => s.userId);
  const { token } = useAuthStore();
  const register = useChatStore((s) => s.register);
  const [astroDetails, setAstroDetails] = useState(null);

  useEffect(() => {
    const fetchAstrologerDetails = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_ASTRO_URL}/astrologer-details`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAstroDetails(res.data.user);
      } catch (err) {
        console.error("Failed to fetch astrologer details:", err);
      }
    };

    if (token && userId) {
      register(userId);
      fetchAstrologerDetails();
    }
  }, [token, userId, register]);

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Sidebar */}
      <aside className="w-full md:w-1/4">
        <AstrologerSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-black/40 text-white">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          Welcome, Astrologer
        </h1>

        {astroDetails && (
          <div className="mb-6 bg-white/10 p-4 rounded-lg shadow text-sm sm:text-base space-y-2">
            <p><strong>Name:</strong> {astroDetails.firstName} {astroDetails.lastName}</p>
            <p><strong>Email:</strong> {astroDetails.email}</p>
            <p><strong>Phone:</strong> {astroDetails.phone}</p>
            <p><strong>KYC Status:</strong> {astroDetails.kyc}</p>
            <p><strong>Wallet Balance:</strong> ₹{astroDetails.walletBalance || 0}</p>
            <p>
              <strong>Status:</strong>{" "}
              {astroDetails.isOnline ? (
                <span className="text-green-400">Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Chat Requests */}
          <Link to="/astrologer-chat-request" className="block">
            <div className="cursor-pointer bg-white p-4 sm:p-6 rounded-2xl shadow hover:shadow-lg transition duration-300 border border-gray-200 h-full">
              <div className="flex items-center gap-4">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                <div>
                  <h2 className="text-base sm:text-lg font-medium text-gray-800">Chat Requests</h2>
                  <p className="text-sm text-gray-500">View and respond to user chat requests</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Profile */}
          <Link to="/astrologer-profile" className="block">
            <div className="cursor-pointer bg-white p-4 sm:p-6 rounded-2xl shadow hover:shadow-lg transition duration-300 border border-gray-200 h-full">
              <div className="flex items-center gap-4">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                <div>
                  <h2 className="text-base sm:text-lg font-medium text-gray-800">Profile</h2>
                  <p className="text-sm text-gray-500">Update your profile and settings</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AstrologerDashboard;
