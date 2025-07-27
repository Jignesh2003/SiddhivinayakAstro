import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

  // Register user socket room on mount
  useEffect(() => {
    if (userId) {
      register(userId);
    }
  }, [userId, register]);

  // Scroll on new message
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages and assign receiverId only (no welcome message!)
  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_CHAT_URL}/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs = res.data?.messages || [];
        const session = res.data?.session;
        if (session?.userId?._id && session?.astrologerId?._id) {
          const userInSession = session.userId._id.toString();
          const astrologerInSession = session.astrologerId._id.toString();
          const selfId = userId.toString();
          let computedReceiverId = selfId === userInSession ? astrologerInSession : userInSession;
          setReceiverId(computedReceiverId);
          setMessages(msgs);
        } else {
          setReceiverId(null);
          setMessages(msgs);
        }
        setError(null);
      } catch (err) {
        console.log(err);
        
        setError("Could not load chat messages.");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchMessages();
  }, [sessionId, token, userId]);

  // Setup all socket listeners & cleanup
  useEffect(() => {
    if (!sessionId) return;
    joinRoom(sessionId);

    const handleMessage = (msg) => {
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
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
        }, 2000);
      }
    };
    onSessionEnded(handleSessionEnded);

    const handleLowBalance = ({ sessionId: lowBalanceSid, message }) => {
      if (lowBalanceSid === sessionId) {
        setLowBalanceWarning(true);
        toast.error(message || "Your wallet balance is low.");
      }
    };
    useChatStore.getState().socket.on("low-balance", handleLowBalance);

    const handleUserLeft = ({ sessionId: leftId }) => {
      if (leftId === sessionId) {
        toast("The other person has left the room.");
      }
    };
    useChatStore.getState().socket.on("user-left", handleUserLeft);

    return () => {
      offMessage();
      offSessionEnded();
      useChatStore.getState().socket.off("low-balance", handleLowBalance);
      useChatStore.getState().socket.off("user-left", handleUserLeft);
      leaveRoom(sessionId);
      setLowBalanceWarning(false);
    };
  }, [
    sessionId,
    joinRoom,
    leaveRoom,
    onMessage,
    offMessage,
    onSessionEnded,
    offSessionEnded,
    navigate,
    role,
  ]);

  // Send message handler
  const handleSend = () => {
    if (input.trim() && receiverId && !sessionEnded) {
      sendMessage({
        sessionId,
        senderId: userId,
        receiverId,
        content: input.trim(),
      });
      setInput("");
    }
  };

  // End chat using socket only (no API call)
  const handleEndChat = () => {
    if (sessionId) {
      emitSessionEnded(sessionId);
      setSessionEnded(true);
      toast.success("You have ended the chat.");
      setTimeout(() => {
        offSessionEnded();
        leaveRoom(sessionId);
        navigate(role === "user" ? "/" : "/astrologer-dashboard");
      }, 300);
    }
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
      aria-label="Chat Session"
    >
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-base sm:text-xl font-semibold text-gray-900">Chat Session</h2>
        <button
          onClick={handleEndChat}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
          aria-label="End Chat"
          disabled={sessionEnded}
        >
          <LogOut className="w-4 h-4" />
          End Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 px-1 sm:px-2" aria-live="polite" aria-relevant="additions">
        {loading ? (
          <p className="text-center text-gray-500 mt-4">Loading messages...</p>
        ) : error ? (
          <p className="text-center text-red-500 mt-4">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 mt-4 italic">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const sender =
              typeof msg.senderId === "object" && msg.senderId !== null
                ? msg.senderId._id || msg.senderId
                : msg.senderId;
            const isMine = sender?.toString() === userId?.toString();
            return (
              <div
                key={msg._id || Math.random()}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl shadow max-w-xs text-sm ${
                    isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <div>{msg.content}</div>
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

      <div className="mt-4 flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading || !receiverId || sessionEnded}
          aria-label="Type your message"
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
