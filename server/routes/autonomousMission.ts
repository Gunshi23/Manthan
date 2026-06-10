import { Router } from "express";
import { generateMissionPlan } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { goal, businessType } = req.body;
    if (!goal) {
      res.status(400).json({ error: "Goal parameter is required." });
      return;
    }

    const missionPlan = await generateMissionPlan(goal, businessType || "Fashion & Retail");
    
    // Save to Firestore 'missions' collection
    const missionId = "miss_" + Date.now();
    const missionData = {
      id: missionId,
      goal,
      createdAt: new Date().toISOString(),
      ...missionPlan
    };

    await db.collection("missions").doc(missionId).set(missionData);

    // Also write to mission_updates to track start
    await db.collection("mission_updates").add({
      missionId,
      status: "Queued",
      timestamp: new Date().toISOString()
    });

    res.status(200).json(missionData);
  } catch (error: any) {
    console.error("Autonomous Mission route error:", error);
    res.status(500).json({ error: error.message || "Failed to generate autonomous mission plan" });
  }
});

// GET /api/missions
router.get("/history", async (req, res) => {
  try {
    const snapshot = await db.collection("missions").orderBy("createdAt", "desc").get();
    const history: any[] = [];
    snapshot.forEach((doc: any) => {
      history.push(doc.data());
    });
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve mission history" });
  }
});

export default router;
