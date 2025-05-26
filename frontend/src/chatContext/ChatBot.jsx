import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import { SendHorizonal, LogOut } from "lucide-react";
import assets from "../assets/assets";

const ChatBox = () => {
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const isNewSession = searchParams.get("new") === "true";

  const {
    register,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    offMessage,
    onSessionEnded,
    offSessionEnded,
    emitSessionEnded,
  } = useChatStore();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const senderId = userId;

  useEffect(() => {
    if (userId) {
      register(userId);
    }
  }, [userId, register]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_CHAT_URL}/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const msgs = res.data.messages || [];
        const session = res.data.session;

        if (session?.userId?._id && session?.astrologerId?._id) {
          const userIdStr = userId.toString();
          const userIdInSession = session.userId._id.toString();
          const astrologerIdInSession = session.astrologerId._id.toString();

          const otherId =
            userIdStr === userIdInSession ? astrologerIdInSession : userIdInSession;

          setReceiverId(otherId);

          if (isNewSession && msgs.length === 0) {
            const welcomeMsg = {
              senderId: astrologerIdInSession,
              receiverId: userIdInSession,
              content:
                "Hi, I’ve just connected. Looking forward to guiding you! ✨ Please share your full name and birth details.",
              createdAt: new Date().toISOString(),
              _id: `local-${Date.now()}-auto`,
            };
            setMessages([welcomeMsg]);
          } else {
            setMessages(msgs);
          }
        } else {
          setReceiverId(null);
          setMessages(msgs);
        }
      } catch (err) {
        console.error("❌ Failed to load chat messages:", err);
        setError("Could not load chat messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [sessionId, token, userId, isNewSession]);

  useEffect(() => {
    if (!sessionId) {
      console.log(`📡 Joining room: ${sessionId}`);
      return;
    }

    joinRoom(sessionId);

    const handleMessage = (msg) => {
      console.log("📩 Received message:", msg);
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
    };
    onMessage(handleMessage);

    const handleSessionEnded = ({ sessionId: endedId }) => {
      console.log("🚨 Received session-ended event:", endedId);
      if (endedId === sessionId) {
        const redirectPath = role === "user" ? "/" : "/astrologer-dashboard";
        const toastMsg =
          role === "user"
            ? "The astrologer has ended the session."
            : "The user has left. Chat session ended.";
        toast.error(toastMsg);
        navigate(redirectPath);
      }
    };
    onSessionEnded(handleSessionEnded);

    const handleUserLeft = ({ sessionId: leftId, socketId }) => {
      console.log("⚠️ user-left event received:", { leftId, socketId });
      if (leftId === sessionId) {
        toast("The other person has left the room.");
      }
    };
    useChatStore.getState().socket.on("user-left", handleUserLeft);

    return () => {
      console.log("🧹 Cleaning up socket listeners and leaving room", sessionId);
      offMessage();
      offSessionEnded();
      useChatStore.getState().socket.off("user-left");
      leaveRoom(sessionId);
    };
  }, [
    sessionId,
    joinRoom,
    onMessage,
    offMessage,
    leaveRoom,
    onSessionEnded,
    offSessionEnded,
    navigate,
    role,
  ]);

  const handleSend = () => {
    if (input.trim() && receiverId) {
      sendMessage({
        sessionId,
        senderId,
        receiverId,
        content: input.trim(),
      });
      setInput("");
    }
  };

  const handleEndChat = () => {
    if (sessionId) emitSessionEnded(sessionId);
    toast.success("You have ended the chat.");
    setTimeout(() => {
      offSessionEnded();
      leaveRoom(sessionId);
      navigate(role === "user" ? "/" : "/astrologer-dashboard");
    }, 300);
  };

  return (
    <div
      className="flex flex-col w-full sm:max-w-2xl max-w-full mx-auto h-[70vh] mt-6 sm:mt-10 border rounded-2xl shadow-lg p-4 bg-white"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-base sm:text-xl font-semibold text-white">Chat Session</h2>
        <button
          onClick={handleEndChat}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
        >
          <LogOut className="w-4 h-4" />
          End Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 px-1 sm:px-2">
        {loading ? (
          <p className="text-center text-gray-500 mt-4">Loading messages...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-4">{error}</p>
        ) : (
          messages.map((msg) => {
            const sender =
              typeof msg.senderId === "object" && msg.senderId !== null
                ? msg.senderId._id || msg.senderId
                : msg.senderId;

            const isMine = sender?.toString?.() === senderId?.toString?.();

            return (
              <div
                key={msg._id || Math.random()}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl shadow max-w-xs text-sm ${
                    isMine
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className="text-[10px] mt-1 opacity-70 text-right">
                    {msg.createdAt &&
                      new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 text-white focus:ring-blue-400"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading || !receiverId}
        />
        <button
          onClick={handleSend}
          disabled={!receiverId || loading || input.trim() === ""}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-200 disabled:opacity-50"
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
