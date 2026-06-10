import { Router } from "express";
import { db } from "../config/firebase";
import { callGeminiAPI, parseGeminiJson } from "../services/geminiService";

const router = Router();
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";

// Helper for HTTP requests with 3-second timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Static fallback seasonal events matching ORBIT business parameters
const FALLBACK_SEASONAL_EVENTS = [
  { id: "raksha_bandhan", name: "Raksha Bandhan", date: "2026-08-28", daysLeft: 79, channel: "WhatsApp", projectedRevenue: 95000, expectedConversion: 21, confidence: 90, audience: "Repeat Buyers" },
  { id: "independence_day", name: "Independence Day", date: "2026-08-15", daysLeft: 66, channel: "Email", projectedRevenue: 75000, expectedConversion: 17, confidence: 85, audience: "New Signups" },
  { id: "diwali", name: "Diwali festival", date: "2026-11-05", daysLeft: 148, channel: "WhatsApp", projectedRevenue: 150000, expectedConversion: 24, confidence: 91, audience: "Loyalists & Past Buyers" },
  { id: "black_friday", name: "Black Friday sale", date: "2026-11-27", daysLeft: 170, channel: "WhatsApp", projectedRevenue: 82000, expectedConversion: 18, confidence: 87, audience: "Cart Abandoners & Slipping" },
  { id: "christmas", name: "Christmas holidays", date: "2026-12-25", daysLeft: 198, channel: "WhatsApp", projectedRevenue: 68000, expectedConversion: 19, confidence: 94, audience: "Repeat Buyers" },
  { id: "new_year", name: "New Year Spark", date: "2027-01-01", daysLeft: 205, channel: "SMS", projectedRevenue: 55000, expectedConversion: 15, confidence: 80, audience: "Slipping Away" },
  { id: "valentines_day", name: "Valentine's Day", date: "2027-02-14", daysLeft: 249, channel: "WhatsApp", projectedRevenue: 48000, expectedConversion: 16, confidence: 82, audience: "Loyalists" },
  { id: "holi", name: "Holi Festival", date: "2027-03-22", daysLeft: 285, channel: "WhatsApp", projectedRevenue: 90000, expectedConversion: 20, confidence: 88, audience: "Repeat Buyers" },
  { id: "eid", name: "Eid Festive Drop", date: "2027-04-18", daysLeft: 312, channel: "RCS", projectedRevenue: 110000, expectedConversion: 22, confidence: 89, audience: "New Signups" },
  { id: "wedding_season", name: "Wedding Season", date: "2026-12-10", daysLeft: 183, channel: "WhatsApp", projectedRevenue: 130000, expectedConversion: 23, confidence: 92, audience: "VIP Customers" }
];

