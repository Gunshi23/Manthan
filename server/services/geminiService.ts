import { getGeminiApiKey } from "../config/gemini";

// Helper to call Gemini REST API using native fetch
export async function callGeminiAPI(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const activeKey = getGeminiApiKey();
  if (!activeKey || activeKey.trim() === "" || activeKey.startsWith("placeholder")) {
    throw new Error("Gemini API key is not configured on the backend.");
  }

  const model = "gemini-2.5-flash"; // standard stable model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;

  const requestBody: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2000,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.error && errJson.error.message) {
          errorMsg = errJson.error.message;
        }
      } catch (e) {
        // ignore JSON parse errors
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response or unexpected format from Gemini API");
    }

    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Clean markdown JSON formatting if present
export function parseGeminiJson<T>(text: string, fallback: T): T {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      const match = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (match && match[1]) {
        cleaned = match[1].trim();
      }
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn("Failed to parse Gemini JSON:", err);
    return fallback;
  }
}

export async function generateMissionPlan(goal: string, businessType: string = "Fashion & Retail") {
  try {
    const sys = `You are the ORBIT Growth Engine, coordinating 5 AI agents to plan and generate a growth campaign for the business objective.
The agents are:
- Polaris (Audience Intelligence): Chooses one segment from ["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"] and explains findings.
- Luna (Recovery): Audits leakage, specifies recoverableRevenue (number), inactiveCustomers (number), abandonedLeads (number), recoveryConfidence (number), and a detailed recovery explanation.
- Vega (Predictive ROI): Computes predictedRoi (number), predictedRevenue (number), and a detailed forecast explanation.
- Nova (Campaign Creator): Generates copy for Email (subject, body), WhatsApp (body), SMS (body), and RCS (title, body, mediaUrl).
- Atlas (Operations): Chooses one channel from ["Email", "WhatsApp", "SMS", "RCS"] and explains the dispatch routing.

Format your response as a single valid JSON object matching this schema exactly:
{
  "Polaris": {
    "segment": "Loyalists" | "Slipping Away" | "High-Value Inactive" | "New Signups",
    "explanation": "your explanation"
  },
  "Luna": {
    "recoverableRevenue": 12000,
    "inactiveCustomers": 12,
    "abandonedLeads": 15,
    "recoveryConfidence": 92,
    "explanation": "your explanation"
  },
  "Vega": {
    "predictedRoi": 4.2,
    "predictedRevenue": 35000,
    "explanation": "your explanation"
  },
  "Nova": {
    "Email": { "subject": "...", "body": "..." },
    "WhatsApp": { "body": "..." },
    "SMS": { "body": "..." },
    "RCS": { "title": "...", "body": "...", "mediaUrl": "..." }
  },
  "Atlas": {
    "selectedChannel": "Email" | "WhatsApp" | "SMS" | "RCS",
    "explanation": "your explanation"
  },
  "recommendation": {
    "summary": "overall recommendation statement",
    "confidenceScore": 89,
    "estimatedTimeframe": "14 Days"
  }
}
Do not return any markdown code block formatting. Only return the raw JSON object.`;

    const prompt = `Business Objective Goal: "${goal}". Business Category: "${businessType}". Coordinate the campaign plan.`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockMissionPlan(goal));
  } catch (error) {
    console.warn("generateMissionPlan failed, running fallback mock.", error);
    return getMockMissionPlan(goal);
  }
}

export async function runFutureSimulation(audience: string, discount: number, channel: string) {
  try {
    const sys = `You are the ORBIT Predictive Analytics engine. You compute simulated growth marketing timelines based on discount, channel, and target audience.
Format your response as a single valid JSON object matching this schema exactly:
{
  "conservative": {
    "conversionRate": 1.8,
    "revenue": 15000,
    "roi": 1.5,
    "customerFatigue": "Low",
    "optOutRate": 0.4
  },
  "recommended": {
    "conversionRate": 4.5,
    "revenue": 38000,
    "roi": 4.1,
    "customerFatigue": "Medium",
    "optOutRate": 0.9
  },
  "aggressive": {
    "conversionRate": 7.2,
    "revenue": 62000,
    "roi": 3.8,
    "customerFatigue": "High",
    "optOutRate": 2.4
  }
}
Only return the raw JSON object. Do not include markdown code block styling.`;

    const prompt = `Audience: "${audience}", Discount: ${discount}%, Channel: "${channel}". Predict Conservative, Recommended, and Aggressive outcomes.`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockSimulation(audience, discount, channel));
  } catch (error) {
    console.warn("runFutureSimulation failed, running fallback mock.", error);
    return getMockSimulation(audience, discount, channel);
  }
}

