import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import AstrologerSidebar from "./AstrologerSidebar";
import assets from "../assets/assets";

const AstrologerDashboard = () => {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const register = useChatStore((s) => s.register);

  useEffect(() => {
    if (userId) {
      console.log("AstrologerDashboard: registering socket for", userId);
      register(userId);
    }
  }, [userId, register]);

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
      <main className="flex-1 p-4 sm:p-6 md:p-8 bg-black/40">
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-6">
          Welcome, Astrologer
        </h1>

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
