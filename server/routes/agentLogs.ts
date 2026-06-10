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

export default router;
