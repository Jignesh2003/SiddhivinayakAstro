import Message from "../models/message.js";
import { endSession } from "../utils/endSession.js";
import ChatSession from "../models/chatSession.js";
import User from "../models/User.js"; // 👈 Import User model

const activeUsersInRoom = {}; // { sessionId: Set of socketIds }
const userSocketMap = {}; // 👈 { socketId: userId }

export const setupSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("register", async ({ userId }) => {
      if (userId) {
        socket.join(userId);
        userSocketMap[socket.id] = userId;

        console.log(`✅ User ${userId} joined personal room`);

        try {
          await User.findByIdAndUpdate(userId, { isOnline: true });
          console.log(`🟢 User ${userId} set isOnline: true`);
        } catch (err) {
          console.error("❌ Error updating isOnline true:", err.message);
        }
      }
    });

    socket.on("joinRoom", ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(sessionId);

      if (!activeUsersInRoom[sessionId]) {
        activeUsersInRoom[sessionId] = new Set();
      }
      activeUsersInRoom[sessionId].add(socket.id);

      console.log(`✅ Socket ${socket.id} joined session room ${sessionId}`);
    });

    socket.on("sendMessage", async ({ sessionId, senderId, receiverId, content }) => {
      if (!sessionId || !senderId || !receiverId || !content) return;

      try {
        const newMessage = await Message.create({ chatSessionId: sessionId, senderId, content });
        const messageData = {
          _id: newMessage._id,
          chatSessionId: sessionId,
          senderId,
          content,
          timestamp: newMessage.timestamp,
        };

        io.to(receiverId).emit("receiveMessage", messageData);
        io.to(senderId).emit("receiveMessage", messageData);
      } catch (err) {
        console.error("💥 Error saving message:", err.message);
      }
    });

    const handleUserLeavingSession = async (sessionId, socketId) => {
      const roomSet = activeUsersInRoom[sessionId];
      if (!roomSet) {
        console.log(`⚠️ No active room for ${sessionId}`);
        return;
      }

      if (!roomSet.has(socketId)) {
        console.log(`⚠️ Socket ${socketId} not found in room ${sessionId}`);
      } else {
        console.log(`👋 Socket ${socketId} is leaving room ${sessionId}`);
      }

      roomSet.delete(socketId);
      console.log(`👋 Socket ${socketId} left room ${sessionId}`);
      io.to(sessionId).emit("user-left", { sessionId, socketId });

      if (roomSet.size === 0) {
        delete activeUsersInRoom[sessionId];
        try {
          const session = await ChatSession.findById(sessionId);
          const messageCount = await Message.countDocuments({ chatSessionId: sessionId });

          if (session && session.status !== "ended" && messageCount > 0) {
            console.log(`🔚 All users left. Ending session ${sessionId}`);
            await endSession(sessionId, io);
          } else {
            console.log(`🟡 All users left but no messages. Not ending session ${sessionId}`);
          }
        } catch (err) {
          console.error("❌ Error ending session:", err.message);
        }
      } else {
        try {
          const session = await ChatSession.findById(sessionId);
          const messageCount = await Message.countDocuments({ chatSessionId: sessionId });

          if (session && session.status !== "ended" && messageCount > 0 && !session.endTime) {
            console.log(`🟠 One party left. Ending session ${sessionId} proactively.`);
            await endSession(sessionId, io);
          }
        } catch (err) {
          console.error("❌ Error updating session endTime:", err.message);
        }
      }
    };

    socket.on("leave-room", async (sessionId) => {
      if (!sessionId) {
        console.log("⚠️ leave-room called with empty sessionId");
        return;
      }

      socket.leave(sessionId);
      console.log(`👋 Socket ${socket.id} requested to leave room ${sessionId}`);

      await handleUserLeavingSession(sessionId, socket.id);
    });

    socket.on("disconnect", async () => {
      console.log("🔴 Socket disconnected:", socket.id);

      const userId = userSocketMap[socket.id];
      if (userId) {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false });
          console.log(`🔴 User ${userId} set isOnline: false`);
        } catch (err) {
          console.error("❌ Error updating isOnline false:", err.message);
        }
        delete userSocketMap[socket.id];
      }

      for (const [sessionId, socketSet] of Object.entries(activeUsersInRoom)) {
        if (socketSet.has(socket.id)) {
          console.log(`🔔 Socket ${socket.id} was in session ${sessionId} before disconnect`);
          await handleUserLeavingSession(sessionId, socket.id);
        }
      }
    });
  });
};
