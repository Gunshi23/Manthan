import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routers
import autonomousMissionRouter from "./routes/autonomousMission";
import copilotRouter from "./routes/copilot";
import futureSimulatorRouter from "./routes/futureSimulator";
import boardroomRouter from "./routes/boardroom";
import campaignsRouter from "./routes/campaigns";
import opportunitiesRouter from "./routes/opportunities";
import brandDnaRouter from "./routes/brandDna";
import analyticsRouter from "./routes/analytics";

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: "*", // allow requests from all origins (Vite server running on port 5173 or other hosts)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "online" });
});

// Mount routes
app.use("/api/autonomous-mission", autonomousMissionRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api/future-simulator", futureSimulatorRouter);
app.use("/api/boardroom", boardroomRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/brand-dna", brandDnaRouter);
app.use("/api/analytics", analyticsRouter);

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 ORBIT backend server running on http://localhost:${PORT}`);
  });
}

export default app;
