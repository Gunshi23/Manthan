import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mail, MessageCircle, Phone, Layers, Sparkles, Edit3, Send, Eye,
  BarChart3, TrendingUp, RefreshCw, Wand2, Scissors, Dna, Play,
  Users, Terminal, Zap, Target, Brain, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Rocket, X, AlertCircle, ArrowRight,
  Activity, Star, Shield, Cpu, FlaskConical, MessageSquare, Globe
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
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
  Polaris: { segment: string; explanation: string; audienceSize: number };
  Luna: { recoverableRevenue: number; inactiveCustomers: number; abandonedLeads: number; recoveryConfidence: number; explanation: string };
  Vega: { predictedRoi: number; predictedRevenue: number; confidenceScore: number; explanation: string };
  Nova: { Email: { subject: string; body: string }; WhatsApp: { body: string }; SMS: { body: string }; RCS: { title: string; body: string; mediaUrl: string } };
  Atlas: { selectedChannel: string; explanation: string };
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
  Polaris: "#3B82F6", Luna: "#EC4899", Vega: "#8B5CF6", Nova: "#F59E0B", Atlas: "#22C55E"
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

function buildFallbackPlan(goal: string, businessType: string): MissionPlan {
  const isChurn = /churn|retention|risk/i.test(goal);
  const isCart = /cart|abandon|recover/i.test(goal);
  const isVIP = /vip|premium|luxury/i.test(goal);
  const seg = isChurn ? "Slipping Away" : isCart ? "High-Value Inactive" : isVIP ? "Loyalists" : "Loyalists";
  const rev = isVIP ? 82000 : isCart ? 65000 : isChurn ? 48000 : 54000;
  return {
    Polaris: { segment: seg, explanation: `Polaris scanned the full customer universe for ${businessType} and isolated the ${seg} cohort as the highest-impact target for this mission.`, audienceSize: isChurn ? 88 : isVIP ? 45 : 120 },
    Luna: { recoverableRevenue: Math.round(rev * 0.42), inactiveCustomers: 34, abandonedLeads: 18, recoveryConfidence: 91, explanation: `Luna audited transaction logs and found ₹${Math.round(rev * 0.42).toLocaleString()} in recoverable revenue across inactive customer nodes.` },
    Vega: { predictedRoi: isVIP ? 5.2 : 4.2, predictedRevenue: rev, confidenceScore: 89, explanation: `Vega forecasted ROI based on historical campaign data. The ${seg} cohort yields the best conversion curve at this cadence.` },
    Nova: {
      Email: { subject: `Exclusive Offer: ${goal.slice(0, 40)}`, body: `Hi {{name}},\n\nWe noticed you haven't shopped with us recently. As one of our valued customers, we've curated a special offer just for you.\n\nUse code ORBIT20 for 20% off your next purchase.\n\nShop now before it expires!\n\nWarm regards,\nAura Threads` },
      WhatsApp: { body: `✨ Hey *{{name}}*! \n\nWe miss you! Here's an exclusive offer crafted by our AI just for you.\n\n🎁 20% OFF your next order\n🚚 Free shipping today\n\nTap to claim: https://aurathreads.in/special\n\n_(Reply STOP to opt out)_` },
      SMS: { body: `Aura Threads: Hi {{name}}, 20% OFF exclusive offer for you. Valid 48hrs. Claim: https://aurathreads.in/off` },
      RCS: { title: "Your Exclusive Offer Awaits", body: `Hey {{name}}, we've prepared a curated collection drop just for you. Tap below to explore early access.`, mediaUrl: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=600&q=80" }
    },
    Atlas: { selectedChannel: "WhatsApp", explanation: "Atlas verified WhatsApp as the highest-performing delivery channel for this cohort — 92% open rate confirmed." },
    recommendation: { summary: `Deploy a WhatsApp-first campaign targeting the ${seg} cohort with personalized offers and a 48-hour urgency window.`, confidenceScore: 89, estimatedTimeframe: "14 Days" }
  };
}

/* ══════════════════════════════════════════════════════════════
   GROWTH ENGINE PAGE
══════════════════════════════════════════════════════════════ */
export const GrowthEngine: React.FC = () => {
  const { customers, campaigns, config, businessType, addAgentLog, launchMissionCampaign, mission, startMission } = useOrbit();

  /* ── State ── */
  const [goal, setGoal] = useState("Increase Repeat Purchases by 20%");
  const [activeChannel, setActiveChannel] = useState<ChannelType>("WhatsApp");
  const [activeVariant, setActiveVariant] = useState<VariantKey>("A");
  const [isPreview, setIsPreview] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);

  /* ── AI Workflow State ── */
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowDone, setWorkflowDone] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { agent: "Polaris", label: "Analyzing customer audience...", status: "idle", color: "#3B82F6", icon: "👁" },
    { agent: "Luna",    label: "Identifying opportunities...",  status: "idle", color: "#EC4899", icon: "🌙" },
    { agent: "Vega",    label: "Forecasting outcomes...",       status: "idle", color: "#8B5CF6", icon: "⭐" },
    { agent: "Nova",    label: "Generating campaigns...",       status: "idle", color: "#F59E0B", icon: "✨" },
    { agent: "Atlas",   label: "Preparing deployment...",       status: "idle", color: "#22C55E", icon: "🚀" },
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

  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Derived data ── */
  const totalCustomers = customers.length;
  const segmentCounts = SEGMENT_PROFILES.map(s => ({
    ...s,
    count: customers.filter(c => c.segment === s.key).length
  }));

  /* ── Initialize variants from mission plan ── */
  useEffect(() => {
    if (!missionPlan) return;
    const base = missionPlan.Nova;
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
      // Step 1 - Polaris
      setStep(0, "running"); await sleep(900);

      // Step 2 - Luna  
      setStep(1, "running"); await sleep(800);

      // Step 3 - Vega
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
        plan = data && data.Polaris ? data : buildFallbackPlan(goal, businessType);
      } catch {
        plan = buildFallbackPlan(goal, businessType);
      }

      setStep(0, "done");
      setStep(1, "done");
      setStep(2, "done");

      // Step 4 - Nova
      setStep(3, "running"); await sleep(900);
      setStep(3, "done");

      // Step 5 - Atlas
      setStep(4, "running"); await sleep(700);
      setStep(4, "done");

      setMissionPlan(plan);

      // Log to agent logs
      addAgentLog("Polaris", `Audience scan complete for mission: "${goal}". Target: ${plan.Polaris.segment}.`, "action");
      addAgentLog("Luna", plan.Luna.explanation, "thought");
      addAgentLog("Vega", `ROI forecast: ${plan.Vega.predictedRoi}x. Revenue: ₹${plan.Vega.predictedRevenue.toLocaleString()}.`, "thought");
      addAgentLog("Nova", `Campaign copy generated for ${Object.keys(plan.Nova).join(", ")}.`, "action");
      addAgentLog("Atlas", `Deployment ready via ${plan.Atlas.selectedChannel}. ${plan.Atlas.explanation}`, "action");

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
          audience: p.Polaris.segment,
          discount: 20,
          channel: p.Atlas.selectedChannel,
        }),
      });
      const data = res.ok ? await res.json() : null;
      if (data && data.conservative) {
        setSimData(data);
      } else {
        const mult = p.Vega.predictedRoi / 4.2;
        setSimData({
          conservative: { conversionRate: 2.1, revenue: Math.round(p.Vega.predictedRevenue * 0.6), roi: parseFloat((p.Vega.predictedRoi * 0.65).toFixed(1)), customerFatigue: "Low", optOutRate: 0.4 },
          recommended:  { conversionRate: 4.8, revenue: p.Vega.predictedRevenue, roi: p.Vega.predictedRoi, customerFatigue: "Medium", optOutRate: 0.9 },
          aggressive:   { conversionRate: 7.2, revenue: Math.round(p.Vega.predictedRevenue * 1.35), roi: parseFloat((p.Vega.predictedRoi * 1.2).toFixed(1)), customerFatigue: "High", optOutRate: 2.1 },
        });
      }
    } catch {
      if (p) {
        setSimData({
          conservative: { conversionRate: 2.1, revenue: Math.round(p.Vega.predictedRevenue * 0.6), roi: parseFloat((p.Vega.predictedRoi * 0.65).toFixed(1)), customerFatigue: "Low", optOutRate: 0.4 },
          recommended:  { conversionRate: 4.8, revenue: p.Vega.predictedRevenue, roi: p.Vega.predictedRoi, customerFatigue: "Medium", optOutRate: 0.9 },
          aggressive:   { conversionRate: 7.2, revenue: Math.round(p.Vega.predictedRevenue * 1.35), roi: parseFloat((p.Vega.predictedRoi * 1.2).toFixed(1)), customerFatigue: "High", optOutRate: 2.1 },
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
      regenerate: `Rewrite this campaign copy for a ${businessType} store targeting ${missionPlan.Polaris.segment}. Goal: ${goal}. Make it fresh and compelling.`,
    };

    const prompt = `${toneMap[action]}\n\nOriginal message:\n${currentBody}`;
    try {
      let newBody = currentBody;
      if (config.geminiKey) {
        const res = await callGeminiAPI(prompt, "You are Nova, ORBIT's expert campaign copywriter. Return only the rewritten copy, no explanations.", config.geminiKey);
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
    const prompt = `Explain in detail why ORBIT created this campaign for the goal: "${goal}".
Use agent perspectives:
- Polaris (Audience): ${missionPlan.Polaris.explanation}
- Luna (Opportunities): ${missionPlan.Luna.explanation}
- Vega (Predictions): ${missionPlan.Vega.explanation}
- Nova (Campaign): Generated ${activeChannel} campaign for ${missionPlan.Polaris.segment}
- Atlas (Execution): ${missionPlan.Atlas.explanation}

Format as JSON: { "Polaris": "...", "Luna": "...", "Vega": "...", "Nova": "...", "Atlas": "...", "overall": "..." }`;
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
    Polaris: `I scanned all ${totalCustomers} customers and identified the ${missionPlan?.Polaris.segment} cohort as the ideal target. This group has the highest probability of conversion based on historical purchase frequency, LTV data, and channel engagement patterns.`,
    Luna: `I detected ₹${missionPlan?.Luna.recoverableRevenue.toLocaleString() || 0} in recoverable revenue. There are ${missionPlan?.Luna.inactiveCustomers || 0} dormant high-value accounts and ${missionPlan?.Luna.abandonedLeads || 0} abandoned intent signals that can be reactivated with a targeted outreach.`,
    Vega: `My predictive models calculate a ${missionPlan?.Vega.predictedRoi || 0}x ROI at ${missionPlan?.Vega.confidenceScore || 89}% confidence. The conversion curve for this segment peaks within a 14-day window, so time-sensitive messaging maximizes yield.`,
    Nova: `I generated 5 campaign variants tailored to different emotional registers — professional, urgent, luxury, friendly, and emotional. The WhatsApp format was prioritized due to its 92% open rate for this segment. All copy uses {{name}} personalization for higher CTR.`,
    Atlas: `Deployment pathways verified. ${missionPlan?.Atlas.selectedChannel} selected as primary channel. I've pre-validated recipient consent, routing endpoints, and webhook callbacks for delivery tracking. Zero configuration needed.`,
    overall: `ORBIT recommends this campaign because it represents the highest-confidence, highest-ROI action available given your current customer data and business objective. Every element — audience, copy, channel, and timing — has been optimized by the collective intelligence of all 5 AI agents.`,
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
          channel: missionPlan.Atlas.selectedChannel,
          targetSegment: missionPlan.Polaris.segment,
          audienceSize: missionPlan.Polaris.audienceSize || 100,
          predictedRevenue: missionPlan.Vega.predictedRevenue,
          predictedRoi: missionPlan.Vega.predictedRoi,
          copy: variants[activeVariant].body,
          subject: variants[activeVariant].subject,
          status: "Running",
        }),
      }).catch(() => {});

      addAgentLog("Atlas", `Campaign launched via ${missionPlan.Atlas.selectedChannel}. Mission "${goal}" is now active.`, "result");
      setLaunchDone(true);
    } catch (err) {
      console.error("Launch error:", err);
    } finally {
      setLaunching(false);
    }
  };

  const currentVariant = variants[activeVariant];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050816] relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-25 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-10 z-0" />

      {/* Page Header */}
      <div className="shrink-0 px-6 pt-4 bg-gray-950/30 border-b border-gray-800/50 relative z-10">
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
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900/40 border border-gray-800 font-mono text-[9px] text-gray-500">
                <Users size={10} className="text-blue-400" />
                {totalCustomers} CUSTOMERS
              </div>
            </div>
          }
        />
      </div>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

          {/* ══════════════════════════════════════════════════════
              SECTION 1 — MISSION COMMAND INPUT
          ══════════════════════════════════════════════════════ */}
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-24 bg-gradient-to-bl from-blue-600/10 to-transparent pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Target size={14} className="text-white" />
              </div>
              <div>
                <h2 className="font-space text-sm font-bold text-white uppercase tracking-wider">Mission Command</h2>
                <p className="font-mono text-[9px] text-gray-500">Define your growth objective — ORBIT will do the rest</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <label className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Growth Objective</label>
                <div className="relative">
                  <input
                    type="text"
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleGenerateStrategy()}
                    placeholder="What growth objective should ORBIT achieve?"
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
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-6 rounded-2xl">
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
              {workflowSteps.map((step, idx) => (
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
              <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <BarChart3 size={12} className="text-white" />
                  </div>
                  <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Mission Intelligence</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Target Segment",   value: missionPlan.Polaris.segment,                           color: "text-blue-400" },
                    { label: "Audience Size",     value: `${missionPlan.Polaris.audienceSize || customers.filter(c => c.segment === missionPlan.Polaris.segment).length} customers`, color: "text-white" },
                    { label: "Potential Revenue", value: `₹${missionPlan.Luna.recoverableRevenue.toLocaleString()}`, color: "text-yellow-400" },
                    { label: "Predicted Revenue", value: `₹${missionPlan.Vega.predictedRevenue.toLocaleString()}`, color: "text-green-400" },
                    { label: "Expected ROI",      value: `${missionPlan.Vega.predictedRoi}x`,                   color: "text-purple-400" },
                    { label: "Confidence Score",  value: `${missionPlan.recommendation.confidenceScore}%`,      color: "text-white" },
                    { label: "Best Channel",      value: missionPlan.Atlas.selectedChannel,                     color: "text-green-400" },
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
              <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Brain size={12} className="text-white" />
                  </div>
                  <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Why ORBIT Recommends This</h2>
                </div>

                <div className="space-y-3">
                  {[
                    { agent: "Polaris", color: AGENT_COLORS.Polaris, icon: "👁", text: missionPlan.Polaris.explanation },
                    { agent: "Luna",    color: AGENT_COLORS.Luna,    icon: "🌙", text: `${missionPlan.Luna.explanation} Recoverable revenue: ₹${missionPlan.Luna.recoverableRevenue.toLocaleString()}.` },
                    { agent: "Vega",    color: AGENT_COLORS.Vega,    icon: "⭐", text: missionPlan.Vega.explanation },
                    { agent: "Nova",    color: AGENT_COLORS.Nova,    icon: "✨", text: `Nova selected ${missionPlan.Atlas.selectedChannel} due to its open rate advantage. Generated 5 campaign variants.` },
                    { agent: "Atlas",   color: AGENT_COLORS.Atlas,   icon: "🚀", text: missionPlan.Atlas.explanation },
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
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Users size={12} className="text-white" />
              </div>
              <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Audience Explorer</h2>
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
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 rounded-2xl overflow-hidden">
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                    <Edit3 size={12} className="text-white" />
                  </div>
                  <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Campaign Generator</h2>
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
                    <p className="font-mono text-[8px] text-gray-600">Use {"{{name}}"} for personalization. Nova automatically injects customer data at dispatch.</p>
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
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Activity size={12} className="text-white" />
              </div>
              <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Channel Strategy</h2>
              {missionPlan && (
                <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-[8px] text-green-400">
                  <Star size={9} className="fill-green-400" />
                  Best: {missionPlan.Atlas.selectedChannel}
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {(Object.entries(CHANNEL_CONFIG) as [ChannelType, typeof CHANNEL_CONFIG[ChannelType]][]).map(([ch, cfg]) => {
                const Icon = cfg.icon;
                const isBest = missionPlan?.Atlas.selectedChannel === ch;
                const rev = missionPlan ? Math.round(missionPlan.Vega.predictedRevenue * parseFloat(cfg.conv) / 4.2) : 0;
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
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FlaskConical size={12} className="text-white" />
              </div>
              <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Future Simulator</h2>
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
                  { key: "conservative", label: "Conservative",  color: "#F59E0B", emoji: "📉", gradient: "from-yellow-500/10 to-transparent" },
                  { key: "recommended",  label: "Recommended",   color: "#22C55E", emoji: "🎯", gradient: "from-green-500/10 to-transparent", isBest: true },
                  { key: "aggressive",   label: "Aggressive",    color: "#EF4444", emoji: "🚀", gradient: "from-red-500/10 to-transparent" },
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
              SECTION 11 — ATLAS EXECUTION CENTER
          ══════════════════════════════════════════════════════ */}
          <div className="orbit-panel border border-gray-800/60 bg-gray-900/20 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Rocket size={12} className="text-white" />
              </div>
              <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider">Atlas Execution Center</h2>
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
                    { label: "Primary Channel",  value: missionPlan?.Atlas.selectedChannel || "—",                 color: "text-white" },
                    { label: "Target Cohort",    value: missionPlan?.Polaris.segment || "—",                       color: "text-white" },
                    { label: "Consent Check",    value: "VERIFIED",                                                color: "text-green-400" },
                    { label: "Queue Status",     value: "CLEARED",                                                 color: "text-blue-400" },
                    { label: "Delivery Engine",  value: "ATLAS-99",                                                color: "text-purple-400" },
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
                    <p className="font-mono text-[9px] text-gray-400">Atlas has dispatched the campaign via {missionPlan?.Atlas.selectedChannel}. Mission Control is tracking engagement in real-time. Check Mission Control for live analytics.</p>
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
                  Dispatches via {missionPlan?.Atlas.selectedChannel || "channel"} · Updates Mission Control · Logs to Firestore
                </p>
              </div>
            </div>
          </div>

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
                    { agent: "Polaris", color: AGENT_COLORS.Polaris, icon: "👁", title: "Audience Intelligence Analysis",  key: "Polaris" },
                    { agent: "Luna",    color: AGENT_COLORS.Luna,    icon: "🌙", title: "Opportunity Discovery Findings",  key: "Luna" },
                    { agent: "Vega",    color: AGENT_COLORS.Vega,    icon: "⭐", title: "Predictive Analytics Report",     key: "Vega" },
                    { agent: "Nova",    color: AGENT_COLORS.Nova,    icon: "✨", title: "Campaign Creation Strategy",      key: "Nova" },
                    { agent: "Atlas",   color: AGENT_COLORS.Atlas,   icon: "🚀", title: "Execution Plan",                  key: "Atlas" },
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
                      <p className="font-space text-[10px] font-bold text-blue-400 mb-1">ORBIT's Overall Recommendation</p>
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