export async function generateBoardroomDiscussion(goal: string, missionPlan: any) {
  try {
    const sys = `You are the ORBIT Boardroom facilitator. Generate a structured AI agent courtroom consensus discussion where each agent (Polaris, Luna, Vega, Nova, Atlas) aligns on the mission objective and strategy.
Format your response as a single valid JSON object matching this schema exactly:
{
  "messages": [
    { "agent": "Polaris", "text": "speech text here" },
    { "agent": "Luna", "text": "speech text here" },
    { "agent": "Vega", "text": "speech text here" },
    { "agent": "Nova", "text": "speech text here" },
    { "agent": "Atlas", "text": "speech text here" }
  ]
}
Only return the raw JSON object.`;

    const prompt = `Business Goal: "${goal}". Mission Plan: ${JSON.stringify(missionPlan)}. Generate the boardroom conversation.`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockBoardroomDiscussion(goal, missionPlan));
  } catch (error) {
    console.warn("generateBoardroomDiscussion failed, running fallback mock.", error);
    return getMockBoardroomDiscussion(goal, missionPlan);
  }
}

export async function generateCopilotResponse(message: string, context: { brandDna?: any, campaigns?: any[], opportunities?: any[] }) {
  try {
    const sys = `You are orbit.ai Copilot, a co-founder AI assistant for orbit.ai. Respond to the user's query about their business or campaigns in a concise, professional, growth-focused tone, speaking as their AI co-founder partner.
Suggest a next action step if appropriate, which we can map to a dashboard page in orbit.ai.
Format your response as a valid JSON object matching this schema:
{
  "replyText": "your response speech here...",
  "action": {
    "label": "Next Action Button Label",
    "page": "command-center" | "mission-control" | "customer-galaxy" | "growth-engine" | "future-simulator" | "opportunity-radar" | "competitor-intel" | "agent-boardroom" | "analytics"
  }
}
Note: the "action" field is optional. Only include it if there is a highly relevant dashboard page to navigate to.
Return ONLY the raw JSON object. Do not include markdown tags or extra explanations.`;

    const prompt = `User Query: "${message}"\nContext:\nBrand DNA: ${JSON.stringify(context.brandDna || {})}\nCampaigns History: ${JSON.stringify(context.campaigns || [])}\nOpportunities: ${JSON.stringify(context.opportunities || [])}`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockCopilotResponse(message));
  } catch (error: any) {
    console.warn("generateCopilotResponse failed, running fallback response.", error);
    return getMockCopilotResponse(message);
  }
}

function getMockCopilotResponse(message: string) {
  const lowerQuery = message.toLowerCase();
  let replyText = "Calibrated boardroom registers. I suggest reviewing our upcoming campaigns to optimize expected revenue.";
  let action: any = { label: "Open CommandCenter", page: "command-center" };

  if (lowerQuery.includes("sales") || lowerQuery.includes("increase")) {
    replyText = "Vega: Your primary growth opportunity is to target Slipping VIPs. Our data shows 12 inactive customer accounts with high untapped buying capacity. Standard recovery campaign yields an expected ₹12,000 (91% confidence).";
    action = { label: "Launch Reactivation Campaign", page: "opportunity-radar" };
  } else if (lowerQuery.includes("fail") || lowerQuery.includes("why")) {
    replyText = "Vega: The recent win-back initiatives suffered high cart abandonment on messaging checkout screens. Competitor benchmarks show fashion brands see 23% higher conversions by moving form steps directly inside WhatsApp replies.";
    action = { label: "View Competitor Benchmarks", page: "competitor-intel" };
  } else if (lowerQuery.includes("opportunity") || lowerQuery.includes("biggest")) {
    replyText = "Luna: Growth Radar has detected ₹24,500 in hidden revenue. This includes 17 abandoned checkouts on Instagram DMs and 12 inactive VIP customers. Let's deploy Luna recovery nodes.";
    action = { label: "Open Opportunity Radar", page: "opportunity-radar" };
  } else if (lowerQuery.includes("whatsapp") || lowerQuery.includes("create")) {
    replyText = "Nova: I have pre-drafted an automated WhatsApp creative drop targeting repeat buyers based on your Fashion DNA profile. Let's customize it in the Growth Engine.";
    action = { label: "Go to Growth Engine", page: "growth-engine" };
  } else if (lowerQuery.includes("revenue") || lowerQuery.includes("predict")) {
    replyText = "Vega: Next month's predicted baseline is ₹78,000 (87% confidence). Launching a Diwali collections promotion (14 days away) is projected to add an extra ₹45,000 in revenue.";
    action = { label: "Open Future Simulator", page: "future-simulator" };
  }
  
  return { replyText, action };
}

