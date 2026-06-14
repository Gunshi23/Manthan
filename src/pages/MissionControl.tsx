import React, { useState, useEffect, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import {
  TrendingUp, Target, Zap, Shield,
  Activity, ChevronUp, Cpu,
  Layers, X, Play, Pause, RefreshCw, Plus, 
  Trash2, Copy, FileText, Database,
  Flame, BarChart3, Fingerprint, Crown, ShieldAlert,
  MapPin, ArrowRight, Clock, Award
} from "lucide-react";
import { AgentCardModal } from "../components/AgentCardModal";
import { PageHeaderHUD } from "../components/PageHeaderHUD";

/* ─── Animated Counter Hook ─────────────────────────────────── */
function useCounter(target: number, duration = 1000, prefix = "", suffix = "") {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return `${prefix}${value.toLocaleString()}${suffix}`;
}

/* ─── Sparkline SVG Component ──────────────────────────────── */
const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({
  values, color, height = 40
}) => {
  const w = 120, h = height;
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const d = `M${pts.join(" L")}`;
  const fill = `M${pts[0]} L${pts.join(" L")} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#grad-${color})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle
        cx={w}
        cy={h - ((values[values.length - 1] - min) / range) * h}
        r="3"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
};

/* ─── Radial Gauge Component ────────────────────────────────── */
const RadialGauge: React.FC<{ value: number; max?: number; color: string; label: string; size?: number; isLight?: boolean }> = ({
  value, max = 100, color, label, size = 80, isLight = false
}) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"} strokeWidth="6" />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center rotate-90">
          <span className={`font-space font-bold text-xs ${isLight ? "text-gray-900" : "text-white"}`}>{value}%</span>
        </div>
      </div>
      <span className={`font-mono text-[8px] uppercase tracking-widest text-center ${isLight ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
    </div>
  );
};

/* ─── Agent Info ────────────────────────────────────────────── */
const AGENT_CONFIG = {
  Polaris: { color: "#3B82F6", role: "Audience Intelligence" },
  Luna: { color: "#F59E0B", role: "Opportunity Detection" },
  Vega: { color: "#8B5CF6", role: "Revenue Forecasting" },
  Nova: { color: "#EC4899", role: "Campaign Generator" },
  Atlas: { color: "#22C55E", role: "Campaign Dispatch" }
};

export const MissionControl: React.FC = () => {
  const {
    campaigns, orders, agentLogs, growthScore, networkHealth,
    revenueGoal, theme, lunaMetrics, customers, addAgentLog,
    missions, refreshMissions, updateMissionStatus, duplicateMission, deleteMission,
    topPersona, riskPersona, growthPersona, highestRevenuePersona,
    latestVerdict, workspaceDna
  } = useOrbit();
  
  const isLight = theme === "executive";
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  // Timeframe selector state for KPIs
  const [kpiTimeframe, setKpiTimeframe] = useState<"Today" | "This Week" | "This Month">("This Month");

  // Opportunities State
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isOppsLoading, setIsOppsLoading] = useState(false);

  // Executive Briefing State
  const [briefing, setBriefing] = useState<string>("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);

  // Custom Mission Creator Modal/State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customGoal, setCustomGoal] = useState("");
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);

  // Real-Time Execution Pipeline State
  const [pipelineState, setPipelineState] = useState<{
    active: boolean;
    currentStep: "Polaris" | "Luna" | "Vega" | "Nova" | "Atlas" | "idle";
    logs: string[];
    progress: number;
    missionId?: string;
    missionGoal?: string;
    completedSteps: string[];
    generatedCampaignId?: string;
  }>({
    active: false,
    currentStep: "idle",
    logs: [],
    progress: 0,
    completedSteps: []
  });

  // Selected Mission Details Modal
  const [selectedMission, setSelectedMission] = useState<any | null>(null);

  // scrolling Agent Activity ticker state
  const [activityTicker, setActivityTicker] = useState<string[]>([]);

  // Demo Mode State
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const demoIntervalRef = useRef<any>(null);

  // Load and refresh initial data
  useEffect(() => {
    fetchOpportunities();
    fetchBriefing();
    refreshMissions();
  }, []);

  // Poll for list updates
  useEffect(() => {
    const timer = setInterval(() => {
      refreshMissions();
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshMissions]);

  // Activity Ticker scrolling entries generator
  useEffect(() => {
    const defaultActivities = [
      "Polaris clustered 145 repeat buyers based on LTV spikes",
      "Nova generated personalized RCS Rich Card draft variants",
      "Vega calculated 4.8x ROI forecast coefficients on slipping cohort",
      "Atlas dispatched 120 checkout drops via Twilio gateway",
      "Luna detected an abandoned cart leakage cluster in segment",
      "Polaris mapped 24 VIP customer churn threats to system dashboard",
      "Luna audited payment gateway leakage logs for 8 leads",
      "Vega projected ₹42,500 revenue window in 30-day forecast",
      "Nova injected brand DNA tokens into Diwali creative template"
    ];

    setActivityTicker(defaultActivities);

    const logTimer = setInterval(() => {
      if (agentLogs.length > 0) {
        const randomLog = agentLogs[Math.floor(Math.random() * agentLogs.length)];
        const text = `${randomLog.agent}: ${randomLog.message}`;
        setActivityTicker(prev => [text, ...prev].slice(0, 25));
      }
    }, 4000);

    return () => clearInterval(logTimer);
  }, [agentLogs]);

  // Fetch opportunities aggregation endpoint
  const fetchOpportunities = async () => {
    setIsOppsLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (e) {
      console.warn("Failed to retrieve opportunities:", e);
    } finally {
      setIsOppsLoading(false);
    }
  };

  // Fetch AI Briefing
  const fetchBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const res = await fetch("/api/analytics/briefing");
      if (res.ok) {
        const data = await res.json();
        setBriefing(data.briefing);
      }
    } catch (e) {
      console.warn("Briefing error:", e);
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // Timeframe calculation logic for KPIs
  const computeKPIMetrics = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const msInDay = 24 * 60 * 60 * 1000;

    let targetOrders = orders;
    let targetCampaigns = campaigns;
    let trendMultiplier = 1.0;

    if (kpiTimeframe === "Today") {
      targetOrders = orders.filter(o => o.date === todayStr);
      targetCampaigns = campaigns.filter(c => c.createdAt && c.createdAt.split("T")[0] === todayStr);
      trendMultiplier = 0.85; // Simulated ratio today vs yesterday
    } else if (kpiTimeframe === "This Week") {
      targetOrders = orders.filter(o => {
        const oDate = new Date(o.date);
        return (now.getTime() - oDate.getTime()) <= 7 * msInDay;
      });
      targetCampaigns = campaigns.filter(c => {
        if (!c.createdAt) return false;
        const cDate = new Date(c.createdAt);
        return (now.getTime() - cDate.getTime()) <= 7 * msInDay;
      });
      trendMultiplier = 1.14;
    } else {
      // Month
      targetOrders = orders.filter(o => {
        const oDate = new Date(o.date);
        return (now.getTime() - oDate.getTime()) <= 30 * msInDay;
      });
      targetCampaigns = campaigns.filter(c => {
        if (!c.createdAt) return false;
        const cDate = new Date(c.createdAt);
        return (now.getTime() - cDate.getTime()) <= 30 * msInDay;
      });
      trendMultiplier = 1.28;
    }

    const achieved = targetOrders.reduce((s, o) => s + o.amount, 0);
    const completedCamps = targetCampaigns.filter(c => c.status === "Completed");
    const campaignsCount = targetCampaigns.length;

    // Projected/Forecast calculations
    const forecast = Math.round(achieved * trendMultiplier);
    
    // Dynamic Growth score computed from conversion ratios
    const totalSent = completedCamps.reduce((s, c) => s + c.sentCount, 0);
    const totalPurchased = completedCamps.reduce((s, c) => s + c.purchaseCount, 0);
    const conversionAvg = totalSent > 0 ? (totalPurchased / totalSent) * 100 : 22.4;
    const computedGrowth = Math.min(99.8, Math.max(45, Math.round(growthScore * 10 + (conversionAvg - 22))));

    // Fallbacks if Today has zero data
    const finalAchieved = achieved || (kpiTimeframe === "Today" ? 14500 : achieved);
    const finalForecast = forecast || (kpiTimeframe === "Today" ? 18200 : forecast);

    return {
      achieved: finalAchieved,
      goal: Math.round(revenueGoal / (kpiTimeframe === "Today" ? 30 : kpiTimeframe === "This Week" ? 4.2 : 1)),
      forecast: finalForecast,
      growth: parseFloat((computedGrowth / 10).toFixed(1)),
      campaignsCount
    };
  };

  const kpis = computeKPIMetrics();

  const achievedCounter = useCounter(kpis.achieved, 800, "₹");
  const goalCounter = useCounter(kpis.goal, 800, "₹");
  const forecastCounter = useCounter(kpis.forecast, 800, "₹");
  const growthCounter = useCounter(Math.round(kpis.growth * 10), 800, "", "");

  /* ─── Real-Time Mission Execution Flow ─── */
  const triggerExecutionPipeline = async (goal: string, targetChannel: "Email" | "WhatsApp" | "SMS" | "RCS" = "WhatsApp") => {
    if (pipelineState.active) return;

    setPipelineState({
      active: true,
      currentStep: "Polaris",
      logs: [`[${new Date().toLocaleTimeString()}] Polaris: Initializing segment analysis for goal "${goal}"`],
      progress: 10,
      missionGoal: goal,
      completedSteps: []
    });

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    // 1. Polaris step
    await sleep(2000);
    const pMsg = `Polaris: Segment mapped. Isolated 18 dormant customers with LTV records > ₹8,000.`;
    addAgentLog("Polaris", pMsg, "action");
    setPipelineState(prev => ({
      ...prev,
      currentStep: "Luna",
      progress: 30,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${pMsg}`],
      completedSteps: [...prev.completedSteps, "Polaris"]
    }));

    // 2. Luna step
    await sleep(2000);
    const lMsg = `Luna: Leakage audit complete. Detected cart drop opportunity: Potential recovery revenue: ₹12,500.`;
    addAgentLog("Luna", lMsg, "action");
    setPipelineState(prev => ({
      ...prev,
      currentStep: "Vega",
      progress: 50,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${lMsg}`],
      completedSteps: [...prev.completedSteps, "Luna"]
    }));

    // 3. Vega step
    await sleep(2000);
    const vMsg = `Vega: Projected ROI: 4.8x. Predicted baseline conversion yield: 28% for channel ${targetChannel}.`;
    addAgentLog("Vega", vMsg, "thought");
    setPipelineState(prev => ({
      ...prev,
      currentStep: "Nova",
      progress: 70,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${vMsg}`],
      completedSteps: [...prev.completedSteps, "Vega"]
    }));

    // 4. Nova step
    await sleep(2000);
    const nMsg = `Nova: Generated personalized campaign copy. Subject: "Upgrade Orbit", Body: "Claim 15% off checkouts".`;
    addAgentLog("Nova", nMsg, "chat");
    
    // Save generated campaign mock/record to backend API
    let campaignId = "";
    try {
      const saveRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goal,
          goal: goal,
          channel: targetChannel,
          targetSegment: "Slipping Away",
          audienceSize: 18,
          predictedRevenue: 12500,
          predictedRoi: 4.8,
          copy: "Hi {{name}}, complete your booking today for 15% off. Limit window active.",
          status: "Running"
        })
      });
      if (saveRes.ok) {
        const savedCamp = await saveRes.json();
        campaignId = savedCamp.campaignId;
      }
    } catch (e) {
      console.warn("Failed to create campaign record:", e);
    }

    setPipelineState(prev => ({
      ...prev,
      currentStep: "Atlas",
      progress: 90,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${nMsg}`, `[${new Date().toLocaleTimeString()}] Atlas: Gateway channels validated. Initiating Twilio/Resend dispatch queue...`],
      completedSteps: [...prev.completedSteps, "Nova"],
      generatedCampaignId: campaignId
    }));

    // 5. Atlas step
    await sleep(2500);
    
    // Trigger simulated webhook conversions and finalize campaign on backend
    if (campaignId) {
      try {
        await fetch("/api/campaigns/launch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: targetChannel,
            audience: [{ phone: "+919876543210", email: "target@orbit.io", name: "Arjun S." }],
            template: "Hi Arjun, complete your booking today.",
            missionId: campaignId
          })
        });
      } catch (err) {
        console.warn("Launch trigger failed:", err);
      }
    }

    const aMsg = `Atlas: Campaign dispatch successful. Sent: 18 messages. Webhooks online for delivery events.`;
    addAgentLog("Atlas", aMsg, "result");
    
    // Save generated mission history record to backend
    try {
      await fetch("/api/autonomous-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal,
          businessType: "Fashion & Retail",
          Polaris: { segment: "Slipping Away", explanation: "Mapped 18 targets" },
          Luna: { recoverableRevenue: 12500, inactiveCustomers: 18, abandonedLeads: 8, recoveryConfidence: 91, explanation: "Opportunity active" },
          Vega: { predictedRoi: 4.8, predictedRevenue: 12500, explanation: "Calculated yields" },
          Nova: { Email: { subject: "Orbit Promo", body: "15% off" }, WhatsApp: { body: "Promo drop" }, SMS: { body: "Orbit drop" }, RCS: { title: "Orbit Promo", body: "Glow update", mediaUrl: "" } },
          Atlas: { selectedChannel: targetChannel, explanation: "Dispatch gates armed" },
          status: "Completed",
          recommendation: { summary: "Rerun campaigns weekly", confidenceScore: 92 }
        })
      });
    } catch (e) {
      console.warn("Failed to log mission:", e);
    }

    setPipelineState(prev => ({
      ...prev,
      currentStep: "idle",
      progress: 100,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${aMsg}`, `[${new Date().toLocaleTimeString()}] System: Mission completed successfully.`],
      completedSteps: [...prev.completedSteps, "Atlas"]
    }));

    // Trigger lists refresh
    fetchOpportunities();
    refreshMissions();
    fetchBriefing();

    await sleep(2000);
    setPipelineState(prev => ({ ...prev, active: false }));
  };

  /* ─── Autonomous Demo Mode Loop ─── */
  const toggleDemoMode = () => {
    if (demoMode) {
      // Turn off
      setDemoMode(false);
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      addAgentLog("System", "Autonomous Demo Mode Deactivated.", "thought");
    } else {
      // Turn on
      setDemoMode(true);
      addAgentLog("System", "Autonomous Demo Mode Activated. Starting operations...", "thought");
      
      const goals = [
        "Recover Abandoned Carts",
        "VIP Loyalty Campaign",
        "Festival Launch Campaign",
        "Win-back Dormant Customers",
        "Cross-sell Existing Buyers"
      ];
      const channels: Array<"Email" | "WhatsApp" | "SMS" | "RCS">[] = [["WhatsApp"], ["Email"], ["RCS"], ["SMS"]];

      let idx = 0;
      const executeNextDemoMission = () => {
        const selectedGoal = goals[idx % goals.length];
        const selectedChannel = channels[idx % channels.length][0];
        idx++;
        triggerExecutionPipeline(selectedGoal, selectedChannel);
      };

      // Execute first immediately
      executeNextDemoMission();

      // Trigger next campaign every 15 seconds
      demoIntervalRef.current = setInterval(() => {
        executeNextDemoMission();
      }, 16000);
    }
  };

  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  // Launch Opportunity action handler
  const handleLaunchOpportunity = (opp: any) => {
    triggerExecutionPipeline(opp.title, opp.type === "VIP" ? "Email" : "WhatsApp");
  };

  // Autonomous New Mission Planner (Calls backend)
  const handleGenerateNewMission = async () => {
    setIsGeneratingMission(true);
    try {
      const res = await fetch("/api/autonomous-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: "Autonomous Revenue Recovery Planner",
          businessType: "Fashion & Apparel"
        })
      });
      if (res.ok) {
        const data = await res.json();
        addAgentLog("System", `Generated autonomous mission: "${data.goal}"`, "result");
        refreshMissions();
      }
    } catch (e) {
      console.warn("Failed to generate mission:", e);
    } finally {
      setIsGeneratingMission(false);
    }
  };

  // Export Report file downloader
  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      kpis,
      campaigns,
      orders,
      lunaMetrics
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `orbit_control_report_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    addAgentLog("System", "Exported operational control report.", "thought");
  };

  // Duplicate, pause/resume, and archive/delete mission hooks
  const handlePauseMission = async (id: string) => {
    await updateMissionStatus(id, "Paused");
  };

  const handleResumeMission = async (id: string) => {
    await updateMissionStatus(id, "Running");
  };

  const handleArchiveMission = async (id: string) => {
    await deleteMission(id);
  };

  const handleDuplicateMission = async (id: string) => {
    await duplicateMission(id);
  };

  // Atlas Delivery Stats Computations
  const totalSentCount = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalDeliveredCount = campaigns.reduce((s, c) => s + (c.deliveredCount || 0), 0);
  const totalOpenedCount = campaigns.reduce((s, c) => s + (c.openedCount || 0), 0);
  const totalClickedCount = campaigns.reduce((s, c) => s + (c.clickedCount || 0), 0);
  const totalConvertedCount = campaigns.reduce((s, c) => s + (c.purchaseCount || 0), 0);
  const totalFailedCount = campaigns.reduce((s, c) => s + (c.failedCount || 0), 0);
  const totalPendingCount = campaigns.reduce((s, c) => s + (c.pendingCount || 0), 0);
  const totalCampaignRevenue = campaigns.reduce((s, c) => s + (c.revenueGenerated || 0), 0);

  // Revenue Attribution calculations
  const revenueBySegment = {
    Loyalists: orders.filter(o => customers.find(c => c.id === o.customerId)?.segment === "Loyalists").reduce((s, o) => s + o.amount, 0),
    SlippingAway: orders.filter(o => customers.find(c => c.id === o.customerId)?.segment === "Slipping Away").reduce((s, o) => s + o.amount, 0),
    HighValueInactive: orders.filter(o => customers.find(c => c.id === o.customerId)?.segment === "High-Value Inactive").reduce((s, o) => s + o.amount, 0),
    NewSignups: orders.filter(o => customers.find(c => c.id === o.customerId)?.segment === "New Signups").reduce((s, o) => s + o.amount, 0)
  };

  const revenueByChannel = {
    WhatsApp: orders.filter(o => o.channel === "WhatsApp").reduce((s, o) => s + o.amount, 0),
    Email: orders.filter(o => o.channel === "Email").reduce((s, o) => s + o.amount, 0),
    SMS: orders.filter(o => o.channel === "SMS").reduce((s, o) => s + o.amount, 0),
    RCS: orders.filter(o => o.channel === "RCS").reduce((s, o) => s + o.amount, 0)
  };

  const totalSegmentRev = Object.values(revenueBySegment).reduce((s, v) => s + v, 0) || 1;
  const totalChannelRev = Object.values(revenueByChannel).reduce((s, v) => s + v, 0) || 1;

  // Mission Health System Calculations
  const averageROI = campaigns.length > 0 ? parseFloat((campaigns.reduce((s, c) => s + (c.predictedRoi || 4.2), 0) / campaigns.length).toFixed(1)) : 4.2;
  const averageConversion = totalSentCount > 0 ? parseFloat(((totalConvertedCount / totalSentCount) * 100).toFixed(1)) : 22.4;
  const successRate = campaigns.length > 0 ? Math.round((campaigns.filter(c => c.status === "Completed").length / campaigns.length) * 100) : 92;
  const healthScore = Math.round((successRate * 0.4) + (averageConversion * 1.5) + (networkHealth * 0.3));

  return (
    <div className={`flex-1 min-h-0 overflow-y-auto relative transition-colors duration-300 ${isLight ? "bg-gray-50" : "bg-[#050816]"}`}>
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      <div className="relative z-10 p-6 space-y-6">
        {/* ══════════════ HEADER ══════════════ */}
        <PageHeaderHUD
          title="Mission Control"
          subtitle="orbit.ai OPERATIONAL HQ · REAL-TIME AI EXECUTION HUB"
          onSelectAgent={setSelectedAgent}
          actions={
            <div className="flex items-center gap-3">
              {/* Demo Mode Toggle Switch */}
              <div className="flex items-center gap-2 border border-gray-800 bg-gray-950/60 rounded-xl px-4 py-2">
                <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">Autonomous Demo Mode</span>
                <button
                  onClick={toggleDemoMode}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${
                    demoMode ? "bg-orbit-success" : "bg-gray-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ${demoMode ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orbit-blue to-orbit-purple text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer shadow-orbit-glow"
              >
                <Plus size={12} />
                Assemble Custom Mission
              </button>
            </div>
          }
        />

        {/* ══════════════ TOP KPI SECTION ══════════════ */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={14} className="text-orbit-blue animate-pulse" />
              Live Telemetry Ledger
            </span>
            {/* Timeframe Selector */}
            <div className="flex bg-gray-950 border border-gray-800 rounded-lg p-0.5 font-mono text-[9px] uppercase">
              {(["Today", "This Week", "This Month"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setKpiTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    kpiTimeframe === tf
                      ? "bg-orbit-blue text-white shadow-orbit-glow-blue"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Revenue Achieved",
                value: achievedCounter,
                raw: kpis.achieved,
                goal: kpis.goal,
                color: "#22C55E",
                glow: "rgba(34,197,94,0.15)",
                delta: "+14.2% yield",
                up: true,
                spark: [20000, 24000, 22000, 31000, 28000, kpis.achieved],
                icon: TrendingUp
              },
              {
                label: "Revenue Goal",
                value: goalCounter,
                raw: kpis.goal,
                goal: kpis.goal,
                color: "#3B82F6",
                glow: "rgba(59,130,246,0.15)",
                delta: "Ledger Target",
                up: null,
                spark: null,
                icon: Target
              },
              {
                label: "Forecast Revenue",
                value: forecastCounter,
                raw: kpis.forecast,
                goal: kpis.goal,
                color: "#8B5CF6",
                glow: "rgba(139,92,246,0.15)",
                delta: "AI projected",
                up: true,
                spark: [25000, 29000, 28000, 37000, 34000, kpis.forecast],
                icon: Zap
              },
              {
                label: "Growth Score",
                value: `${(parseFloat(growthCounter) / 10).toFixed(1)}`,
                raw: kpis.growth,
                goal: 10,
                color: "#EC4899",
                glow: "rgba(236,72,153,0.15)",
                delta: "Attribution Delta",
                up: true,
                spark: [7.2, 7.8, 8.1, 7.9, 8.3, kpis.growth],
                icon: Activity
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              const progressPct = Math.min(100, Math.round((card.raw / card.goal) * 100)) || 0;
              return (
                <div
                  key={idx}
                  className={`relative rounded-xl border p-4 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
                    isLight ? "bg-white border-gray-200" : "bg-[#0c0f20]/60 border-gray-800 hover:border-gray-750"
                  }`}
                  style={{ boxShadow: isLight ? undefined : `0 0 20px ${card.glow}` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{card.label}</span>
                    <Icon size={12} style={{ color: card.color }} />
                  </div>
                  <div>
                    <span className="font-space text-2xl font-bold tracking-tight" style={{ color: card.color }}>
                      {card.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {card.up && <ChevronUp size={10} className="text-orbit-success" />}
                    <span className={`font-mono text-[9px] ${card.up ? "text-orbit-success" : "text-gray-500"}`}>{card.delta}</span>
                  </div>
                  {card.spark && (
                    <div className="mt-1">
                      <Sparkline values={card.spark} color={card.color} height={30} />
                    </div>
                  )}
                  {card.label !== "Growth Score" && (
                    <div className={`w-full h-1 rounded-full overflow-hidden mt-1 ${isLight ? "bg-gray-200" : "bg-gray-900"}`}>
                      <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: card.color }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Persona HUD Grid */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2">
              <Fingerprint size={14} className="text-orbit-purple" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-bold">Persona DNA HUD Intelligence</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Top Persona */}
              <div className={`relative rounded-xl border p-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
                isLight ? "bg-white border-gray-200" : "bg-[#090b18]/70 border-gray-800 hover:border-purple-500/20"
              }`} style={{ boxShadow: isLight ? undefined : "0 0 15px rgba(139,92,246,0.05)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">Top Persona</span>
                  <Fingerprint size={12} className="text-orbit-purple animate-pulse" />
                </div>
                <div className="h-9 flex items-center">
                  <span className="font-space text-xs font-bold tracking-tight text-white line-clamp-2 leading-tight">
                    {topPersona ? topPersona.name : "Analyzing..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[9px] mt-1 text-gray-400">
                  <span>Audience Base:</span>
                  <span className="text-white font-bold">{topPersona ? `${topPersona.customerCount} (${Math.round((topPersona.customerCount / (customers.length || 1)) * 100)}%)` : "0%"}</span>
                </div>
              </div>

              {/* Highest Revenue */}
              <div className={`relative rounded-xl border p-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
                isLight ? "bg-white border-gray-200" : "bg-[#090b18]/70 border-gray-800 hover:border-emerald-500/20"
              }`} style={{ boxShadow: isLight ? undefined : "0 0 15px rgba(34,197,94,0.05)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">Highest Revenue</span>
                  <Crown size={12} className="text-orbit-success" />
                </div>
                <div className="h-9 flex items-center">
                  <span className="font-space text-xs font-bold tracking-tight text-white line-clamp-2 leading-tight">
                    {highestRevenuePersona ? highestRevenuePersona.name : "Analyzing..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[9px] mt-1 text-gray-400">
                  <span>Revenue Share:</span>
                  <span className="text-orbit-success font-bold">{highestRevenuePersona ? `${highestRevenuePersona.revenueContributionPct}%` : "0%"}</span>
                </div>
              </div>

              {/* Highest Risk */}
              <div className={`relative rounded-xl border p-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
                isLight ? "bg-white border-gray-200" : "bg-[#090b18]/70 border-gray-800 hover:border-red-500/20"
              }`} style={{ boxShadow: isLight ? undefined : "0 0 15px rgba(239,68,68,0.05)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">Highest Churn Risk</span>
                  <ShieldAlert size={12} className="text-red-400" />
                </div>
                <div className="h-9 flex items-center">
                  <span className="font-space text-xs font-bold tracking-tight text-white line-clamp-2 leading-tight">
                    {riskPersona ? riskPersona.name : "Analyzing..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[9px] mt-1 text-gray-400">
                  <span>Risk Level:</span>
                  <span className="text-red-400 font-bold">{riskPersona ? `${riskPersona.riskLevel} (${riskPersona.riskScore}%)` : "Low"}</span>
                </div>
              </div>

              {/* Growth Opportunity */}
              <div className={`relative rounded-xl border p-4 flex flex-col gap-2 overflow-hidden transition-all duration-300 ${
                isLight ? "bg-white border-gray-200" : "bg-[#090b18]/70 border-gray-800 hover:border-amber-500/20"
              }`} style={{ boxShadow: isLight ? undefined : "0 0 15px rgba(245,158,11,0.05)" }}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">Growth Opportunity</span>
                  <TrendingUp size={12} className="text-orbit-amber" />
                </div>
                <div className="h-9 flex items-center">
                  <span className="font-space text-xs font-bold tracking-tight text-white line-clamp-2 leading-tight">
                    {growthPersona ? growthPersona.name : "Analyzing..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[9px] mt-1 text-gray-400">
                  <span>Potential:</span>
                  <span className="text-orbit-amber font-bold">₹{growthPersona ? (growthPersona.revenuePotential - growthPersona.predictedLtv).toLocaleString() : "0"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ THREE COLUMN GRID DASHBOARD ══════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COLUMN 1: EXECUTIVE BRIEFING, EXECUTION CENTER & ACTIVE MISSIONS */}
          <div className="space-y-6">
            
            {/* AI Executive Briefing */}
            <div className={`rounded-xl border p-5 space-y-3 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={13} className="text-orbit-purple" />
                  AI Executive Briefing
                </span>
                <button
                  onClick={fetchBriefing}
                  disabled={isBriefingLoading}
                  className="p-1 text-gray-500 hover:text-white cursor-pointer transition-colors"
                >
                  <RefreshCw size={11} className={isBriefingLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {isBriefingLoading ? (
                <div className="space-y-2 py-4">
                  <div className="h-3 bg-gray-850 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-850 rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-gray-850 rounded w-2/3 animate-pulse" />
                </div>
              ) : (
                <div className="font-mono text-[9.5px] leading-relaxed text-gray-400 whitespace-pre-line bg-gray-950/35 p-3 rounded-lg border border-gray-850">
                  {briefing || "orbit.ai currently has no active missions. Click launch opportunity or generate new mission above to begin."}
                </div>
              )}
            </div>

            {/* Mission Execution Center Pipeline */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={13} className="text-orbit-blue" />
                  Mission Execution Center
                </span>
                {pipelineState.active && (
                  <span className="font-mono text-[8px] bg-orbit-blue/10 border border-orbit-blue/35 text-orbit-blue px-2 py-0.5 rounded-full uppercase animate-pulse">
                    Pipeline Active
                  </span>
                )}
              </div>

              {/* Execution flowchart visualizer */}
              <div className="grid grid-cols-5 gap-1 items-center relative py-2 bg-gray-950/20 p-2 rounded-lg border border-gray-855/20">
                {Object.keys(AGENT_CONFIG).map((agentName, idx) => {
                  const cfg = AGENT_CONFIG[agentName as keyof typeof AGENT_CONFIG];
                  const isActive = pipelineState.currentStep === agentName;
                  const isCompleted = pipelineState.completedSteps.includes(agentName);
                  
                  return (
                    <React.Fragment key={agentName}>
                      <div className="flex flex-col items-center gap-1 relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            isActive
                              ? "border-white bg-[#1e293b] scale-110 shadow-orbit-glow"
                              : isCompleted
                                ? "bg-orbit-success/15 border-orbit-success text-orbit-success"
                                : "border-gray-800 bg-[#0c0f20]"
                          }`}
                          style={isActive ? { boxShadow: `0 0 15px ${cfg.color}` } : undefined}
                          onClick={() => setSelectedAgent(agentName as any)}
                        >
                          <span className="font-space text-[10px] font-bold">
                            {isCompleted ? "✓" : agentName.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-mono text-[8px] text-gray-500 uppercase tracking-wide">{agentName}</span>
                      </div>
                      {idx < 4 && (
                        <div className="h-0.5 flex-1 bg-gray-855 relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-orbit-success transition-all duration-500"
                            style={{ width: isCompleted ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Real-time Logs scrolling */}
              <div className="bg-black/40 border border-gray-850 p-3 rounded-lg h-36 overflow-y-auto font-mono text-[9px] text-gray-400 space-y-1.5 scrollbar-thin">
                {pipelineState.logs.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">[ Pipeline Idle - Launch a mission to monitor logs ]</p>
                ) : (
                  pipelineState.logs.map((log, i) => (
                    <p key={i} className="leading-relaxed border-l border-gray-800 pl-1.5">
                      <span className="text-orbit-blue font-bold">&gt;</span> {log}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Active Missions Dashboard */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-orbit-success" />
                  Active Pipelines
                </span>
                <span className="font-mono text-[9px] text-gray-550">
                  {campaigns.filter(c => c.status === "Running" || c.status === "Sending").length} RUNNING
                </span>
              </div>

              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {campaigns.filter(c => c.status === "Running" || c.status === "Sending").length === 0 ? (
                  <p className="text-center text-gray-600 font-mono text-[10px] py-8">[ No active running campaigns ]</p>
                ) : (
                  campaigns.filter(c => c.status === "Running" || c.status === "Sending").map(c => {
                    const progressPct = c.sentCount > 0 ? Math.round(((c.deliveredCount || 0) / c.sentCount) * 100) : 0;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedMission(c)}
                        className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg space-y-2 cursor-pointer hover:border-gray-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-space text-[10px] font-bold text-white uppercase">{c.name}</span>
                            <span className="font-mono text-[8px] text-gray-500 block uppercase">{c.channel} · {c.sentCount} recipients</span>
                          </div>
                          <span className="font-mono text-[8px] border border-orbit-blue/30 bg-orbit-blue/5 text-orbit-blue px-2 py-0.5 rounded-full uppercase animate-pulse">
                            {c.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                          <span>Yield: ₹{(c.revenueGenerated || 0).toLocaleString()}</span>
                          <span>Conv: {c.purchaseCount} ({c.sentCount > 0 ? ((c.purchaseCount / c.sentCount)*100).toFixed(0) : 0}%)</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                            <div className="h-full bg-orbit-blue transition-all duration-500" style={{ width: `${progressPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[7.5px] font-mono text-gray-500 uppercase">
                            <span>Delivered: {c.deliveredCount}</span>
                            <span>{progressPct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* COLUMN 2: OPPORTUNITY SCANNER, ATLAS DELIVERY & SCROLLING ACTIVITY */}
          <div className="space-y-6">
            
            {/* Opportunity Detection powered by Luna */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} className="text-amber-500" />
                  Luna Opportunity Detector
                </span>
                <button
                  onClick={fetchOpportunities}
                  disabled={isOppsLoading}
                  className="p-1 text-gray-500 hover:text-white cursor-pointer transition-colors"
                  title="Rescan database cohorts"
                >
                  <RefreshCw size={11} className={isOppsLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="space-y-3 max-h-[295px] overflow-y-auto pr-1">
                {isOppsLoading ? (
                  <div className="space-y-2 py-8 text-center font-mono text-[10px] text-gray-500">
                    <RefreshCw className="animate-spin inline mr-1" size={12} />
                    Aggregating customer ledgers...
                  </div>
                ) : opportunities.length === 0 ? (
                  <p className="text-center text-gray-600 font-mono text-[10px] py-12">[ No opportunities found in current matrix ]</p>
                ) : (
                  opportunities.map(opp => (
                    <div
                      key={opp.id}
                      className="p-3 bg-gray-950/30 border border-gray-850 rounded-lg space-y-2 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-space text-[10.5px] font-bold text-white block uppercase">{opp.title}</span>
                          <span className="font-mono text-[8px] text-gray-500 uppercase">{opp.description}</span>
                        </div>
                        <span className="font-mono text-[8px] border border-amber-500/30 bg-amber-500/5 text-amber-500 px-2 py-0.5 rounded-full uppercase">
                          {opp.confidence}% CONF
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[9px] text-gray-400">
                        <div>
                          <span className="text-gray-550 text-[7.5px] block uppercase">Potential Revenue</span>
                          <span className="text-white font-bold text-[10px]">₹{opp.potentialRevenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-550 text-[7.5px] block uppercase">Target Group</span>
                          <span className="text-white">{opp.audienceSize} accounts</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-900/50 pt-2 gap-2">
                        <span className="font-mono text-[8.5px] text-gray-500 truncate">{opp.reasoning || opp.recommendedAction}</span>
                        <button
                          onClick={() => handleLaunchOpportunity(opp)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-mono text-[8px] font-bold uppercase rounded cursor-pointer transition-colors"
                        >
                          Launch
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Atlas Delivery Center */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={13} className="text-orbit-success" />
                  Atlas Delivery Center
                </span>
                <span className="font-mono text-[9px] text-gray-550">TWILIO + RESEND GATEWAYS</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-950/20 border border-gray-850 p-2.5 rounded-lg text-center">
                  <span className="font-mono text-[8px] text-gray-500 uppercase block">Sent Messages</span>
                  <span className="font-space text-lg font-bold text-white">{totalSentCount}</span>
                </div>
                <div className="bg-gray-950/20 border border-gray-850 p-2.5 rounded-lg text-center">
                  <span className="font-mono text-[8px] text-gray-500 uppercase block">Delivered Messages</span>
                  <span className="font-space text-lg font-bold text-orbit-success">{totalDeliveredCount}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[9.5px]">
                {[
                  { label: "Opened", val: totalOpenedCount, color: "text-orbit-purple" },
                  { label: "Clicked", val: totalClickedCount, color: "text-yellow-450" },
                  { label: "Converted", val: totalConvertedCount, color: "text-orbit-success" },
                  { label: "Failed", val: totalFailedCount, color: "text-red-400" },
                  { label: "Pending", val: totalPendingCount, color: "text-blue-400" },
                  { label: "Yield", val: `₹${totalCampaignRevenue.toLocaleString()}`, color: "text-white font-bold" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-gray-950/20 border border-gray-850 p-2 rounded text-center">
                    <span className="text-[7.5px] text-gray-500 uppercase block mb-0.5">{stat.label}</span>
                    <span className={stat.color}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* scrolling Live Agent Activity Ticker */}
            <div className={`rounded-xl border p-5 space-y-3 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-orbit-blue animate-pulse" />
                  Live Operator Feeds
                </span>
                <span className="font-mono text-[8px] text-gray-550 uppercase">Sync active</span>
              </div>

              <div className="relative h-28 overflow-hidden bg-gray-955/20 border border-gray-855/20 rounded-lg p-2.5">
                <div className="space-y-2 scroll-feed-anim">
                  {activityTicker.map((act, i) => (
                    <div key={i} className="flex gap-2 items-center font-mono text-[8.5px] text-gray-400 truncate border-b border-gray-900/30 pb-1">
                      <span className="w-1 h-1 rounded-full bg-orbit-blue shrink-0 animate-pulse" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
                {/* Fade out mask */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#050816]/90 to-transparent pointer-events-none" />
              </div>
            </div>

          </div>

          {/* COLUMN 3: REVENUE ATTRIBUTION, MISSION HEALTH, timeline & COMMANDS */}
          <div className="space-y-6">

            {/* Business DNA HUD */}
            {workspaceDna && (
              <div className={`rounded-xl border p-4 space-y-3 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                  <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Database size={12} className="text-orbit-purple" />
                    Business DNA
                  </span>
                  <span className={`font-mono text-[8px] px-2 py-0.5 rounded-full border ${workspaceDna.dataSource === "csv" ? "text-orbit-success border-orbit-success/30 bg-orbit-success/5" : "text-orbit-blue border-orbit-blue/30 bg-orbit-blue/5"}`}>
                    {workspaceDna.dataSource === "csv" ? "📁 DATASET" : "⚡ PRESET"}
                  </span>
                </div>
                <div className="space-y-2 font-mono text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Industry</span>
                    <span className="text-white font-bold">{workspaceDna.industryType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Primary KPI</span>
                    <span className="text-orbit-blue font-bold">{workspaceDna.primaryMetric}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Top Category</span>
                    <span className="text-white">{workspaceDna.topCategory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Growth Est.</span>
                    <span className="text-orbit-success font-bold">+{workspaceDna.growthRate}% MoM</span>
                  </div>
                </div>
                <div className="border-t border-gray-800/60 pt-2">
                  <span className="font-mono text-[7px] text-gray-600 uppercase block mb-1.5">Top Opportunities</span>
                  {workspaceDna.opportunities.slice(0, 2).map((opp, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <div className="w-1 h-1 rounded-full bg-orbit-success mt-1.5 shrink-0" />
                      <span className="font-mono text-[8.5px] text-gray-400 leading-tight">{opp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Boardroom Verdict */}
            {latestVerdict && (
              <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
                <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                  <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award size={13} className="text-orbit-success animate-pulse" />
                    Latest Boardroom Verdict
                  </span>
                  <span className="font-mono text-[8px] text-gray-550 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-green-400 animate-ping" />
                    SYNCED
                  </span>
                </div>
                
                <div className="space-y-3 font-mono text-[9.5px]">
                  <div>
                    <span className="text-[7.5px] text-gray-500 uppercase block">Directive Agenda</span>
                    <span className="text-white font-bold text-[11px] block">{latestVerdict.scenarioName}</span>
                    <span className="text-gray-400 block text-[9px] leading-relaxed mt-0.5">{latestVerdict.scenarioDescription}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-black/40 border border-gray-850/40 rounded-lg p-2.5">
                    <div>
                      <span className="text-[7px] text-gray-550 uppercase block">Target Segment</span>
                      <span className="text-blue-400 font-bold block">{latestVerdict.targetPersona}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-gray-555 uppercase block">Region</span>
                      <span className="text-purple-400 font-bold block flex items-center gap-0.5">
                        <MapPin size={9} />
                        {latestVerdict.region}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[7.5px] text-gray-500 uppercase block">Trend Strategic Pivot</span>
                    <div className="text-gray-300 flex items-center gap-1.5 mt-0.5">
                      <span className="text-red-400 font-semibold">{latestVerdict.currentTrend}</span>
                      <ArrowRight size={10} className="text-gray-500" />
                      <span className="text-orbit-success font-semibold">{latestVerdict.futureTrend}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-900">
                    <div>
                      <span className="text-[7.5px] text-gray-555 uppercase block">Projected Revenue</span>
                      <span className="text-orbit-success font-bold block text-[10.5px]">₹{latestVerdict.revenueOpportunity.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] text-gray-555 uppercase block">Expected ROI</span>
                      <span className="text-blue-400 font-bold block text-[10.5px]">{latestVerdict.expectedRoi}x</span>
                    </div>
                  </div>

                  {/* 30/60/90 Forecast sub-panel */}
                  <div className="space-y-2 pt-2 border-t border-gray-900">
                    <span className="text-[7.5px] text-gray-500 uppercase block tracking-wider flex items-center gap-1">
                      <Clock size={10} className="text-orbit-purple" />
                      Time Machine Forecast
                    </span>
                    <div className="space-y-1.5 text-[8.5px] text-gray-450">
                      <div className="flex gap-2">
                        <span className="text-orbit-purple font-bold shrink-0 w-8">T+30d:</span>
                        <span className="leading-tight">{latestVerdict.forecast.d30}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-orbit-purple font-bold shrink-0 w-8">T+60d:</span>
                        <span className="leading-tight">{latestVerdict.forecast.d60}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-orbit-purple font-bold shrink-0 w-8">T+90d:</span>
                        <span className="leading-tight">{latestVerdict.forecast.d90}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Attribution Panel */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={13} className="text-orbit-purple" />
                  Revenue Attribution Metrics
                </span>
                <span className="font-mono text-[8px] text-gray-550">Attributed loops</span>
              </div>

              {/* Attribution charts by Segment and Channel */}
              <div className="space-y-4 font-mono text-[9.5px]">
                
                {/* Segment Attribution */}
                <div className="space-y-2">
                  <p className="text-gray-500 uppercase text-[8px] font-bold tracking-wider">Revenue by Customer Segment</p>
                  {[
                    { label: "Loyalists", val: revenueBySegment.Loyalists, color: "bg-orbit-blue" },
                    { label: "Slipping Away", val: revenueBySegment.SlippingAway, color: "bg-amber-500" },
                    { label: "High-Value Inactive", val: revenueBySegment.HighValueInactive, color: "bg-orbit-purple" },
                    { label: "New Signups", val: revenueBySegment.NewSignups, color: "bg-pink-500" }
                  ].map(item => {
                    const ratio = Math.max(2, Math.round((item.val / totalSegmentRev) * 100)) || 25;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[8.5px] text-gray-400">
                          <span>{item.label}</span>
                          <span>₹{item.val.toLocaleString()} ({ratio}%)</span>
                        </div>
                        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Channel Attribution */}
                <div className="space-y-2 border-t border-gray-900/80 pt-3">
                  <p className="text-gray-500 uppercase text-[8px] font-bold tracking-wider">Revenue by Channel</p>
                  {[
                    { label: "WhatsApp", val: revenueByChannel.WhatsApp, color: "bg-orbit-success" },
                    { label: "Email", val: revenueByChannel.Email, color: "bg-orbit-purple" },
                    { label: "SMS", val: revenueByChannel.SMS, color: "bg-orbit-blue" },
                    { label: "RCS", val: revenueByChannel.RCS, color: "bg-pink-500" }
                  ].map(item => {
                    const ratio = Math.max(2, Math.round((item.val / totalChannelRev) * 100)) || 25;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-[8.5px] text-gray-400">
                          <span>{item.label}</span>
                          <span>₹{item.val.toLocaleString()} ({ratio}%)</span>
                        </div>
                        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Mission Health System */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} className="text-orbit-success" />
                  Mission Health Ledger
                </span>
                <span className="font-mono text-[8px] text-gray-550">Integrity audits</span>
              </div>

              <div className="flex items-center justify-around py-1.5 border-b border-gray-900/60 pb-3">
                <RadialGauge value={healthScore} color="#22C55E" label="System Health" isLight={isLight} size={70} />
                <RadialGauge value={successRate} color="#3B82F6" label="Success Rate" isLight={isLight} size={70} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px] text-gray-400">
                <div>
                  <span className="text-[7px] text-gray-500 uppercase block mb-0.5">Average ROI</span>
                  <span className="text-white font-bold">{averageROI}x</span>
                </div>
                <div>
                  <span className="text-[7px] text-gray-500 uppercase block mb-0.5">Avg Conv</span>
                  <span className="text-orbit-success font-bold">{averageConversion}%</span>
                </div>
                <div>
                  <span className="text-[7px] text-gray-500 uppercase block mb-0.5">Network latency</span>
                  <span className="text-white font-bold">12ms</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className={`rounded-xl border p-5 space-y-4 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className="text-orbit-blue" />
                  Mission Timeline
                </span>
                <span className="font-mono text-[8px] text-gray-550 uppercase">Operational Steps</span>
              </div>

              <div className="relative pl-4 border-l border-gray-800 space-y-3 font-mono text-[9px] text-gray-400 max-h-48 overflow-y-auto scrollbar-thin">
                {[
                  { title: "Mission Formulated", desc: "AI engine resolved campaign constraints", step: "Detected" },
                  { title: "Audience Isolated", desc: "Polaris demographic vectors matched", step: "Analyzed" },
                  { title: "Forecast Rendered", desc: "Vega calculated regression ROI limits", step: "Generated" },
                  { title: "Marketing Assets Ready", desc: "Nova compiled WhatsApp & Email copy templates", step: "Scheduled" },
                  { title: "Gateway Port Armed", desc: "Atlas verified delivery latency bounds", step: "Launching" },
                  { title: "Broadcast Dispatched", desc: "Dispatched over Twilio/Resend channels", step: "Running" },
                  { title: "Engagement Logs Syncing", desc: "Live webhooks monitoring conversions", step: "Completed" }
                ].map((item, idx) => {
                  const isActiveStep = pipelineState.active && (
                    (pipelineState.currentStep === "Polaris" && idx <= 1) ||
                    (pipelineState.currentStep === "Luna" && idx <= 2) ||
                    (pipelineState.currentStep === "Vega" && idx <= 2) ||
                    (pipelineState.currentStep === "Nova" && idx <= 3) ||
                    (pipelineState.currentStep === "Atlas" && idx <= 5)
                  );
                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                        isActiveStep
                          ? "border-orbit-blue bg-orbit-blue shadow-orbit-glow-blue animate-ping"
                          : "border-gray-800 bg-[#050816]"
                      }`} />
                      <p className={`font-bold ${isActiveStep ? "text-orbit-blue font-bold" : "text-white"}`}>{item.title}</p>
                      <p className="text-[7.5px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Executive Commands panel */}
            <div className={`rounded-xl border p-5 space-y-3 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
              <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} className="text-red-500 animate-pulse" />
                  Executive Control Console
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[9px] uppercase font-bold">
                <button
                  onClick={handleGenerateNewMission}
                  disabled={isGeneratingMission}
                  className="p-2.5 bg-gray-950 border border-gray-850 rounded-lg hover:border-orbit-blue/40 text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={10} />
                  {isGeneratingMission ? "Planning..." : "Plan Mission"}
                </button>
                <button
                  onClick={() => triggerExecutionPipeline("Quick Revenue Reactivation")}
                  disabled={pipelineState.active}
                  className="p-2.5 bg-gray-950 border border-gray-850 rounded-lg hover:border-orbit-success/40 text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play size={10} />
                  Launch Loop
                </button>
                <button
                  onClick={handleExportReport}
                  className="p-2.5 bg-gray-950 border border-gray-850 rounded-lg hover:border-orbit-purple/40 text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={10} />
                  Export Stats
                </button>
                <button
                  onClick={() => {
                    if (confirm("Clear local simulation state?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="p-2.5 bg-gray-950 border border-red-900/50 hover:bg-red-500/10 rounded-lg text-red-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={10} />
                  Wipe DB
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ══════════════ MISSION HISTORY LEDGER ══════════════ */}
        <div className={`rounded-xl border p-5 ${isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"}`}>
          <div className="flex justify-between items-center border-b border-gray-800/60 pb-3 mb-4">
            <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-orbit-blue" />
              Operational Mission Ledger
            </span>
            <span className="font-mono text-[9px] text-gray-550">{missions.length} RECORDED DIRECTIVES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px] divide-y divide-gray-900">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider text-[8px]">
                  <th className="pb-2">Mission Goal</th>
                  <th className="pb-2">Segment</th>
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-right">Yield Target</th>
                  <th className="pb-2 text-center">Status</th>
                  <th className="pb-2 text-center">Trigger Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900 text-gray-300">
                {missions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-600">
                      [ No mission records stored in ledger ]
                    </td>
                  </tr>
                ) : (
                  missions.map(m => (
                    <tr key={m.id} className="hover:bg-gray-950/20 transition-colors">
                      <td
                        onClick={() => setSelectedMission(m)}
                        className="py-3 font-space font-bold cursor-pointer hover:text-orbit-blue transition-colors max-w-xs truncate"
                      >
                        {m.goal}
                      </td>
                      <td className="py-3">{m.Polaris?.segment || "Loyalists"}</td>
                      <td className="py-3 uppercase text-[9px]">{m.Atlas?.selectedChannel || "WhatsApp"}</td>
                      <td className="py-3 text-right font-space font-bold">
                        ₹{(m.Vega?.predictedRevenue || 12000).toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                          m.status === "Completed" ? "bg-orbit-success/10 text-orbit-success border border-orbit-success/20" :
                          m.status === "Paused" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                          m.status === "Running" ? "bg-orbit-blue/10 text-orbit-blue border border-orbit-blue/20 animate-pulse" :
                          "bg-gray-800/40 text-gray-400"
                        }`}>
                          {m.status || "Detected"}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {m.status === "Running" ? (
                            <button
                              onClick={() => handlePauseMission(m.id)}
                              className="p-1 hover:text-white text-gray-500 transition-colors"
                              title="Pause Mission Pipeline"
                            >
                              <Pause size={10} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleResumeMission(m.id)}
                              className="p-1 hover:text-white text-gray-500 transition-colors"
                              title="Resume Mission Pipeline"
                            >
                              <Play size={10} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicateMission(m.id)}
                            className="p-1 hover:text-white text-gray-500 transition-colors"
                            title="Duplicate Mission Directive"
                          >
                            <Copy size={10} />
                          </button>
                          <button
                            onClick={() => handleArchiveMission(m.id)}
                            className="p-1 hover:text-red-400 text-gray-500 transition-colors"
                            title="Archive Mission Record"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════
          ASSEMBLE CUSTOM MISSION MODAL
      ════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 p-6 bg-[#0c0f20]/95 text-white space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 space-grid opacity-10 pointer-events-none" />
            <div className="flex justify-between items-center border-b border-gray-855 pb-3">
              <span className="font-space text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Target className="text-orbit-blue animate-pulse" size={14} />
                Assemble Custom Directive
              </span>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-550 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              <div className="space-y-1.5">
                <label className="text-gray-400 uppercase tracking-wider">Business Objective Goal</label>
                <input
                  type="text"
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  placeholder="e.g. Win back inactive VIP customers in Noida sector"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <button
                onClick={async () => {
                  if (!customGoal.trim()) return;
                  setIsCreateModalOpen(false);
                  triggerExecutionPipeline(customGoal);
                  setCustomGoal("");
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orbit-blue to-orbit-purple text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer shadow-orbit-glow"
              >
                <Play size={11} />
                Compile & Dispatch AI Loop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MISSION DETAILS MODAL
      ════════════════════════════════════════ */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 p-6 bg-[#0c0f20]/95 text-white space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 space-grid opacity-10 pointer-events-none" />
            <div className="flex justify-between items-center border-b border-gray-855 pb-3">
              <span className="font-space text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="text-orbit-purple" size={14} />
                Mission Directive details
              </span>
              <button onClick={() => setSelectedMission(null)} className="text-gray-555 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-[10px] text-gray-300 h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg">
                  <span className="text-gray-550 block uppercase text-[7.5px]">Goal Target</span>
                  <span className="text-white text-xs font-bold font-space uppercase block mt-0.5">{selectedMission.goal || selectedMission.name}</span>
                </div>
                <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg">
                  <span className="text-gray-550 block uppercase text-[7.5px]">Lifecycle Status</span>
                  <span className="text-orbit-success text-xs font-bold font-space uppercase block mt-0.5">{selectedMission.status}</span>
                </div>
              </div>

              {/* Segment Breakdown */}
              <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg space-y-1.5">
                <p className="text-gray-500 uppercase font-bold text-[8px]">Audience Segment Matrix</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-550 block text-[7px] uppercase">Matched Segment</span>
                    <span className="text-white">{selectedMission.Polaris?.segment || "Loyalists"}</span>
                  </div>
                  <div>
                    <span className="text-gray-550 block text-[7px] uppercase">Audience Size</span>
                    <span className="text-white">{selectedMission.audienceSize || selectedMission.sentCount || 18} stars</span>
                  </div>
                  <div>
                    <span className="text-gray-550 block text-[7px] uppercase">Attribution logic</span>
                    <span className="text-white truncate block">{selectedMission.Polaris?.explanation || "Spike in churn rate risk"}</span>
                  </div>
                </div>
              </div>

              {/* Copilot Copy */}
              <div className="p-3 bg-[#1b2532] rounded-lg border border-gray-800 space-y-1">
                <p className="text-gray-400 uppercase font-bold text-[8px]">Personalized Marketing Copy Preview</p>
                <div className="bg-[#005d4b] text-white rounded-lg p-2.5 text-[9px] leading-relaxed whitespace-pre-line">
                  {selectedMission.copy || selectedMission.Nova?.WhatsApp?.body || "Hello, we have exclusive access for you. Claim your slot inside."}
                </div>
              </div>

              {/* ROI & yields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg space-y-1">
                  <span className="text-gray-500 block uppercase text-[8px] font-bold">Predicted Returns</span>
                  <p>Revenue: <span className="text-white font-bold font-space text-[11px]">₹{(selectedMission.Vega?.predictedRevenue || selectedMission.predictedRevenue || 12500).toLocaleString()}</span></p>
                  <p>ROI Factor: <span className="text-orbit-purple font-bold">{selectedMission.Vega?.predictedRoi || selectedMission.predictedRoi || 4.8}x</span></p>
                </div>
                <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg space-y-1">
                  <span className="text-gray-500 block uppercase text-[8px] font-bold">Actual Conversions</span>
                  <p>Revenue Achieved: <span className="text-orbit-success font-bold font-space text-[11px]">₹{(selectedMission.revenueGenerated || 0).toLocaleString()}</span></p>
                  <p>Purchasers: <span className="text-white font-bold">{selectedMission.purchaseCount || 0} nodes</span></p>
                </div>
              </div>

              {/* Agent contributions checklist */}
              <div className="p-3 bg-gray-950/20 border border-gray-850 rounded-lg space-y-2">
                <p className="text-gray-500 uppercase font-bold text-[8px]">AI Boardroom Collaboration Matrix</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Polaris", role: "Audience Intelligence", expl: selectedMission.Polaris?.explanation || "Cohort demographic vector mapping" },
                    { name: "Luna", role: "Opportunity Recovery", expl: selectedMission.Luna?.explanation || "Revenue leakage audit checks" },
                    { name: "Vega", role: "ROI Forecasting", expl: selectedMission.Vega?.explanation || "Conversion optimization regressions" },
                    { name: "Nova", role: "Campaign Generation", expl: selectedMission.Nova?.WhatsApp?.body || "Personalized template creative writes" },
                    { name: "Atlas", role: "Operations Dispatch", expl: selectedMission.Atlas?.explanation || "Message dispatch & gateway schedules" }
                  ].map(agent => (
                    <div key={agent.name} className="flex gap-2 items-start border-b border-gray-900/30 pb-1.5 last:border-0 last:pb-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-orbit-blue mt-1 shrink-0" />
                      <div>
                        <p className="text-white font-bold">{agent.name} ({agent.role})</p>
                        <p className="text-[7.5px] text-gray-500 mt-0.5">{agent.expl}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};

export default MissionControl;
