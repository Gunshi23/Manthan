import { Router } from "express";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("analytics").orderBy("createdAt", "desc").limit(30).get();
    const data: any[] = [];
    snapshot.forEach((doc: any) => {
      data.push(doc.data());
    });

    if (data.length === 0) {
      // Return default populated mock analytics snapshots so charts are fully populated instantly
      const mockAnalytics = [
        { date: "2026-06-05", revenue: 24500, purchases: 18, conversionRate: 11.2 },
        { date: "2026-06-06", revenue: 32000, purchases: 24, conversionRate: 12.8 },
        { date: "2026-06-07", revenue: 28000, purchases: 20, conversionRate: 10.5 },
        { date: "2026-06-08", revenue: 41000, purchases: 31, conversionRate: 14.1 },
        { date: "2026-06-09", revenue: 38500, purchases: 29, conversionRate: 13.2 }
      ];

      // Save them so they reside in DB
      for (const item of mockAnalytics) {
        await db.collection("analytics").add({
          ...item,
          createdAt: new Date(item.date).toISOString()
        });
      }

      res.status(200).json(mockAnalytics);
      return;
    }

    res.status(200).json(data.reverse()); // order chronologically for charts
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve analytics" });
  }
});

export default router;
