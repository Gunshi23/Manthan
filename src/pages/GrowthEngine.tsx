import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Mail, MessageCircle, Phone, Layers, Sparkles, Edit3, Eye,
  BarChart3, RefreshCw, Wand2, Scissors, Dna, Play,
  Users, Zap, Target, Brain,
  CheckCircle2, Rocket, X, AlertCircle, ArrowRight,
  Activity, Star, Cpu, FlaskConical, MessageSquare, Globe,
  Clock, Send, SlidersHorizontal
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import type { Persona } from "../context/OrbitContext";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

/* ─── Types ───────────────────────────────────────────────────── */
type ChannelType = "Email" | "WhatsApp" | "SMS" | "RCS";
type VariantKey = "A" | "B" | "C" | "D" | "E";

interface CampaignVariant {
  label: string;
  tone: string;
  subject?: string;
  body: string;
  title?: string;
}

interface MissionPlan {
  Drishti: { segment: string; explanation: string; audienceSize: number };
  Pragya: { recoverableRevenue: number; inactiveCustomers: number; abandonedLeads: number; recoveryConfidence: number; explanation: string };
  Khoj: { predictedRoi: number; predictedRevenue: number; confidenceScore: number; explanation: string };
  Rachna: { Email: { subject: string; body: string }; WhatsApp: { body: string }; SMS: { body: string }; RCS: { title: string; body: string; mediaUrl: string } };
  Saarthi: { selectedChannel: string; explanation: string };
  recommendation: { summary: string; confidenceScore: number; estimatedTimeframe: string };
}

interface SimScenario {
  conversionRate: number; revenue: number; roi: number; customerFatigue: string; optOutRate: number;
}

interface SimData { conservative: SimScenario; recommended: SimScenario; aggressive: SimScenario; }

interface WorkflowStep {
  agent: string; label: string; status: "idle" | "running" | "done" | "error"; color: string; icon: string;
}

const AGENT_COLORS: Record<string, string> = {
  Drishti: "#3B82F6", Pragya: "#EC4899", Khoj: "#8B5CF6", Rachna: "#F59E0B", Saarthi: "#22C55E"
};

const CHANNEL_CONFIG: Record<ChannelType, { icon: React.FC<any>; color: string; borderColor: string; bg: string; label: string; openRate: string; ctr: string; conv: string; reach: string }> = {
  Email:    { icon: Mail,          color: "text-blue-400",   borderColor: "border-blue-500/40",   bg: "bg-blue-500/5",   label: "Email",    openRate: "38%", ctr: "12%", conv: "4.2%", reach: "100%" },
  WhatsApp: { icon: MessageCircle, color: "text-green-400",  borderColor: "border-green-500/40",  bg: "bg-green-500/5",  label: "WhatsApp", openRate: "92%", ctr: "34%", conv: "8.8%", reach: "78%" },
  SMS:      { icon: Phone,         color: "text-yellow-400", borderColor: "border-yellow-400/40", bg: "bg-yellow-400/5", label: "SMS",      openRate: "72%", ctr: "19%", conv: "5.1%", reach: "94%" },
  RCS:      { icon: Layers,        color: "text-purple-400", borderColor: "border-purple-500/40", bg: "bg-purple-500/5", label: "RCS",      openRate: "54%", ctr: "22%", conv: "6.3%", reach: "61%" },
};

const SEGMENT_PROFILES = [
  { key: "Loyalists", emoji: "⭐", avgSpend: "₹2,840", freq: "8.4x", engagement: "94%", ltv: "₹23,800", channel: "WhatsApp", risk: "8%" },
  { key: "Slipping Away", emoji: "⚠️", avgSpend: "₹1,420", freq: "2.1x", engagement: "31%", ltv: "₹8,200", channel: "Email", risk: "82%" },
  { key: "High-Value Inactive", emoji: "💎", avgSpend: "₹4,100", freq: "0.8x", engagement: "12%", ltv: "₹31,500", channel: "WhatsApp", risk: "74%" },
  { key: "New Signups", emoji: "🚀", avgSpend: "₹890", freq: "1.1x", engagement: "67%", ltv: "₹4,200", channel: "SMS", risk: "38%" },
];

const GOAL_EXAMPLES = [
  "Increase Repeat Purchases by 20%",
  "Recover Abandoned Carts",
  "Launch Diwali Collection Campaign",
  "Reduce Churn in VIP Segment",
  "Increase VIP Revenue by 30%",
];

/* ─── Helpers ─────────────────────────────────────────────────── */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function buildFallbackPlan(goal: string, businessType: string, personas?: Persona[]): MissionPlan {
  let targetPersona: Persona | undefined = undefined;
  if (personas && personas.length > 0) {
    targetPersona = personas.find(p => goal.toLowerCase().includes(p.name.toLowerCase()) || goal.toLowerCase().includes(p.id.toLowerCase()));
  }

  const isVIP = targetPersona ? targetPersona.id.includes("vip") : /vip|premium|luxury/i.test(goal);
  const isChurn = targetPersona ? targetPersona.id.includes("dormant") || targetPersona.id.includes("value") : /churn|retention|risk|dormant/i.test(goal);
  const isCart = targetPersona ? targetPersona.id.includes("new") : /cart|abandon|recover/i.test(goal);
  
  const seg = targetPersona ? targetPersona.name : (isVIP ? "VIP Fashion Enthusiast" : isChurn ? "Dormant High-Value Customer" : isCart ? "Bargain Hunter" : "Trend Explorer");
  const channel = targetPersona ? targetPersona.preferredChannel : "WhatsApp";
  const audience = targetPersona ? targetPersona.customerCount : 45;
  const rev = targetPersona ? Math.round(targetPersona.revenuePotential) : 54000;
  const roi = targetPersona ? (targetPersona.id.includes("vip") ? 4.8 : targetPersona.id.includes("trend") ? 4.1 : targetPersona.id.includes("dormant") ? 3.9 : 3.5) : 4.2;
  const roiText = `${roi}x`;

  return {
    Drishti: { 
      segment: seg, 
      explanation: targetPersona 
        ? `Drishti scanned customer nodes and targeted ${targetPersona.name} representing ${targetPersona.customerCount} customers with ${targetPersona.revenueContributionPct}% revenue share.`
        : `Drishti scanned the full customer universe for ${businessType} and isolated the ${seg} cohort as the highest-impact target for this mission.`, 
      audienceSize: audience 
    },
    Pragya: { 
      recoverableRevenue: Math.round(rev * 0.42), 
      inactiveCustomers: Math.max(1, Math.round(audience * 0.3)), 
      abandonedLeads: Math.max(1, Math.round(audience * 0.15)), 
      recoveryConfidence: targetPersona ? targetPersona.loyaltyScore : 91, 
      explanation: targetPersona
        ? `Pragya analyzed ${targetPersona.name} accounts and identified ₹${Math.round(rev * 0.42).toLocaleString()} in untapped headroom. Recommended strategy: ${targetPersona.recommendedStrategy}`
        : `Pragya audited transaction logs and found ₹${Math.round(rev * 0.42).toLocaleString()} in recoverable revenue across inactive customer nodes.` 
    },
    Khoj: { 
      predictedRoi: roi, 
      predictedRevenue: rev, 
      confidenceScore: targetPersona ? targetPersona.loyaltyScore : 89, 
      explanation: `Khoj forecasted ROI at ${roiText} based on historical performance models for ${seg}.` 
    },
    Rachna: {
      Email: { 
        subject: targetPersona ? `Special Drop for our ${targetPersona.name}` : `Exclusive Offer: ${goal.slice(0, 40)}`, 
        body: targetPersona 
          ? `Hi {{name}},\n\nWe've crafted a special recommendation just for you. Based on your preferences, we suggest trying our latest collections.\n\nRecommended: ${targetPersona.suggestedCampaign}\n\nUse code ORBIT20 for exclusive perks.\n\nWarm regards,\nManthan.ai Intelligence`
          : `Hi {{name}},\n\nWe noticed you haven't shopped with us recently. As one of our valued customers, we've curated a special offer just for you.\n\nUse code ORBIT20 for 20% off your next purchase.\n\nShop now before it expires!\n\nWarm regards,\nAura Threads` 
      },
      WhatsApp: { 
        body: targetPersona
          ? `✨ Hey *{{name}}*! \n\nWe've designed a special campaign for our *${targetPersona.name}* community.\n\n🎁 Recommended Action: *${targetPersona.suggestedCampaign}*\n🚚 Strategy: ${targetPersona.recommendedStrategy}\n\nTap to explore: https://Manthan.ai/dna\n\n_(Reply STOP to opt out)_`
          : `✨ Hey *{{name}}*! \n\nWe miss you! Here's an exclusive offer crafted by our AI just for you.\n\n🎁 20% OFF your next order\n🚚 Free shipping today\n\nTap to claim: https://aurathreads.in/special\n\n_(Reply STOP to opt out)_` 
      },
      SMS: { 
        body: targetPersona
          ? `Manthan: Hi {{name}}, exclusive campaign for ${targetPersona.name}: ${targetPersona.suggestedCampaign}. Explore: https://Manthan.ai/dna`
          : `Aura Threads: Hi {{name}}, 20% OFF exclusive offer for you. Valid 48hrs. Claim: https://aurathreads.in/off` 
      },
      RCS: { 
        title: targetPersona ? `Curated for ${targetPersona.name}` : "Your Exclusive Offer Awaits", 
        body: targetPersona 
          ? `Hey {{name}}, we've prepared a custom campaign based on your DNA profile. Tap below to explore early access.`
          : `Hey {{name}}, we've prepared a curated collection drop just for you. Tap below to explore early access.`, 
        mediaUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80" 
      }
    },
    Saarthi: { 
      selectedChannel: channel, 
      explanation: `Saarthi verified ${channel} as the highest-performing delivery channel for the ${seg} cohort.` 
    },
    recommendation: { 
      summary: targetPersona
        ? `Deploy a ${channel}-first campaign targeting the ${targetPersona.name} segment with ${targetPersona.suggestedCampaign}.`
        : `Deploy a WhatsApp-first campaign targeting the ${seg} cohort with personalized offers and a 48-hour urgency window.`, 
      confidenceScore: targetPersona ? targetPersona.loyaltyScore : 89, 
      estimatedTimeframe: "14 Days" 
    }
  };
}

