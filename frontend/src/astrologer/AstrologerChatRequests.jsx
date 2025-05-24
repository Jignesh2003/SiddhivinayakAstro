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
      console.log(astrologerId);
      
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
    // Initial fetch when component mounts
    fetchRequests();

    // Set up interval for periodic fetching (every 10 seconds)
    const intervalId = setInterval(fetchRequests, 10000);

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, [astrologerId, token]);

  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AstrologerSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-gray-500" size={48} />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-2" />
              <p>No pending chat requests.</p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Pending Chat Requests</h2>
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="bg-white shadow-md rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <User2 className="text-blue-500" />
                    <div>
                      <p className="font-semibold">
                        User: {req.userId?.firstName || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Requested:{" "}
                        {new Date(req.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToRequest(req._id, "approved")}
                      className="flex items-center gap-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => respondToRequest(req._id, "rejected")}
                      className="flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      <XCircle size={18} />
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
