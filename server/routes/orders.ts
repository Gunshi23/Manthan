import { Router } from "express";
import { db } from "../config/firebase";
import { isResourceExhausted, getFallbackData } from "../utils/fallback";

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
    if (isResourceExhausted(error)) {
      console.warn("⚠️ Firestore quota exceeded (RESOURCE_EXHAUSTED). Triggering demo-safe fallback for /api/orders");
      const fallbackOrders = getFallbackData("orders");
      res.status(200).json(fallbackOrders);
      return;
    }
    console.error("Orders route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve orders" });
  }
});

export default router;
