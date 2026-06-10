import { Router } from "express";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("customers").get();
    const customers: any[] = [];
    snapshot.forEach((doc: any) => {
      customers.push(doc.data());
    });
    res.status(200).json(customers);
  } catch (error: any) {
    console.error("Customers route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve customers" });
  }
});

export default router;