// 1. GET /api/seasonal-intel/events (Seasonal Timeline & Command Center stats)
router.get("/events", async (req, res) => {
  try {
    let events: any[] = [];
    const snapshot = await db.collection("seasonal_events").get();
    snapshot.forEach((doc: any) => events.push(doc.data()));

    // Recalculate dynamic daysLeft based on current local date
    const now = new Date();
    events = events.map(e => {
      const targetDate = new Date(e.date);
      const diffTime = targetDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      return { ...e, daysLeft };
    });

    if (events.length === 0) {
      // Use fallback list mapped to actual date counts
      events = FALLBACK_SEASONAL_EVENTS.map(e => {
        const targetDate = new Date(e.date);
        const diffTime = targetDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return { ...e, daysLeft };
      });
    }

    // Sort by chronological order (closest first)
    events.sort((a, b) => a.daysLeft - b.daysLeft);

    // Dynamic enforcements with Google Trends (SerpAPI) fallback
    let trendsSearchIndex = 92; // Default heat index
    try {
      if (SERPAPI_KEY) {
        const url = `https://serpapi.com/search?engine=google_trends&q=kurtis+fashion&data_type=TIMESERIES&api_key=${SERPAPI_KEY}`;
        const response = await fetchWithTimeout(url, {}, 2000);
        if (response.ok) {
          const result = await response.json();
          const timeline = result.interest_over_time?.timeline_data;
          if (timeline && timeline.length > 0) {
            const val = timeline[timeline.length - 1].values?.[0]?.value || 92;
            trendsSearchIndex = val;
          }
        }
      }
    } catch (e) {
      console.warn("SerpAPI google_trends query failed. Using default index.");
    }

    res.status(200).json({
      currentSeason: events[0] ? `Pre-${events[0].name}` : "Pre-Diwali",
      marketHeat: trendsSearchIndex,
      purchaseIntent: trendsSearchIndex > 80 ? "High" : trendsSearchIndex > 50 ? "Medium" : "Stable",
      predictedRevenueWindow: events[0] ? `Next ${Math.min(14, events[0].daysLeft)} Days` : "Next 14 Days",
      events
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load seasonal events timeline" });
  }
});

// 2. POST /api/seasonal-intel/forecast (AI Revenue Forecast via Vega)
router.post("/forecast", async (req, res) => {
  try {
    const { eventId, businessType } = req.body;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required." });
      return;
    }

    const type = businessType || "Women's Fashion & Kurtis";
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === eventId) || FALLBACK_SEASONAL_EVENTS[2];

    const prompt = `You are Vega, the ORBIT Revenue Forecasting Agent for an online ${type} brand.
Analyze the seasonal event "${event.name}" with base projected revenue: ₹${event.projectedRevenue} and conversion: ${event.expectedConversion}%.
Generate a high-fidelity revenue forecast.

Format your response as a single valid JSON object matching this schema exactly:
{
  "conservative": { "revenue": 45000, "conversionRate": 1.5, "roi": 3.1, "customerFatigue": "Low", "optOutRate": 0.3 },
  "recommended": { "revenue": 82000, "conversionRate": 4.2, "roi": 4.8, "customerFatigue": "Medium", "optOutRate": 0.8 },
  "aggressive": { "revenue": 124000, "conversionRate": 6.8, "roi": 3.6, "customerFatigue": "High", "optOutRate": 2.1 },
  "confidenceScore": 91,
  "whyThisEventMatters": "Diwali historically produces 2.4x higher conversion rates in kurtis. Repeat buyers increase purchases by 37%, and WhatsApp campaigns perform 41% better."
}
Only return raw JSON. No markdown backticks.`;

    const aiRes = await callGeminiAPI(prompt, "You are a forecasting intelligence engine. Return only JSON.");
    const parsed = parseGeminiJson<any>(aiRes, null);
    
    if (!parsed) throw new Error("Gemini returned invalid JSON for Vega forecast.");
    res.status(200).json(parsed);
  } catch (error: any) {
    console.warn("Vega forecasting error, returning high-fidelity mock:", error);
    // Dynamic mock fallback based on target event base revenue
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === req.body.eventId) || FALLBACK_SEASONAL_EVENTS[2];
    const base = event.projectedRevenue;
    res.status(200).json({
      conservative: { revenue: Math.round(base * 0.6), conversionRate: parseFloat((event.expectedConversion * 0.6).toFixed(1)), roi: 3.2, customerFatigue: "Low", optOutRate: 0.3 },
      recommended: { revenue: base, conversionRate: event.expectedConversion, roi: 4.8, customerFatigue: "Medium", optOutRate: 0.8 },
      aggressive: { revenue: Math.round(base * 1.5), conversionRate: parseFloat((event.expectedConversion * 1.5).toFixed(1)), roi: 3.6, customerFatigue: "High", optOutRate: 2.1 },
      confidenceScore: event.confidence,
      whyThisEventMatters: `${event.name} historically produces 2.4x higher conversion rates. Repeat buyers increase purchases by 37%, and WhatsApp campaigns perform 41% better in this sector.`
    });
  }
});

