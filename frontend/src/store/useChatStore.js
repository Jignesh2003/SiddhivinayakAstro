import { create } from "zustand";
import { io } from "socket.io-client";

const useChatStore = create((set, get) => {
  let socket;

  if (!socket) {
    socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to socket:", socket.id);
      
      // If userId already exists in state, register it now
      const uid = get().userId;
      if (uid) {
        console.log("📲 Auto-registering after connect with userId:", uid);
        socket.emit("register", { userId: uid });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected from socket");
    });
  }

  return {
    socket,
    userId: null,  // store userId here

    setUserId: (id) => {
      set({ userId: id });

      // Register on socket if connected
      if (socket.connected && id) {
        console.log("📲 Registering user:", id);
        socket.emit("register", { userId: id });
      }
    },

    leaveRoom: (sessionId) => {
      if (sessionId) {
        console.log("👋 Emitting leave-room:", sessionId);
        socket.emit("leave-room", sessionId);
      }
    },

    register: (userId) => {
      get().setUserId(userId);
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

    emitSessionEnded: (sessionId) => {
      if (sessionId) {
        console.log("📢 Emitting session-ended:", sessionId);
        socket.emit("session-ended", { sessionId });
      }
    },
  };
});

export default useChatStore;
