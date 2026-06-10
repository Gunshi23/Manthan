import { Router } from "express";
import { generateBrandDNA } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { businessType, growthStyle } = req.body;
    if (!businessType || !growthStyle) {
      res.status(400).json({ error: "BusinessType and growthStyle parameters are required." });
      return;
    }

    const dna = await generateBrandDNA(businessType, growthStyle);

    // Save to Firestore 'brand_dna' collection
    const dnaId = "dna_" + Date.now();
    const dnaData = {
      id: dnaId,
      createdAt: new Date().toISOString(),
      ...dna
    };

    await db.collection("brand_dna").doc(dnaId).set(dnaData);

    res.status(200).json(dna);
  } catch (error: any) {
    console.error("Brand DNA route error:", error);
    res.status(500).json({ error: error.message || "Failed to generate brand DNA profile" });
  }
});

// GET /api/brand-dna (retrieve current brand dna)
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("brand_dna").orderBy("createdAt", "desc").limit(1).get();
    if (snapshot.empty) {
      res.status(404).json({ error: "No brand DNA profile generated yet." });
      return;
    }
    res.status(200).json(snapshot.docs[0].data());
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve brand DNA profile" });
  }
});

export default router;
