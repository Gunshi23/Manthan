import { Router } from "express";
import { generateOpportunityRadar } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const oppsResult = await generateOpportunityRadar({});
    const opportunities = oppsResult.opportunities || [];

    // Sync opportunities to Firestore (overwrite or set)
    for (const opp of opportunities) {
      await db.collection("opportunities").doc(opp.id).set({
        ...opp,
        updatedAt: new Date().toISOString()
      });
    }

    res.status(200).json(opportunities);
  } catch (error: any) {
    console.error("Opportunities route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve revenue opportunities" });
  }
});

export default router;
