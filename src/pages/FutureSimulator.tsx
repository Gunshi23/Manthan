import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, Sparkles, Activity, Check, Send, 
  RefreshCw, Play, ArrowRight, Brain
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";

// Types
type AudienceType = "VIP Customers" | "Inactive Customers" | "Repeat Buyers" | "New Customers" | "Custom Segment";
type ChannelType = "WhatsApp" | "Email" | "SMS" | "RCS" | "Multi-channel";
type OfferType = "5%" | "10%" | "15%" | "20%" | "25%" | "Custom";
type CampaignType = "Product Launch" | "Retention" | "Reactivation" | "Upsell" | "Cross-sell" | "Festival Campaign" | "Custom";
type TimePeriodType = "1 Week" | "2 Weeks" | "1 Month" | "3 Months";

interface TimelineData {
  id: "A" | "B" | "C";
  name: string;
  badge: string;
  revenue: number;
  openRate: number;
  conversion: number;
  confidence: number;
  roi: string;
  risk: "Low" | "Medium" | "High";
  colorClass: string;
  borderClass: string;
  bgGlowClass: string;
  textAccentClass: string;
  recs: string[];
}

interface ChatMessage {
  sender: "user" | "Khoj";
  text: string;
  timestamp: string;
  stats?: {
    revenue: number;
    audienceSize: number;
    conversion: number;
    confidence: number;
  };
}

