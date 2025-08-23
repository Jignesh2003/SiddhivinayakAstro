import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import cron from "node-cron";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoute.js";
import authRoutes from "./routes/authRoutes.js";
import astroRoutes from "./routes/astroRoutes.js";
import horoscopeRoutes from "./routes/horoscopeRoutes.js";
import astrologyRoutes from "./routes/astrologyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import kundaliPdfRoutes from "./routes/kundaliPdfRoutes.js";
import { setupSocketHandlers } from "./sockets/chatHandler.js";
import { initializeMinuteBillingCron } from "./jobs/minuteBilling.js";
import { fetchHoroscopes } from "./jobs/fetchHoroscope.js";

dotenv.config();

const app = express();
app.use("/api/webhook", webhookRoutes);

// Middleware
app.use(express.json());
app.use("/static", express.static(path.join(process.cwd(), "static")));
app.use(
  cors({
    origin: [
      "https://siddhivinayak-astro.vercel.app",
      "https://www.siddhivinayakastroworld.com",
      "https://www.siddhivinayakastroworld.in",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/astrologers", astroRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/horoscope", horoscopeRoutes);
app.use("/api/astrology", astrologyRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/kundali", kundaliPdfRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Create HTTP server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://siddhivinayak-astro.vercel.app",
      "http://localhost:5173",
      "https://www.siddhivinayakastroworld.com",
      "https://www.siddhivinayakastroworld.in",
    ],
    credentials: true,
  },
});
console.log(process.env.MONGO_URI);

// Start all services
async function startServer() {
  try {
    console.log("Starting server...");

    console.log("🔄 Connecting to Database...");
    await connectDB(); // Will throw if fails
    console.log("✅ MongoDB Connected!");

    // Init socket handlers and cron jobs AFTER DB is ready
    setupSocketHandlers(io);
    initializeMinuteBillingCron(io);

    // Start horoscope cron job in production
    if (process.env.NODE_ENV === "production") {
      cron.schedule("30 0 * * *", fetchHoroscopes, {
        timezone: "Asia/Kolkata",
      });
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1); // Exit if DB failed to connect
  }
}

startServer();