export async function generateBrandDNA(businessType: string, growthStyle: string) {
  try {
    const sys = `You are the ORBIT Brand Intelligence Engine. You evaluate brand definitions and output critical metrics.
Format your response as a single valid JSON object matching this schema exactly:
{
  "businessType": "string",
  "growthStyle": "string",
  "customerUniverse": 1250,
  "growthPotential": "High" | "Medium" | "Low",
  "orbitHealth": 85,
  "recommendedMissions": ["Mission A", "Mission B", "Mission C"]
}
Only return the raw JSON.`;

    const prompt = `Business Type: "${businessType}", Growth Style: "${growthStyle}". Generate the Brand DNA parameters.`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockBrandDNA(businessType, growthStyle));
  } catch (error) {
    console.warn("generateBrandDNA failed, running fallback mock.", error);
    return getMockBrandDNA(businessType, growthStyle);
  }
}

export async function generateOpportunityRadar(context: any) {
  try {
    const sys = `You are the ORBIT Opportunity Detection Engine. Analyze the customer segments, campaign performance, and analytics metrics to identify high-yield growth opportunities.
Format your response as a single valid JSON object matching this schema exactly:
{
  "totalPotentialRevenue": 45600,
  "highestPriority": "Abandoned Cart Recovery",
  "opportunities": [
    {
      "id": "opp_cart_recovery",
      "title": "Abandoned Cart Recovery",
      "type": "Lead" | "Inactive" | "VIP" | "Prospect",
      "description": "description text",
      "potentialRevenue": 11919,
      "confidence": 91,
      "audienceSize": 17,
      "priorityScore": 95,
      "recommendedAction": "Recover Lost Revenue" | "Reduce Customer Churn" | "Increase Customer LTV" | "Acquire New Customers",
      "reasoning": "detailed reasoning text of why this was found",
      "color": "Green" | "Yellow" | "Red" | "Purple",
      "angle": 45,
      "distance": 65
    }
  ]
}
Only return the raw JSON object. Do not include markdown code block formatting.`;

    const prompt = `Business Context Data: ${JSON.stringify(context)}. Analyze this data to discover and prioritize revenue leaks and growth opportunities.`;
    const res = await callGeminiAPI(prompt, sys);
    return parseGeminiJson(res, getMockOpportunitiesPayload());
  } catch (error) {
    console.warn("generateOpportunityRadar failed, running fallback mock.", error);
    return getMockOpportunitiesPayload();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// High-Fidelity Mock Fallback Generators
// ─────────────────────────────────────────────────────────────────────────────

function getMockMissionPlan(goal: string) {
  let segment = "Loyalists";
  let explPolaris = "Polaris identified 24 repeat customers in your loyal buyer category.";
  if (goal.toLowerCase().includes("churn") || goal.toLowerCase().includes("risk")) {
    segment = "Slipping Away";
    explPolaris = "Polaris detected 18 high-risk accounts showing severe retention drop-offs.";
  } else if (goal.toLowerCase().includes("recover") || goal.toLowerCase().includes("inactive")) {
    segment = "High-Value Inactive";
    explPolaris = "Polaris isolated 14 top-spending accounts who have not ordered in the past 60 days.";
  }

  return {
    Polaris: {
      segment,
      explanation: explPolaris
    },
    Luna: {
      recoverableRevenue: 12500,
      inactiveCustomers: 12,
      abandonedLeads: 8,
      recoveryConfidence: 94,
      explanation: "Luna scanned checkout logs and found slippage in high-ltv billing loops."
    },
    Vega: {
      predictedRoi: 4.8,
      predictedRevenue: 38500,
      explanation: "Vega calculated target reactivation coefficients. Expecting 4.8x ROI yield."
    },
    Nova: {
      Email: {
        subject: `Early Access Pre-sale Launch: Custom Upgrades`,
        body: `Hi {{name}},\n\nGet exclusive priority access to the latest collections at ORBIT.\n\nWarm regards,\nORBIT Operations`
      },
      WhatsApp: {
        body: `👋 Hi *{{name}}*! Get pre-sale access to our top updates. Free shipping today. Reply *YES* to claim.`
      },
      SMS: {
        body: `ORBIT: Hi {{name}}, early access pre-sale is live! Shop now at https://orbit.io`
      },
      RCS: {
        title: "Priority Offer Access",
        body: "Hey {{name}}, get pre-sale access to the new collection. Priority delivery active.",
        mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80"
      }
    },
    Atlas: {
      selectedChannel: "WhatsApp",
      explanation: "Atlas selected WhatsApp as the channel with highest target engagement preference."
    },
    recommendation: {
      summary: "Deploy a high-frequency WhatsApp win-back loop targeting VIP spenders.",
      confidenceScore: 92,
      estimatedTimeframe: "14 Days"
    }
  };
}

function getMockSimulation(audience: string, discount: number, channel: string) {
  const mult = discount / 15.0;
  return {
    conservative: {
      conversionRate: parseFloat((1.5 * mult).toFixed(1)),
      revenue: Math.round(18000 * mult),
      roi: parseFloat((1.8 * mult).toFixed(1)),
      customerFatigue: "Low",
      optOutRate: 0.3
    },
    recommended: {
      conversionRate: parseFloat((4.2 * mult).toFixed(1)),
      revenue: Math.round(39000 * mult),
      roi: parseFloat((4.2 * mult).toFixed(1)),
      customerFatigue: "Medium",
      optOutRate: 0.8
    },
    aggressive: {
      conversionRate: parseFloat((6.8 * mult).toFixed(1)),
      revenue: Math.round(59000 * mult),
      roi: parseFloat((3.6 * mult).toFixed(1)),
      customerFatigue: "High",
      optOutRate: 2.1
    }
  };
}

function getMockBoardroomDiscussion(goal: string, plan: any) {
  const p = plan || getMockMissionPlan(goal);
  return {
    messages: [
      { agent: "Polaris", text: `I have segmented ${p.Polaris?.segment || "Loyalists"} cohort as the ideal targets. ${p.Polaris?.explanation || ""}` },
      { agent: "Luna", text: `I support this focus. ${p.Luna?.explanation || "Detected slippage of recovery nodes."} Est Revenue: ₹${(p.Luna?.recoverableRevenue || 12000).toLocaleString()}` },
      { agent: "Vega", text: `Target ROI looks highly viable. Reactivation forecasts indicate ${p.Vega?.predictedRoi || 4.2}x returns yield. Expected Revenue: ₹${(p.Vega?.predictedRevenue || 35000).toLocaleString()}.` },
      { agent: "Nova", text: `I have compiled responsive marketing assets for ${p.Atlas?.selectedChannel || "WhatsApp"} templates. Personalization handles are armed.` },
      { agent: "Atlas", text: `Gateways verified. Selected channel: ${p.Atlas?.selectedChannel || "WhatsApp"}. Dispatch buffers are ready for deployment.` }
    ]
  };
}

function getMockBrandDNA(businessType: string, growthStyle: string) {
  return {
    businessType,
    growthStyle,
    customerUniverse: 1250,
    growthPotential: "High" as const,
    orbitHealth: 88,
    recommendedMissions: [
      "Recover slipping Q2 buyers",
      "Launch premium checkout drops",
      "Scale VIP LTV thresholds"
    ]
  };
}

function getMockOpportunitiesPayload() {
  return {
    totalPotentialRevenue: 45600,
    highestPriority: "Abandoned Cart Recovery",
    opportunities: [
      {
        id: "opp_cart_recovery",
        title: "Abandoned Cart Recovery",
        type: "Lead",
        description: "17 customer nodes left checkout with items.",
        potentialRevenue: 11919,
        confidence: 91,
        audienceSize: 17,
        priorityScore: 95,
        recommendedAction: "Recover Lost Revenue",
        reasoning: "Luna detected a 34% increase in abandoned checkout events over the last 7 days. Customers who abandoned carts have historically converted at 28% when contacted via WhatsApp within 24 hours.",
        color: "Yellow",
        angle: 45,
        distance: 65
      },
      {
        id: "opp_inactive_winback",
        title: "Inactive Customer Win-back",
        type: "Inactive",
        description: "Re-engage top VIP tier spenders inactive for 60+ days.",
        potentialRevenue: 15400,
        confidence: 88,
        audienceSize: 12,
        priorityScore: 88,
        recommendedAction: "Reduce Customer Churn",
        reasoning: "These high-value accounts have churn risk scores over 75% due to 60+ days of dormancy, representing a total revenue leak of ₹15,400.",
        color: "Purple",
        angle: 160,
        distance: 80
      },
      {
        id: "opp_vip_early_access",
        title: "VIP Early Access Opportunity",
        type: "VIP",
        description: "Reward top active VIP customers with early collection drops.",
        potentialRevenue: 18281,
        confidence: 94,
        audienceSize: 8,
        priorityScore: 92,
        recommendedAction: "Increase Customer LTV",
        reasoning: "Top loyalty tier customers exhibit positive feedback loops when engaged with early product releases, increasing LTV capacity.",
        color: "Green",
        angle: 290,
        distance: 45
      }
    ]
  };
}
