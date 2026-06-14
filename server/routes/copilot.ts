import { Router } from "express";
import { generateCopilotResponse } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: "Message parameter is required." });
      return;
    }

    // Retrieve context from Firestore to feed to Gemini
    let brandDna: any = {};
    let campaigns: any[] = [];
    let opportunities: any[] = [];

    try {
      // Fetch Brand DNA (last created entry)
      const brandSnap = await db.collection("brand_dna").orderBy("createdAt", "desc").limit(1).get();
      if (!brandSnap.empty) {
        brandDna = brandSnap.docs[0].data();
      }

      // Fetch campaigns (last 5)
      const campaignSnap = await db.collection("campaigns").orderBy("createdAt", "desc").limit(5).get();
      campaignSnap.forEach((doc: any) => {
        campaigns.push(doc.data());
      });

      // Fetch opportunities (last 5)
      const oppSnap = await db.collection("opportunities").limit(5).get();
      oppSnap.forEach((doc: any) => {
        opportunities.push(doc.data());
      });
    } catch (dbErr) {
      console.warn("Could not retrieve full DB context for copilot. Proceeding with partial context.", dbErr);
    }

    const aiRes = await generateCopilotResponse(message, { brandDna, campaigns, opportunities });
    
    // Log interaction to agent_logs
    try {
      await db.collection("agent_logs").add({
        agent: "Copilot",
        prompt: message,
        response: aiRes.response,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // ignore log failures
    }

    res.status(200).json(aiRes);
  } catch (error: any) {
    console.error("Copilot route error:", error);
    res.status(500).json({ error: error.message || "Failed to generate copilot response" });
  }
});

export default router;
