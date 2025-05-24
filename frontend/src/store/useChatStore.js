// store/useChatStore.js
import { create } from "zustand";
import { io } from "socket.io-client";

let socket;

const useChatStore = create(() => {
  if (!socket) {
    socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected from socket");
    });
  }

  return {
    socket,

    leaveRoom: (sessionId) => {
      if (sessionId) {
        console.log("👋 Emitting leave-room:", sessionId);
        socket.emit("leave-room", sessionId);
      }
    },

    register: (userId) => {
      if (userId) {
        console.log("📲 Registering user:", userId);
        socket.emit("register", { userId });
      }
    },

    joinRoom: (sessionId) => {
      if (sessionId) {
        console.log("📡 Emitting joinRoom:", sessionId);
        socket.emit("joinRoom", { sessionId });
      }
    },

    sendMessage: ({ sessionId, senderId, receiverId, content }) => {
      socket.emit("sendMessage", { sessionId, senderId, receiverId, content });
    },

    onMessage: (callback) => {
      socket.on("receiveMessage", callback);
    },

    offMessage: () => {
      socket.off("receiveMessage");
    },

    onSessionEnded: (callback) => {
      socket.on("session-ended", callback);
    },

    offSessionEnded: () => {
      socket.off("session-ended");
    },

    // ✅ Add this to allow emitting "session-ended"
    emitSessionEnded: (sessionId) => {
      if (sessionId) {
        console.log("📢 Emitting session-ended:", sessionId);
        socket.emit("session-ended", { sessionId }); // ✅ FIXED: match the listener
      }
    },
  };
});

export default useChatStore;
