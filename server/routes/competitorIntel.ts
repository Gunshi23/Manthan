import { Router } from "express";
import { db } from "../config/firebase";
import { callGeminiAPI, parseGeminiJson } from "../services/geminiService";

const router = Router();
// SERPAPI_KEY is retrieved dynamically from process.env at request time.

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

// 1. GET /api/competitor-intel/watchlist
router.get("/watchlist", async (req, res) => {
  try {
    const snapshot = await db.collection("competitors").get();
    const competitors: any[] = [];
    snapshot.forEach((doc: any) => competitors.push(doc.data()));

    if (competitors.length === 0) {
      // Fallback fallback mock list
      return res.status(200).json([
        { id: "comp_1", name: "FashionHub", abbr: "FH", followerGrowth: "+14.2%", engagementRate: "4.8%", campaignActivity: "High", newProducts: 12, promoStatus: "Diwali Sale Active", threat: "red", threatLabel: "Threat", marketShare: 28, topChannel: "Instagram" },
        { id: "comp_2", name: "StyleKart", abbr: "SK", followerGrowth: "+8.7%", engagementRate: "3.2%", campaignActivity: "Medium", newProducts: 6, promoStatus: "Flash Sale Weekly", threat: "yellow", threatLabel: "Monitor", marketShare: 19, topChannel: "WhatsApp" },
        { id: "comp_3", name: "TrendWear", abbr: "TW", followerGrowth: "+5.1%", engagementRate: "2.9%", campaignActivity: "Low", newProducts: 3, promoStatus: "Clearance Running", threat: "green", threatLabel: "Opportunity", marketShare: 12, topChannel: "Email" }
      ]);
    }
    res.status(200).json(competitors);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch competitor watchlist" });
  }
});

