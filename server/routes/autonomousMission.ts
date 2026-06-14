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

// GET /api/autonomous-mission/history
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

// PUT /api/autonomous-mission/:id (update status or attributes)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    await db.collection("missions").doc(id).update(updateData);

    // Track status transitions in mission_updates
    if (updateData.status) {
      await db.collection("mission_updates").add({
        missionId: id,
        status: updateData.status,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({ success: true, updated: updateData });
  } catch (error: any) {
    console.error("Mission update error:", error);
    res.status(500).json({ error: error.message || "Failed to update mission" });
  }
});

// POST /api/autonomous-mission/duplicate/:id
router.post("/duplicate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("missions").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Mission not found" });
      return;
    }

    const data = snap.data();
    const newId = "miss_" + Date.now();
    const duplicatedData = {
      ...data,
      id: newId,
      goal: `${data.goal} (Copy)`,
      createdAt: new Date().toISOString(),
      status: "Detected" // Reset status to default lifecycle start
    };

    await db.collection("missions").doc(newId).set(duplicatedData);

    await db.collection("mission_updates").add({
      missionId: newId,
      status: "Detected",
      timestamp: new Date().toISOString()
    });

    res.status(201).json(duplicatedData);
  } catch (error: any) {
    console.error("Mission duplicate error:", error);
    res.status(500).json({ error: error.message || "Failed to duplicate mission" });
  }
});

// DELETE /api/autonomous-mission/:id (archive/remove)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("missions").doc(id).delete();
    
    // Cleanup updates
    try {
      const updatesSnap = await db.collection("mission_updates").where("missionId", "==", id).get();
      updatesSnap.forEach((doc: any) => doc.ref.delete());
    } catch (e) {
      console.warn("Could not clean up updates snap: ", e);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Mission deletion error:", error);
    res.status(500).json({ error: error.message || "Failed to delete mission" });
  }
});

export default router;
