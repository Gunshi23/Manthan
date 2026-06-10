import { Router } from "express";
import { sendWhatsAppMessage, sendCampaignWhatsApp } from "../services/twilioService";
import { sendEmail, sendCampaignEmail } from "../services/resendService";
import { db } from "../config/firebase";

const router = Router();

// POST /api/whatsapp/send
router.post("/whatsapp/send", async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      res.status(400).json({ error: "Phone and message are required." });
      return;
    }
    const result = await sendWhatsAppMessage(phone, message);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to send WhatsApp message" });
  }
});

// POST /api/email/send
router.post("/email/send", async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      res.status(400).json({ error: "To, subject, and body are required." });
      return;
    }
    const result = await sendEmail(to, subject, body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// POST /api/campaigns/launch
router.post("/launch", async (req, res) => {
  try {
    const { channel, audience, template, missionId, subject } = req.body;
    if (!channel || !audience || !template) {
      res.status(400).json({ error: "Channel, audience, and template are required." });
      return;
    }

    const campaignId = "camp_" + Date.now();
    const finalMissionId = missionId || "miss_" + Date.now();
    const recipients = Array.isArray(audience) ? audience : [];

    let result;
    if (channel === "WhatsApp") {
      result = await sendCampaignWhatsApp(campaignId, finalMissionId, recipients, template);
    } else {
      result = await sendCampaignEmail(campaignId, finalMissionId, recipients, subject || "Special Offer from ORBIT", template);
    }

    // Write to mission_updates
    const finalStatus = result.success ? "Completed" : "Failed";
    await db.collection("mission_updates").add({
      missionId: finalMissionId,
      campaignId,
      status: finalStatus === "Completed" ? "Delivered" : "Failed",
      timestamp: new Date().toISOString()
    });

    // Populate conversion simulation statistics in the campaigns document
    if (result.success) {
      const delivered = result.dispatchedCount;
      const opened = Math.round(delivered * (0.75 + Math.random() * 0.15));
      const clicked = Math.round(opened * (0.4 + Math.random() * 0.2));
      const purchases = Math.max(1, Math.round(clicked * (0.2 + Math.random() * 0.2)));
      const revenue = purchases * (500 + Math.floor(Math.random() * 1000));

      await db.collection("campaigns").doc(campaignId).update({
        openedCount: opened,
        clickedCount: clicked,
        purchaseCount: purchases,
        revenueGenerated: revenue,
        status: "Completed"
      });

      // Write simulated metrics to 'analytics' collection for charts
      await db.collection("analytics").add({
        campaignId,
        date: new Date().toISOString().split("T")[0],
        revenue,
        purchases,
        conversionRate: parseFloat(((purchases / delivered) * 100).toFixed(1)),
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: result.success,
      campaignId,
      missionId: finalMissionId,
      dispatchedCount: result.dispatchedCount,
      failedCount: result.failedCount
    });
  } catch (error: any) {
    console.error("Campaign Launch route error:", error);
    res.status(500).json({ error: error.message || "Failed to launch campaign" });
  }
});

// GET /api/campaigns (retrieve campaign list)
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("campaigns").orderBy("createdAt", "desc").get();
    const campaigns: any[] = [];
    snapshot.forEach((doc: any) => {
      campaigns.push(doc.data());
    });
    res.status(200).json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve campaigns list" });
  }
});

// POST /api/campaigns (save a newly generated campaign)
router.post("/", async (req, res) => {
  try {
    const { name, goal, channel, targetSegment, audienceSize, predictedRevenue, predictedRoi, copy, subject, status } = req.body;
    const campaignId = "camp_" + Date.now();
    const doc = {
      id: campaignId,
      name: name || goal || "Growth Engine Campaign",
      goal: goal || "",
      channel: channel || "WhatsApp",
      targetSegment: targetSegment || "Loyalists",
      audienceSize: audienceSize || 0,
      predictedRevenue: predictedRevenue || 0,
      predictedRoi: predictedRoi || 0,
      copy: copy || "",
      subject: subject || "",
      status: status || "Draft",
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      purchaseCount: 0,
      revenueGenerated: 0,
      createdAt: new Date().toISOString(),
      description: goal || "",
    };
    await db.collection("campaigns").doc(campaignId).set(doc);
    res.status(201).json({ success: true, campaignId, ...doc });
  } catch (error: any) {
    console.error("Campaign save error:", error);
    res.status(500).json({ error: error.message || "Failed to save campaign" });
  }
});


// GET /api/campaigns/templates
router.get("/templates", (req, res) => {
  const templates = [
    {
      id: "tmpl_recovery",
      name: "Recovery Campaign",
      description: "Re-engage dormant premium accounts with custom discount codes.",
      channel: "WhatsApp",
      body: "Hi {{name}} 👋\n\nWe noticed you haven't visited recently. Get 15% off your next checkout. Reply YES to claim."
    },
    {
      id: "tmpl_vip",
      name: "VIP Campaign",
      description: "Send high-ltv customers early pre-sale access details.",
      channel: "WhatsApp",
      body: "Hi {{name}} 🌟\n\nAs one of our VIP members, you get early access to our premium launch. Click here: https://orbit.io/sale"
    },
    {
      id: "tmpl_festival",
      name: "Festival Campaign",
      description: "Promote festive collection specials with custom greetings.",
      channel: "WhatsApp",
      body: "Happy Diwali {{name}} ✨\n\nCelebrate with 20% off all new collections. Claim your code: DIWALI20"
    },
    {
      id: "tmpl_product",
      name: "Product Launch Campaign",
      description: "Broadcast early access release announcements.",
      channel: "Email",
      subject: "Exclusive Launch Access: Cyberwear Implant upgrades",
      body: "Hello {{name}},\n\nGet exclusive priority access to the new collection."
    },
    {
      id: "tmpl_reactivation",
      name: "Reactivation Campaign",
      description: "Win back slipping cart checkouts.",
      channel: "Email",
      subject: "Did you forget something?",
      body: "Hi {{name}},\n\nYour items are still waiting in your cart. Complete your order today."
    }
  ];
  res.status(200).json(templates);
});

export default router;