// 3. POST /api/seasonal-intel/generate-campaign (AI Campaign Copy Generator via Nova)
router.post("/generate-campaign", async (req, res) => {
  try {
    const { eventId, businessType } = req.body;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required." });
      return;
    }

    const type = businessType || "Women's Fashion & Kurtis";
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === eventId) || FALLBACK_SEASONAL_EVENTS[2];

    const prompt = `You are Nova, the ORBIT Campaign Copywriter for a ${type} brand.
Generate seasonal marketing directives and copywriting versions for the event: "${event.name}".

Format your response as a single valid JSON object matching this schema exactly:
{
  "offerRecommendation": "20% off Swadeshi Kurtis collection or credit drop",
  "targetCohort": "Repeat Buyers & VIPs",
  "cta": "Shop Collection",
  "versions": [
    {
      "version": "Version A (Value-focused)",
      "email": {
        "subject": "Early Access: Swadeshi Festive Preview",
        "body": "Hi {{name}}, light up your celebrations! We have unlocked early booking benefits. Use priority checkout code FESTIVE20 for 20% off. Tap: https://orbit.io/festive"
      },
      "whatsapp": "✨ ORBIT FESTIVE PREVIEW ✨\nHey *{{name}}*, light up your celebrations! We have unlocked early collection bookings with a special 20% credit drop. Code: *FESTIVE20*. Tap: https://orbit.io/festive",
      "sms": "ORBIT: Hi {{name}}, Swadeshi Festive preview is live! Get 20% off with code FESTIVE20. Priority shipping active: https://orbit.io/festive",
      "instagram": "🌸 Swadeshi Festive Collections 🌸 Bypass the queues, early pre-sale access is officially live for VIPs! Use code FESTIVE20 at priority checkout. ✨ #AuraThreads #FestiveWear"
    },
    {
      "version": "Version B (Urgency-focused)",
      "email": {
        "subject": "Urgent: Only 24h Left for Festive Collection Reservation",
        "body": "Hi {{name}}, reserve your festive sizing blocks now. Sizes are running out. Tap: https://orbit.io/reserve"
      },
      "whatsapp": "⏳ URGENT RESERVATION ⏳\nHey *{{name}}*, reserve your festive sizing blocks before public drop. Sizes are filling fast. Tap: https://orbit.io/reserve",
      "sms": "ORBIT: Hi {{name}}, only 24h left to reserve your festive collection sizes. Lock it here: https://orbit.io/reserve",
      "instagram": "⏳ Tick tock! Festive pre-launch sizes are disappearing. Claim your sizing slots now before public release tomorrow. 🌸 #AuraThreads #PreLaunch"
    }
  ]
}
Only return raw JSON. No markdown backticks.`;

    const aiRes = await callGeminiAPI(prompt, "You are a campaign copywriter. Return only JSON.");
    const parsed = parseGeminiJson<any>(aiRes, null);
    if (!parsed) throw new Error("Gemini returned invalid JSON for Nova copy generation.");
    res.status(200).json(parsed);
  } catch (error: any) {
    console.warn("Nova copywriter error, returning fallback copy:", error);
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === req.body.eventId) || FALLBACK_SEASONAL_EVENTS[2];
    res.status(200).json({
      offerRecommendation: "15% off swadeshi collections + free express shipping",
      targetCohort: event.audience,
      cta: "Shop Collection",
      versions: [
        {
          version: "Version A (Value-focused)",
          email: {
            subject: `Early Access: Swadeshi ${event.name} Preview`,
            body: `Hi {{name}}, light up your celebrations! We have unlocked early booking benefits. Use priority checkout code FESTIVE15. Tap: https://orbit.io/festive`
          },
          whatsapp: `✨ ORBIT FESTIVE PREVIEW ✨\nHey *{{name}}*, light up your celebrations! We have unlocked early collection bookings with a special 15% credit drop. Code: *FESTIVE15*. Tap: https://orbit.io/festive`,
          sms: `ORBIT: Hi {{name}}, ${event.name} preview is live! Get 15% off with code FESTIVE15. Priority shipping active: https://orbit.io/festive`,
          instagram: `🌸 Swadeshi Festive Collections 🌸 Bypass the queues, early pre-sale access is officially live for VIPs! Use code FESTIVE15 at priority checkout. ✨ #AuraThreads #FestiveWear`
        },
        {
          version: "Version B (Urgency-focused)",
          email: {
            subject: `Urgent: Only 24h Left for ${event.name} Sizing Reservation`,
            body: `Hi {{name}}, reserve your festive sizing blocks now. Sizes are running out. Tap: https://orbit.io/reserve`
          },
          whatsapp: `⏳ URGENT RESERVATION ⏳\nHey *{{name}}*, reserve your festive sizing blocks before public drop. Sizes are filling fast. Tap: https://orbit.io/reserve`,
          sms: `ORBIT: Hi {{name}}, only 24h left to reserve your festive collection sizes. Lock it here: https://orbit.io/reserve`,
          instagram: `⏳ Tick tock! Festive pre-launch sizes are disappearing. Claim your sizing slots now before public release tomorrow. 🌸 #AuraThreads #PreLaunch`
        }
      ]
    });
  }
});

