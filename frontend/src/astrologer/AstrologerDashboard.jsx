import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import AstrologerSidebar from "./AstrologerSidebar"; // Adjust path as necessary
import assets from "../assets/assets";

const AstrologerDashboard = () => {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const register = useChatStore((s) => s.register);

  useEffect(() => {
    // As soon as we know our astrologer’s userId, mark them online
    if (userId) {
      console.log("AstrologerDashboard: registering socket for", userId);
      register(userId);
    }
  }, [userId, register]);

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen bg-gray-50"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Sidebar */}
      <div className="w-full md:w-1/4">
        <AstrologerSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-6">
          Welcome, Astrologer
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div
            onClick={() => navigate("/astrologer-chat-request")}
            className="cursor-pointer bg-white p-4 sm:p-6 rounded-xl shadow hover:shadow-lg transition duration-300 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              <div>
                <h2 className="text-base sm:text-lg font-medium text-gray-800">Chat Requests</h2>
                <p className="text-sm text-gray-500">
                  View and respond to user chat requests
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center gap-4">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
              <div>
                <h2 className="text-base sm:text-lg font-medium text-gray-800">Profile</h2>
                <p className="text-sm text-gray-500">
                  Update your profile and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AstrologerDashboard;
