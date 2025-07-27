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

  // Fetch messages and session info once on mount/sessionId change
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

          // Determine the other participant ID (peer)
          let otherId = null;

          // Defensive check: only set receiverId if both IDs exist
          if (userIdInSession && astrologerIdInSession) {
            otherId = userIdStr === userIdInSession ? astrologerIdInSession : userIdInSession;
          }

          setReceiverId(otherId);

          if (isNewSession && msgs.length === 0) {
            // Welcome message from USER side (so appears on right for the user)
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

  // Handle end chat action
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
      className="flex flex-col w-full sm:max-w-3xl max-w-full mx-auto h-[70vh] mt-6 sm:mt-10 border rounded-2xl shadow-lg p-6 bg-white relative"
      style={{
        backgroundImage: `url(${assets.GalaxyBackground})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      aria-label="Chat box"
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Chat Session</h2>
        <button
          onClick={handleEndChat}
          disabled={sessionEnded}
          className="flex items-center gap-2 text-red-600 hover:text-red-800 disabled:opacity-50"
          aria-label="End Chat"
        >
          <LogOut className="w-5 h-5" />
          End Chat
        </button>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto p-3 scrollbar scrollbar-thumb-blue-400 scrollbar-track-gray-100 rounded-lg mb-4 bg-white"
        aria-live="polite"
        aria-relevant="additions"
      >
        {loading && <p className="text-gray-500 text-center">Loading chat...</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center text-gray-400 italic">No messages yet</p>
        )}
        {messages.map((msg) => {
          const sender =
            typeof msg.senderId === "object" && msg.senderId !== null ? msg.senderId._id || msg.senderId : msg.senderId;
          const isMine = sender?.toString() === senderId?.toString();
          return (
            <div
              key={msg._id}
              className={`max-w-xs px-4 py-2 mb-2 rounded-2xl shadow cursor-default select-text transition-all duration-150 ease-in-out ${
                isMine ? "self-end bg-blue-600 text-white" : "self-start bg-gray-200 text-gray-900"
              }`}
              style={{ animation: "fadeIn 0.3s ease forwards" }}
              role="article"
              aria-label={`${isMine ? "Your message" : "Received message"}`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className="mt-1 text-xs text-right opacity-70 select-none">
                {msg.createdAt &&
                  new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-3 border-t pt-3">
        <input
          type="text"
          value={input}
          placeholder="Type your message..."
          disabled={loading || !receiverId || sessionEnded}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          aria-label="Message input"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={!receiverId || loading || input.trim() === "" || sessionEnded}
          aria-label="Send message"
          className="rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors p-2"
        >
          <SendHorizonal className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Low Balance Warning bar */}
      {lowBalanceWarning && !sessionEnded && (
        <div
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center justify-between max-w-md w-full gap-4 z-50"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <span>Your wallet balance is low. Please recharge or end the chat.</span>
          <button
            onClick={handleEndChat}
            className="bg-white text-red-600 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            aria-label="End Chat"
          >
            End Chat
          </button>
        </div>
      )}

      {/* Session Ended overlay */}
      {sessionEnded && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center pointer-events-none">
          <p className="text-xl font-semibold text-gray-900 select-none">Chat session ended.</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
