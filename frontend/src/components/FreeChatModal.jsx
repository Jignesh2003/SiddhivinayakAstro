import React, { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import axios from "axios";
import { toast } from "react-toastify";

const FreeChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Namaste 🙏 I'm Jyoti, your personal astrologer. We have a brief 1-minute free session to look into your stars. What's been weighing on your mind—love, career, or something else?", sender: "ai" }
  ]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const navigate = useNavigate();
  const { token, setHasUsedFreeTrial } = useAuthStore();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Timer logic
  useEffect(() => {
    if (!isOpen) return;

    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      handleTimeUp();
    }
  }, [isOpen, timeLeft, isFinished]);

  const handleTimeUp = async () => {
    setIsFinished(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "Your free trial is over. To continue, you can ask your doubts with expert astrologers by clicking on the button below.",
        sender: "ai"
      }
    ]);

    // Mark free trial as used in DB
    try {
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/used-free-trial`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setHasUsedFreeTrial(true);
      }
    } catch (error) {
      console.error("Failed to update free trial status:", error);
      toast.error("Failed to update free trial status.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isFinished) return;

    const userText = input.trim();
    const userMessage = { id: Date.now(), text: userText, sender: "user" };

    // Add user message to state immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_CHAT_URL}/free-ai`,
        { messages: updatedMessages },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const aiResponseText = response.data?.reply;

      if (aiResponseText && timeLeft > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: aiResponseText,
            sender: "ai"
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);
      toast.error("AI is currently unavailable. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleChatWithExpert = () => {
    onClose();
    navigate("/astro-list");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-poppins">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[600px] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <div>
              <h3 className="font-bold">Jyoti Astrologer</h3>
              <p className="text-xs text-indigo-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`font-mono font-bold text-lg px-2 py-1 rounded bg-black/20 ${timeLeft <= 10 ? 'text-red-300 animate-pulse' : ''}`}>
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === "user"
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
                }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isTyping && !isFinished && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 text-gray-500 flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area or End Action */}
        <div className="p-4 bg-white border-t border-gray-100">
          {isFinished ? (
            <button
              onClick={handleChatWithExpert}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <User size={20} />
              Chat with Expert Astrologers
            </button>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-100 text-gray-800 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                disabled={isFinished}
              />
              <button
                type="submit"
                disabled={!input.trim() || isFinished}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreeChatModal;
