import { Router } from "express";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("agent_logs").orderBy("createdAt", "desc").limit(100).get();
    const logs: any[] = [];
    snapshot.forEach((doc: any) => {
      logs.push(doc.data());
    });
    res.status(200).json(logs);
  } catch (error: any) {
    console.error("Agent logs route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve agent logs" });
  }
});

// POST /api/agent-logs
router.post("/", async (req, res) => {
  try {
    const { agent, message, type } = req.body;
    const logId = "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const logData = {
      id: logId,
      agent: agent || "System",
      message: message || "",
      type: type || "thought",
      createdAt: new Date().toISOString(),
      timestamp: new Date().toLocaleTimeString()
    };
    await db.collection("agent_logs").doc(logId).set(logData);
    res.status(201).json(logData);
  } catch (error: any) {
    console.error("Agent logs POST error:", error);
    res.status(500).json({ error: error.message || "Failed to save agent log" });
  }
});

export default router;
