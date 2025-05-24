import { useNavigate } from "react-router-dom";
import { MessageSquare, User } from "lucide-react";
import AstrologerSidebar from "./AstrologerSidebar"; // Adjust path as necessary

const AstrologerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AstrologerSidebar />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Welcome, Astrologer</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => navigate("/astrologer-chat-request")}
            className="cursor-pointer bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-300 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-lg font-medium text-gray-800">Chat Requests</h2>
                <p className="text-sm text-gray-500">View and respond to user chat requests</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center gap-4">
              <User className="w-8 h-8 text-purple-500" />
              <div>
                <h2 className="text-lg font-medium text-gray-800">Profile</h2>
                <p className="text-sm text-gray-500">Update your profile and settings</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AstrologerDashboard;
