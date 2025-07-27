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
  const [lowBalanceWarning, setLowBalanceWarning] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const senderId = userId;

  // Register user to socket personal room
  useEffect(() => {
    if (userId) {
      register(userId);
    }
  }, [userId, register]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch messages and session info once
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
            // Welcome message from USER side so it appears on right for user
            const welcomeMsg = {
              senderId: userIdInSession,
              receiverId: astrologerIdInSession,
              createdAt: new Date().toISOString(),
              _id: `local-${Date.now()}-auto`,
              content:
                "Hi, I’ve just connected! Looking forward to guiding you. ✨ Please share your full name and birth details.",
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

  // Setup socket listeners and join room
  useEffect(() => {
    if (!sessionId) {
      console.log(`📡 Joining room: ${sessionId}`);
      return;
    }

    joinRoom(sessionId);

    const handleMessage = (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === msg._id);
        return exists ? prev : [...prev, msg];
      });
    };
    onMessage(handleMessage);

    const handleSessionEnded = ({ sessionId: endedId }) => {
      if (endedId === sessionId) {
        setSessionEnded(true);
        toast.error(
          role === "user"
            ? "Chat ended by astrologer or system."
            : "Chat ended by user or system."
        );
        setTimeout(() => {
          navigate(role === "user" ? "/" : "/astrologer-dashboard");
        }, 2000); // Delay so user sees toast
      }
    };
    onSessionEnded(handleSessionEnded);

    const handleLowBalance = ({ sessionId: lowBalanceSid, message }) => {
      if (lowBalanceSid === sessionId) {
        toast.error(message || "Low wallet balance");
        setLowBalanceWarning(true);
      }
    };
    useChatStore.getState().socket.on("low-balance", handleLowBalance);

    const handleUserLeft = ({ sessionId: leftId, socketId }) => {
      if (leftId === sessionId) {
        toast("The other person has left the room.");
      }
    };
    useChatStore.getState().socket.on("user-left", handleUserLeft);

    return () => {
      offMessage();
      offSessionEnded();
      setLowBalanceWarning(false);
      useChatStore.getState().socket.off("low-balance", handleLowBalance);
      useChatStore.getState().socket.off("user-left", handleUserLeft);
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

  // Send message handler  
  const handleSend = () => {
    // Allow send when lowBalanceWarning is true; only disable on sessionEnded
    if (input.trim() && receiverId && !sessionEnded) {
      sendMessage({
        sessionId,
        senderId,
        receiverId,
        content: input.trim(),
      });
      setInput("");
    }
  };

  // Handle chat end action
  const handleEndChat = () => {
    if (sessionId) {
      emitSessionEnded(sessionId);
      toast.success("You have ended the chat.");
      setSessionEnded(true);
    }
    setTimeout(() => {
      offSessionEnded();
      leaveRoom(sessionId);
      navigate(role === "user" ? "/" : "/astrologer-dashboard");
    }, 1000);
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
        <h2 className="text-base sm:text-xl font-semibold text-gray-900">Chat Session</h2>
        <button
          onClick={handleEndChat}
          disabled={sessionEnded}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          aria-label="End Chat"
          title="End Chat"
          type="button"
        >
          <LogOut className="w-5 h-5" />
          End Chat
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-3 px-2 sm:px-4 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200"
        aria-live="polite"
        aria-relevant="additions"
      >
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
                  className={`relative px-4 py-2 rounded-2xl shadow-md max-w-xs text-sm transition-opacity duration-300 ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                  style={{ animation: "fadeIn 0.3s ease forwards" }}
                >
                  <div className="break-words">{msg.content}</div>
                  <div className="text-[10px] mt-1 opacity-70 text-right select-none">
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

      {/* Low balance warning bar */}
      {lowBalanceWarning && !sessionEnded && (
        <div
          className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between max-w-md w-full gap-4"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span>Your wallet balance is low. Please recharge or end the chat.</span>
          <button
            onClick={handleEndChat}
            className="bg-white text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            aria-label="End Chat"
          >
            End Chat
          </button>
        </div>
      )}

      {/* Overlay when session ended */}
      {sessionEnded && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center pointer-events-none">
          <p className="text-lg font-semibold text-gray-700 select-none">
            Chat session ended.
          </p>
        </div>
      )}

      {/* Input area */}
      <div className="mt-4 flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 text-gray-900 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading || !receiverId || sessionEnded}
          aria-label="Type a message"
        />
        <button
          onClick={handleSend}
          disabled={!receiverId || loading || input.trim() === "" || sessionEnded}
          className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <SendHorizonal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
