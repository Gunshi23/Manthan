import { Router } from "express";
import { runFutureSimulation } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { audience, discount, channel } = req.body;
    if (!audience || discount === undefined || !channel) {
      res.status(400).json({ error: "Audience, discount, and channel parameters are required." });
      return;
    }

    const simulation = await runFutureSimulation(audience, Number(discount), channel);
    
    // Save to Firestore 'simulations' collection
    const simulationId = "sim_" + Date.now();
    const simulationData = {
      id: simulationId,
      audience,
      discount: Number(discount),
      channel,
      createdAt: new Date().toISOString(),
      ...simulation
    };

    await db.collection("simulations").doc(simulationId).set(simulationData);

    res.status(200).json(simulation);
  } catch (error: any) {
    console.error("Future Simulator route error:", error);
    res.status(500).json({ error: error.message || "Failed to run future simulation" });
  }
});

export default router;
