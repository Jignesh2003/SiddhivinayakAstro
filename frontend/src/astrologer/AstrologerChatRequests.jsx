import { useEffect, useState } from "react";
import {
  Loader2,
  User2,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AstrologerSidebar from "./AstrologerSidebar";

const AstrologerChatRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.userId);
  const navigate = useNavigate();

  const astrologerId = userId;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_CHAT_URL}/requests/${astrologerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (sessionId, response) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_CHAT_URL}/${sessionId}/respond`,
        { status: response },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response === "approved") {
        navigate(`/astro-user-chat/${sessionId}?new=true`);
      } else {
        fetchRequests(); // refresh only on reject
      }
    } catch (err) {
      console.error("Error responding to request", err);
    }
  };
  
  useEffect(() => {
    fetchRequests();
    const intervalId = setInterval(fetchRequests, 10000);
    return () => clearInterval(intervalId);
  }, [astrologerId, token]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full lg:w-64">
        <AstrologerSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-gray-500" size={48} />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-500">
            <div>
              <MessageSquare size={48} className="mx-auto mb-2" />
              <p className="text-base sm:text-lg">No pending chat requests.</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
              Pending Chat Requests
            </h2>
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white shadow-md rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"
                >
                  <div className="flex items-center space-x-4">
                    <User2 className="text-blue-500" />
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        User: {req.userId?.firstName || "Unknown"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Requested:{" "}
                        {new Date(req.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <button
                      onClick={() => respondToRequest(req._id, "approved")}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                    >
                      <CheckCircle2 size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => respondToRequest(req._id, "rejected")}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AstrologerChatRequests;