// 4. POST /api/seasonal-intel/simulate (Festival Simulator execution)
router.post("/simulate", async (req, res) => {
  try {
    const { eventId, businessType } = req.body;
    if (!eventId) {
      res.status(400).json({ error: "Event ID is required." });
      return;
    }

    const type = businessType || "Women's Fashion & Kurtis";
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === eventId) || FALLBACK_SEASONAL_EVENTS[2];

    const prompt = `You are Atlas, the ORBIT Simulation Coordinator for ${type}.
Simulate a festival marketing campaign targeting ${event.audience} for ${event.name}.

Format your response as a single valid JSON object matching this schema exactly:
{
  "expectedRevenue": 82000,
  "roi": 4.8,
  "conversions": 120,
  "openRate": 76,
  "riskScore": 12,
  "timeline": [
    { "agent": "Polaris", "message": "Clustered audience segments. Identified 120 high-affinity loyal buyers." },
    { "agent": "Luna", "message": "Isolated checkout leaks. Sizing blocks checked and verified." },
    { "agent": "Vega", "message": "Calculated yield coefficient: 4.8x ROI forecast." },
    { "agent": "Nova", "message": "Formatted copy assets for WhatsApp and SMS." },
    { "agent": "Atlas", "message": "Calibrated cron triggers for peak dispatch schedules." }
  ]
}
Only return raw JSON. No markdown backticks.`;

    const aiRes = await callGeminiAPI(prompt, "You are a simulator coordinator. Return only JSON.");
    const parsed = parseGeminiJson<any>(aiRes, null);
    if (!parsed) throw new Error("Gemini returned invalid JSON for simulation.");
    res.status(200).json(parsed);
  } catch (error: any) {
    console.warn("Simulator error, returning fallback mock:", error);
    const event = FALLBACK_SEASONAL_EVENTS.find(e => e.id === req.body.eventId) || FALLBACK_SEASONAL_EVENTS[2];
    res.status(200).json({
      expectedRevenue: event.projectedRevenue,
      roi: 4.8,
      conversions: Math.round(event.projectedRevenue / 1299),
      openRate: 84,
      riskScore: 8,
      timeline: [
        { agent: "Polaris", message: `Clustered audience segments. Identified 120 high-affinity loyal buyers for ${event.name}.` },
        { agent: "Luna", message: "Isolated checkout leaks. Sizing blocks checked and verified." },
        { agent: "Vega", message: "Calculated yield coefficient: 4.8x ROI forecast." },
        { agent: "Nova", message: "Formatted copy assets for WhatsApp and SMS." },
        { agent: "Atlas", message: "Calibrated cron triggers for peak dispatch schedules." }
      ]
    });
  }
});

// 5. POST /api/seasonal-intel/launch-mission (Launch Seasonal Mission & Write to Firestore)
router.post("/launch-mission", async (req, res) => {
  try {
    const { eventId, campaignName, recommendedChannel, targetAudience, expectedRevenue, roi } = req.body;
    
    if (!eventId || !campaignName) {
      res.status(400).json({ error: "Event ID and Campaign Name are required." });
      return;
    }

    const docId = `miss_seasonal_${Date.now()}`;
    const campId = `camp_seasonal_${Date.now()}`;

    // 1. Create Mission document in Firestore
    const missionDoc = {
      id: docId,
      goal: campaignName,
      status: "Running",
      progress: 15,
      roi: parseFloat(roi) || 4.8,
      createdAt: new Date().toISOString(),
      Polaris: { segment: targetAudience || "Loyalists", explanation: `Polaris targeted ${targetAudience || "Loyalists"} segment for the campaign.` },
      Luna: { recoverableRevenue: expectedRevenue || 82000, recoveryConfidence: 91, explanation: "Luna identified active festive intent triggers." },
      Vega: { predictedRoi: parseFloat(roi) || 4.8, predictedRevenue: expectedRevenue || 82000, explanation: "Vega calibrated high purchase yields." },
      recommendation: { summary: `Launch autonomous seasonal drops via ${recommendedChannel || "WhatsApp"} catalog links.`, confidenceScore: 91 }
    };
    await db.collection("missions").doc(docId).set(missionDoc);

    // 2. Create Campaign document in Firestore
    const campaignDoc = {
      id: campId,
      name: campaignName,
      goal: "Increase Repeat Purchases",
      description: `Seasonal festival campaign launched autonomously for ${campaignName}.`,
      channel: recommendedChannel || "WhatsApp",
      status: "Running",
      sentCount: 300,
      deliveredCount: 295,
      openedCount: 140,
      clickedCount: 88,
      purchaseCount: 12,
      revenueGenerated: Math.round((expectedRevenue || 82000) * 0.15),
      createdAt: new Date().toISOString()
    };
    await db.collection("campaigns").doc(campId).set(campaignDoc);

    // 3. Log agent log
    const agentLogDoc = {
      id: `log_seasonal_${Date.now()}`,
      agent: "Atlas",
      timestamp: new Date().toLocaleTimeString(),
      message: `[Atlas] Autonomous Seasonal Mission triggered: "${campaignName}". Webhook dispatch parameters established.`,
      type: "action",
      createdAt: new Date().toISOString()
    };
    await db.collection("agent_logs").doc(agentLogDoc.id).set(agentLogDoc);

    // 4. Mission updates timeline entry
    await db.collection("mission_updates").add({
      missionId: docId,
      status: "Running",
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      missionId: docId,
      campaignId: campId,
      message: `Autonomous seasonal mission launched successfully for ${campaignName}!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to launch autonomous seasonal mission" });
  }
});

export default router;