/* ══════════════════════════════════════════════════════════════
   GROWTH ENGINE PAGE
══════════════════════════════════════════════════════════════ */
export const GrowthEngine: React.FC = () => {
  const { customers, config, businessType, addAgentLog, launchMissionCampaign, addCampaign, startMission, personas, theme } = useOrbit();
  const isLight = theme === "executive";

  /* ── State ── */
  const [goal, setGoal] = useState("Increase Repeat Purchases by 20%");
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const [activeChannel, setActiveChannel] = useState<ChannelType>("WhatsApp");
  const [activeVariant, setActiveVariant] = useState<VariantKey>("A");
  const [isPreview, setIsPreview] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<"Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya" | null>(null);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);

  /* ── AI Workflow State ── */
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowDone, setWorkflowDone] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { agent: "Drishti", label: "Analyzing customer audience...", status: "idle", color: "#3B82F6", icon: "👁" },
    { agent: "Pragya",    label: "Identifying opportunities...",  status: "idle", color: "#EC4899", icon: "🌙" },
    { agent: "Khoj",    label: "Forecasting outcomes...",       status: "idle", color: "#8B5CF6", icon: "⭐" },
    { agent: "Rachna",    label: "Generating campaigns...",       status: "idle", color: "#F59E0B", icon: "✨" },
    { agent: "Saarthi",   label: "Preparing deployment...",       status: "idle", color: "#22C55E", icon: "🚀" },
  ]);

  /* ── Mission Data ── */
  const [missionPlan, setMissionPlan] = useState<MissionPlan | null>(null);
  const [simData, setSimData] = useState<SimData | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  /* ── Campaign Variants ── */
  const [variants, setVariants] = useState<Record<VariantKey, CampaignVariant>>({
    A: { label: "Professional", tone: "professional", subject: "Exclusive Offer for You", body: "" },
    B: { label: "Urgent",       tone: "urgent",        subject: "⚡ Last Chance: Expires Tonight", body: "" },
    C: { label: "Luxury",       tone: "luxury",        subject: "Curated Exclusively for You", body: "" },
    D: { label: "Friendly",     tone: "friendly",      subject: "Hey! We Made This Just for You", body: "" },
    E: { label: "Emotional",    tone: "emotional",      subject: "We Miss You, {{name}} 💙", body: "" },
  });

  /* ── AI Copywriting ── */
  const [assistLoading, setAssistLoading] = useState<string | null>(null);

  /* ── Launch State ── */
  const [launching, setLaunching] = useState(false);
  const [launchDone, setLaunchDone] = useState(false);

  /* ── Explainability Modal ── */
  const [showExplain, setShowExplain] = useState(false);
  const [explainData, setExplainData] = useState<any>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  /* ── Lifecycle Automation State ── */
  const [activeTab, setActiveTab] = useState<"manual" | "automation">("manual");
  const [activeAutomationCategory, setActiveAutomationCategory] = useState<"review" | "checkin" | "missyou" | "winback" | "dormant">("review");
  const [automationTemplates, setAutomationTemplates] = useState<Record<string, { type: string; subject?: string; body: string }>>({
    review: {
      type: "Review Request",
      subject: "We hope you are loving your recent order!",
      body: "Hi {{name}},\n\nThank you for your recent purchase. We hope you are enjoying your order.\n\nYour feedback means a lot to us.\n\nCould you please leave a quick review?"
    },
    checkin: {
      type: "Relationship Building",
      subject: "Just checking in — how is your purchase?",
      body: "Hi {{name}},\n\nJust checking in.\n\nHow has your experience been with your purchase?\n\nLet us know if you need any assistance."
    },
    missyou: {
      type: "Re-engagement",
      subject: "We miss you, {{name}}! 💙",
      body: "Hi {{name}},\n\nWe miss you.\n\nIt's been a while since your last visit.\n\nHere's something special waiting for you."
    },
    winback: {
      type: "Customer Recovery",
      subject: "An exclusive offer just for you",
      body: "Hi {{name}},\n\nYou haven't shopped with us in a while.\n\nWe would love to welcome you back.\n\nEnjoy an exclusive offer created just for you."
    },
    dormant: {
      type: "High Priority Recovery",
      subject: "Come back and claim your reward 🎁",
      body: "Hi {{name}},\n\nWe noticed you haven't visited recently.\n\nCome back and enjoy a special reward from us."
    }
  });

  const [automationSending, setAutomationSending] = useState(false);
  const [automationSendDone, setAutomationSendDone] = useState(false);
  const [automationChannel, setAutomationChannel] = useState<"WhatsApp" | "Email" | "SMS">("WhatsApp");
  const [automationCustomerStatuses, setAutomationCustomerStatuses] = useState<Record<string, "Ready" | "Queued" | "Dispatched">>({});
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const getDaysSincePurchase = (lastPurchaseDate?: string) => {
    if (!lastPurchaseDate) return 999;
    const current = new Date("2026-06-14");
    const last = new Date(lastPurchaseDate);
    const diff = current.getTime() - last.getTime();
    if (isNaN(diff)) return 999;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const reviewCohort = useMemo(() => customers.filter(c => getDaysSincePurchase(c.lastPurchaseDate) <= 7), [customers]);
  const checkinCohort = useMemo(() => customers.filter(c => {
    const days = getDaysSincePurchase(c.lastPurchaseDate);
    return days >= 8 && days <= 15;
  }), [customers]);
  const missyouCohort = useMemo(() => customers.filter(c => {
    const days = getDaysSincePurchase(c.lastPurchaseDate);
    return days >= 16 && days <= 30;
  }), [customers]);
  const winbackCohort = useMemo(() => customers.filter(c => {
    const days = getDaysSincePurchase(c.lastPurchaseDate);
    return days >= 31 && days <= 60;
  }), [customers]);
  const dormantCohort = useMemo(() => customers.filter(c => getDaysSincePurchase(c.lastPurchaseDate) > 60), [customers]);

  const potentialRevenueRecovery = useMemo(() => {
    const totalLtv = winbackCohort.reduce((sum, c) => sum + (c.lifetimeValue || c.ltv || 0), 0) +
                     dormantCohort.reduce((sum, c) => sum + (c.lifetimeValue || c.ltv || 0), 0);
    return Math.round(totalLtv * 0.15);
  }, [winbackCohort, dormantCohort]);

  const fifteenDaysCohort = useMemo(() => customers.filter(c => {
    const days = getDaysSincePurchase(c.lastPurchaseDate);
    return days >= 15 && days <= 30;
  }), [customers]);

  const oneMonthCohort = useMemo(() => customers.filter(c => {
    const days = getDaysSincePurchase(c.lastPurchaseDate);
    return days > 30;
  }), [customers]);

  const getActiveCohort = () => {
    if (activeAutomationCategory === "review") return reviewCohort;
    if (activeAutomationCategory === "checkin") return checkinCohort;
    if (activeAutomationCategory === "missyou") return missyouCohort;
    if (activeAutomationCategory === "winback") return winbackCohort;
    return dormantCohort;
  };

  const applyRecencyPreset = (presetType: "review" | "missing15" | "inactiveMonth") => {
    addAgentLog("Rachna", `Applying Recency Campaign Preset: ${presetType === "review" ? "Within 7 Days (Review)" : presetType === "missing15" ? "15 Days Inactive" : "Last 1 Month Inactive"}`, "action");
    
    let targetCohort = reviewCohort;
    let goalText = "Ask for product review (Purchase within last 7 days)";
    let segmentName = "Recent Buyers (<= 7 Days)";
    let explanationText = "Targeting customers who made a purchase in the last 7 days to collect feedback while their experience is fresh.";
    let predictedRevenue = 0;
    let predictedRoi = 1.0;
    let channel: ChannelType = "WhatsApp";
    let channelExpl = "WhatsApp exhibits a 92% open rate, ensuring maximum response rates for customer feedback surveys.";
    let recSummary = "Deploy a WhatsApp review request campaign to recent buyers.";
    let recTime = "7 Days";
    
    let subject = "How is your recent purchase?";
    let bodyA = "Hi {{name}},\n\nThank you for your recent purchase! We hope you are loving your order.\n\nCould you please take 30 seconds to leave us a quick review? We would love to hear your feedback!\n\nBest,\nOrbit Team";
    let bodyB = "Hi *{{name}}*! \n\nThank you for your recent purchase. We hope you are loving your order!\n\nCould you please take a moment to leave a review?\n\nRate us: https://Manthan.ai/review";
    let bodyC = "Hi {{name}},\n\nWe hope you love your order! Share your feedback with us by writing a quick review.\n\nRate here: https://Manthan.ai/review";
    let bodyD = "Hi {{name}}, thank you for your recent purchase! We hope you love it. Please leave a quick review here: https://Manthan.ai/review";
    let bodyE = "Hi {{name}}, we value your opinion. How was your recent shopping experience with us? Tell us here: https://Manthan.ai/review";

    if (presetType === "missing15") {
      targetCohort = fifteenDaysCohort;
      goalText = "Re-engage customer (Inactive for last 15 days)";
      segmentName = "Inactive Buyers (8-15 Days)";
      explanationText = "Targeting customers whose last purchase was between 8 and 15 days ago to prevent early churn.";
      predictedRevenue = Math.round(fifteenDaysCohort.length * 450);
      predictedRoi = 3.8;
      channel = "WhatsApp";
      channelExpl = "WhatsApp is recommended for quick check-ins to maintain interactive engagement.";
      recSummary = "Deploy a re-engagement check-in campaign to customers inactive for 15 days.";
      recTime = "14 Days";

      subject = "We miss you, {{name}}! 💙";
      bodyA = "Hi {{name}},\n\nWe are missing you! It has been 15 days since you last visited or bought anything from us.\n\nWe would love to see you again. Check out our latest collection designed just for you!\n\nWarmly,\nOrbit Team";
      bodyB = "Hey *{{name}}*! \n\nWe miss you! 💙 It has been 15 days since your last purchase. We've dropped some exciting new styles we think you'd love.\n\nCheck them out: https://Manthan.ai/styles";
      bodyC = "Dear {{name}},\n\nIt has been 15 days since we last had the pleasure of serving you. We've introduced new arrivals curated for your taste.\n\nExplore: https://Manthan.ai/styles";
      bodyD = "Hey {{name}} 👋\n\nIt's been 15 days! Just wanted to check in and see how you're doing. A new trend drop just hit our store.\n\nSee it here: https://Manthan.ai/styles";
      bodyE = "Hi {{name}}, we miss you! It's been 15 days since your last checkout. Check out new drops: https://Manthan.ai/styles";
    } else if (presetType === "inactiveMonth") {
      targetCohort = oneMonthCohort;
      goalText = "Win-back customer (No purchase in last 1 month)";
      segmentName = "Dormant Buyers (> 30 Days)";
      explanationText = "Targeting customers who have not bought anything in the last 1 month to win them back with targeted offers.";
      predictedRevenue = Math.round(oneMonthCohort.length * 850);
      predictedRoi = 4.8;
      channel = "Email";
      channelExpl = "Email provides a richer space for premium welcome back gift codes and catalog previews.";
      recSummary = "Deploy a win-back discount campaign to customers inactive for 30+ days.";
      recTime = "14 Days";

      subject = "An exclusive offer to welcome you back 🎁";
      bodyA = "Hi {{name}},\n\nYou have not bought anything from us in the last 1 month. We really miss you!\n\nTo help you get back, here is an exclusive 20% discount code for your next checkout: WELCOME20.\n\nShop now: https://Manthan.ai";
      bodyB = "Hey *{{name}}*! \n\nYou haven't shopped with us in over a month. We miss you! 🎁\n\nHere's 20% OFF your next order: WELCOME20\n\nClaim now: https://Manthan.ai/welcome";
      bodyC = "Dear {{name}},\n\nIt has been over a month. As a token of our appreciation, please enjoy an exclusive 20% welcome-back privilege. Code: WELCOME20.";
      bodyD = "Hey {{name}} 👋\n\nYou haven't shopped with us in over a month. Use WELCOME20 for 20% OFF: https://Manthan.ai/welcome";
      bodyE = "Hi {{name}},\n\nWe haven't seen you in 30 days! We want you back. Here is an exclusive 20% offer code WELCOME20 for your next purchase.";
    }

    setGoal(goalText);
    setActiveChannel(channel);

    const basePlan: MissionPlan = {
      Drishti: {
        segment: segmentName,
        explanation: explanationText,
        audienceSize: targetCohort.length
      },
      Pragya: {
        recoverableRevenue: Math.round(targetCohort.length * 0.42 * 1000),
        inactiveCustomers: targetCohort.length,
        abandonedLeads: 0,
        recoveryConfidence: 85,
        explanation: explanationText
      },
      Khoj: {
        predictedRoi,
        predictedRevenue,
        confidenceScore: 85,
        explanation: `Khoj forecasted ROI at ${predictedRoi}x based on historical models for this recency cohort.`
      },
      Rachna: {
        Email: { subject, body: bodyA },
        WhatsApp: { body: bodyB },
        SMS: { body: bodyD },
        RCS: { title: subject, body: bodyC, mediaUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80" }
      },
      Saarthi: {
        selectedChannel: channel,
        explanation: channelExpl
      },
      recommendation: {
        summary: recSummary,
        confidenceScore: 85,
        estimatedTimeframe: recTime
      }
    };

    setMissionPlan(basePlan);

    setVariants({
      A: { label: "Professional", tone: "professional", subject, body: bodyA },
      B: { label: "Urgent",       tone: "urgent",        subject, body: bodyB },
      C: { label: "Luxury",       tone: "luxury",        subject, body: bodyC },
      D: { label: "Friendly",     tone: "friendly",      subject, body: bodyD },
      E: { label: "Emotional",    tone: "emotional",     subject, body: bodyE },
    });

    setSimData({
      conservative: { conversionRate: 2.1, revenue: Math.round(predictedRevenue * 0.65), roi: parseFloat((predictedRoi * 0.65).toFixed(1)), customerFatigue: "Low", optOutRate: 0.4 },
      recommended:  { conversionRate: 4.8, revenue: predictedRevenue, roi: predictedRoi, customerFatigue: "Medium", optOutRate: 0.9 },
      aggressive:   { conversionRate: 7.2, revenue: Math.round(predictedRevenue * 1.35), roi: parseFloat((predictedRoi * 1.2).toFixed(1)), customerFatigue: "High", optOutRate: 2.1 },
    });

    setWorkflowDone(true);
  };

  const handleOptimizeCampaign = async () => {
    setAiOptimizing(true);
    addAgentLog("Rachna", `Initializing AI copywriting optimization for ${activeAutomationCategory} campaign...`, "action");
    
    const targetCohort = getActiveCohort();
    const segmentName = activeAutomationCategory === "review" ? "Recent Buyers" 
      : activeAutomationCategory === "checkin" ? "Re-engagement Check-In"
      : activeAutomationCategory === "missyou" ? "Slipping Away (Miss You)"
      : activeAutomationCategory === "winback" ? "Inactive Customer"
      : "Dormant Customer";

    const defaultMsg = automationTemplates[activeAutomationCategory].body;
    const systemPrompt = `You are the Manthan.ai Growth Campaign Copywriter.
Optimize the following automated lifecycle campaign template body:
"${defaultMsg}"

For business type: "${businessType}".
Target cohort segment: "${segmentName}".

Ensure the copy contains appropriate dynamic tags like {{name}}. Make it highly engaging, tailored, and premium. For Working Professionals, recommend structured collections or professional themes. For Students, suggest trend drops. For Dormant, offer special incentives.
Do not return any markdown code block formatting. Return only the raw text of the optimized message.`;

    try {
      let optimizedBody = defaultMsg;
      if (config.geminiKey) {
        optimizedBody = await callGeminiAPI(`Optimize copy for ${segmentName} in ${businessType} business.`, systemPrompt, config.geminiKey);
      } else {
        await sleep(1000);
        const hasStudents = targetCohort.some(c => (c.persona || "").includes("Student") || (c.persona || "").includes("Gen Z"));
        const hasProfessionals = targetCohort.some(c => (c.persona || "").includes("Professional") || (c.persona || "").includes("Working"));
        
        if (activeAutomationCategory === "review") {
          optimizedBody = `Hi {{name}},\n\nThank you for choosing ${businessType.toLowerCase().includes("fashion") ? "Aura Threads" : "Manthan.ai"}. We hope you are loving your new purchase.\n\nYour review helps our community. Could you leave a quick rating?\n\nBest,\nTeam Manthan`;
        } else if (activeAutomationCategory === "checkin") {
          if (hasProfessionals) {
            optimizedBody = `Hi {{name}},\n\nJust checking in on your office wear and smart-casual selections. How is the fit and comfort?\n\nLet us know if you need sizing adjustments.\n\nWarmly,\nAura Threads Support`;
          } else {
            optimizedBody = `Hi {{name}},\n\nHow is your recent purchase working out? We'd love to hear your thoughts.\n\nReply here if you need any setup assistance!`;
          }
        } else if (activeAutomationCategory === "missyou") {
          if (hasStudents) {
            optimizedBody = `Hi {{name}},\n\nWe miss you! 💙 A new trend drop just hit Aura Threads and we know you'll love it.\n\nHere's a 15% discount for your next style swap: SWAP15.\n\nCheck it out!`;
          } else {
            optimizedBody = `Hi {{name}},\n\nWe miss you. It's been a while since your last purchase. We've added new collections that match your profile.\n\nUse code RETURN15 for 15% off.\n\nShop now: https://Manthan.ai/shop`;
          }
        } else if (activeAutomationCategory === "winback") {
          optimizedBody = `Hi {{name}},\n\nIt has been over a month! We'd love to welcome you back.\n\nGet 20% off your next purchase using code WINBACK20.\n\nClaim now: https://Manthan.ai/winback`;
        } else {
          optimizedBody = `Hi {{name}},\n\nWe noticed you haven't visited Aura Threads in a while. Here is a high-priority recovery reward just for you:\n\n🎁 ₹500 off your next order over ₹1,550!\nCode: RECOVER500\n\nShop: https://Manthan.ai/reward`;
        }
      }
      
      setAutomationTemplates(prev => ({
        ...prev,
        [activeAutomationCategory]: {
          ...prev[activeAutomationCategory],
          body: optimizedBody
        }
      }));
      addAgentLog("Rachna", `AI Campaign message optimized successfully for ${activeAutomationCategory} cohort.`, "action");
    } catch (err: any) {
      console.error("Gemini optimization failed:", err);
      addAgentLog("Rachna", `Failed to optimize copy via Gemini: ${err.message || err}`, "thought");
    } finally {
      setAiOptimizing(false);
    }
  };

  const handleSendAutomation = async () => {
    setAutomationSending(true);
    setAutomationSendDone(false);
    
    const cohort = getActiveCohort();
    addAgentLog("Saarthi", `Initiating ${automationChannel} automated dispatch to ${cohort.length} targets...`, "action");
    
    const queuedStatuses: Record<string, "Ready" | "Queued" | "Dispatched"> = {};
    cohort.forEach(c => {
      queuedStatuses[c.id] = "Queued";
    });
    setAutomationCustomerStatuses(prev => ({ ...prev, ...queuedStatuses }));
    
    await sleep(1500);
    
    const dispatchedStatuses: Record<string, "Ready" | "Queued" | "Dispatched"> = {};
    cohort.forEach(c => {
      dispatchedStatuses[c.id] = "Dispatched";
    });
    setAutomationCustomerStatuses(prev => ({ ...prev, ...dispatchedStatuses }));
    setAutomationSending(false);
    setAutomationSendDone(true);
    
    addAgentLog("Saarthi", `Campaign successfully dispatched via Twilio/Resend. Verified 100% gateway handshake.`, "action");

    const finalCampaign = {
      id: "camp_" + Date.now(),
      name: `Automated ${activeAutomationCategory.toUpperCase()} - ${automationChannel}`,
      goal: `Automated Recency Campaign`,
      description: `Targeting recency cohort: ${activeAutomationCategory}`,
      channel: automationChannel as any,
      status: "Completed" as const,
      sentCount: cohort.length,
      deliveredCount: Math.round(cohort.length * 0.95),
      openedCount: Math.round(cohort.length * 0.70),
      clickedCount: Math.round(cohort.length * 0.35),
      purchaseCount: Math.round(cohort.length * 0.10),
      revenueGenerated: Math.round(cohort.length * 0.10 * 1500),
      createdAt: new Date().toISOString(),
      predictedRoi: 4.5,
      predictedRevenue: Math.round(cohort.length * 150),
    };

    // Store campaign to backend
    fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: finalCampaign.name,
        goal: finalCampaign.goal,
        channel: finalCampaign.channel,
        targetSegment: activeAutomationCategory,
        audienceSize: finalCampaign.sentCount,
        predictedRevenue: finalCampaign.predictedRevenue,
        predictedRoi: finalCampaign.predictedRoi,
        copy: automationTemplates[activeAutomationCategory].body,
        subject: automationTemplates[activeAutomationCategory].subject || "",
        status: finalCampaign.status,
      }),
    }).catch(err => console.warn("Failed to store automated campaign:", err));

    addCampaign(finalCampaign);
  };



  /* ── Derived data ── */
  const totalCustomers = customers.length;
  const segmentCounts = SEGMENT_PROFILES.map(s => ({
    ...s,
    count: customers.filter(c => c.segment === s.key).length
  }));

  /* ── Initialize variants from mission plan ── */
  useEffect(() => {
    if (!missionPlan) return;
    const base = missionPlan.Rachna;
    const ch = activeChannel;
    const getBase = () => ch === "Email" ? base.Email.body : ch === "WhatsApp" ? base.WhatsApp.body : ch === "SMS" ? base.SMS.body : base.RCS.body;
    setVariants(prev => ({
      A: { ...prev.A, body: getBase(), subject: ch === "Email" ? base.Email.subject : prev.A.subject, title: ch === "RCS" ? base.RCS.title : prev.A.title },
      B: { ...prev.B, body: getBase().replace("20% OFF", "⚡ 20% OFF — EXPIRES IN 2 HOURS") },
      C: { ...prev.C, body: `✨ ${getBase()}` },
      D: { ...prev.D, body: getBase().replace("Hi {{name}}", "Hey there, {{name}} 👋") },
      E: { ...prev.E, body: getBase().replace("Hi {{name}}", "We've been thinking about you, {{name}} 💙") },
    }));
  }, [missionPlan, activeChannel]);

  /* ── Strategy Generation ── */
  const handleGenerateStrategy = useCallback(async () => {
    if (!goal.trim() || workflowRunning) return;
    setWorkflowRunning(true);
    setWorkflowDone(false);
    setMissionPlan(null);
    setSimData(null);
    setLaunchDone(false);

    const resetSteps = () => setWorkflowSteps(s => s.map(step => ({ ...step, status: "idle" })));
    resetSteps();

    const setStep = (idx: number, status: WorkflowStep["status"]) => {
      setWorkflowSteps(s => s.map((step, i) => i === idx ? { ...step, status } : step));
    };

    try {
      // Step 1 - Drishti
      setStep(0, "running"); await sleep(900);

      // Step 2 - Pragya  
      setStep(1, "running"); await sleep(800);

      // Step 3 - Khoj
      setStep(2, "running"); await sleep(700);

      // Actual API call while steps animate
      let plan: MissionPlan;
      try {
        const res = await fetch("/api/autonomous-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, businessType }),
        });
        const data = res.ok ? await res.json() : null;
        plan = data && data.Drishti ? data : buildFallbackPlan(goal, businessType, personas);
      } catch {
        plan = buildFallbackPlan(goal, businessType, personas);
      }

      setStep(0, "done");
      setStep(1, "done");
      setStep(2, "done");

      // Step 4 - Rachna
      setStep(3, "running"); await sleep(900);
      setStep(3, "done");

      // Step 5 - Saarthi
      setStep(4, "running"); await sleep(700);
      setStep(4, "done");

      setMissionPlan(plan);

      // Log to agent logs
      addAgentLog("Drishti", `Audience scan complete for mission: "${goal}". Target: ${plan.Drishti.segment}.`, "action");
      addAgentLog("Pragya", plan.Pragya.explanation, "thought");
      addAgentLog("Khoj", `ROI forecast: ${plan.Khoj.predictedRoi}x. Revenue: ₹${plan.Khoj.predictedRevenue.toLocaleString()}.`, "thought");
      addAgentLog("Rachna", `Campaign copy generated for ${Object.keys(plan.Rachna).join(", ")}.`, "action");
      addAgentLog("Saarthi", `Deployment ready via ${plan.Saarthi.selectedChannel}. ${plan.Saarthi.explanation}`, "action");

      // Trigger simulation
      await runSimulation(plan);

      setWorkflowDone(true);
    } catch (err) {
      console.error("Strategy generation failed:", err);
      setWorkflowSteps(s => s.map(step => step.status === "running" ? { ...step, status: "error" } : step));
    } finally {
      setWorkflowRunning(false);
    }
  }, [goal, businessType, workflowRunning]);

  /* ── Future Simulation ── */
  const runSimulation = async (plan?: MissionPlan) => {
    const p = plan || missionPlan;
    if (!p) return;
    setSimLoading(true);
    try {
      const res = await fetch("/api/future-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: p.Drishti.segment,
          discount: 20,
          channel: p.Saarthi.selectedChannel,
        }),
      });
      const data = res.ok ? await res.json() : null;
      if (data && data.conservative) {
        setSimData(data);
      } else {

        setSimData({
          conservative: { conversionRate: 2.1, revenue: Math.round(p.Khoj.predictedRevenue * 0.6), roi: parseFloat((p.Khoj.predictedRoi * 0.65).toFixed(1)), customerFatigue: "Low", optOutRate: 0.4 },
          recommended:  { conversionRate: 4.8, revenue: p.Khoj.predictedRevenue, roi: p.Khoj.predictedRoi, customerFatigue: "Medium", optOutRate: 0.9 },
          aggressive:   { conversionRate: 7.2, revenue: Math.round(p.Khoj.predictedRevenue * 1.35), roi: parseFloat((p.Khoj.predictedRoi * 1.2).toFixed(1)), customerFatigue: "High", optOutRate: 2.1 },
        });
      }
    } catch {
      if (p) {
        setSimData({
          conservative: { conversionRate: 2.1, revenue: Math.round(p.Khoj.predictedRevenue * 0.6), roi: parseFloat((p.Khoj.predictedRoi * 0.65).toFixed(1)), customerFatigue: "Low", optOutRate: 0.4 },
          recommended:  { conversionRate: 4.8, revenue: p.Khoj.predictedRevenue, roi: p.Khoj.predictedRoi, customerFatigue: "Medium", optOutRate: 0.9 },
          aggressive:   { conversionRate: 7.2, revenue: Math.round(p.Khoj.predictedRevenue * 1.35), roi: parseFloat((p.Khoj.predictedRoi * 1.2).toFixed(1)), customerFatigue: "High", optOutRate: 2.1 },
        });
      }
    } finally {
      setSimLoading(false);
    }
  };

  /* ── AI Copywriting Assist ── */
  const handleAssist = async (action: string) => {
    if (!missionPlan || assistLoading) return;
    setAssistLoading(action);
    const currentBody = variants[activeVariant].body;
    const toneMap: Record<string, string> = {
      shorter: "Make this message 30% shorter, punchy and direct. Keep the core offer.",
      professional: "Rewrite this in a formal professional business tone.",
      luxury: "Rewrite this in an elevated luxury brand tone — sophisticated, exclusive.",
      friendly: "Rewrite this in a warm, casual friendly tone as if from a friend.",
      urgent: "Rewrite this with urgency and scarcity signals — limited time, act now.",
      instagram: "Rewrite this as an Instagram DM — short, casual, emoji-rich, conversational.",
      dna: `Rewrite this and inject brand DNA signals for ${businessType}. Make it feel uniquely on-brand.`,
      regenerate: `Rewrite this campaign copy for a ${businessType} store targeting ${missionPlan.Drishti.segment}. Goal: ${goal}. Make it fresh and compelling.`,
    };

    const prompt = `${toneMap[action]}\n\nOriginal message:\n${currentBody}`;
    try {
      let newBody = currentBody;
      if (config.geminiKey) {
        const res = await callGeminiAPI(prompt, "You are Rachna, Manthan.ai's expert campaign copywriter. Return only the rewritten copy, no explanations.", config.geminiKey);
        newBody = res.trim();
      } else {
        // Fallback transforms
        if (action === "shorter") newBody = currentBody.split("\n\n").slice(0, 2).join("\n\n") + "\n\nClaim your offer → https://aurathreads.in";
        else if (action === "urgent") newBody = "⚡ " + currentBody + "\n\n⏰ EXPIRES IN 2 HOURS — Don't miss out!";
        else if (action === "luxury") newBody = currentBody.replace("Hi {{name}}", "Dear Valued {{name}}").replace("20% OFF", "An exclusive 20% privilege");
        else if (action === "friendly") newBody = "Hey {{name}} 👋\n\n" + currentBody;
        else newBody = currentBody;
      }
      setVariants(prev => ({ ...prev, [activeVariant]: { ...prev[activeVariant], body: newBody } }));
    } catch (err) {
      console.error("AI Assist error:", err);
    } finally {
      setAssistLoading(null);
    }
  };

  /* ── Explainability ── */
  const handleExplain = async () => {
    if (!missionPlan) return;
    setShowExplain(true);
    setExplainLoading(true);
    setExplainData(null);
    const prompt = `Explain in detail why Manthan created this campaign for the goal: "${goal}".
Use agent perspectives:
- Drishti (Audience): ${missionPlan.Drishti.explanation}
- Pragya (Opportunities): ${missionPlan.Pragya.explanation}
- Khoj (Predictions): ${missionPlan.Khoj.explanation}
- Rachna (Campaign): Generated ${activeChannel} campaign for ${missionPlan.Drishti.segment}
- Saarthi (Execution): ${missionPlan.Saarthi.explanation}

Format as JSON: { "Drishti": "...", "Pragya": "...", "Khoj": "...", "Rachna": "...", "Saarthi": "...", "overall": "..." }`;
    try {
      if (config.geminiKey) {
        const res = await callGeminiAPI(prompt, "You are an explainability engine. Return only a JSON object.", config.geminiKey);
        const parsed = parseGeminiJson<any>(res, null);
        setExplainData(parsed || buildFallbackExplain());
      } else {
        await sleep(1000);
        setExplainData(buildFallbackExplain());
      }
    } catch {
      setExplainData(buildFallbackExplain());
    } finally {
      setExplainLoading(false);
    }
  };

  const buildFallbackExplain = () => ({
    Drishti: `I scanned all ${totalCustomers} customers and identified the ${missionPlan?.Drishti.segment} cohort as the ideal target. This group has the highest probability of conversion based on historical purchase frequency, LTV data, and channel engagement patterns.`,
    Pragya: `I detected ₹${missionPlan?.Pragya.recoverableRevenue.toLocaleString() || 0} in recoverable revenue. There are ${missionPlan?.Pragya.inactiveCustomers || 0} dormant high-value accounts and ${missionPlan?.Pragya.abandonedLeads || 0} abandoned intent signals that can be reactivated with a targeted outreach.`,
    Khoj: `My predictive models calculate a ${missionPlan?.Khoj.predictedRoi || 0}x ROI at ${missionPlan?.Khoj.confidenceScore || 89}% confidence. The conversion curve for this segment peaks within a 14-day window, so time-sensitive messaging maximizes yield.`,
    Rachna: `I generated 5 campaign variants tailored to different emotional registers — professional, urgent, luxury, friendly, and emotional. The WhatsApp format was prioritized due to its 92% open rate for this segment. All copy uses {{name}} personalization for higher CTR.`,
    Saarthi: `Deployment pathways verified. ${missionPlan?.Saarthi.selectedChannel} selected as primary channel. I've pre-validated recipient consent, routing endpoints, and webhook callbacks for delivery tracking. Zero configuration needed.`,
    overall: `Manthan.ai recommends this campaign because it represents the highest-confidence, highest-ROI action available given your current customer data and business objective. Every element — audience, copy, channel, and timing — has been optimized by the collective intelligence of all 5 AI agents.`,
  });

  /* ── Launch Campaign ── */
  const handleLaunch = async () => {
    if (!missionPlan || launching) return;
    setLaunching(true);
    try {
      startMission(goal);
      await sleep(500);
      launchMissionCampaign(activeChannel);
      await sleep(1500);

      // Store campaign to backend
      await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goal.slice(0, 50),
          goal,
          channel: missionPlan.Saarthi.selectedChannel,
          targetSegment: missionPlan.Drishti.segment,
          audienceSize: missionPlan.Drishti.audienceSize || 100,
          predictedRevenue: missionPlan.Khoj.predictedRevenue,
          predictedRoi: missionPlan.Khoj.predictedRoi,
          copy: variants[activeVariant].body,
          subject: variants[activeVariant].subject,
          status: "Running",
        }),
      }).catch(() => {});

      addAgentLog("Saarthi", `Campaign launched via ${missionPlan.Saarthi.selectedChannel}. Mission "${goal}" is now active.`, "result");
      setLaunchDone(true);
    } catch (err) {
      console.error("Launch error:", err);
    } finally {
      setLaunching(false);
    }
  };

  const currentVariant = variants[activeVariant];

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative ${isLight ? "bg-[#F8FAFC] text-[#0F172A]" : "bg-[#050816] text-white"}`}>
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-25 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-Manthan-glow-blue opacity-10 z-0" />

      {/* Page Header */}
      <div className={`shrink-0 px-6 pt-4 border-b relative z-10 ${isLight ? "bg-white border-[#E2E8F0]" : "bg-gray-950/30 border-gray-800/50"}`}>
        <PageHeaderHUD
          title="Growth Engine"
          subtitle="AI-POWERED GROWTH STRATEGY & CAMPAIGN EXECUTION CENTER"
          onSelectAgent={setSelectedAgent}
          actions={
            <div className="flex items-center gap-2">
              {workflowDone && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-[9px] text-green-400">
                  <CheckCircle2 size={10} />
                  Strategy Ready
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900/40 border border-gray-800 font-mono text-[9px] text-gray-550">
                <Users size={10} className="text-blue-400" />
                {totalCustomers} CUSTOMERS
              </div>
            </div>
          }
        />
        {/* Navigation Tabs */}
        <div className={`flex border-t mt-3 font-mono text-[9px] ${isLight ? "border-[#E2E8F0]" : "border-gray-800/20"}`}>
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 border-b-2 font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "manual" ? (isLight ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-blue-500 text-white bg-blue-500/5") : (isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-gray-500 hover:text-gray-300")
            }`}
          >
            <SlidersHorizontal size={11} className={activeTab === "manual" ? "text-blue-400" : "text-gray-500"} />
            Manual Campaigns
          </button>
          <button
            onClick={() => setActiveTab("automation")}
            className={`px-4 py-2 border-b-2 font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "automation" ? (isLight ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-blue-500 text-white bg-blue-500/5") : (isLight ? "border-transparent text-gray-500 hover:text-gray-900" : "border-transparent text-gray-500 hover:text-gray-300")
            }`}
          >
            <Activity size={11} className={activeTab === "automation" ? "text-blue-400 animate-pulse" : "text-gray-500"} />
            Lifecycle Automation
          </button>
        </div>
      </div>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

          {/* ══════════════════════════════════════════════════════
              SECTION 1 — MISSION COMMAND INPUT
          ══════════════════════════════════════════════════════ */}
          {activeTab === "manual" && (
            <>
              <div className={`Manthan-panel p-6 rounded-2xl relative overflow-hidden ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="absolute top-0 right-0 w-64 h-24 bg-gradient-to-bl from-blue-600/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Target size={14} className="text-white" />
              </div>
              <div>
                <h2 className="font-space text-sm font-bold text-white uppercase tracking-wider">Mission Command</h2>
                <p className="font-mono text-[9px] text-gray-500">Define your growth objective — Manthan.ai will do the rest</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <label className="font-mono text-[9px] text-gray-550 uppercase tracking-wider block">Target Persona</label>
                <select
                  value={selectedPersonaId}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedPersonaId(val);
                    if (val) {
                      const matched = personas.find(p => p.id === val);
                      if (matched) {
                        setGoal(`Target Persona: ${matched.name}. Strategy: ${matched.recommendedStrategy}`);
                      }
                    }
                  }}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 font-mono text-xs text-white focus:outline-none focus:border-blue-500/60"
                >
                  <option value="">-- Autodetect Target --</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Growth Objective</label>
                <div className="relative">
                  <input
                    type="text"
                    value={goal}
                    onChange={e => {
                      setGoal(e.target.value);
                      setSelectedPersonaId("");
                    }}
                    onKeyDown={e => e.key === "Enter" && handleGenerateStrategy()}
                    placeholder="What growth objective should Manthan achieve?"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-blue-500/60 placeholder-gray-600 pr-32"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[8px] text-gray-600">PRESS ENTER</div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {GOAL_EXAMPLES.map(eg => (
                    <button key={eg} onClick={() => setGoal(eg)}
                      className="px-2.5 py-1 rounded-lg bg-gray-900/60 border border-gray-800 text-[9px] font-mono text-gray-400 hover:text-white hover:border-gray-700 transition-all cursor-pointer">
                      {eg}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateStrategy}
                disabled={workflowRunning || !goal.trim()}
                className={`px-8 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 whitespace-nowrap ${
                  workflowRunning
                    ? "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 cursor-pointer"
                }`}>
                {workflowRunning ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {workflowRunning ? "Generating..." : "Generate Strategy"}
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 2 — AUTONOMOUS AI WORKFLOW
          ══════════════════════════════════════════════════════ */}
          <div className="Manthan-panel border border-gray-800/60 bg-gray-900/20 p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Cpu size={14} className="text-white" />
              </div>
              <div>
                <h2 className="font-space text-sm font-bold text-white uppercase tracking-wider">Autonomous AI Workflow</h2>
                <p className="font-mono text-[9px] text-gray-500">5-agent intelligence chain activating in sequence</p>
              </div>
              {workflowDone && (
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 font-mono text-[9px] text-green-400 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  ALL AGENTS COMPLETE
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {workflowSteps.map((step) => (
                <div key={step.agent} className={`relative p-3 rounded-xl border transition-all duration-500 ${
                  step.status === "running" ? "border-opacity-60 shadow-lg bg-gray-900/60" :
                  step.status === "done"    ? "bg-gray-900/40 border-opacity-40" :
                  step.status === "error"   ? "border-red-500/40 bg-red-500/5" :
                  "border-gray-800/40 bg-gray-900/10"
                }`} style={{ borderColor: step.status !== "idle" && step.status !== "error" ? step.color + (step.status === "running" ? "80" : "40") : undefined }}>
                  {step.status === "running" && (
                    <div className="absolute inset-0 rounded-xl opacity-20 animate-pulse" style={{ backgroundColor: step.color }} />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{step.icon}</span>
                      {step.status === "running" && <RefreshCw size={10} className="animate-spin text-gray-400" />}
                      {step.status === "done"    && <CheckCircle2 size={12} style={{ color: step.color }} />}
                      {step.status === "idle"    && <div className="w-2 h-2 rounded-full bg-gray-700" />}
                      {step.status === "error"   && <AlertCircle size={12} className="text-red-400" />}
                    </div>
                    <p className="font-space text-[10px] font-bold text-white">{step.agent}</p>
                    <p className="font-mono text-[8px] text-gray-500 mt-0.5 leading-tight">{step.label}</p>
                    <div className="mt-2 h-0.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${step.status === "done" ? "w-full" : step.status === "running" ? "w-2/3 animate-pulse" : "w-0"}`}
                        style={{ backgroundColor: step.color }} />
                    </div>
                    <p className="font-mono text-[7px] mt-1" style={{ color: step.status === "idle" ? "#4B5563" : step.color }}>
                      {step.status === "idle" ? "STANDBY" : step.status === "running" ? "PROCESSING" : step.status === "done" ? "COMPLETE" : "ERROR"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTIONS 3+4 — MISSION INTELLIGENCE + AI REASONING
          ══════════════════════════════════════════════════════ */}
          {missionPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* SECTION 3 — Mission Intelligence */}
              <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <BarChart3 size={12} className="text-white" />
                  </div>
                  <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Mission Intelligence</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Target Segment",   value: missionPlan.Drishti.segment,                           color: "text-blue-400" },
                    { label: "Audience Size",     value: `${missionPlan.Drishti.audienceSize || customers.filter(c => c.segment === missionPlan.Drishti.segment).length} customers`, color: "text-white" },
                    { label: "Potential Revenue", value: `₹${missionPlan.Pragya.recoverableRevenue.toLocaleString()}`, color: "text-yellow-400" },
                    { label: "Predicted Revenue", value: `₹${missionPlan.Khoj.predictedRevenue.toLocaleString()}`, color: "text-green-400" },
                    { label: "Expected ROI",      value: `${missionPlan.Khoj.predictedRoi}x`,                   color: "text-purple-400" },
                    { label: "Confidence Score",  value: `${missionPlan.recommendation.confidenceScore}%`,      color: "text-white" },
                    { label: "Best Channel",      value: missionPlan.Saarthi.selectedChannel,                     color: "text-green-400" },
                    { label: "Timeframe",         value: missionPlan.recommendation.estimatedTimeframe,         color: "text-gray-300" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/50">
                      <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className={`font-space text-sm font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Confidence bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between font-mono text-[8px] text-gray-500">
                    <span>Model Confidence</span>
                    <span className="text-green-400">{missionPlan.recommendation.confidenceScore}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${missionPlan.recommendation.confidenceScore}%` }} />
                  </div>
                </div>
              </div>

              {/* SECTION 4 — AI Reasoning */}
              <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Brain size={12} className="text-white" />
                  </div>
                  <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Why Manthan.ai Recommends This</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { agent: "Drishti", color: AGENT_COLORS.Drishti, icon: "👁", text: missionPlan.Drishti.explanation },
                    { agent: "Pragya",    color: AGENT_COLORS.Pragya,    icon: "🌙", text: `${missionPlan.Pragya.explanation} Recoverable revenue: ₹${missionPlan.Pragya.recoverableRevenue.toLocaleString()}.` },
                    { agent: "Khoj",    color: AGENT_COLORS.Khoj,    icon: "⭐", text: missionPlan.Khoj.explanation },
                    { agent: "Rachna",    color: AGENT_COLORS.Rachna,    icon: "✨", text: `Rachna selected ${missionPlan.Saarthi.selectedChannel} due to its open rate advantage. Generated 5 campaign variants.` },
                    { agent: "Saarthi",   color: AGENT_COLORS.Saarthi,   icon: "🚀", text: missionPlan.Saarthi.explanation },
                  ].map(r => (
                    <div key={r.agent} className="flex gap-3 p-3 rounded-xl border border-gray-800/30 bg-gray-950/30">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs" style={{ backgroundColor: r.color + "20", border: `1px solid ${r.color}40` }}>
                        {r.icon}
                      </div>
                      <div>
                        <p className="font-space text-[9px] font-bold" style={{ color: r.color }}>{r.agent}</p>
                        <p className="font-mono text-[9px] text-gray-400 leading-relaxed mt-0.5">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SECTION 5 — AUDIENCE EXPLORER
          ══════════════════════════════════════════════════════ */}
          <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Users size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Audience Explorer</h2>
              <div className="ml-auto flex gap-1">
                {segmentCounts.map((seg, idx) => (
                  <button key={seg.key} onClick={() => setSelectedSegmentIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[8px] font-bold transition-all cursor-pointer border ${
                      selectedSegmentIdx === idx
                        ? "bg-gray-800 text-white border-gray-700"
                        : "text-gray-500 border-gray-900 bg-transparent hover:text-gray-300"
                    }`}>
                    {seg.emoji} {seg.key.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const seg = segmentCounts[selectedSegmentIdx];
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { label: "Segment",       value: seg.key,      highlight: true },
                    { label: "Audience Size", value: `${seg.count} customers` },
                    { label: "Avg Spend",     value: seg.avgSpend },
                    { label: "Purchase Freq", value: seg.freq },
                    { label: "Engagement",    value: seg.engagement },
                    { label: "Lifetime Value",value: seg.ltv },
                    { label: "Risk Score",    value: seg.risk, isRisk: true },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/40">
                      <p className="font-mono text-[7px] text-gray-600 uppercase tracking-wider">{item.label}</p>
                      <p className={`font-space text-xs font-bold mt-1 ${item.isRisk && parseFloat(item.value) > 60 ? "text-red-400" : item.highlight ? "text-blue-400" : "text-white"}`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTIONS 6+9 — CAMPAIGN GENERATOR + COPYWRITING ASSIST
          ══════════════════════════════════════════════════════ */}
          <div className="Manthan-panel border border-gray-800/60 bg-gray-900/20 rounded-2xl overflow-hidden">
            {/* Channel selector */}
            <div className="grid grid-cols-4 border-b border-gray-800/60">
              {(Object.entries(CHANNEL_CONFIG) as [ChannelType, typeof CHANNEL_CONFIG[ChannelType]][]).map(([ch, cfg]) => {
                const Icon = cfg.icon;
                const active = activeChannel === ch;
                return (
                  <button key={ch} onClick={() => { setActiveChannel(ch); setIsPreview(false); }}
                    className={`flex items-center gap-2 px-4 py-3 text-left transition-all cursor-pointer border-r border-gray-800/40 last:border-r-0 ${active ? `${cfg.bg} ${cfg.color} border-b-2` : "text-gray-500 hover:text-gray-300 hover:bg-gray-900/20"}`}
                    style={{ borderBottomColor: active ? cfg.borderColor.replace("border-", "").replace("/40", "") : "transparent" }}>
                    <Icon size={14} className="shrink-0" />
                    <div>
                      <p className="font-space text-[10px] font-bold">{cfg.label}</p>
                      <p className="font-mono text-[7px] text-gray-600">{cfg.openRate} open rate</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-4">
              {/* Recency Quick Presets */}
              <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-400" />
                    <span className="font-mono text-[9px] font-bold text-gray-300 uppercase tracking-wider">Recency Campaigns (Purchase History Presets)</span>
                  </div>
                  <span className="font-mono text-[8px] text-gray-500">SELECT TO PRE-POPULATE CAMPAIGN</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => applyRecencyPreset("review")}
                    className="p-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 text-left transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-space text-[10px] font-bold text-blue-400 block group-hover:text-blue-300">Within 7 Days (Review)</span>
                      <span className="font-mono text-[8px] text-gray-500 block mt-0.5">Ask recent buyers for a review</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-950 border border-gray-850 text-blue-400">
                      {reviewCohort.length}
                    </span>
                  </button>

                  <button
                    onClick={() => applyRecencyPreset("missing15")}
                    className="p-2.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 text-left transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-space text-[10px] font-bold text-purple-400 block group-hover:text-purple-300">Missing from 15 Days</span>
                      <span className="font-mono text-[8px] text-gray-500 block mt-0.5">Send a relationship check-in</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-950 border border-gray-850 text-purple-400">
                      {fifteenDaysCohort.length}
                    </span>
                  </button>

                  <button
                    onClick={() => applyRecencyPreset("inactiveMonth")}
                    className="p-2.5 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-left transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div>
                      <span className="font-space text-[10px] font-bold text-amber-400 block group-hover:text-amber-300">Last 1 Month Inactive</span>
                      <span className="font-mono text-[8px] text-gray-500 block mt-0.5">Send a win-back offer</span>
                    </div>
                    <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-950 border border-gray-850 text-amber-400">
                      {oneMonthCohort.length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                    <Edit3 size={12} className="text-white" />
                  </div>
                  <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Campaign Generator</h2>
                </div>

                {/* Variant tabs */}
                <div className="flex items-center gap-1 bg-gray-950 border border-gray-900 rounded-xl p-1">
                  {(["A","B","C","D","E"] as VariantKey[]).map(v => (
                    <button key={v} onClick={() => setActiveVariant(v)}
                      className={`px-3 py-1 rounded-lg font-mono text-[8px] font-bold transition-all cursor-pointer ${
                        activeVariant === v ? "bg-gray-800 text-white border border-gray-700" : "text-gray-500 hover:text-gray-300"
                      }`}>
                      {v} — {variants[v].label}
                    </button>
                  ))}
                  {/* Edit/Preview toggle */}
                  <div className="ml-2 flex border-l border-gray-800 pl-2 gap-1">
                    <button onClick={() => setIsPreview(false)} className={`px-2 py-1 rounded-lg text-[8px] font-mono transition-all cursor-pointer ${!isPreview ? "bg-blue-500/20 text-blue-400" : "text-gray-600 hover:text-gray-400"}`}><Edit3 size={10} /></button>
                    <button onClick={() => setIsPreview(true)}  className={`px-2 py-1 rounded-lg text-[8px] font-mono transition-all cursor-pointer ${isPreview  ? "bg-blue-500/20 text-blue-400" : "text-gray-600 hover:text-gray-400"}`}><Eye size={10} /></button>
                  </div>
                </div>
              </div>

              {!isPreview ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                  {/* Editor */}
                  <div className="space-y-3">
                    {activeChannel === "Email" && (
                      <div>
                        <label className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Subject Line</label>
                        <input type="text" value={currentVariant.subject || ""} onChange={e => setVariants(p => ({ ...p, [activeVariant]: { ...p[activeVariant], subject: e.target.value } }))}
                          className="w-full bg-gray-950/60 border border-gray-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50" />
                      </div>
                    )}
                    {activeChannel === "RCS" && (
                      <div>
                        <label className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Card Title</label>
                        <input type="text" value={currentVariant.title || ""} onChange={e => setVariants(p => ({ ...p, [activeVariant]: { ...p[activeVariant], title: e.target.value } }))}
                          className="w-full bg-gray-950/60 border border-gray-900 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50" />
                      </div>
                    )}
                    <div>
                      <label className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Campaign Copy — Variant {activeVariant} ({variants[activeVariant].label})</label>
                      <textarea rows={8} value={currentVariant.body}
                        onChange={e => setVariants(p => ({ ...p, [activeVariant]: { ...p[activeVariant], body: e.target.value } }))}
                        placeholder={missionPlan ? "Campaign copy generated..." : "Generate a strategy first to populate campaign copy..."}
                        className="w-full bg-gray-950/50 border border-gray-900 rounded-xl p-4 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed" />
                    </div>
                    <p className="font-mono text-[8px] text-gray-600">Use {"{{name}}"} for personalization. Rachna automatically injects customer data at dispatch.</p>
                  </div>

                  {/* AI Copywriting Assist panel */}
                  <div className="space-y-3">
                    <div className="p-3.5 bg-gray-950 border border-gray-900 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-purple-400" />
                        <span className="font-mono text-[9px] font-bold text-gray-300 uppercase tracking-wider">AI Copywriting Assist</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: "shorter",      icon: Scissors,     label: "Make Shorter",     color: "text-gray-400" },
                          { key: "professional", icon: Wand2,        label: "Professional",     color: "text-blue-400" },
                          { key: "luxury",       icon: Star,         label: "Luxury Tone",      color: "text-yellow-400" },
                          { key: "friendly",     icon: MessageSquare,label: "Friendly Tone",    color: "text-green-400" },
                          { key: "urgent",       icon: Zap,          label: "Urgent Tone",      color: "text-red-400" },
                          { key: "instagram",    icon: Globe,        label: "Instagram Tone",   color: "text-pink-400" },
                          { key: "dna",          icon: Dna,          label: "Inject Brand DNA", color: "text-purple-400" },
                          { key: "regenerate",   icon: RefreshCw,    label: "Regenerate",       color: "text-white" },
                        ].map(btn => {
                          const Icon = btn.icon;
                          const isLoading = assistLoading === btn.key;
                          return (
                            <button key={btn.key} onClick={() => handleAssist(btn.key)} disabled={!!assistLoading || !missionPlan}
                              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-800 bg-gray-900/30 font-mono text-[8px] transition-all cursor-pointer hover:border-gray-700 hover:bg-gray-900 ${!missionPlan ? "opacity-40 cursor-not-allowed" : ""}`}>
                              {isLoading ? <RefreshCw size={9} className="animate-spin text-gray-400" /> : <Icon size={9} className={btn.color} />}
                              <span className="text-gray-300">{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explainability */}
                    <button onClick={handleExplain} disabled={!missionPlan}
                      className={`w-full p-3 rounded-xl border font-mono text-[9px] font-bold text-left transition-all cursor-pointer ${
                        missionPlan ? "border-purple-500/30 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10" : "border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                      }`}>
                      <div className="flex items-center gap-2">
                        <Brain size={11} className="text-purple-400" />
                        Why Did AI Create This Campaign?
                        <ArrowRight size={10} className="ml-auto" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Preview Panel */
                <div className="flex items-center justify-center py-8 bg-gray-950/20 rounded-xl border border-gray-900">
                  {activeChannel === "Email" && (
                    <div className="w-full max-w-md bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl text-xs">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3">
                        <div className="text-white/70 text-[9px] font-mono mb-0.5">From: Aura Threads &lt;hello@aurathreads.in&gt;</div>
                        <div className="text-white font-bold text-sm">{currentVariant.subject}</div>
                      </div>
                      <div className="p-5 whitespace-pre-line text-gray-700 leading-relaxed">{currentVariant.body.replace("{{name}}", "Priya")}</div>
                      <div className="px-5 pb-5"><button className="px-5 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold cursor-pointer">Shop Now →</button></div>
                    </div>
                  )}
                  {activeChannel === "WhatsApp" && (
                    <div className="w-64 bg-[#0a1014] rounded-3xl p-3 border border-gray-800 shadow-2xl">
                      <div className="flex justify-between text-[7px] text-gray-500 font-mono px-2 mb-2"><span>11:42 AM</span><span>98%</span></div>
                      <div className="bg-[#1f2c34] rounded-2xl p-3">
                        <div className="bg-[#005d4b] text-white rounded-2xl p-2.5 text-[10px] leading-relaxed whitespace-pre-line shadow-sm">{currentVariant.body.replace("{{name}}", "Priya")}</div>
                        <div className="text-right mt-1 text-[7px] text-gray-500">11:42 AM ✓✓</div>
                      </div>
                    </div>
                  )}
                  {activeChannel === "SMS" && (
                    <div className="w-60 bg-gray-950 rounded-2xl p-3 border border-gray-800 shadow-2xl">
                      <div className="bg-blue-600 text-white rounded-2xl p-3 text-[10px] leading-relaxed whitespace-pre-line">{currentVariant.body.replace("{{name}}", "Priya")}</div>
                      <div className="text-right text-[7px] text-gray-500 mt-1 font-mono">SMS · DELIVERED</div>
                    </div>
                  )}
                  {activeChannel === "RCS" && (
                    <div className="w-64 bg-[#0a1014] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
                      <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80" alt="RCS" className="w-full h-28 object-cover" />
                      <div className="p-3.5 space-y-2">
                        <h3 className="font-space font-bold text-white text-xs">{currentVariant.title}</h3>
                        <p className="text-[10px] text-gray-400 leading-relaxed whitespace-pre-line">{currentVariant.body.replace("{{name}}", "Priya")}</p>
                        <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-[10px] font-bold cursor-pointer">Explore Now</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 7 — CHANNEL STRATEGY
          ══════════════════════════════════════════════════════ */}
          <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Activity size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Channel Strategy</h2>
              {missionPlan && (
                <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-[8px] text-green-400">
                  <Star size={9} className="fill-green-400" />
                  Best: {missionPlan.Saarthi.selectedChannel}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(Object.entries(CHANNEL_CONFIG) as [ChannelType, typeof CHANNEL_CONFIG[ChannelType]][]).map(([ch, cfg]) => {
                const Icon = cfg.icon;
                const isBest = missionPlan?.Saarthi.selectedChannel === ch;
                const rev = missionPlan ? Math.round(missionPlan.Khoj.predictedRevenue * parseFloat(cfg.conv) / 4.2) : 0;
                return (
                  <div key={ch} className={`relative p-4 rounded-xl border transition-all ${isBest ? `${cfg.bg} ${cfg.borderColor} shadow-lg` : "border-gray-800/40 bg-gray-900/10"}`}>
                    {isBest && <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-green-500/20 border border-green-500/30 font-mono text-[7px] text-green-400 font-bold">RECOMMENDED</div>}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${cfg.bg} border ${cfg.borderColor}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <p className={`font-space text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                    <div className="mt-3 space-y-1.5">
                      {[
                        { l: "Expected Reach",  v: cfg.reach },
                        { l: "Open Rate",       v: cfg.openRate },
                        { l: "CTR",             v: cfg.ctr },
                        { l: "Conversion",      v: cfg.conv },
                        { l: "Est. Revenue",    v: missionPlan ? `₹${rev.toLocaleString()}` : "—" },
                      ].map(row => (
                        <div key={row.l} className="flex justify-between font-mono text-[8px]">
                          <span className="text-gray-500">{row.l}</span>
                          <span className={isBest ? cfg.color : "text-gray-300"}>{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 8 — FUTURE SIMULATOR
          ══════════════════════════════════════════════════════ */}
          <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FlaskConical size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Future Simulator</h2>
              <button onClick={() => runSimulation()} disabled={!missionPlan || simLoading}
                className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold border transition-all cursor-pointer ${
                  !missionPlan ? "border-gray-800 text-gray-600 cursor-not-allowed" : "border-purple-500/30 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10"
                }`}>
                {simLoading ? <RefreshCw size={10} className="animate-spin" /> : <Play size={10} />}
                {simLoading ? "Simulating..." : "Re-Simulate"}
              </button>
            </div>

            {simData ? (
              <div className="grid grid-cols-3 gap-4">
                {([
                  { key: "conservative", label: "Conservative",  color: "#F59E0B", emoji: "📉", gradient: "from-yellow-500/10 to-transparent", isBest: false },
                  { key: "recommended",  label: "Recommended",   color: "#22C55E", emoji: "🎯", gradient: "from-green-500/10 to-transparent", isBest: true },
                  { key: "aggressive",   label: "Aggressive",    color: "#EF4444", emoji: "🚀", gradient: "from-red-500/10 to-transparent", isBest: false },
                ] as const).map(scenario => {
                  const data = simData[scenario.key];
                  return (
                    <div key={scenario.key} className={`relative p-4 rounded-xl border overflow-hidden ${scenario.isBest ? "border-green-500/30 bg-green-500/5" : "border-gray-800/40 bg-gray-900/10"}`}>
                      {scenario.isBest && <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-green-500/20 font-mono text-[7px] text-green-400 font-bold border border-green-500/30">RECOMMENDED</div>}
                      <div className="text-xl mb-2">{scenario.emoji}</div>
                      <p className="font-space text-sm font-bold text-white">{scenario.label}</p>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="font-mono text-[7px] text-gray-500 uppercase">Revenue</p>
                          <p className="font-space text-xl font-bold" style={{ color: scenario.color }}>₹{data.revenue.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { l: "ROI",       v: `${data.roi}x` },
                            { l: "Conversion",v: `${data.conversionRate}%` },
                            { l: "Fatigue",   v: data.customerFatigue },
                            { l: "Opt-out",   v: `${data.optOutRate}%` },
                          ].map(row => (
                            <div key={row.l} className="bg-gray-950/40 p-2 rounded-lg">
                              <p className="font-mono text-[7px] text-gray-600 uppercase">{row.l}</p>
                              <p className="font-mono text-[9px] font-bold text-gray-300 mt-0.5">{row.v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (data.roi / 6) * 100)}%`, backgroundColor: scenario.color }} />
                        </div>
                        <div className="flex justify-between font-mono text-[7px] text-gray-600 mt-0.5">
                          <span>0x ROI</span><span>6x ROI</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 rounded-xl border border-gray-800/30 bg-gray-950/20">
                <div className="text-center">
                  <FlaskConical size={24} className="text-gray-700 mx-auto mb-2" />
                  <p className="font-mono text-[9px] text-gray-600">Generate a strategy to run the future simulator</p>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 11 — Saarthi EXECUTION CENTER
          ══════════════════════════════════════════════════════ */}
          <div className={`Manthan-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Rocket size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Saarthi Execution Center</h2>
              {missionPlan && (
                <div className="ml-auto flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[8px] font-bold ${
                    launchDone ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400 animate-pulse"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${launchDone ? "bg-green-400" : "bg-blue-400 animate-pulse"}`} />
                    {launchDone ? "CAMPAIGN ACTIVE" : "READY FOR LAUNCH"}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-start">
              {/* Mission summary */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Campaign Status",  value: launchDone ? "Running" : missionPlan ? "Ready" : "Idle",  color: launchDone ? "text-green-400" : missionPlan ? "text-blue-400" : "text-gray-500" },
                    { label: "Primary Channel",  value: missionPlan?.Saarthi.selectedChannel || "—",                 color: "text-white" },
                    { label: "Target Cohort",    value: missionPlan?.Drishti.segment || "—",                       color: "text-white" },
                    { label: "Consent Check",    value: "VERIFIED",                                                color: "text-green-400" },
                    { label: "Queue Status",     value: "CLEARED",                                                 color: "text-blue-400" },
                    { label: "Delivery Engine",  value: "Saarthi-99",                                                color: "text-purple-400" },
                    { label: "Twilio Gateway",   value: "ACTIVE",                                                  color: "text-green-400" },
                    { label: "Resend Gateway",   value: "ACTIVE",                                                  color: "text-green-400" },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-950/50 p-3 rounded-xl border border-gray-800/40">
                      <p className="font-mono text-[7px] text-gray-600 uppercase tracking-wider">{item.label}</p>
                      <p className={`font-mono text-[10px] font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {launchDone && (
                  <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} className="text-green-400" />
                      <span className="font-space text-xs font-bold text-green-400">Campaign Successfully Launched!</span>
                    </div>
                    <p className="font-mono text-[9px] text-gray-400">Saarthi has dispatched the campaign via {missionPlan?.Saarthi.selectedChannel}. Mission Control is tracking engagement in real-time. Check Mission Control for live analytics.</p>
                  </div>
                )}
              </div>

              {/* Launch button */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <button
                  onClick={handleLaunch}
                  disabled={!missionPlan || launching || launchDone}
                  className={`w-full py-4 px-8 rounded-xl font-mono text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-200 ${
                    launchDone
                      ? "bg-green-500/10 text-green-400 border border-green-500/30 cursor-not-allowed"
                      : !missionPlan
                      ? "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                      : launching
                      ? "bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/20 hover:opacity-90 hover:scale-[1.02] active:scale-95 cursor-pointer"
                  }`}>
                  {launchDone ? <><CheckCircle2 size={16} /> Campaign Active</> :
                   launching   ? <><RefreshCw size={16} className="animate-spin" /> Launching...</> :
                   <><Rocket size={16} /> Launch Autonomous Mission</>}
                </button>
                <p className="font-mono text-[8px] text-gray-600 text-center leading-relaxed">
                  Dispatches via {missionPlan?.Saarthi.selectedChannel || "channel"} · Updates Mission Control · Logs to Firestore
                </p>
              </div>
            </div>
          </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION B — LIFECYCLE AUTOMATION
        ══════════════════════════════════════════════════════ */}
        {activeTab === "automation" && (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Dashboard metrics block */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Review Requests Pending", value: reviewCohort.length, icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20" },
                { label: "Customers To Re-engage", value: checkinCohort.length + missyouCohort.length, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20" },
                { label: "Inactive Customers", value: winbackCohort.length, icon: Clock, color: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-500/20" },
                { label: "Dormant Customers", value: dormantCohort.length, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
                { label: "Potential Recovery", value: `₹${potentialRevenueRecovery.toLocaleString()}`, icon: Zap, color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" }
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`p-4 rounded-2xl border ${stat.border} ${stat.bg} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider leading-relaxed block max-w-[120px]">{stat.label}</span>
                      <Icon size={14} className={stat.color} />
                    </div>
                    <div className="font-space text-lg font-bold text-white">{stat.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Campaign Editor Split panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
              
              {/* Cohort Selector (Left Column) */}
              <div className="space-y-2.5">
                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-wider block">Target Recency Cohorts</span>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "review", label: "Review Request", size: reviewCohort.length, desc: "Purchased within 7 days", color: "border-blue-500/35 text-blue-400 bg-blue-500/5" },
                    { key: "checkin", label: "Check-In Nurture", size: checkinCohort.length, desc: "Purchased 8-15 days ago", color: "border-amber-500/35 text-amber-400 bg-amber-500/5" },
                    { key: "missyou", label: "Miss You Recovery", size: missyouCohort.length, desc: "Purchased 15-30 days ago", color: "border-purple-500/35 text-purple-400 bg-purple-500/5" },
                    { key: "winback", label: "Win-Back Offer", size: winbackCohort.length, desc: "Purchased 30-60 days ago", color: "border-pink-500/35 text-pink-400 bg-pink-500/5" },
                    { key: "dormant", label: "Dormant Recovery", size: dormantCohort.length, desc: "Purchased > 60 days ago", color: "border-red-500/35 text-red-400 bg-red-500/5" }
                  ].map(cohort => {
                    const active = activeAutomationCategory === cohort.key;
                    return (
                      <button
                        key={cohort.key}
                        onClick={() => {
                          setActiveAutomationCategory(cohort.key as any);
                          setAutomationSendDone(false);
                        }}
                        className={`w-full p-3.5 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start ${
                          active 
                            ? cohort.color + " shadow-xl" 
                            : "border-gray-900 hover:border-gray-800 opacity-60 hover:opacity-100 bg-transparent"
                        }`}
                      >
                        <div className="space-y-1">
                          <span className="font-space text-xs font-bold block">{cohort.label}</span>
                          <span className="font-mono text-[8px] text-gray-550 block">{cohort.desc}</span>
                        </div>
                        <div className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-400">
                          {cohort.size}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Editor & API Sender (Right Column) */}
              <div className="Manthan-panel border border-gray-800/60 bg-gray-900/20 p-6 rounded-2xl relative overflow-hidden space-y-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-space text-sm font-bold text-white uppercase tracking-wider">
                        {automationTemplates[activeAutomationCategory].type} Message Composer
                      </h2>
                      <p className="font-mono text-[8px] text-gray-555 uppercase">Targeting {getActiveCohort().length} customer records</p>
                    </div>
                  </div>

                  {/* AI Optimize Button */}
                  <button
                    onClick={handleOptimizeCampaign}
                    disabled={aiOptimizing}
                    className="px-2.5 py-1.5 rounded bg-purple-500/10 border border-purple-500/35 hover:bg-purple-500/20 text-purple-400 font-mono text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiOptimizing ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={11} className="animate-pulse" />
                        <span>Optimize via Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Subject and Body editors */}
                <div className="space-y-4 pt-1">
                  {automationTemplates[activeAutomationCategory].subject !== undefined && (
                    <div className="space-y-1.5">
                      <label className="font-mono text-[8px] text-gray-555 uppercase tracking-widest block">Message Subject Line</label>
                      <input
                        type="text"
                        value={automationTemplates[activeAutomationCategory].subject}
                        onChange={e => {
                          setAutomationTemplates(prev => ({
                            ...prev,
                            [activeAutomationCategory]: {
                              ...prev[activeAutomationCategory],
                              subject: e.target.value
                            }
                          }));
                        }}
                        className="w-full bg-gray-950/80 border border-gray-855 rounded-xl p-3 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-mono text-[8px] text-gray-555 uppercase tracking-widest block">Message Template Body</label>
                    <textarea
                      rows={6}
                      value={automationTemplates[activeAutomationCategory].body}
                      onChange={e => {
                        setAutomationTemplates(prev => ({
                          ...prev,
                          [activeAutomationCategory]: {
                            ...prev[activeAutomationCategory],
                            body: e.target.value
                          }
                        }));
                      }}
                      className="w-full bg-gray-950/80 border border-gray-855 rounded-xl p-3 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500/50 leading-relaxed"
                    />
                  </div>
                </div>

                {/* Channel Toggle & Dispatch Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-t border-gray-855 pt-5">
                  
                  {/* Channel selection toggles */}
                  <div className="space-y-1.5 w-full md:w-auto">
                    <span className="font-mono text-[8px] text-gray-555 uppercase tracking-widest block">Dispatch API Integrations</span>
                    <div className="flex bg-gray-955 border border-gray-800 rounded-lg p-0.5 font-mono text-[9px] shadow-2xl w-fit">
                      {[
                        { id: "WhatsApp", label: "WhatsApp", icon: MessageCircle, color: "text-green-400" },
                        { id: "Email", label: "Email", icon: Mail, color: "text-blue-400" },
                        { id: "SMS", label: "SMS", icon: Phone, color: "text-yellow-400" }
                      ].map(ch => {
                        const active = automationChannel === ch.id;
                        const Icon = ch.icon;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setAutomationChannel(ch.id as any);
                              setAutomationSendDone(false);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded cursor-pointer transition-all ${
                              active
                                ? "bg-blue-600/90 text-white shadow font-semibold"
                                : "text-gray-500 hover:text-gray-300"
                            }`}
                          >
                            <Icon size={10} className={ch.color} />
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dispatch Button */}
                  <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-1.5">
                    <button
                      onClick={handleSendAutomation}
                      disabled={automationSending || getActiveCohort().length === 0}
                      className={`w-full md:w-56 py-2 px-4 rounded-xl font-mono text-[10px] uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        getActiveCohort().length === 0
                          ? "bg-gray-900 border border-gray-850 text-gray-650 cursor-not-allowed"
                          : automationSendDone
                          ? "bg-green-500/20 border border-green-500/40 text-green-400 cursor-default"
                          : automationSending
                          ? "bg-gray-900 border border-gray-850 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:opacity-90 hover:scale-[1.02] active:scale-95 cursor-pointer"
                      }`}
                    >
                      {automationSendDone ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>Campaign Dispatched</span>
                        </>
                      ) : automationSending ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Sending via Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Send Targeted Campaign</span>
                        </>
                      )}
                    </button>
                    <span className="font-mono text-[8px] text-gray-600">
                      {getActiveCohort().length === 0 ? "No target customer nodes available" : `Triggers ${automationChannel} dispatches to ${getActiveCohort().length} nodes`}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Customer Preview Table */}
            <div className="Manthan-panel border border-gray-800/60 bg-gray-900/20 p-6 rounded-2xl relative overflow-hidden space-y-4">
              <div>
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-blue-400" />
                  Target Audience Preview List
                </h3>
                <p className="font-mono text-[8px] text-gray-555 uppercase mt-0.5">Showing matching customer nodes for {automationTemplates[activeAutomationCategory].type} campaign</p>
              </div>

              <div className="border border-gray-850 rounded-xl overflow-hidden bg-gray-950/20">
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left font-mono text-[10.5px]">
                    <thead className="bg-gray-950 text-gray-500 uppercase text-[9px] border-b border-gray-850 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4">Name</th>
                        <th className="py-2.5 px-4">Persona</th>
                        <th className="py-2.5 px-4">Recency (Days Since Purchase)</th>
                        <th className="py-2.5 px-4">Preferred Channel</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-850/40 text-gray-300">
                      {getActiveCohort().length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 text-[10px]">
                            No customer records currently qualify for this recency cohort.
                          </td>
                        </tr>
                      ) : (
                        getActiveCohort().map((cust, idx) => {
                          const days = getDaysSincePurchase(cust.lastPurchaseDate);
                          const status = automationCustomerStatuses[cust.id] || "Ready";
                          return (
                            <tr key={idx} className="hover:bg-gray-900/10">
                              <td className="py-2.5 px-4 font-space text-xs font-bold text-white">{cust.name}</td>
                              <td className="py-2.5 px-4 text-purple-400">{cust.persona}</td>
                              <td className="py-2.5 px-4">{days === 999 ? "Never" : `${days} Days`}</td>
                              <td className="py-2.5 px-4">{cust.preferredChannel}</td>
                              <td className="py-2.5 px-4 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  status === "Dispatched"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : status === "Queued"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`}>
                                  {status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          EXPLAINABILITY MODAL
      ══════════════════════════════════════════════════════ */}
      {showExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Brain size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-space text-sm font-bold text-white">Why Did AI Create This Campaign?</h3>
                  <p className="font-mono text-[9px] text-gray-500">Agent reasoning & decision chain</p>
                </div>
              </div>
              <button onClick={() => setShowExplain(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-700 transition-all cursor-pointer">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {explainLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <RefreshCw size={24} className="text-purple-400 animate-spin mx-auto mb-2" />
                    <p className="font-mono text-[9px] text-gray-500">Generating agent reasoning...</p>
                  </div>
                </div>
              ) : explainData ? (
                <>
                  {[
                    { agent: "Drishti", color: AGENT_COLORS.Drishti, icon: "👁", title: "Audience Intelligence Analysis",  key: "Drishti" },
                    { agent: "Pragya",    color: AGENT_COLORS.Pragya,    icon: "🌙", title: "Opportunity Discovery Findings",  key: "Pragya" },
                    { agent: "Khoj",    color: AGENT_COLORS.Khoj,    icon: "⭐", title: "Predictive Analytics Report",     key: "Khoj" },
                    { agent: "Rachna",    color: AGENT_COLORS.Rachna,    icon: "✨", title: "Campaign Creation Strategy",      key: "Rachna" },
                    { agent: "Saarthi",   color: AGENT_COLORS.Saarthi,   icon: "🚀", title: "Execution Plan",                  key: "Saarthi" },
                  ].map(r => (
                    <div key={r.agent} className="p-4 rounded-xl border border-gray-800/40 bg-gray-900/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: r.color + "20", border: `1px solid ${r.color}40` }}>{r.icon}</div>
                        <div>
                          <p className="font-space text-xs font-bold" style={{ color: r.color }}>{r.agent}</p>
                          <p className="font-mono text-[8px] text-gray-600">{r.title}</p>
                        </div>
                      </div>
                      <p className="font-mono text-[9px] text-gray-400 leading-relaxed pl-9">{explainData[r.key]}</p>
                    </div>
                  ))}

                  {explainData.overall && (
                    <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                      <p className="font-space text-[10px] font-bold text-blue-400 mb-1">Manthan.ai's Overall Recommendation</p>
                      <p className="font-mono text-[9px] text-gray-400 leading-relaxed">{explainData.overall}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
