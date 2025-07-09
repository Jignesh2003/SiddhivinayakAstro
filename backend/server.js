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
import { setupSocketHandlers } from "./sockets/chatHandler.js";
import horoscopeRoutes from "./routes/horoscopeRoutes.js"
import cron from 'node-cron';
import { fetchHoroscopes } from './jobs/fetchHoroscope.js';
import astrologyRoutes from './routes/astrologyRoutes.js'
dotenv.config();
const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "https://siddhivinayak-astro.vercel.app",
    "https://www.siddhivinayakastroworld.com",
     "https://www.siddhivinayakastroworld.in",
     "http://localhost:5173",
  ],
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/astrologers", astroRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/horoscope', horoscopeRoutes);
app.use('/api/astrology',astrologyRoutes)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Socket + HTTP Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://siddhivinayak-astro.vercel.app",
      "http://localhost:5173",
      "https://www.siddhivinayakastroworld.com",
     "https://www.siddhivinayakastroworld.in"
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
// Run at 00:00 UTC → 05:30 IST every day
cron.schedule('30 0 * * *', fetchHoroscopes, {
  timezone: 'Asia/Kolkata'
});
