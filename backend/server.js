import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoute.js";
import authRoutes from "./routes/authRoutes.js";
import astroRoutes from "./routes/astroRoutes.js";
import authMiddleware from "./middlewares/authMiddleware.js";
import { setupSocketHandlers } from "./sockets/chatHandler.js";

dotenv.config();
const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "https://siddhi-vinayak-astro-fe.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/astrologers", astroRoutes);
app.use("/api/chat", authMiddleware, chatRoutes);

// Socket + HTTP Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://siddhi-vinayak-astro-fe.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  },
});

// Socket logic moved to handler
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
