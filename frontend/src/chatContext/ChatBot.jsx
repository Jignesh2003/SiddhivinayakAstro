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
    join,
    joinRoom,
    leaveRoom,
    sendMessage,
    onMessage,
    offMessage,
    onSessionEnded,
    offSessionEnded,
    emitSession,
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

  // Register user socket room
  useEffect(() => {
    if (userId) {
      register(userId);
    }
  }, [userId, register]);

  // Auto scroll to bottom on message update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch messages & session data and set receiverId and welcome message
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
          const userInSession = session.userId._id.toString();
          const astrologerInSession = session.astrologerId._id.toString();
          const userIdStr = userId.toString();

          // Compute receiverId (peer id) based on logged in user
          let otherId = null;
          if (userInSession && astrologerInSession) {
            otherId = userIdStr === userInSession ? astrologerInSession : userInSession;
          }

          // Debug logs for user & IDs
          console.log("ChatBox Debug Info:", {
            loggedInUserId: userIdStr,
            userInSession,
            astrologerInSession,
            computedReceiverId: otherId,
            role,
          });

          if (!otherId) {
            // Fallback to set receiverId explicitly
            if (role === "user" && astrologerInSession) setReceiverId(astrologerInSession);
            else if (role === "astrologer" && userInSession) setReceiverId(userInSession);
          } else {
            setReceiverId(otherId);
          }

          // Show welcome message only if user and first time opener
          if (isNewSession && msgs.length === 0) {
            if (role === "user") {
              const welcomeMsg = {
                senderId: userInSession,
                receiverId: astrologerInSession,
                createdAt: new Date().toISOString(),
                _id: `local-${Date.now()}-auto`,
                content:
                  "Hi! I’ve just connected. Please share your full name and birth details to get started.",
              };
              setMessages([welcomeMsg]);
            } else {
              setMessages([]); // no welcome message for astrologer
            }
          } else {
            setMessages(msgs);
          }
        } else {
          setReceiverId(null);
          setMessages(msgs);
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
        setError("Failed to load chat messages.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [sessionId, token, userId, isNewSession, role]);

  // Socket event listeners, join rooms
  useEffect(() => {
    if (!sessionId) return;

    joinRoom(sessionId);

    const onNewMessage = (msg) => {
      setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    };

    const onSessionEnd = ({ sessionId: endedId }) => {
      if (endedId === sessionId) {
        setSessionEnded(true);
        toast.error(
          role === "user"
            ? "Chat ended by astrologer or system."
            : "Chat ended by user or system."
        );
        setTimeout(() => {
          navigate(role === "user" ? "/" : "/dashboard");
        }, 2000);
      }
    };

    const onLowBalance = ({ sessionId: sid, message }) => {
      if (sid === sessionId) {
        setLowBalanceWarning(true);
        toast.error(message || "Your balance is low.");
      }
    };

    const onUserLeft = ({ sessionId: sid }) => {
      if (sid === sessionId) {
        toast("The other party has left the chat.");
      }
    };

    onMessage(onNewMessage);
    onSessionEnded(onSessionEnd);
    useChatStore.getState().socket.on("low-balance", onLowBalance);
    useChatStore.getState().socket.on("user-left", onUserLeft);

    return () => {
      offMessage();
      offSessionEnded();
      useChatStore.getState().socket.off("low-balance", onLowBalance);
      useChatStore.getState().socket.off("user-left", onUserLeft);
      leaveRoom(sessionId);
      setLowBalanceWarning(false);
    };
  }, [sessionId, joinRoom, leaveRoom, onMessage, offMessage, onSessionEnded, offSessionEnded, navigate, role]);

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

  // End chat handler
  const handleEndChat = () => {
    if (sessionId) {
      emitSessionEnded(sessionId);
      toast.success("You ended the chat.");
      setSessionEnded(true);
    }
    setTimeout(() => {
      leaveRoom(sessionId);
      navigate(role === "user" ? "/" : "/dashboard");
    }, 1000);
  };

  return (
    <div
      className="flex flex-col w-full max-w-3xl mx-auto h-[80vh] mt-6 rounded-xl shadow-lg bg-white p-6 relative"
      style={{ backgroundImage: `url(${assets.GalaxyBackground})`, backgroundSize: "cover" }}
      aria-label="Chat box"
    >
      <header className="flex justify-between items-center border-b border-gray-300 mb-4 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Chat Session</h2>
        <button
          onClick={handleEndChat}
          disabled={sessionEnded}
          aria-label="End Chat"
          className="flex items-center gap-2 text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" /> End Chat
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto p-4 rounded-lg bg-white scrollbar-thin scrollbar-thumb-gray-400"
        role="log"
        aria-live="polite"
      >
        {loading && <p className="text-center text-gray-500">Loading messages...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center italic text-gray-400">No messages yet</p>
        )}

        {messages.map((msg) => {
          const senderVal =
            typeof msg.senderId === "object" && msg.senderId !== null
              ? msg.senderId._id || msg.senderId
              : msg.senderId;
          const isMine = senderVal === userId;
          return (
            <article
              key={msg._id}
              role="article"
              aria-label={isMine ? "Your message" : "Received message"}
              className={`max-w-xs p-3 mb-3 rounded-lg shadow-md select-text ${
                isMine ? "bg-blue-600 text-white self-end" : "bg-gray-200 text-gray-900 self-start"
              }`}
              style={{ animation: "fadein 0.3s ease-in" }}
            >
              {msg.content}
              <time className="block mt-1 text-xs text-right opacity-70 select-none">
                {msg?.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </time>
            </article>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      <footer className="flex gap-3 border-t border-gray-300 pt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          disabled={loading || !receiverId || sessionEnded}
          aria-label="Message input"
          className="flex-grow py-3 px-4 border rounded-full placeholder-gray-400 text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={loading || !receiverId || !input.trim() || sessionEnded}
          aria-label="Send message"
          className="py-3 px-3 bg-blue-600 rounded-full text-white disabled:bg-blue-400 disabled:cursor-not-allowed hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <SendHorizonal />
        </button>
      </footer>

      {lowBalanceWarning && !sessionEnded && (
        <section
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg max-w-md w-full flex justify-between items-center gap-4 z-50"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p>Your balance is low. Please recharge or end the chat.</p>
          <button
            onClick={handleEndChat}
            className="py-2 px-4 bg-white text-red-600 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="End Chat"
          >
            End Chat
          </button>
        </section>
      )}

      {sessionEnded && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center pointer-events-none">
          <p className="text-2xl font-semibold text-gray-900 select-none">Chat ended.</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
