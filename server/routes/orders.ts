import { Router } from "express";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders: any[] = [];
    snapshot.forEach((doc: any) => {
      orders.push(doc.data());
    });
    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Orders route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve orders" });
  }
});

export default router;
