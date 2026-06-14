import { Router } from "express";
import { generateBoardroomDiscussion } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { goal, missionPlan } = req.body;
    if (!goal) {
      res.status(400).json({ error: "Goal parameter is required." });
      return;
    }

    const discussion = await generateBoardroomDiscussion(goal, missionPlan);
    
    // Save to Firestore 'agent_logs' collection
    const boardroomId = "br_" + Date.now();
    const logData = {
      id: boardroomId,
      goal,
      createdAt: new Date().toISOString(),
      messages: discussion.messages
    };

    await db.collection("agent_logs").doc(boardroomId).set(logData);

    res.status(200).json(discussion);
  } catch (error: any) {
    console.error("Boardroom route error:", error);
    res.status(500).json({ error: error.message || "Failed to generate courtroom boardroom discussion" });
  }
});

export default router;