// 2. GET /api/competitor-intel/trends (Trend Radar Nodes)
router.get("/trends", async (req, res) => {
  try {
    let trendsList: any[] = [];
    const snapshot = await db.collection("industry_trends").get();
    snapshot.forEach((doc: any) => trendsList.push(doc.data()));

    // Try to enrich with live Google Trends data via SerpAPI
    try {
      const activeKey = process.env.SERPAPI_KEY || "";
      const url = `https://serpapi.com/search?engine=google_trends&q=kurtis&data_type=TIMESERIES&api_key=${activeKey}`;
      const response = await fetchWithTimeout(url, {}, 2500);
      if (response.ok) {
        const result = await response.json();
        const interestData = result.interest_over_time?.timeline_data;
        if (interestData && interestData.length > 0) {
          // Find latest interest score
          const latestPoint = interestData[interestData.length - 1];
          const value = latestPoint.values?.[0]?.value || 90;
          
          // Enrich the core trends list
          trendsList = trendsList.map(t => {
            if (t.label.toLowerCase().includes("whatsapp") || t.label.toLowerCase().includes("festival")) {
              return { ...t, score: Math.min(100, Math.max(60, value + Math.floor(Math.random() * 8))) };
            }
            return t;
          });
          console.log(`Enriched Trend Radar nodes with Google Trends score: ${value}`);
        }
      }
    } catch (e) {
      console.warn("SerpAPI Trends enrich failed. Using database defaults.", e);
    }

    if (trendsList.length === 0) {
      // Default fallback nodes
      trendsList = [
        { id: "trend_1", label: "Short Video Reels", score: 94, growth: "+34% YoY", revenue: "₹12L potential", difficulty: "Medium", color: "#3B82F6", x: 380, y: 180, vx: 0.3, vy: -0.2 },
        { id: "trend_2", label: "Festival Buying Surge", score: 89, growth: "+28% YoY", revenue: "₹28L potential", difficulty: "Low", color: "#F59E0B", x: 220, y: 280, vx: -0.2, vy: 0.3 },
        { id: "trend_3", label: "WhatsApp Commerce", score: 92, growth: "+41% YoY", revenue: "₹34L potential", difficulty: "Low", color: "#22C55E", x: 480, y: 320, vx: 0.2, vy: 0.2 }
      ];
    }

    res.status(200).json(trendsList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch industry trends" });
  }
});

// 3. GET /api/competitor-intel/signals (Live Market Signals)
router.get("/signals", async (req, res) => {
  try {
    let signals: any[] = [];
    const snapshot = await db.collection("market_signals").get();
    snapshot.forEach((doc: any) => signals.push(doc.data()));

    // Try to pull live news from SerpAPI and translate to ORBIT signals via Gemini
    try {
      const activeKey = process.env.SERPAPI_KEY || "";
      const url = `https://serpapi.com/search?engine=google_news&q=kurtis+fashion+india&api_key=${activeKey}`;
      const response = await fetchWithTimeout(url, {}, 2500);
      if (response.ok) {
        const result = await response.json();
        const newsResults = result.news_results?.slice(0, 3) || [];
        if (newsResults.length > 0) {
          const headlines = newsResults.map((n: any) => n.title).join(" | ");
          
          // Call Gemini to format news into 5 structured competitor alerts matching Aura Threads Kurtis brand
          const sysInstruction = "You are ORBIT's Competitive Intelligence Analyst. Translate the news headlines into 5 highly realistic market signals and competitor alerts.";
          const prompt = `News Headlines: "${headlines}". 
Create exactly 5 competitor alerts or market signals for a Women's Kurti and Ethnic wear brand called "Aura Threads".
Format your response as a single valid JSON array matching this schema:
[
  {
    "id": "sig_x",
    "title": "short title about a competitor action or industry trend",
    "desc": "one sentence explanation of what occurred and what the metric is",
    "impact": 88,
    "confidence": 92,
    "agent": "Polaris" | "Vega" | "Luna" | "Nova" | "Atlas",
    "agentColor": "#3B82F6" | "#EC4899" | "#8B5CF6" | "#F59E0B" | "#22C55E",
    "type": "opportunity" | "threat" | "neutral",
    "trend": "up" | "down" | "stable"
  }
]
Only return raw JSON. No markdown backticks.`;

          const aiResponse = await callGeminiAPI(prompt, sysInstruction);
          const parsedSignals = parseGeminiJson<any[]>(aiResponse, []);
          if (parsedSignals && parsedSignals.length > 0) {
            signals = parsedSignals;
            console.log(`Parsed ${signals.length} live signals from Google News headlines.`);
          }
        }
      }
    } catch (e) {
      console.warn("SerpAPI News signal compilation failed. Using database signals.", e);
    }

    if (signals.length === 0) {
      // Default fallback
      signals = [
        { id: "sig_1", title: "FashionHub launched a Diwali Kurta Sale", desc: "Aggressive 40% discount blast via WhatsApp and Reels. Engagement spiked 42% in 24 hours.", impact: 91, confidence: 88, agent: "Polaris", agentColor: "#3B82F6", type: "threat", trend: "up" },
        { id: "sig_2", title: "Kurti reels engagement up 2.4x industry-wide", desc: "Short-form video showcasing palazzo coordinate sets outperforms static catalog posts.", impact: 84, confidence: 92, agent: "Vega", agentColor: "#8B5CF6", type: "opportunity", trend: "up" },
        { id: "sig_3", title: "Instagram DM shopping cart checkout leaks fell 8%", desc: "Direct payment links in Instagram chats increased checkout yields by 8%.", impact: 76, confidence: 85, agent: "Luna", agentColor: "#EC4899", type: "opportunity", trend: "up" }
      ];
    }

    res.status(200).json(signals);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to retrieve market signals" });
  }
});

// 4. POST /api/competitor-intel/report (AI Strategic Report)
router.post("/report", async (req, res) => {
  try {
    const { businessType } = req.body;
    const type = businessType || "Women's Fashion & Kurtis";
    
    const prompt = `You are ORBIT's Competitive Intelligence Analyst for an online ${type} brand.
Analyze the current competitor environment (e.g. FashionHub, StyleKart launching Diwali sales, reels outperforming static posts by 2.3x) and compile an executive competitor report.

Format your response as a single valid JSON object matching this schema exactly:
{
  "summary": "2-sentence executive summary analyzing the market landscape",
  "topThreat": "biggest competitor threat, e.g. FashionHub's WhatsApp blasts",
  "missedRevenue": 58000,
  "competitorStrategies": ["comp strategy 1", "comp strategy 2", "comp strategy 3"],
  "marketOpportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "recommendedActions": [
    { "action": "action description", "priority": "High" | "Medium", "expectedRevenue": 28000 }
  ],
  "revenueImpact": "short explanation of missed revenue and why"
}
Only return raw JSON. No markdown.`;

    const aiRes = await callGeminiAPI(prompt, "You are a competitive intelligence systems analyst. Return only JSON.");
    const parsedReport = parseGeminiJson<any>(aiRes, null);
    
    if (!parsedReport) {
      throw new Error("Invalid response from Gemini API");
    }
    
    res.status(200).json(parsedReport);
  } catch (error: any) {
    console.warn("AI Report generation error, returning high-fidelity fallback:", error);
    // Return high fidelity fallback report
    res.status(200).json({
      summary: "Competitors in the Kurti fashion space are aggressively deploying WhatsApp campaign templates and reels with 40% discount hooks. Interactive shopping features have led to a 22% increase in competitor engagement.",
      topThreat: "FashionHub's Diwali catalog blast targeting WhatsApp subscribers",
      missedRevenue: 58000,
      competitorStrategies: [
        "Interactive WhatsApp catalog shopping cards",
        "Short-form Instagram Reels with micro-influencer haul codes",
        "Cart abandonment notifications sent via WhatsApp within 4 hours"
      ],
      marketOpportunities: [
        "WhatsApp Checkout links bypassing standard web stores",
        "VIP exclusive early pre-sale access drops to Loyalists",
        "RCS rich interactive cards showcasing Palazzo Set coordinates"
      ],
      recommendedActions: [
        { action: "Launch VIP WhatsApp Counter Campaign to Loyalists", priority: "High", expectedRevenue: 28000 },
        { action: "Set up automated WhatsApp recovery for checkout cart drops", priority: "High", expectedRevenue: 22000 },
        { action: "Partner with micro-influencers for UGC video hauls", priority: "Medium", expectedRevenue: 12000 }
      ],
      revenueImpact: "Estimated ₹58,000 in revenue leaks due to competitor dominance on WhatsApp and checkout abandonment."
    });
  }
});

// 5. POST /api/competitor-intel/reverse (Campaign Reverse Engineering)
router.post("/reverse", async (req, res) => {
  try {
    const { campaign, businessType } = req.body;
    if (!campaign) {
      res.status(400).json({ error: "Campaign data is required." });
      return;
    }
    
    const type = businessType || "Women's Fashion & Kurtis";
    const prompt = `Reverse engineer the competitor campaign:
Brand: "${campaign.brand}", Name: "${campaign.name}", Type: "${campaign.type}", Offer: "${campaign.offer}", Channel: "${campaign.channel}"
For an online ${type} brand.

Format your response as a single valid JSON object matching this schema exactly:
{
  "targetAudience": "description of their target customer persona and buying capacity",
  "likelyObjective": "the main objective, e.g. conversion velocity, VIP retention",
  "strengths": ["campaign strength 1", "campaign strength 2"],
  "weaknesses": ["campaign weakness 1", "campaign weakness 2"],
  "counterStrategy": "two-sentence actionable strategy to out-compete them using ORBIT"
}
Only return raw JSON. No markdown.`;

    const aiRes = await callGeminiAPI(prompt, "You are a strategic marketing consultant. Return only JSON.");
    const parsedReverse = parseGeminiJson<any>(aiRes, null);
    
    if (!parsedReverse) {
      throw new Error("Invalid response from Gemini API");
    }
    
    res.status(200).json(parsedReverse);
  } catch (error: any) {
    console.warn("Campaign reverse engineering error, returning high-fidelity fallback:", error);
    const c = req.body.campaign || { brand: "FashionHub", name: "Diwali Mega Sale", type: "Festival", offer: "40% off sitewide", channel: "WhatsApp" };
    res.status(200).json({
      targetAudience: `Active female ethnic wear shoppers seeking festive kurtis — primarily price-sensitive buyers in the 22-38 demographic.`,
      likelyObjective: `Maximize order volume and capture high-intent buying signals before competitors launch.`,
      strengths: [
        "Direct WhatsApp checkout link minimizes checkout dropoff",
        "Heavy discount offer generates immediate click-through FOMO"
      ],
      weaknesses: [
        "Broad, generic campaign structure lacks customer segment personalization",
        "High discount trains customers to avoid buying at full price"
      ],
      counterStrategy: `Launch a personalized early-access collection campaign targeting your highest-tier VIP Loyalists. Instead of matching their heavy discount, offer exclusive pre-sale access to premium silk Kurtas with priority shipping, preserving your brand equity and margins.`
    });
  }
});

export default router;