export const FutureSimulator: React.FC = () => {
  const { addAgentLog, config, theme } = useOrbit();
  const isLight = theme === "executive";
  const [selectedAgent, setSelectedAgent] = useState<"Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya" | null>(null);
  
  // Page mode: "variables" (custom inputs) vs "missions" (mission objectives)
  const [simulatorMode, setSimulatorMode] = useState<"variables" | "missions">("variables");
  
  // Custom variables state
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>("Repeat Buyers");
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>("WhatsApp");
  const [selectedOffer, setSelectedOffer] = useState<OfferType>("15%");
  const [customOffer, setCustomOffer] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType>("Upsell");
  const [customCampaignType, setCustomCampaignType] = useState("");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriodType>("1 Month");

  // Mission mode state
  const [selectedMission, setSelectedMission] = useState<string>("Increase Repeat Purchases");

  // Simulation status states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [simSteps, setSimSteps] = useState<{ label: string; agent: string; done: boolean }[]>([
    { label: "Analyzing future outcomes...", agent: "Drishti", done: false },
    { label: "Drishti evaluating audience...", agent: "Drishti", done: false },
    { label: "Khoj generating predictions...", agent: "Khoj", done: false },
    { label: "Rachna simulating engagement...", agent: "Rachna", done: false },
    { label: "Saarthi calculating execution strategy...", agent: "Saarthi", done: false },
  ]);

  // Selected timeline view detail
  const [selectedTimeline, setSelectedTimeline] = useState<"A" | "B" | "C">("B");
  
  // Interactive graph active metric
  const [activeMetric, setActiveMetric] = useState<"revenue" | "customers" | "retention" | "engagement">("revenue");

  // Timelines outcome datasets (will be calculated dynamically)
  const [timelines, setTimelines] = useState<Record<"A" | "B" | "C", TimelineData>>({
    A: {
      id: "A",
      name: "Timeline A",
      badge: "Conservative",
      revenue: 45000,
      openRate: 58,
      conversion: 6,
      confidence: 91,
      roi: "2.8x",
      risk: "Low",
      colorClass: "from-blue-500/15 to-blue-555/5",
      borderClass: "border-blue-550/40 hover:border-blue-450/60 shadow-Manthan-glow-blue",
      bgGlowClass: "rgba(59, 130, 246, 0.08)",
      textAccentClass: "text-blue-400",
      recs: ["Low churn risk", "Guaranteed steady returns", "Best for budget conservation"]
    },
    B: {
      id: "B",
      name: "Timeline B",
      badge: "Recommended (Khoj Optimal)",
      revenue: 78000,
      openRate: 71,
      conversion: 12,
      confidence: 87,
      roi: "4.8x",
      risk: "Low",
      colorClass: "from-green-500/20 to-emerald-500/20 bg-green-500/5",
      borderClass: "border-green-500/40 hover:border-green-400/70 shadow-Manthan-glow-green animate-glow-pulse",
      bgGlowClass: "rgba(34, 197, 94, 0.15)",
      textAccentClass: "text-green-400",
      recs: ["Highest ROI balance", "Optimized audience engagement", "Negligible churn risk bump"]
    },
    C: {
      id: "C",
      name: "Timeline C",
      badge: "Aggressive",
      revenue: 120000,
      openRate: 82,
      conversion: 17,
      confidence: 69,
      roi: "6.2x",
      risk: "High",
      colorClass: "from-purple-500/15 to-violet-500/5 bg-purple-500/5",
      borderClass: "border-purple-500/30 hover:border-purple-400/50 shadow-Manthan-glow-purple",
      bgGlowClass: "rgba(139, 92, 246, 0.08)",
      textAccentClass: "text-purple-400",
      recs: ["Maximum revenue potential", "High fatigue risk", "Requires premium copywriting failovers"]
    }
  });

  // What If Chat Panel states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "Khoj",
      text: "Simulator ready. Query any timeline alteration or audience subset. What happens if we adjust parameters?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Predefined missions configurations
  const missionsList = [
    {
      name: "Increase Repeat Purchases",
      desc: "Drive repeat sales from loyal cohorts using upsell creatives.",
      audience: "Repeat Buyers" as AudienceType,
      channel: "WhatsApp" as ChannelType,
      offer: "10%" as OfferType,
      campaign: "Upsell" as CampaignType,
      time: "2 Weeks" as TimePeriodType
    },
    {
      name: "Recover Slipping High-Value Customers",
      desc: "Re-engage top buyers showing signs of inactivity.",
      audience: "Inactive Customers" as AudienceType,
      channel: "Multi-channel" as ChannelType,
      offer: "20%" as OfferType,
      campaign: "Reactivation" as CampaignType,
      time: "1 Month" as TimePeriodType
    },
    {
      name: "Activate New Signups",
      desc: "Convert first-time registrations into paying customers.",
      audience: "New Customers" as AudienceType,
      channel: "Email" as ChannelType,
      offer: "15%" as OfferType,
      campaign: "Product Launch" as CampaignType,
      time: "1 Week" as TimePeriodType
    },
    {
      name: "Deter Customer Churn",
      desc: "Proactive retention campaign for vulnerable segments.",
      audience: "Inactive Customers" as AudienceType,
      channel: "RCS" as ChannelType,
      offer: "25%" as OfferType,
      campaign: "Retention" as CampaignType,
      time: "1 Month" as TimePeriodType
    }
  ];

  // Auto-fill variables on mission selection
  useEffect(() => {
    if (simulatorMode === "missions") {
      const activeMissionObj = missionsList.find(m => m.name === selectedMission);
      if (activeMissionObj) {
        setSelectedAudience(activeMissionObj.audience);
        setSelectedChannel(activeMissionObj.channel);
        setSelectedOffer(activeMissionObj.offer);
        setSelectedCampaignType(activeMissionObj.campaign);
        setSelectedTimePeriod(activeMissionObj.time);
      }
    }
  }, [selectedMission, simulatorMode]);

  // Scroll chat window to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatTyping]);

  // Run the futuristic simulation chamber sequence
  const executeSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    setHasSimulated(false);
    
    // Reset simulation logging list
    setSimSteps(prev => prev.map(s => ({ ...s, done: false })));

    // Calculate baseline multiplier based on options chosen
    const audSize = selectedAudience === "VIP Customers" ? 24 
                  : selectedAudience === "Inactive Customers" ? 18 
                  : selectedAudience === "Repeat Buyers" ? 32 
                  : selectedAudience === "New Customers" ? 22 
                  : 40;

    const offerValue = selectedOffer === "5%" ? 0.05 
                     : selectedOffer === "10%" ? 0.1 
                     : selectedOffer === "15%" ? 0.15 
                     : selectedOffer === "20%" ? 0.2 
                     : selectedOffer === "25%" ? 0.25 
                     : parseFloat(customOffer) / 100 || 0.15;

    const channelMultiplier = selectedChannel === "WhatsApp" ? 1.4
                            : selectedChannel === "RCS" ? 1.3
                            : selectedChannel === "Multi-channel" ? 1.6
                            : selectedChannel === "Email" ? 1.0
                            : 0.8; // SMS

    const campaignMultiplier = selectedCampaignType === "Festival Campaign" ? 1.5
                             : selectedCampaignType === "Upsell" ? 1.2
                             : selectedCampaignType === "Reactivation" ? 0.95
                             : 1.1;

    // Time scaling (months)
    const timeScale = selectedTimePeriod === "1 Week" ? 0.25
                    : selectedTimePeriod === "2 Weeks" ? 0.5
                    : selectedTimePeriod === "1 Month" ? 1.0
                    : 3.0; // 3 months

    // Base conversion rate
    const baseConvB = 12 * channelMultiplier * (1 + offerValue) * campaignMultiplier;
    const baseRevB = audSize * 1500 * (baseConvB / 100) * channelMultiplier * (1 - offerValue * 0.5) * timeScale * 12;

    const revB = Math.round(baseRevB);
    const revA = Math.round(baseRevB * 0.58);
    const revC = Math.round(baseRevB * 1.55);

    const convB = Math.min(30, Math.round(baseConvB));
    const convA = Math.min(15, Math.round(baseConvB * 0.5));
    const convC = Math.min(45, Math.round(baseConvB * 1.4));

    const openB = Math.min(95, Math.round(65 * channelMultiplier));
    const openA = Math.min(85, Math.round(openB * 0.85));
    const openC = Math.min(100, Math.round(openB * 1.15));

    const confA = Math.round(90 + Math.random() * 5);
    const confB = Math.round(82 + Math.random() * 6);
    const confC = Math.round(55 + Math.random() * 15);

    const roiMultiplier = (val: number) => {
      const parsedVal = val / (audSize * 120);
      return Math.max(1.5, parsedVal).toFixed(1) + "x";
    };

    // Calculate dynamic timelines
    const newTimelines: Record<"A" | "B" | "C", TimelineData> = {
      A: {
        id: "A",
        name: "Timeline A",
        badge: "Conservative Scenario",
        revenue: revA,
        openRate: openA,
        conversion: convA,
        confidence: confA,
        roi: roiMultiplier(revA),
        risk: "Low",
        colorClass: "from-blue-500/15 to-blue-555/5",
        borderClass: "border-blue-550/40 hover:border-blue-450/60 shadow-Manthan-glow-blue",
        bgGlowClass: "rgba(59, 130, 246, 0.08)",
        textAccentClass: "text-blue-400",
        recs: [
          "Zero customer fatigue risk.",
          "High baseline stability under market fluctuations.",
          `Saves approximately ₹${Math.round(audSize * 50)} in campaign dispatch credits.`
        ]
      },
      B: {
        id: "B",
        name: "Timeline B",
        badge: "Recommended (Optimal)",
        revenue: revB,
        openRate: openB,
        conversion: convB,
        confidence: confB,
        roi: roiMultiplier(revB),
        risk: selectedChannel === "WhatsApp" && timeScale > 1 ? "Medium" : "Low",
        colorClass: "from-green-500/20 to-emerald-500/20 bg-green-500/5",
        borderClass: "border-green-500/40 hover:border-green-400/70 shadow-Manthan-glow-green animate-glow-pulse",
        bgGlowClass: "rgba(34, 197, 94, 0.15)",
        textAccentClass: "text-green-400",
        recs: [
          "Khoj identified: Optimal balance of conversion yields versus opt-out rates.",
          `High performance channel allocation using ${selectedChannel} nodes.`,
          "Perfect execution window aligned with cohort session parameters."
        ]
      },
      C: {
        id: "C",
        name: "Timeline C",
        badge: "Aggressive Expansion",
        revenue: revC,
        openRate: openC,
        conversion: convC,
        confidence: confC,
        roi: roiMultiplier(revC),
        risk: "High",
        colorClass: "from-purple-500/15 to-violet-500/5 bg-purple-500/5",
        borderClass: "border-purple-500/30 hover:border-purple-400/50 shadow-Manthan-glow-purple",
        bgGlowClass: "rgba(139, 92, 246, 0.08)",
        textAccentClass: "text-purple-400",
        recs: [
          "Risk of high opt-out rates (estimated 12-18% cohort friction).",
          "Accelerated purchase cycles may trigger customer fatigue.",
          "Requires strict visual card personalization loops to succeed."
        ]
      }
    };

    // Sequential timing simulation loading steps
    const stepDuration = 1200;
    
    // Add first telemetry start log
    addAgentLog("System", `Calibrating simulation timelines for cohort [${selectedAudience}] ...`, "thought");

    // Start simulation steps
    const timer = setInterval(() => {
      setSimulationStep(prev => {
        const next = prev + 1;
        
        // Log telemetry messages
        if (next === 1) {
          addAgentLog("Drishti", `Evaluating database index. Mapped cohort size: ${audSize} customer profiles. Channel nodes: ${selectedChannel}.`, "action");
        } else if (next === 2) {
          addAgentLog("Khoj", `Loading neural network predictive weights. Formulating ROI yield equations for ${selectedCampaignType} campaign.`, "thought");
        } else if (next === 3) {
          addAgentLog("Rachna", `Simulating customer conversion reactions to ${selectedOffer} offer templates. Testing click probabilities.`, "action");
        } else if (next === 4) {
          addAgentLog("Saarthi", "Compiling timeline paths. Calibrating margin drift and unsubscribes. Finalizing telemetry matrices.", "thought");
        }

        // Update step completions
        setSimSteps(steps => steps.map((s, idx) => ({
          ...s,
          done: idx < next
        })));

        if (next >= simSteps.length) {
          clearInterval(timer);
          setTimeout(() => {
            setIsSimulating(false);
            setTimelines(newTimelines);
            setHasSimulated(true);
            addAgentLog("Khoj", `Simulations consolidated. Timeline B recommended (Confidence: ${confB}%, Predicted Revenue: ₹${revB.toLocaleString()}).`, "result");
          }, 600);
          return prev;
        }
        return next;
      });
    }, stepDuration);
  };

  // Handle What If Chat queries
  const handleWhatIfSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = customQuery || chatInput;
    if (!queryText.trim() || isChatTyping) return;

    // Add user message to chat
    const userMsg: ChatMessage = {
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatTyping(true);

    let geminiResponse: any = null;

    if (config.geminiKey) {
      try {
        const systemPrompt = `You are Khoj, the AI Predictive Analytics Agent for Manthan.ai. The user has set up their business (category: "${selectedAudience}").
They are querying a growth timeline mutation or what-if scenario in the Future Simulator: "${queryText}".
Formulate your response as a valid JSON object matching this schema exactly:
{
  "replyText": "your detailed predictive analysis response speech here...",
  "stats": {
    "revenue": number (estimated yield, e.g. 24000),
    "audienceSize": number (affected audience size, e.g. 50),
    "conversion": number (estimated conversion rate in %, e.g. 15),
    "confidence": number (confidence level in %, e.g. 88)
  }
}
Return ONLY the raw JSON object. Do not write markdown tags or extra explanations.`;

        const userPrompt = `Query: "${queryText}"
Context Audience: "${selectedAudience}"
Context Channel: "${selectedChannel}"
Context Offer: "${selectedOffer}"
Context Campaign Strategy: "${selectedCampaignType}"`;

        const resText = await callGeminiAPI(userPrompt, systemPrompt, config.geminiKey);
        geminiResponse = parseGeminiJson(resText, null);
      } catch (err) {
        console.warn("Future Simulator Khoj Chat query failed:", err);
      }
    }

    if (geminiResponse) {
      const vegaMsg: ChatMessage = {
        sender: "Khoj",
        text: geminiResponse.replyText || "Khoj recalibrated simulation parameters.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stats: geminiResponse.stats
      };
      setChatHistory(prev => [...prev, vegaMsg]);
      setIsChatTyping(false);
      addAgentLog("Khoj", `What-if scenario query resolved: ${queryText}`, "thought");
    } else {
      // Process simulation output based on text query content
      setTimeout(() => {
        let revenue = 48000;
        let audienceSize = 84;
        let conversion = 14;
        let confidence = 89;
        let replyText = "";

        const lowerQuery = queryText.toLowerCase();

        if (lowerQuery.includes("vip")) {
          audienceSize = 24;
          conversion = 21;
          revenue = Math.round(audienceSize * 2500 * (conversion / 100));
          confidence = 92;
          replyText = "Targeting only VIP customers reduces campaign volume but maximizes conversion velocity. Churn risk decreases to near zero due to high brand loyalty. Khoj recommends Email or RCS cards to protect premium branding.";
        } else if (lowerQuery.includes("whatsapp") || lowerQuery.includes("whats app")) {
          audienceSize = 65;
          conversion = 16;
          revenue = Math.round(audienceSize * 1400 * (conversion / 100));
          confidence = 88;
          replyText = "Transitioning campaigns to WhatsApp nodes increases open rates by 35% compared to Email. Conversational replies can act as direct checkout gateways. Warning: excessive frequency will cause opt-out spikes.";
        } else if (lowerQuery.includes("diwali") || lowerQuery.includes("festival") || lowerQuery.includes("holiday")) {
          audienceSize = 80;
          conversion = 19;
          revenue = Math.round(audienceSize * 2200 * (conversion / 100));
          confidence = 83;
          replyText = "Launching during a major holiday/festival boosts consumer intent by 2x. Competition in advertising nodes is high. Khoj recommends a multi-channel failover plan starting 3 days early with high-incentive VIP drops.";
        } else if (lowerQuery.includes("discount") || lowerQuery.includes("offer") || lowerQuery.includes("20%") || lowerQuery.includes("25%")) {
          audienceSize = 80;
          conversion = 18;
          revenue = Math.round(audienceSize * 1500 * 0.8 * (conversion / 100));
          confidence = 86;
          replyText = "Increasing the discount from 10% to 20%+ triggers a conversion spike of 1.5x. However, product margin collapses by 22%. Khoj suggests limiting high discounts to Slipping Away VIPs rather than New Signups.";
        } else if (lowerQuery.includes("inactive") || lowerQuery.includes("dormant")) {
          audienceSize = 18;
          conversion = 9;
          revenue = Math.round(audienceSize * 1800 * (conversion / 100));
          confidence = 79;
          replyText = "Targeting inactive customer nodes requires a Reactivation creative template. Expected open rate is lower (32%), but converting even 1-2 accounts restores substantial Lifetime Value (LTV).";
        } else if (lowerQuery.includes("frequency") || lowerQuery.includes("twice") || lowerQuery.includes("every day")) {
          audienceSize = 80;
          conversion = 14;
          revenue = Math.round(audienceSize * 1600 * 1.35 * (conversion / 100));
          confidence = 61;
          replyText = "Increasing campaign frequency drives short-term clicks but triggers aggressive churn warnings. Long-term projection shows a 24% customer decay rate over 90 days. Not recommended unless utilizing high-value VIP channels.";
        } else {
          // Fallback generic analysis
          audienceSize = 54;
          conversion = 11;
          revenue = Math.round(audienceSize * 1600 * (conversion / 100));
          confidence = 85;
          replyText = "Khoj recalculated simulation parameters. Running this custom query creates a mid-tier performance pathway. ROI yield remains stable at 3.4x with minimal channel resistance.";
        }

        const vegaMsg: ChatMessage = {
          sender: "Khoj",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stats: {
            revenue,
            audienceSize,
            conversion,
            confidence
          }
        };

        setChatHistory(prev => [...prev, vegaMsg]);
        setIsChatTyping(false);
        addAgentLog("Khoj", `What-if scenario query resolved: ${queryText}`, "thought");
      }, 1800);
    }
  };

  // Mock Graph Data points coordinates for SVG drawing
  // Coordinates are generated dynamically for selected timeline and selected metric
  const getGraphCoordinates = () => {
    const steps = 6;
    const paddingX = 40;
    const paddingY = 30;
    const height = 180;
    const width = 450;
    
    // Scale factors
    let valA = 0, valB = 0, valC = 0;
    if (activeMetric === "revenue") {
      valA = timelines.A.revenue;
      valB = timelines.B.revenue;
      valC = timelines.C.revenue;
    } else if (activeMetric === "customers") {
      valA = timelines.A.conversion * 3;
      valB = timelines.B.conversion * 3;
      valC = timelines.C.conversion * 3;
    } else if (activeMetric === "retention") {
      valA = 96; // Conservative has excellent retention
      valB = 89; // Recommended has good retention
      valC = 71; // Aggressive has bad retention
    } else {
      valA = timelines.A.openRate;
      valB = timelines.B.openRate;
      valC = timelines.C.openRate;
    }

    const getMaxVal = () => Math.max(valA, valB, valC, 10);
    const maxVal = getMaxVal();

    const generatePoints = (targetVal: number, type: "linear" | "exponential" | "decay" | "retention") => {
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < steps; i++) {
        const x = paddingX + (i / (steps - 1)) * (width - paddingX * 2);
        let pct = 0;
        
        if (type === "linear") {
          pct = (i / (steps - 1));
        } else if (type === "exponential") {
          pct = Math.pow(i / (steps - 1), 1.8);
        } else if (type === "decay") {
          pct = 1 - Math.exp(-i * 1.5);
        } else if (type === "retention") {
          // starts high, decreases slightly
          pct = 1 - (i / (steps - 1)) * (1 - targetVal / 100);
        }

        const value = type === "retention" ? 100 * pct : targetVal * pct;
        // SVG y is 0 at top, so flip it
        const y = height - paddingY - (value / (type === "retention" ? 100 : maxVal)) * (height - paddingY * 2);
        points.push({ x, y });
      }
      return points;
    };

    let curveType: "linear" | "exponential" | "decay" | "retention" = "exponential";
    if (activeMetric === "retention") curveType = "retention";
    else if (activeMetric === "engagement") curveType = "decay";
    else if (activeMetric === "customers") curveType = "linear";

    const pathA = generatePoints(valA, curveType);
    const pathB = generatePoints(valB, curveType);
    const pathC = generatePoints(valC, curveType);

    const formatSvgPath = (pts: { x: number; y: number }[]) => {
      return pts.reduce((acc, p, idx) => {
        if (idx === 0) return `M ${p.x} ${p.y}`;
        // Draw standard cubic bezier curves for premium smooth look
        const prev = pts[idx - 1];
        const cp1x = prev.x + (p.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (p.x - prev.x) / 2;
        const cp2y = p.y;
        return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
      }, "");
    };

    return {
      pointsA: pathA,
      pointsB: pathB,
      pointsC: pathC,
      pathA: formatSvgPath(pathA),
      pathB: formatSvgPath(pathB),
      pathC: formatSvgPath(pathC),
      width,
      height,
      paddingX,
      paddingY,
      maxVal
    };
  };

  const graphData = getGraphCoordinates();

  // Selected timeline details for the Recommendations Panel
  const focusTimeline = timelines[selectedTimeline];

  return (
    <div className={`flex-1 flex overflow-hidden relative font-inter ${isLight ? "bg-[#F8FAFC] text-[#0F172A]" : "bg-[#050816] text-white"}`}>
      {/* Visual background elements */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-Manthan-glow-blue opacity-10 z-0" />
      <div className="scanlines" />

      {/* ════════════════════════════════════════
          LEFT COLUMN — SIMULATION CONFIG PANEL
      ════════════════════════════════════════ */}
      <aside className={`w-72 lg:w-80 shrink-0 flex flex-col border-r backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10 ${isLight ? "border-[#E2E8F0] bg-white" : "border-gray-900 bg-gray-950/45"}`}>
        
        {/* Module Header */}
        <div className={`border-b pb-3 mb-2 flex items-center gap-2 ${isLight ? "border-[#E2E8F0]" : "border-gray-900"}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-Manthan-blue/30 to-Manthan-purple/30 border border-Manthan-purple/40 flex items-center justify-center">
            <Cpu className="text-Manthan-purple animate-pulse" size={16} />
          </div>
          <div>
            <h2 className={`font-space text-sm font-bold uppercase tracking-wider leading-none ${isLight ? "text-[#0F172A]" : "text-white"}`}>Simulation Chamber</h2>
            <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest mt-1 block">Calibrate parameters</span>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl font-mono text-[9px] font-bold border ${isLight ? "bg-slate-100 border-[#E2E8F0]" : "bg-gray-950 border-gray-900"}`}>
          <button
            onClick={() => setSimulatorMode("variables")}
            className={`py-2 rounded-lg cursor-pointer transition-all ${
              simulatorMode === "variables" ? (isLight ? "bg-white text-blue-600 border-[#BFDBFE] shadow-sm font-bold" : "bg-gray-900 text-white border-gray-800 shadow") : (isLight ? "border-transparent text-gray-500 hover:text-gray-950" : "border-transparent text-gray-500 hover:text-gray-300")
            }`}
          >
            Custom Variables
          </button>
          <button
            onClick={() => setSimulatorMode("missions")}
            className={`py-2 rounded-lg cursor-pointer transition-all ${
              simulatorMode === "missions" ? (isLight ? "bg-white text-blue-600 border-[#BFDBFE] shadow-sm font-bold" : "bg-gray-900 text-white border-gray-800 shadow") : (isLight ? "border-transparent text-gray-500 hover:text-gray-950" : "border-transparent text-gray-500 hover:text-gray-300")
            }`}
          >
            Mission Simulator
          </button>
        </div>

        {/* Dynamic Panel Input Fields */}
        {simulatorMode === "missions" ? (
          /* Mission Selector Option List */
          <div className="Manthan-panel p-4 space-y-3">
            <label className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Select Target Mission</label>
            <div className="space-y-2">
              {missionsList.map((m, idx) => {
                const isSelected = selectedMission === m.name;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedMission(m.name)}
                    className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? "border-Manthan-purple/55 bg-Manthan-purple/5 text-white" 
                        : "border-gray-900 bg-transparent text-gray-400 hover:border-gray-800 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-space font-bold text-xs">{m.name}</span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-Manthan-purple shadow-Manthan-glow-purple" />}
                    </div>
                    <p className="font-mono text-[8px] text-gray-550 leading-relaxed mt-1">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Custom Variables Modifiers */
          <div className="space-y-3.5">
            {/* Variable: Audience */}
            <div className="Manthan-panel p-3.5 space-y-2">
              <label className="font-mono text-[8px] text-gray-500 uppercase tracking-wider block">Target Audience</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["VIP Customers", "Inactive Customers", "Repeat Buyers", "New Customers"] as AudienceType[]).map(aud => (
                  <button
                    key={aud}
                    onClick={() => setSelectedAudience(aud)}
                    className={`py-1.5 px-2 rounded-lg border font-mono text-[9px] truncate text-center cursor-pointer transition-all ${
                      selectedAudience === aud 
                        ? "border-Manthan-blue/50 bg-Manthan-blue/10 text-white" 
                        : "border-gray-900 text-gray-500 hover:border-gray-800"
                    }`}
                  >
                    {aud.replace(" Customers", "")}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedAudience("Custom Segment")}
                className={`w-full py-1.5 px-2 rounded-lg border font-mono text-[9px] text-center cursor-pointer transition-all ${
                  selectedAudience === "Custom Segment" 
                    ? "border-Manthan-blue/50 bg-Manthan-blue/10 text-white" 
                    : "border-gray-900 text-gray-500 hover:border-gray-800"
                }`}
              >
                Custom Cohort Segment
              </button>
            </div>

            {/* Variable: Channel */}
            <div className="Manthan-panel p-3.5 space-y-2">
              <label className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Communication Channel</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["WhatsApp", "Email", "SMS", "RCS"] as ChannelType[]).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChannel(ch)}
                    className={`py-1.5 px-2 rounded-lg border font-mono text-[9px] text-center cursor-pointer transition-all ${
                      selectedChannel === ch 
                        ? "border-Manthan-purple/50 bg-Manthan-purple/10 text-white" 
                        : "border-gray-900 text-gray-500 hover:border-gray-800"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedChannel("Multi-channel")}
                className={`w-full py-1.5 px-2 rounded-lg border font-mono text-[9px] text-center cursor-pointer transition-all ${
                  selectedChannel === "Multi-channel" 
                    ? "border-Manthan-purple/50 bg-Manthan-purple/10 text-white" 
                    : "border-gray-900 text-gray-500 hover:border-gray-800"
                }`}
              >
                Multi-channel Sync Loop
              </button>
            </div>

            {/* Variable: Offer */}
            <div className="Manthan-panel p-3.5 space-y-2">
              <label className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Incentive Offer Value</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["5%", "10%", "15%", "20%", "25%"] as OfferType[]).map(off => (
                  <button
                    key={off}
                    onClick={() => setSelectedOffer(off)}
                    className={`py-1.5 px-1 rounded-lg border font-mono text-[9px] text-center cursor-pointer transition-all ${
                      selectedOffer === off && selectedOffer !== "Custom"
                        ? "border-Manthan-success/50 bg-Manthan-success/10 text-white" 
                        : "border-gray-900 text-gray-500 hover:border-gray-800"
                    }`}
                  >
                    {off}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedOffer("Custom")}
                  className={`py-1.5 px-1 rounded-lg border font-mono text-[9px] text-center cursor-pointer transition-all ${
                    selectedOffer === "Custom" 
                      ? "border-Manthan-success/50 bg-Manthan-success/10 text-white" 
                      : "border-gray-900 text-gray-500 hover:border-gray-800"
                  }`}
                >
                  Custom
                </button>
              </div>

              {selectedOffer === "Custom" && (
                <input
                  type="text"
                  placeholder="e.g. 30% or BOGO"
                  value={customOffer}
                  onChange={e => setCustomOffer(e.target.value)}
                  className="w-full mt-2 bg-gray-950 border border-gray-900 rounded-lg p-2 font-mono text-[9px] text-white focus:outline-none focus:border-Manthan-success/40"
                />
              )}
            </div>

            {/* Variable: Campaign Type */}
            <div className="Manthan-panel p-3.5 space-y-2">
              <label className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Campaign Strategy Type</label>
              <select
                value={selectedCampaignType}
                onChange={e => setSelectedCampaignType(e.target.value as CampaignType)}
                className="w-full bg-gray-950 border border-gray-900 rounded-lg p-2 font-mono text-[10px] text-white focus:outline-none focus:border-Manthan-blue/40"
              >
                <option value="Product Launch">Product Launch</option>
                <option value="Retention">Retention</option>
                <option value="Reactivation">Reactivation</option>
                <option value="Upsell">Upsell</option>
                <option value="Cross-sell">Cross-sell</option>
                <option value="Festival Campaign">Festival Campaign</option>
                <option value="Custom">Custom...</option>
              </select>

              {selectedCampaignType === "Custom" && (
                <input
                  type="text"
                  placeholder="Strategy name"
                  value={customCampaignType}
                  onChange={e => setCustomCampaignType(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-900 rounded-lg p-2 font-mono text-[9px] text-white focus:outline-none focus:border-Manthan-blue/40"
                />
              )}
            </div>

            {/* Variable: Time Period */}
            <div className="Manthan-panel p-3.5 space-y-2">
              <label className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Simulation Time Frame</label>
              <div className="grid grid-cols-4 gap-1">
                {(["1 Week", "2 Weeks", "1 Month", "3 Months"] as TimePeriodType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTimePeriod(t)}
                    className={`py-1 px-0.5 rounded-lg border font-mono text-[8px] text-center cursor-pointer transition-all ${
                      selectedTimePeriod === t 
                        ? "border-yellow-500/50 bg-yellow-500/10 text-white" 
                        : "border-gray-900 text-gray-650 hover:border-gray-800"
                    }`}
                  >
                    {t.replace(" Weeks", "W").replace(" Week", "W").replace(" Months", "M").replace(" Month", "M")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Simulate Action Button */}
        <button
          onClick={executeSimulation}
          disabled={isSimulating}
          className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isSimulating 
              ? "bg-gray-900 text-gray-550 border border-gray-850 cursor-not-allowed" 
              : "bg-gradient-to-r from-Manthan-blue via-Manthan-purple to-Manthan-blue text-white shadow-Manthan-glow hover:opacity-90 hover:scale-[1.01] active:scale-95 duration-200"
          }`}
        >
          {isSimulating ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
          {isSimulating ? "Recalculating Timelines..." : "Run Simulation"}
        </button>

        {/* Telemetry info */}
        <div className="mt-auto pt-4 border-t border-gray-900 flex justify-between font-mono text-[8px] text-gray-600">
          <span>COHORT REGISTER: ACTIVE</span>
          <span>SPEED: HYPER V</span>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          RIGHT AREA — FUTURISTIC SIMULATION CHAMBER
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Header */}
        <div className="shrink-0 px-6 pt-4 bg-gray-950/20">
          <PageHeaderHUD
            title="Future Simulator"
            subtitle="PREDICT GROWTH BEFORE YOU LAUNCH · POWERED BY Khoj ENGINE"
            onSelectAgent={setSelectedAgent}
            actions={
              <div className="flex items-center gap-2 font-mono text-[9px] px-3 py-1.5 bg-gray-950 rounded-lg border border-gray-900 text-gray-500">
                <Activity size={10} className="text-Manthan-success animate-pulse" />
                <span>Telemetry Mode: Consolidated</span>
              </div>
            }
          />
        </div>

        {/* Page Main Content Switcher */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-6 space-y-6">

          {!hasSimulated && !isSimulating ? (
            /* ════════════════════════════════════════
                EMPTY STATE — HOLOGRAPHIC PLANET
            ════════════════════════════════════════ */
            <div className="flex-1 flex flex-col items-center justify-center py-10 relative">
              <div className="absolute inset-0 bg-Manthan-glow-blue opacity-5 pointer-events-none" />
              
              {/* Rotating holographic planet visual */}
              <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                {/* Outer concentric scanning circles */}
                <div className="absolute inset-0 rounded-full border border-Manthan-blue/10 animate-Manthan-spin-slow" />
                <div className="absolute inset-4 rounded-full border border-dashed border-Manthan-purple/20 animate-Manthan-spin-reverse" />
                <div className="absolute inset-10 rounded-full border border-double border-Manthan-success/15 animate-Manthan-spin-slow" />
                
                {/* Scanning sweep radar lines */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-Manthan-blue/5 to-transparent animate-radar-sweep pointer-events-none" />

                {/* Concentric grid lines and planet structure */}
                <div className="absolute inset-16 rounded-full border border-Manthan-blue/30 bg-[#070b20]/60 flex items-center justify-center shadow-Manthan-glow">
                  <Brain size={36} className="text-Manthan-blue animate-pulse" />
                </div>

                {/* SVG Branching Timeline vectors radiating from center */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10" viewBox="0 0 256 256">
                  {/* Branch A (Conservative) */}
                  <g className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <path d="M 128 128 Q 70 110, 45 65" fill="none" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="45" cy="65" r="4" fill="#3B82F6" className="animate-pulse" />
                    <text x="20" y="55" fill="#3B82F6" className="font-mono text-[7px] font-bold">TIMELINE A: CONS</text>
                  </g>

                  {/* Branch B (Recommended) */}
                  <g className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                    <path d="M 128 128 Q 130 60, 155 35" fill="none" stroke="#8B5CF6" strokeWidth="1.5" />
                    <circle cx="155" cy="35" r="5" fill="#8B5CF6" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <circle cx="155" cy="35" r="4" fill="#8B5CF6" />
                    <text x="165" y="32" fill="#8B5CF6" className="font-space text-[8px] font-bold">TIMELINE B: OPTIMAL</text>
                  </g>

                  {/* Branch C (Aggressive) */}
                  <g className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                    <path d="M 128 128 Q 195 140, 215 105" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="215" cy="105" r="4" fill="#EF4444" className="animate-pulse" />
                    <text x="180" y="125" fill="#EF4444" className="font-mono text-[7px] font-bold">TIMELINE C: AGGR</text>
                  </g>
                </svg>

                {/* Pulsing coordinate tag labels */}
                <div className="absolute top-2 left-6 font-mono text-[7px] text-gray-550 border border-gray-900 px-1 py-0.5 rounded">R: 0.893x</div>
                <div className="absolute bottom-4 right-10 font-mono text-[7px] text-gray-550 border border-gray-900 px-1 py-0.5 rounded">T-VEC: CONF</div>
              </div>

              {/* Header Text */}
              <div className="text-center max-w-md px-4 space-y-3">
                <h2 className="font-space text-2xl font-bold text-white tracking-tight uppercase">Explore Possible Futures</h2>
                <p className="text-sm text-gray-400 font-inter">
                  Run AI-powered growth simulations before launching campaigns. Predict customer behaviors, LTV expansions, and ROI curves across channels.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 bg-Manthan-blue/10 border border-Manthan-blue/20 text-Manthan-blue font-mono text-[9px] uppercase tracking-wider rounded-full">
                    The Future Has Not Been Simulated Yet
                  </span>
                </div>
              </div>
            </div>
          ) : isSimulating ? (
            /* ════════════════════════════════════════
                AI PREDICTION ENGINE LOADER VIEW
            ════════════════════════════════════════ */
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="relative w-40 h-40 mb-10">
                {/* Spinning scanner rings */}
                <div className="absolute inset-0 rounded-full border-2 border-t-Manthan-purple border-r-transparent border-b-Manthan-blue border-l-transparent animate-spin" style={{ animationDuration: '2s' }} />
                <div className="absolute inset-3 rounded-full border border-dashed border-Manthan-blue/30 animate-spin-slow" />
                <div className="absolute inset-6 rounded-full border border-dotted border-Manthan-success/40 animate-Manthan-spin-reverse" />
                
                {/* Digital reading indicators */}
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-[10px] text-gray-500 uppercase">Simulating</span>
                  <span className="text-xl font-bold text-white tracking-wider animate-pulse">{Math.round((simulationStep / simSteps.length) * 100)}%</span>
                  <span className="text-[7px] text-Manthan-purple font-bold tracking-widest mt-1">Khoj ACTV</span>
                </div>
              </div>

              {/* Progress logger telemetry rows */}
              <div className="w-full max-w-md bg-black/40 border border-gray-900 rounded-xl p-4 font-mono text-[10px] space-y-2">
                {simSteps.map((step, idx) => {
                  const isActive = simulationStep === idx;
                  const isDone = step.done;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between py-1 transition-all ${
                        isActive ? "text-white opacity-100" : isDone ? "text-Manthan-success opacity-85" : "text-gray-650 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-Manthan-success/15 flex items-center justify-center border border-Manthan-success/40">
                            <Check size={8} className="text-Manthan-success" />
                          </div>
                        ) : isActive ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-Manthan-purple/40 border-t-Manthan-purple animate-spin" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-900" />
                        )}
                        <span className={isActive ? "font-bold text-Manthan-purple" : ""}>{step.label}</span>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase ${
                        step.agent === "Drishti" ? "border-Manthan-blue/20 bg-Manthan-blue/5 text-Manthan-blue" :
                        step.agent === "Khoj" ? "border-Manthan-purple/20 bg-Manthan-purple/5 text-Manthan-purple" :
                        step.agent === "Rachna" ? "border-pink-500/20 bg-pink-500/5 text-pink-400" :
                        "border-Manthan-success/20 bg-Manthan-success/5 text-Manthan-success"
                      }`}>
                        {step.agent}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ════════════════════════════════════════
                CHAMBER RESULTS — SIMULATION GENERATED
            ════════════════════════════════════════ */
            <>
              {/* TOP: Future Timeline View */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-Manthan-purple" />
                    Simulated Timeline Matrix
                  </h3>
                  <span className="font-mono text-[8px] text-gray-550 uppercase">Select card to focus metrics</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.values(timelines) as TimelineData[]).map((t) => {
                    const isSelected = selectedTimeline === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTimeline(t.id)}
                        className={`Manthan-panel text-left p-4 relative overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[160px] ${isLight ? "border-[#E2E8F0]" : "border-gray-800"} ${
                          isSelected 
                            ? `border-opacity-100 ${t.borderClass} ring-1 ring-white/5 bg-gray-900/40` 
                            : "opacity-65 hover:opacity-95 hover:border-gray-700 bg-gray-950/20"
                        }`}
                      >
                        {/* Selected overlay glow background */}
                        {isSelected && (
                          <div 
                            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none filter blur-2xl" 
                            style={{ background: t.bgGlowClass }}
                          />
                        )}

                        <div className="space-y-3.5">
                          {/* Header badge details */}
                          <div className="flex items-center justify-between">
                            <span className="font-space text-xs font-bold text-white uppercase tracking-tight">{t.name}</span>
                            <span className={`font-mono text-[8.5px] font-bold px-2 py-0.5 rounded border uppercase ${
                              t.id === "A" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                              t.id === "B" ? "border-green-500/30 bg-green-500/10 text-green-400" :
                              "border-purple-500/30 bg-purple-500/10 text-purple-400"
                            }`}>
                              {t.badge}
                            </span>
                          </div>

                          {/* Primary Revenue display */}
                          <div>
                            <span className="font-mono text-[8px] text-gray-550 uppercase block">Expected Revenue</span>
                            <span className={`font-space text-2xl font-bold ${t.textAccentClass}`}>₹{t.revenue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Telemetry bottom row details */}
                        <div className="grid grid-cols-3 gap-1.5 pt-4 border-t border-gray-900/60 mt-4 font-mono text-[9px] text-gray-500">
                          <div>
                            <span className="block text-[8px] text-gray-650 uppercase">Open Rate</span>
                            <span className="text-white font-bold">{t.openRate}%</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-gray-650 uppercase">Conversion</span>
                            <span className="text-white font-bold">{t.conversion}%</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-gray-650 uppercase">Confidence</span>
                            <span className="text-white font-bold">{t.confidence}%</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MIDDLE ROW: Interactive Graph + AI Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: Interactive Future Graph */}
                <div className="lg:col-span-2 Manthan-panel p-5 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4">
                    <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Scenario Projection Curves</span>
                    
                    {/* Metric Selector Tabs */}
                    <div className="flex items-center gap-1 bg-gray-950 p-0.5 rounded-lg border border-gray-900 font-mono text-[8px] font-bold">
                      {(["revenue", "customers", "retention", "engagement"] as const).map(met => (
                        <button
                          key={met}
                          onClick={() => setActiveMetric(met)}
                          className={`px-2 py-1 rounded cursor-pointer uppercase ${
                            activeMetric === met 
                              ? "bg-gray-900 text-white border border-gray-850" 
                              : "text-gray-550 hover:text-gray-300"
                          }`}
                        >
                          {met === "revenue" ? "Revenue" : met === "customers" ? "Conversion" : met === "retention" ? "Retention" : "Engagement"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interactive SVG Chart Rendering */}
                  <div className="flex-1 relative flex flex-col justify-end mt-4">
                    <svg 
                      className="w-full overflow-visible z-10" 
                      viewBox={`0 0 ${graphData.width} ${graphData.height}`}
                    >
                      {/* Grid guidelines */}
                      <line x1={graphData.paddingX} y1={graphData.paddingY} x2={graphData.width - graphData.paddingX} y2={graphData.paddingY} stroke="#111827" strokeWidth="1" />
                      <line x1={graphData.paddingX} y1={graphData.height / 2} x2={graphData.width - graphData.paddingX} y2={graphData.height / 2} stroke="#111827" strokeWidth="1" />
                      <line x1={graphData.paddingX} y1={graphData.height - graphData.paddingY} x2={graphData.width - graphData.paddingX} y2={graphData.height - graphData.paddingY} stroke="#1F2937" strokeWidth="1" />

                      {/* X and Y labels */}
                      <text x={graphData.paddingX - 10} y={graphData.paddingY + 4} fill="#4b5563" className="font-mono text-[8px] text-right" textAnchor="end">
                        {activeMetric === "revenue" ? `₹${(graphData.maxVal/1000).toFixed(0)}K` : activeMetric === "retention" ? "100%" : `${graphData.maxVal}%`}
                      </text>
                      <text x={graphData.paddingX - 10} y={graphData.height / 2 + 3} fill="#374151" className="font-mono text-[8px] text-right" textAnchor="end">
                        {activeMetric === "revenue" ? `₹${(graphData.maxVal/2000).toFixed(0)}K` : activeMetric === "retention" ? "50%" : `${Math.round(graphData.maxVal/2)}%`}
                      </text>
                      <text x={graphData.paddingX - 10} y={graphData.height - graphData.paddingY + 3} fill="#374151" className="font-mono text-[8px] text-right" textAnchor="end">0</text>

                      {/* Timeline curves drawing */}
                      {/* Path A (Conservative) */}
                      <path 
                        d={graphData.pathA} 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4" 
                        className={`transition-opacity duration-300 ${selectedTimeline === "A" ? "opacity-100 stroke-[2]" : "opacity-45"}`} 
                        style={{ filter: selectedTimeline === "A" ? "drop-shadow(0 0 4px #3B82F6)" : "" }}
                      />
                      
                      {/* Path C (Aggressive) */}
                      <path 
                        d={graphData.pathC} 
                        fill="none" 
                        stroke="#8B5CF6" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4" 
                        className={`transition-opacity duration-300 ${selectedTimeline === "C" ? "opacity-100 stroke-[2]" : "opacity-45"}`} 
                        style={{ filter: selectedTimeline === "C" ? "drop-shadow(0 0 6px #8B5CF6)" : "" }}
                      />

                      {/* Path B (Recommended) - Bold and Glowing */}
                      <path 
                        d={graphData.pathB} 
                        fill="none" 
                        stroke="#22C55E" 
                        strokeWidth="2.5" 
                        className={`transition-opacity duration-300 ${selectedTimeline === "B" ? "opacity-100 stroke-[3]" : "opacity-45"}`} 
                        style={{ filter: "drop-shadow(0 0 8px #22C55E)" }}
                      />

                      {/* Interactive plot points on the curve focus */}
                      {selectedTimeline === "A" && graphData.pointsA.map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#3B82F6" className="cursor-pointer hover:r-5 transition-all" />
                      ))}
                      {selectedTimeline === "B" && graphData.pointsB.map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="4.5" fill="#8B5CF6" stroke="#050816" strokeWidth="1" className="cursor-pointer hover:r-6 transition-all" />
                      ))}
                      {selectedTimeline === "C" && graphData.pointsC.map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#EF4444" className="cursor-pointer hover:r-5 transition-all" />
                      ))}
                    </svg>

                    {/* Timeline period axis labeling */}
                    <div className="flex justify-between font-mono text-[8px] text-gray-550 px-8 pt-3 border-t border-gray-950 mt-1">
                      <span>Launch Day 0</span>
                      <span>Day {selectedTimePeriod === "1 Week" ? "2" : selectedTimePeriod === "2 Weeks" ? "4" : selectedTimePeriod === "1 Month" ? "10" : "30"}</span>
                      <span>Day {selectedTimePeriod === "1 Week" ? "4" : selectedTimePeriod === "2 Weeks" ? "8" : selectedTimePeriod === "1 Month" ? "20" : "60"}</span>
                      <span>Day {selectedTimePeriod === "1 Week" ? "7" : selectedTimePeriod === "2 Weeks" ? "14" : selectedTimePeriod === "1 Month" ? "30" : "90"}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: AI Recommendations Panel */}
                <div className="Manthan-panel p-5 flex flex-col justify-between space-y-4">
                  <div className="border-b border-gray-900 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-Manthan-purple" />
                      <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Khoj Recommendation</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 font-mono text-[10px]">
                    {/* Khoj Header details */}
                    <div className={`flex items-start gap-2.5 p-2 rounded-xl border ${isLight ? "bg-[#EFF6FF] border-[#BFDBFE]" : "bg-gray-950/50 border-gray-900"}`}>
                      <div className="w-8 h-8 rounded-full bg-Manthan-purple/15 flex items-center justify-center border border-Manthan-purple/30 text-Manthan-purple font-space font-bold text-xs shrink-0">V</div>
                      <div>
                        <span className={`font-bold block uppercase text-[8px] tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Khoj analytics agent</span>
                        <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                          Projected revenue opportunity: <span className="text-white font-bold">₹{focusTimeline.revenue.toLocaleString()}</span>. 
                          Risk profile is <span className={`font-bold ${focusTimeline.risk === "High" ? "text-red-400" : "text-Manthan-success"}`}>{focusTimeline.risk}</span>.
                        </p>
                      </div>
                    </div>

                    {/* Timeline metadata highlights */}
                    <div className={`space-y-2 border-t pt-3 ${isLight ? "border-[#E2E8F0]" : "border-gray-900"}`}>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Recommended Option:</span>
                        <span className="text-white font-bold">{focusTimeline.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Predicted ROI factor:</span>
                        <span className="text-Manthan-success font-bold">{focusTimeline.roi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Friction risk index:</span>
                        <span className="text-white font-bold">{focusTimeline.risk === "High" ? "High fatigue" : "Low risk"}</span>
                      </div>
                    </div>

                    {/* Bullet strategies */}
                    <div className={`space-y-1.5 border-t pt-3 ${isLight ? "border-[#E2E8F0]" : "border-gray-900"}`}>
                      <span className="block text-[8px] text-gray-650 uppercase tracking-widest mb-1">Tactical Strategy Checklist</span>
                      {focusTimeline.recs.map((rec, index) => (
                        <div key={index} className="flex items-start gap-1.5 text-gray-400">
                          <span className="text-Manthan-purple mt-0.5">·</span>
                          <span className="leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`Variables exported to Growth Engine! Creative variant automatically generated for channel [${selectedChannel}]`)}
                    className="w-full py-2 bg-gray-900 hover:bg-gray-850 text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg border border-gray-800 flex items-center justify-center gap-1.5 active:scale-95 duration-150 transition-all cursor-pointer"
                  >
                    <span>Export Parameters to Growth Engine</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>

              {/* BOTTOM: "What If" Chat Panel */}
              <div className="Manthan-panel p-5 flex flex-col space-y-4">
                <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-[#E2E8F0]" : "border-gray-900"}`}>
                  <div className="flex items-center gap-1.5">
                    <Brain size={14} className="text-Manthan-blue" />
                    <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>What If AI Console</span>
                  </div>
                  <span className="font-mono text-[8px] text-gray-550 uppercase">Query timeline mutations</span>
                </div>

                {/* Quick query buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleWhatIfSubmit(undefined, "What if I only target VIP customers?")}
                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-colors cursor-pointer ${isLight ? "bg-[#EFF6FF] border-[#BFDBFE] text-blue-600 hover:bg-blue-100/50 hover:text-blue-700" : "border-gray-900 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:text-white"}`}
                  >
                    What if I target only VIP customers?
                  </button>
                  <button
                    onClick={() => handleWhatIfSubmit(undefined, "What if I send campaigns through WhatsApp instead of Email?")}
                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-colors cursor-pointer ${isLight ? "bg-[#EFF6FF] border-[#BFDBFE] text-blue-600 hover:bg-blue-100/50 hover:text-blue-700" : "border-gray-900 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:text-white"}`}
                  >
                    What if I send campaigns through WhatsApp instead of Email?
                  </button>
                  <button
                    onClick={() => handleWhatIfSubmit(undefined, "What if I increase the discount to 25%?")}
                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-colors cursor-pointer ${isLight ? "bg-[#EFF6FF] border-[#BFDBFE] text-blue-600 hover:bg-blue-100/50 hover:text-blue-700" : "border-gray-900 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:text-white"}`}
                  >
                    What if I increase the discount to 25%?
                  </button>
                  <button
                    onClick={() => handleWhatIfSubmit(undefined, "What if I launch this campaign during Diwali?")}
                    className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-mono transition-colors cursor-pointer ${isLight ? "bg-[#EFF6FF] border-[#BFDBFE] text-blue-600 hover:bg-blue-100/50 hover:text-blue-700" : "border-gray-900 bg-gray-950/40 text-gray-400 hover:border-gray-700 hover:text-white"}`}
                  >
                    What if I launch this campaign during Diwali?
                  </button>
                </div>

                {/* Chat window log */}
                <div className={`h-44 overflow-y-auto border rounded-xl p-4 font-mono text-[10px] space-y-4 scrollbar-thin ${isLight ? "bg-slate-50 border-[#E2E8F0]" : "bg-black/40 border-gray-900"}`}>
                  {chatHistory.map((msg, index) => {
                    const isVega = msg.sender === "Khoj";
                    return (
                      <div key={index} className={`flex gap-3 items-start ${isVega ? "" : "justify-end"}`}>
                        {isVega && (
                          <div className="w-6 h-6 rounded-full bg-Manthan-blue/15 border border-Manthan-blue/40 text-Manthan-blue font-space font-bold text-[10px] flex items-center justify-center shrink-0">
                            V
                          </div>
                        )}
                        <div className={`space-y-2 max-w-[80%] ${isVega ? "" : "text-right"}`}>
                          <div className={`p-3 rounded-2xl border text-gray-300 leading-relaxed ${
                            isVega ? (isLight ? "bg-white border-[#E2E8F0] text-slate-800 text-left shadow-sm" : "bg-gray-950/50 border-gray-900 text-left") : (isLight ? "bg-blue-50 border-blue-200 text-blue-800 text-left" : "bg-Manthan-blue/10 border-Manthan-blue/30 text-left")
                          }`}>
                            <p>{msg.text}</p>
                            
                            {/* Khoj prediction telemetry card */}
                            {msg.stats && (
                              <div className="grid grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-gray-900 text-[9px] text-gray-500 font-mono">
                                <div>
                                  <span className="block text-[7px] text-gray-650 uppercase">Expected Rev</span>
                                  <span className="text-Manthan-success font-bold">₹{msg.stats.revenue.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="block text-[7px] text-gray-650 uppercase">Audience Size</span>
                                  <span className="text-white font-bold">{msg.stats.audienceSize} stars</span>
                                </div>
                                <div>
                                  <span className="block text-[7px] text-gray-650 uppercase">Conversion</span>
                                  <span className="text-white font-bold">{msg.stats.conversion}%</span>
                                </div>
                                <div>
                                  <span className="block text-[7px] text-gray-650 uppercase">Confidence</span>
                                  <span className="text-white font-bold">{msg.stats.confidence}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-[7.5px] text-gray-600 block px-1">{msg.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}

                  {isChatTyping && (
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-Manthan-blue/15 border border-Manthan-blue/40 text-Manthan-blue font-space font-bold text-[10px] flex items-center justify-center shrink-0">
                        V
                      </div>
                      <div className="p-3 bg-gray-950/50 border border-gray-900 rounded-2xl flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-Manthan-blue typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-Manthan-blue typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-Manthan-blue typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input query field */}
                <form onSubmit={handleWhatIfSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={isChatTyping}
                    placeholder="Ask Khoj, e.g. What if I increase campaign frequency to twice a week?"
                    className={`flex-1 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none border ${isLight ? "bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-500/15 placeholder-slate-400" : "bg-gray-950 border-gray-900 text-white focus:border-Manthan-blue/40 placeholder-gray-650"} disabled:opacity-60`}
                  />
                  <button
                    type="submit"
                    disabled={isChatTyping || !chatInput.trim()}
                    className="px-4 bg-Manthan-blue hover:bg-blue-650 text-white rounded-xl flex items-center justify-center transition-colors disabled:bg-gray-900 disabled:text-gray-600 cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </>
          )}

        </div>
      </main>
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default FutureSimulator;
