import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useChatStore from "../store/ChatStore";
import useAuthStore from "../store/AuthStore";
import { SendHorizonal, LogOut } from "lucide-react";
import assets from "../assets";

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

  // Register user socket room
  useEffect(() => {
    if (userId) {
      register(userId);
    }
  }, [userId, register]);

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages and set receiver ID
  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_CHAT_URL}/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const msgs = res.data.messages || [];
        const session = res.data.session;

        if (session?.userId?._id && session?.astrologerId?._id) {
          const userInSession = session.userId._id.toString();
          const astrologerInSession = session.astrologerId._id.toString();
          const userIdStr = userId.toString();

          let computedReceiverId = null;
          if (userInSession && astrologerInSession) {
            computedReceiverId = userIdStr === userInSession ? astrologerInSession : userInSession;
          }
          setReceiverId(computedReceiverId);

          // Debug info
          console.log("ChatBox Setup:", {
            loggedUser: userIdStr,
            userInSession,
            astrologerInSession,
            computedReceiverId,
            role,
          });

          // Fallback if failed to set receiver
          if (!computedReceiverId) {
            if (role === "user" && astrologerInSession) setReceiverId(astrologerInSession);
            else if (role === "astrologer" && userInSession) setReceiverId(userInSession);
          }

          // Inject welcome message only to user on new session
          if (isNewSession && msgs.length === 0) {
            if (role === "user") {
              const welcomeMsg = {
                senderId: userInSession,
                receiverId: astrologerInSession,
                createdAt: new Date().toISOString(),
                _id: `local-${Date.now()}`,
                content: "Hi! I’ve just connected. Please share your birth details to get started.",
              };
              setMessages([welcomeMsg]);
            } else {
              setMessages([]); // empty chat for astrologer initially
            }
          } else {
            setMessages(msgs);
          }
        } else {
          setReceiverId(null);
          setMessages(msgs);
        }
      } catch (e) {
        console.error("Failed to fetch messages:", e);
        setError("Failed to load chat messages.");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchMessages();
  }, [sessionId, token, userId, isNewSession, role]);

  // Socket event listeners and room management
  useEffect(() => {
    if (!sessionId) return;

    joinRoom(sessionId);

    const incomingMessageHandler = (msg) => {
      setMessages((old) => (old.some((m) => m._id === msg._id) ? old : [...old, msg]));
    };

    const sessionEndedHandler = ({ sessionId: sid }) => {
      if (sid === sessionId) {
        setSessionEnded(true);
        toast.error(
          role === "user" ? "Chat ended by astrologer or system" : "Chat ended by user or system"
        );
        setTimeout(() => {
          navigate(role === "user" ? "/" : "/dashboard");
        }, 2000);
      }
    };

    const lowBalanceHandler = ({ sessionId: sid, message }) => {
      if (sid === sessionId) {
        setLowBalanceWarning(true);
        toast.error(message || "Wallet balance low");
      }
    };

    const userLeftHandler = ({ sessionId: sid }) => {
      if (sid === sessionId) toast("The other party has left");
    };

    onMessage(incomingMessageHandler);
    onSessionEnded(sessionEndedHandler);
    useChatStore.getState().socket.on("low-balance", lowBalanceHandler);
    useChatStore.getState().socket.on("user-left", userLeftHandler);

    return () => {
      offMessage();
      offSessionEnded();
      useChatStore.getState().socket.off("low-balance", lowBalanceHandler);
      useChatStore.getState().socket.off("user-left", userLeftHandler);
      leaveRoom(sessionId);
      setLowBalanceWarning(false);
    };
  }, [sessionId, joinRoom, leaveRoom, onMessage, offMessage, onSessionEnded, offSessionEnded, navigate, role]);

  // Send message handler
  const handleSend = () => {
    if (input.trim() && receiverId && !sessionEnded) {
      sendMessage({ sessionId, senderId, receiverId, content: input.trim() });
      setInput("");
    }
  };

  // End chat handler
  const handleEndChat = () => {
    if (sessionId) {
      emitSessionEnded();
      setSessionEnded(true);
      toast.success("You ended the chat.");
      setTimeout(() => {
        leaveRoom(sessionId);
        navigate(role === "user" ? "/" : "/dashboard");
      }, 1000);
    }
  };

  return (
    <div
      className="flex flex-col max-w-3xl mx-auto h-[80vh] bg-white rounded-xl shadow-lg p-6 relative"
      style={{ backgroundImage: `url(${assets})`, backgroundSize: "cover" }}
      aria-label="Chat box"
    >
      <header className="flex justify-between items-center border-b border-gray-300 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Chat Session</h2>
        <button
          onClick={handleEndChat}
          disabled={sessionEnded}
          aria-label="End chat"
          className="flex items-center gap-2 text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" /> End Chat
        </button>
      </header>

      <main
        className="flex-1 overflow-y-auto p-4 rounded-md scrollbar-thin scrollbar-thumb-gray-400"
        role="log"
        aria-live="polite"
      >
        {loading && <p className="text-center text-gray-500">Loading messages...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center italic text-gray-400">No messages yet</p>
        )}
        {messages.map((msg) => {
          const senderIdVal = typeof msg.senderId === "object" && msg.senderId
            ? msg.senderId._id || msg.senderId
            : msg.senderId;
          const isMine = senderIdVal === userId;
          return (
            <article
              key={msg._id}
              aria-label={isMine ? "Your message" : "Received message"}
              className={`max-w-xs p-3 mb-3 rounded-lg shadow-md select-text ${
                isMine ? "bg-blue-600 text-white self-end" : "bg-gray-200 text-gray-900 self-start"
              }`}
              style={{ animation: "fadein 0.3s ease-in" }}
            >
              {msg.content}
              <time className="block mt-1 text-xs text-right opacity-70 select-none">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                }) : ""}
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
          className="flex-grow py-3 px-4 border rounded-full placeholder-gray-400 text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={loading || !receiverId || !input.trim() || sessionEnded}
          aria-label="Send message"
          className="py-3 px-3 bg-blue-600 rounded-full text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          <SendHorizonal />
        </button>
      </footer>

      {lowBalanceWarning && !sessionEnded && (
        <section
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex justify-between items-center gap-4 max-w-md w-full z-50"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <p>Your wallet balance is low. Please recharge or end the chat.</p>
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
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center pointer-events-none z-40">
          <p className="text-2xl font-semibold text-gray-900 select-none">Chat ended.</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
