import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOrbit } from "../context/OrbitContext";
import {
  Send, Mic, MicOff, X, ChevronRight,
  Zap, Target, Users, BarChart2, Radio, Sparkles,
  CheckCircle2, Circle, Loader2, AlertTriangle,
  ArrowRight, Play, TrendingUp, Shield, Cpu, Activity
} from "lucide-react";

import { PageHeaderHUD } from "../components/PageHeaderHUD";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface ReasoningStep {
  id: string;
  agent: "Polaris" | "Nova" | "Vega" | "Atlas" | "Luna" | "System";
  icon: React.FC<any>;
  label: string;
  detail: string;
  status: "pending" | "running" | "done" | "error";
  ts: string;
  metric?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const AGENT_META = {
  Polaris: { color: "#3B82F6", border: "border-blue-500/30",   bg: "bg-blue-500/8",   dot: "bg-blue-500",   glow: "rgba(59,130,246,0.25)" },
  Nova:    { color: "#EC4899", border: "border-pink-400/30",   bg: "bg-pink-400/8",   dot: "bg-pink-400",   glow: "rgba(236,72,153,0.25)" },
  Vega:    { color: "#8B5CF6", border: "border-violet-500/30", bg: "bg-violet-500/8", dot: "bg-violet-400",  glow: "rgba(139,92,246,0.25)" },
  Atlas:   { color: "#22C55E", border: "border-green-500/30",  bg: "bg-green-500/8",  dot: "bg-green-500",  glow: "rgba(34,197,94,0.25)"  },
  Luna:    { color: "#F59E0B", border: "border-amber-500/30",  bg: "bg-amber-500/8",  dot: "bg-amber-500",  glow: "rgba(245,158,11,0.25)"  },
  System:  { color: "#6B7280", border: "border-gray-700",      bg: "bg-gray-800/50",  dot: "bg-gray-500",   glow: "rgba(107,114,128,0.15)" },
};

const SUGGESTED_COMMANDS = [
  { icon: TrendingUp,  label: "Increase repeat purchases by 20%",   tag: "GROWTH" },
  { icon: Shield,      label: "Reduce churn in premium segment",      tag: "RETENTION" },
  { icon: Users,       label: "Activate dormant high-value accounts", tag: "REACTIVATION" },
  { icon: Zap,         label: "Launch cross-sell for tech cohort",    tag: "UPSELL" },
  { icon: Target,      label: "Maximize LTV of new signups",          tag: "LTV" },
  { icon: BarChart2,   label: "Forecast Q3 revenue and risks",        tag: "ANALYTICS" },
];

const CHANNEL_ICONS: Record<string, string> = {
  Email: "✉",
  WhatsApp: "💬",
  SMS: "📱",
  RCS: "🃏",
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function buildReasoningSteps(goal: string): ReasoningStep[] {
  return [
    {
      id: "s1", agent: "Polaris", icon: Cpu,
      label: "Analyze customers",
      detail: `Scanning customer graph database and tracking parameters matching: "${goal}"`,
      status: "pending", ts: "",
      metric: undefined,
    },
    {
      id: "s2", agent: "Polaris", icon: Target,
      label: "Find audience",
      detail: "Filtering cohort DNA, identifying VIP flags, and evaluating churn risk metrics",
      status: "pending", ts: "",
      metric: undefined,
    },
    {
      id: "s3", agent: "Luna", icon: Activity,
      label: "Recover leaks",
      detail: "Luna auditing abandoned leads, inactive profiles, and estimating recoverable revenue leaks",
      status: "pending", ts: "",
      metric: undefined,
    },
    {
      id: "s4", agent: "Vega", icon: BarChart2,
      label: "Predict revenue",
      detail: "Running regression modeling and computing conversion yield ROI curves",
      status: "pending", ts: "",
      metric: undefined,
    },
    {
      id: "s5", agent: "Nova", icon: Sparkles,
      label: "Generate campaign",
      detail: "Personalizing marketing templates and copywriting across multi-channel segments",
      status: "pending", ts: "",
      metric: undefined,
    },
    {
      id: "s6", agent: "Atlas", icon: Radio,
      label: "Select channel",
      detail: "Testing dispatcher server nodes and checking delivery pathways latency",
      status: "pending", ts: "",
      metric: undefined,
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────────── */
const StepIndicator: React.FC<{ status: ReasoningStep["status"]; color: string }> = ({ status, color }) => {
  if (status === "done")    return <CheckCircle2 size={16} style={{ color }} />;
  if (status === "running") return <Loader2 size={16} style={{ color }} className="animate-spin" />;
  if (status === "error")   return <AlertTriangle size={16} className="text-red-400" />;
  return <Circle size={16} className="text-gray-700" />;
};

/* ─────────────────────────────────────────────────────────────
   COMMAND CENTER
───────────────────────────────────────────────────────────── */
export const CommandCenter: React.FC = () => {
  const {
    theme, mission, startMission, launchMissionCampaign, cancelMission,
    agentLogs, customers, campaigns, config, lunaMetrics
  } = useOrbit();
  const isLight = theme === "executive";

  /* selected agent profile card state */
  const [_selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* mobile sidebar drawers state */
  const [showQuickMissions, setShowQuickMissions] = useState(false);
  const [showAgentFeed, setShowAgentFeed] = useState(false);

  /* input */
  const [inputVal, setInputVal]       = useState("");
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* reasoning timeline state */
  const [steps, setSteps]             = useState<ReasoningStep[]>([]);
  const [_currentStep, setCurrentStep] = useState(-1);
  const [missionStarted, setMissionStarted] = useState(false);
  const [activationPhase, setActivationPhase]   = useState(false);
  const [activationDone, setActivationDone]     = useState(false);
  const [agentsOnline, setAgentsOnline]         = useState<string[]>([]);
  const [outcomeVisible, setOutcomeVisible]     = useState(false);
  const [launchReady, setLaunchReady]           = useState(false);
  const [launchFired, setLaunchFired]           = useState(false);

  /* right panel scroll */
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentLogs]);

  /* ── advance reasoning steps as mission.step changes ── */
  useEffect(() => {
    if (!missionStarted) return;
    const s = mission.step;
    if (s === "analyzing")   advanceTo(0);
    if (s === "segmenting")  advanceTo(1);
    if (s === "predicting")  {
      advanceTo(2);
      setTimeout(() => advanceTo(3), 850);
    }
    if (s === "generating")  advanceTo(4);
    if (s === "ready")       finishAll();
  }, [mission.step, missionStarted]);

  const advanceTo = (idx: number) => {
    setCurrentStep(idx);
    setSteps(prev => prev.map((s, i) => ({
      ...s,
      status: i < idx ? "done" : i === idx ? "running" : s.status,
      ts: i === idx ? new Date().toLocaleTimeString() : s.ts,
    })));
  };

  const finishAll = () => {
    setSteps(prev => prev.map(s => ({
      ...s,
      status: "done",
      ts: s.ts || new Date().toLocaleTimeString(),
      metric: s.id === "s1" ? `${customers.length} analyzed` :
              s.id === "s2" ? `${mission.audienceCount} targets found` :
              s.id === "s3" ? `₹${lunaMetrics.recoverableRevenue.toLocaleString()} recoverable` :
              s.id === "s4" ? `₹${mission.predictedRevenue.toLocaleString()} forecast` :
              s.id === "s5" ? "4 variants ready" :
              s.id === "s6" ? `${mission.selectedChannel} selected` : s.metric,
    })));
    setTimeout(() => {
      setOutcomeVisible(true);
      setTimeout(() => setLaunchReady(true), 600);
    }, 400);
  };

  /* ── submit mission ── */
  const handleSubmit = useCallback((goal: string) => {
    if (!goal.trim()) return;
    setInputVal("");
    setShowQuickMissions(false);
    setShowAgentFeed(false);
    setMissionStarted(true);
    setActivationPhase(true);
    setActivationDone(false);
    setAgentsOnline([]);
    setOutcomeVisible(false);
    setLaunchReady(false);
    setLaunchFired(false);
    setSteps(buildReasoningSteps(goal));
    setCurrentStep(-1);

    /* sequential agent online animation */
    const agents = ["Polaris", "Nova", "Vega", "Atlas", "Luna"];
    agents.forEach((a, i) =>
      setTimeout(() => setAgentsOnline(prev => [...prev, a]), 400 + i * 550)
    );
    setTimeout(() => setActivationDone(true), 400 + agents.length * 550 + 200);

    /* start real mission after activation */
    setTimeout(() => {
      setActivationPhase(false);
      startMission(goal);
    }, 400 + agents.length * 550 + 1000);
  }, [startMission]);

  /* ── voice input ── */
  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setIsListening(true);
      setTimeout(() => {
        setInputVal("Increase repeat purchases by 20%");
        setIsListening(false);
      }, 2500);
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (e: any) => setInputVal(e.results[0][0].transcript);
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    setIsListening(true);
    rec.start();
  };

  /* ── handle launch ── */
  const handleLaunch = () => {
    setLaunchFired(true);
    launchMissionCampaign(mission.selectedChannel);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputVal);
    }
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className={`flex-1 flex overflow-hidden relative ${isLight ? "bg-[#F8FAFC]" : "bg-[#050816]"}`}>
      {/* ── AMBIENT CYBER GRIDS & GLOWS ── */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0 animate-orbit-pulse" />
      {!isLight && <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-25 z-0" />}
      <div className="pointer-events-none absolute top-10 right-10 w-96 h-96 rounded-full bg-orbit-glow-purple opacity-20 z-0" />

      {/* ════════════════════════════════════════
          LEFT SIDEBAR — Suggested Commands
      ════════════════════════════════════════ */}
      <aside className={`w-58 shrink-0 flex flex-col backdrop-blur-md overflow-y-auto relative z-10 transition-all duration-300
        ${isLight ? "border-r border-gray-200 bg-white" : "border-r border-gray-800/60 bg-gray-950/40"}
        ${showQuickMissions 
          ? `fixed inset-y-12 left-0 w-64 z-30 flex h-[calc(100vh-3rem)] border-r ${isLight ? "bg-white border-gray-200" : "bg-[#050816] border-gray-800"}` 
          : "hidden xl:flex"
        }`}>
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-gray-100" : "border-gray-800/60"}`}>
          <p className={`font-mono text-[9px] uppercase tracking-[0.15em] ${isLight ? "text-gray-500" : "text-gray-400"}`}>Quick Missions</p>
          <button onClick={() => setShowQuickMissions(false)} className={`xl:hidden cursor-pointer ${isLight ? "text-gray-400 hover:text-gray-900" : "text-gray-500 hover:text-white"}`}>✕</button>
        </div>
        <div className={`p-4 border-b ${isLight ? "border-gray-100" : "border-gray-800/60"}`}>
          <div className="flex flex-col gap-1.5">
            {SUGGESTED_COMMANDS.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={i}
                  onClick={() => { setInputVal(cmd.label); inputRef.current?.focus(); setShowQuickMissions(false); }}
                  className={`group flex items-start gap-2 p-2.5 rounded-lg border transition-all text-left cursor-pointer duration-200 ${
                    isLight 
                      ? "border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50/20" 
                      : "border-gray-850 bg-gray-900/10 hover:border-blue-500/30 hover:bg-blue-500/5 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  }`}
                >
                  <Icon size={12} className="text-gray-500 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                  <div>
                    <p className={`font-mono text-[10px] leading-snug transition-colors ${
                      isLight ? "text-gray-700 group-hover:text-blue-600" : "text-gray-300 group-hover:text-white"
                    }`}>{cmd.label}</p>
                    <span className={`font-mono text-[8px] mt-0.5 inline-block ${
                      isLight ? "text-gray-400 group-hover:text-blue-600" : "text-gray-600 group-hover:text-blue-400"
                    }`}>{cmd.tag} DIRECTIVE</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="p-4 flex-1">
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-[0.15em] mb-3">Recent Missions</p>
          <div className="flex flex-col gap-1.5">
            {campaigns.slice(0, 5).map((c, i) => (
              <div key={i} className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-colors ${
                isLight 
                  ? "border-gray-200 bg-white hover:border-gray-300" 
                  : "border-gray-850 bg-gray-900/10 hover:border-gray-800"
              }`}>
                <p className={`font-mono text-[10px] truncate ${isLight ? "text-gray-700 font-medium" : "text-gray-300"}`}>{c.name}</p>
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[8px] ${isLight ? "text-gray-400" : "text-gray-500"}`}>{c.channel}</span>
                  <span className={`font-mono text-[8px] font-bold ${c.status === "Completed" ? "text-orbit-success animate-pulse" : "text-orbit-blue"}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <p className="font-mono text-[10px] text-gray-600 text-center py-4">No missions yet</p>
            )}
          </div>
        </div>

        {/* System status */}
        <div className={`p-4 border-t bg-gray-950/10 ${isLight ? "border-gray-100 bg-gray-550/10" : "border-gray-800/60 bg-gray-950/20"}`}>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {["Polaris", "Nova", "Vega", "Atlas", "Luna"].map(a => (
              <div key={a} className="flex items-center gap-1.5 min-w-[70px]">
                <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-pulse" />
                <span className={`font-mono text-[9px] ${isLight ? "text-gray-650" : "text-gray-400"}`}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CENTER — AI WORKSPACE
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        {/* ── CENTER HEADER ── */}
        <div className={`shrink-0 px-6 pt-4 backdrop-blur-md ${isLight ? "bg-white/50" : "bg-gray-950/30"}`}>
          <PageHeaderHUD
            title="Command Center"
            subtitle="ORBIT BRAIN · AUTONOMOUS OPERATIONS NODE"
            onSelectAgent={setSelectedAgent}
            actions={
              <div className="flex items-center gap-4">
                {/* Mobile sidebar toggles */}
                <div className="xl:hidden flex items-center gap-1.5">
                  <button 
                    onClick={() => { setShowQuickMissions(!showQuickMissions); setShowAgentFeed(false); }}
                    className={`px-2 py-1 rounded border font-mono text-[8.5px] cursor-pointer transition-colors ${
                      showQuickMissions 
                        ? "bg-orbit-blue/20 text-orbit-blue border-orbit-blue/30" 
                        : isLight ? "border-gray-200 bg-white text-gray-600 hover:border-gray-300" : "border-gray-800 bg-gray-950/40 text-gray-450 hover:border-gray-750"
                    }`}
                  >
                    Missions
                  </button>
                  <button 
                    onClick={() => { setShowAgentFeed(!showAgentFeed); setShowQuickMissions(false); }}
                    className={`lg:hidden px-2 py-1 rounded border font-mono text-[8.5px] cursor-pointer transition-colors ${
                      showAgentFeed 
                        ? "bg-orbit-purple/20 text-orbit-purple border-orbit-purple/30" 
                        : isLight ? "border-gray-200 bg-white text-gray-600 hover:border-gray-300" : "border-gray-800 bg-gray-950/40 text-gray-450 hover:border-gray-750"
                    }`}
                  >
                    Feed
                  </button>
                </div>

                {/* HUD Diagnostic readout */}
                <div className={`hidden lg:flex items-center gap-4 font-mono text-[9px] px-3 py-1.5 rounded-lg border ${
                  isLight ? "text-gray-500 border-gray-200 bg-gray-50" : "text-gray-400 border-gray-800/80 bg-gray-950/20"
                }`}>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.geminiKey ? "bg-orbit-success" : "bg-red-500"}`} />
                    <span>COGNITIVE NODE: {config.geminiKey ? "ONLINE" : "OFFLINE"}</span>
                  </div>
                  <span className={isLight ? "text-gray-300" : "text-gray-850"}>|</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-pulse" />
                    <span>CORE SYNC: NOMINAL</span>
                  </div>
                </div>

                {/* Live mission pill */}
                {mission.isActive && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-orbit-blue/30 bg-orbit-blue/10 font-mono text-[10px] text-orbit-blue">
                    <span className="w-1.5 h-1.5 rounded-full bg-orbit-blue animate-ping" />
                    MISSION ACTIVE
                  </div>
                )}
                {mission.isActive && (
                  <button onClick={cancelMission}
                    className="p-1.5 rounded-lg border border-gray-800 hover:border-red-400/30 hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-all cursor-pointer">
                    <X size={14} />
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* ── SCROLLABLE CENTER CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── IDLE STATE: big hero prompt ── */}
          {!missionStarted && (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-center gap-8 animate-orbit-pulse">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr from-orbit-blue to-orbit-purple flex items-center justify-center border ${
                  isLight ? "shadow-[0_8px_30px_rgba(59,130,246,0.15)] border-blue-200" : "shadow-[0_0_40px_rgba(59,130,246,0.3)] border-white/10"
                }`}>
                  <Cpu size={32} className="text-white animate-pulse" />
                </div>
                <div className={`absolute -inset-3 rounded-3xl border animate-ping opacity-60 ${isLight ? "border-blue-300/30" : "border-orbit-blue/20"}`} />
              </div>
              <div className="space-y-2">
                <h2 className={`font-space text-2xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  Initiate Autonomous Mission Directive
                </h2>
                <p className={`font-mono text-[11px] max-w-sm leading-relaxed mx-auto ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                  Submit a critical business objective. ORBIT's neural agents will formulate cohorts, project conversions, write creatives, and launch.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_COMMANDS.slice(0, 4).map((cmd, i) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSubmit(cmd.label)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group cursor-pointer duration-300 ${
                        isLight 
                          ? "border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/10 hover:shadow-[0_4px_12px_rgba(37,99,235,0.05)]" 
                          : "border-gray-850 bg-gray-900/10 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_0_15px_rgba(59,130,246,0.08)]"
                      }`}
                    >
                      <div className={`p-2 rounded-lg border transition-colors ${
                        isLight 
                          ? "bg-slate-50 border-slate-200 group-hover:border-blue-500/20 group-hover:bg-blue-50/20" 
                          : "bg-gray-950 border-gray-800 group-hover:border-blue-500/20 group-hover:bg-blue-500/10"
                      }`}>
                        <Icon size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors shrink-0" />
                      </div>
                      <div>
                        <span className={`font-space text-[11px] font-semibold transition-colors leading-snug block ${
                          isLight ? "text-slate-700 group-hover:text-blue-650" : "text-gray-300 group-hover:text-white"
                        }`}>
                          {cmd.label}
                        </span>
                        <span className={`font-mono text-[8px] uppercase tracking-wider mt-0.5 block ${
                          isLight ? "text-slate-400 group-hover:text-blue-550" : "text-gray-600 group-hover:text-blue-400"
                        }`}>
                          {cmd.tag} DIRECTIVE
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
 
          {/* ── ACTIVATION SEQUENCE (As requested) ── */}
          {activationPhase && (
            <div 
              className={`rounded-2xl border p-8 flex flex-col items-center justify-center relative overflow-hidden space-y-6 min-h-[300px] ${
                isLight 
                  ? "bg-white border-emerald-300/50 shadow-md" 
                  : "rounded-2xl border border-emerald-500/20 bg-gray-950/90 border-glow shadow-[0_0_40px_rgba(16,185,129,0.08)]"
              }`}
              style={{
                animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards"
              }}
            >
              <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-scan-beam pointer-events-none`} />
 
              <div className={`w-full max-w-sm font-mono text-xs space-y-3 p-6 rounded-lg relative shadow-2xl border ${
                isLight 
                  ? "bg-emerald-50/20 border-emerald-300/40 text-emerald-800" 
                  : "bg-black/80 border-emerald-500/20 text-emerald-400"
              }`}>
                <div className={`absolute top-2 right-3 flex items-center gap-1.5 text-[8px] font-bold ${
                  isLight ? "text-emerald-600" : "text-emerald-600"
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  CONNECTING
                </div>
                
                <div className={`border-b pb-2 mb-3 text-[10px] uppercase font-semibold tracking-widest ${
                  isLight ? "border-emerald-300/20 text-emerald-600" : "border-emerald-500/10 text-emerald-600"
                }`}>
                  SYS.STATUS: INITIATION
                </div>
                
                <div className={`font-mono font-bold tracking-widest text-sm animate-pulse mb-4 ${
                  isLight ? "text-emerald-700" : "text-emerald-300"
                }`}>
                  &gt; MISSION RECEIVED
                </div>
 
                <div className="space-y-2">
                  {["Polaris", "Nova", "Vega", "Atlas", "Luna"].map((agent) => {
                    const isOnline = agentsOnline.includes(agent);
                    return (
                      <div key={agent} className="flex items-center gap-2 font-mono h-5">
                        {isOnline ? (
                          <div className={`flex items-center gap-2 font-bold tracking-wide ${
                            isLight ? "text-emerald-700" : "text-emerald-300"
                          }`}>
                            <span>✦</span>
                            <span>{agent} Online</span>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-2 ${isLight ? "text-emerald-600/60" : "text-emerald-700"}`}>
                            <Loader2 size={10} className="animate-spin" />
                            <span>{agent} Connecting...</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {activationDone && (
                <div className={`flex items-center gap-2 font-mono text-[10px] animate-pulse mt-2 uppercase tracking-widest ${
                  isLight ? "text-emerald-600" : "text-emerald-400"
                }`}>
                  <span className="animate-spin text-sm">✦</span>
                  All agents online · Beginning reasoning timeline
                </div>
              )}
            </div>
          )}

          {/* ── MISSION BANNER (once active) ── */}
          {missionStarted && !activationPhase && mission.goal && (
            <MissionBanner mission={mission} customers={customers} onCancel={cancelMission} />
          )}

          {/* ── REASONING TIMELINE ── */}
          {steps.length > 0 && (
            <div className={`rounded-2xl border p-5 space-y-1 relative overflow-hidden backdrop-blur-md ${
              isLight ? "border-gray-200 bg-white shadow-sm" : "border-gray-800/80 bg-gray-900/40"
            }`}>
              {!isLight && <div className="absolute top-0 right-0 w-32 h-32 bg-orbit-glow-purple pointer-events-none opacity-10" />}
              
              <div className={`flex items-center gap-2 border-b pb-3 mb-4 ${isLight ? "border-gray-100" : "border-gray-800"}`}>
                <Cpu size={13} className="text-orbit-purple animate-pulse" />
                <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${isLight ? "text-gray-700" : "text-gray-300"}`}>
                  AI Reasoning Timeline
                </span>
                {mission.step !== "idle" && mission.step !== "ready" && mission.step !== "dispatched" && (
                  <span className="ml-auto font-mono text-[9px] text-orbit-blue flex items-center gap-1.5 animate-pulse">
                    <Loader2 size={10} className="animate-spin" /> Reasoning Active
                  </span>
                )}
              </div>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />

                <div className="space-y-3 pl-10">
                  {steps.map((step, i) => {
                    const meta = AGENT_META[step.agent];
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.id}
                        style={{ animationDelay: `${i * 100}ms` }}
                        className={`relative transition-all duration-500 ${step.status === "pending" ? "opacity-30" : "opacity-100"} animate-fade-in-up`}
                      >
                        {/* Dot on timeline */}
                        <div
                          className="absolute -left-[2.35rem] top-3 w-6 h-6 rounded-full border flex items-center justify-center bg-gray-950"
                          style={step.status !== "pending" ? { borderColor: meta.color, boxShadow: `0 0 8px ${meta.color}40` } : { borderColor: "#374151" }}
                        >
                          <StepIndicator status={step.status} color={meta.color} />
                        </div>

                        <div
                          className={`p-4 rounded-xl border transition-all duration-500 ${
                            step.status === "running"
                              ? isLight ? "bg-blue-50/40" : "bg-[#1E293B]"
                              : step.status === "done"
                                ? isLight ? "border-gray-200 bg-gray-50/40 shadow-sm" : "border-[rgba(255,255,255,0.08)] bg-[#0F172A]/80 shadow-sm"
                                : isLight ? "border-gray-100 bg-transparent opacity-45" : "border-[rgba(255,255,255,0.04)] bg-transparent opacity-45"
                          }`}
                          style={step.status === "running" && !isLight ? { borderColor: meta.color, boxShadow: `0 0 25px ${meta.color}40` } : step.status === "running" && isLight ? { borderColor: meta.color } : {}}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <Icon size={13} style={{ color: step.status !== "pending" ? meta.color : "#6b7280" }} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono text-[10px] font-bold capitalize ${isLight ? "text-gray-900" : "text-white"}`}>{step.label}</span>
                                  <span 
                                    onClick={() => step.agent !== "System" && setSelectedAgent(step.agent)}
                                    className="font-mono text-[8px] font-bold uppercase px-1.5 py-0.5 rounded animate-pulse cursor-pointer hover:opacity-85"
                                    style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
                                    title={`View ${step.agent} profile`}
                                  >
                                    {step.agent}
                                  </span>
                                </div>
                                {step.status !== "pending" && (() => {
                                  const agentLog = agentLogs.find(l => l.agent === step.agent);
                                  return (
                                    <p className={`font-mono text-[9px] mt-0.5 leading-relaxed ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                                      {agentLog ? agentLog.message : step.detail}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {step.metric && step.status === "done" && (
                                <span className="font-mono text-[9px] font-bold" style={{ color: meta.color }}>{step.metric}</span>
                              )}
                              {step.ts && (
                                <span className="font-mono text-[8px] text-gray-500 block">{step.ts}</span>
                              )}
                            </div>
                          </div>
                          {step.status === "running" && (
                            <div className="mt-2 h-0.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full animate-[slideRight_2s_ease-in-out_infinite]"
                                style={{ backgroundColor: meta.color, width: "40%" }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── MISSION OUTCOME CARDS ── */}
          {outcomeVisible && mission.step === "ready" && (
            <MissionOutcomeCards mission={mission} onSelectAgent={setSelectedAgent} />
          )}

          {/* ── LAUNCH SEQUENCE ── */}
          {launchReady && !launchFired && (
            <LaunchSequence
              mission={mission}
              onLaunch={handleLaunch}
              onCancel={cancelMission}
            />
          )}

          {/* ── POST-LAUNCH CONFIRMATION ── */}
          {launchFired && (
            <div className={`rounded-2xl border p-6 text-center space-y-3 ${
              isLight ? "border-emerald-200 bg-emerald-50/15" : "border-orbit-success/30 bg-orbit-success/5"
            }`}
              style={isLight ? undefined : { boxShadow: "0 0 40px rgba(34,197,94,0.12)" }}>
              <div className="flex items-center justify-center gap-3">
                <CheckCircle2 size={24} className="text-orbit-success animate-bounce" />
                <span className={`font-space text-lg font-bold tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>Mission Dispatched</span>
              </div>
              <p className={`font-mono text-[10px] ${isLight ? "text-gray-600" : "text-gray-400"}`}>
                Atlas is routing {mission.audienceCount} targets via <span className={`font-bold ${isLight ? "text-gray-950" : "text-white"}`}>{mission.selectedChannel}</span>.
                Track progress in Mission Control.
              </p>
              <div className="flex justify-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-orbit-success bg-orbit-success/10 px-3 py-1 rounded-full border border-orbit-success/20 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-ping" />
                  Campaign Running
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── INPUT BAR ── */}
        <div className={`shrink-0 px-6 py-4 border-t relative z-10 backdrop-blur-md ${
          isLight ? "border-gray-200 bg-white/90" : "border-[rgba(255,255,255,0.08)] bg-[#050816]/90"
        }`}>
          <div
            className={`flex items-end gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
              isLight 
                ? "border-gray-200 bg-white focus-within:border-orbit-blue/50 focus-within:shadow-[0_0_20px_rgba(37,99,235,0.08)]" 
                : "border-[rgba(255,255,255,0.12)] bg-[#0F172A]/85 focus-within:border-orbit-blue/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
            }`}
          >
            {isListening ? (
              <div className="flex-1 flex items-center gap-3 px-2 h-10 animate-pulse">
                <div className="flex items-center gap-1.5 h-6">
                  {[...Array(6)].map((_, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full bg-blue-500 bar-anim"
                      style={{
                        animationDelay: `${idx * 0.12}s`,
                        animationDuration: `${0.5 + Math.random() * 0.8}s`
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-blue-500 tracking-wider animate-pulse uppercase">
                  ORBIT Voice Input Active · Listening for directive...
                </span>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                rows={1}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a business goal… e.g. Increase repeat purchases by 20%"
                className={`flex-1 bg-transparent text-sm font-inter placeholder-gray-500 resize-none focus:outline-none leading-relaxed ${
                  isLight ? "text-gray-900" : "text-white"
                }`}
                style={{ maxHeight: 120, minHeight: 24 }}
              />
            )}
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggleVoice}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? "border-red-500/50 bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                    : isLight ? "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700" : "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300"
                }`}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button
                onClick={() => handleSubmit(inputVal)}
                disabled={!inputVal.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  inputVal.trim()
                    ? "bg-gradient-to-r from-orbit-blue to-orbit-purple text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:opacity-90 active:scale-95"
                    : isLight ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" : "bg-[#162032] text-gray-500 cursor-not-allowed border border-[rgba(255,255,255,0.04)]"
                }`}
              >
                <Send size={13} />
                Launch
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT SIDEBAR — Agent Feed
      ════════════════════════════════════════ */}
      <aside className={`w-64 shrink-0 flex flex-col backdrop-blur-md overflow-hidden relative z-10 transition-all duration-300
        ${isLight ? "border-l border-gray-200 bg-white" : "border-l border-gray-800/60 bg-gray-950/40"}
        ${showAgentFeed 
          ? `fixed inset-y-12 right-0 w-72 z-30 flex h-[calc(100vh-3rem)] border-l ${isLight ? "bg-white border-gray-200" : "bg-[#050816] border-l border-gray-800"}` 
          : "hidden lg:flex"
        }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? "border-gray-100 bg-gray-50/50" : "border-gray-800/60 bg-gray-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <Radio size={12} className="text-orbit-success animate-pulse" />
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${isLight ? "text-gray-700" : "text-white"}`}>Live Agent Feed</span>
          </div>
          <button onClick={() => setShowAgentFeed(false)} className={`lg:hidden cursor-pointer ${isLight ? "text-gray-400 hover:text-gray-900" : "text-gray-550 hover:text-white"}`}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {agentLogs.map((log, i) => {
            const meta = AGENT_META[log.agent] || AGENT_META.System;
            return (
              <div
                key={log.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isLight 
                    ? i === 0
                      ? "bg-blue-50/20 border-blue-200 shadow-sm hover:bg-blue-50/40"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                    : i === 0
                      ? "bg-[#1E293B] border-[rgba(255,255,255,0.12)] shadow-md hover:bg-[#1E293B]"
                      : "bg-[#0F172A] border-[rgba(255,255,255,0.06)] hover:bg-[#1E293B]"
                }`}
                style={{
                  borderLeft: `3px solid ${meta.color}`,
                  boxShadow: i === 0 && !isLight ? `0 0 20px ${meta.color}18` : undefined,
                  animation: i === 0 ? "fadeInUp 0.35s ease both" : undefined
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="font-mono text-[9px] font-bold uppercase" style={{ color: meta.color }}>
                      {log.agent}
                    </span>
                  </div>
                  <span className="font-mono text-[7px] text-gray-500">{log.timestamp}</span>
                </div>
                <p className={`font-mono text-[9px] leading-relaxed ${isLight ? "text-gray-700" : "text-gray-300"}`}>{log.message}</p>
                <div className="mt-1.5">
                  <span className={`font-mono text-[7px] uppercase px-1.5 py-0.5 rounded ${
                    log.type === "chat"    ? "bg-orbit-blue/10 text-orbit-blue" :
                    log.type === "action"  ? "bg-orbit-purple/10 text-orbit-purple" :
                    log.type === "result"  ? "bg-orbit-success/10 text-orbit-success" :
                    isLight ? "bg-gray-105 text-gray-500" : "bg-gray-800 text-gray-500"
                  }`}>
                    {log.type}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>

        {/* Agent mini-grid at bottom with load meters */}
        <div className={`shrink-0 p-3 border-t grid grid-cols-2 gap-2 ${
          isLight ? "border-gray-200 bg-gray-50" : "border-gray-800/60 bg-gray-950/40"
        }`}>
          {(["Polaris", "Nova", "Vega", "Atlas", "Luna"] as const).map(agent => {
            const meta = AGENT_META[agent];
            const lastLog = agentLogs.find(l => l.agent === agent);
            const cpuLoad = Math.round(15 + (agent.length * 7) + (Math.sin(Date.now() / 12000) * 10));
            return (
              <div
                key={agent}
                onClick={() => setSelectedAgent(agent)}
                className={`p-2.5 rounded-lg border cursor-pointer hover:border-current hover:scale-[1.02] ${
                  isLight ? "border-gray-200 bg-white" : `${meta.border} ${meta.bg}`
                } flex flex-col gap-1.5 hover:shadow-[0_0_10px_rgba(59,130,246,0.05)] transition-all`}
                title={`Click to open ${agent} premium card`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
                    <span className={`font-space font-bold text-[10px] ${isLight ? "text-gray-800" : "text-white"}`}>{agent}</span>
                  </div>
                  <span className="font-mono text-[8px] text-gray-500">{cpuLoad}% load</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cpuLoad}%`, backgroundColor: meta.color }} />
                </div>
                {lastLog ? (
                  <p className={`font-mono text-[8px] leading-snug line-clamp-2 border-t pt-1 mt-0.5 ${
                    isLight ? "border-gray-100 text-gray-500" : "border-gray-800/40 text-gray-400"
                  }`}>{lastLog.message}</p>
                ) : (
                  <p className={`font-mono text-[8px] leading-snug line-clamp-2 border-t pt-1 mt-0.5 ${
                    isLight ? "border-gray-100 text-gray-450" : "border-gray-800/40 text-gray-600"
                  }`}>Awaiting directive...</p>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MISSION BANNER
───────────────────────────────────────────────────────────── */
const MissionBanner: React.FC<{
  mission: ReturnType<typeof useOrbit>["mission"];
  customers: any[];
  onCancel: () => void;
}> = ({ mission, customers: _customers, onCancel }) => {
  const heading = mission.step === "ready" || mission.step === "dispatched" ? "Mission Complete" : "Mission In-Progress";
  const stepLabels = {
    analyzing: "Analyzing customer data...",
    segmenting: "Segmenting target audience...",
    predicting: "Calculating revenue forecast...",
    generating: "Generating creative assets...",
    ready: "Mission ready for dispatch",
    dispatched: "Mission running",
    idle: "Waiting..."
  };
  const stepWeights = { analyzing: 20, segmenting: 40, predicting: 60, generating: 80, ready: 100, dispatched: 100, idle: 0 };
  const pct = stepWeights[mission.step];

  const { theme } = useOrbit();
  const isLight = theme === "executive";

  return (
    <div
      className={`rounded-2xl border p-6 relative overflow-hidden transition-all duration-300 ${
        isLight 
          ? "border-gray-200 bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 shadow-sm"
          : "border-orbit-blue/40 bg-gradient-to-r from-orbit-blue/15 via-[#0F172A] to-orbit-purple/15"
      }`}
      style={isLight ? undefined : { boxShadow: "0 0 45px rgba(59,130,246,0.22)" }}
    >
      {/* Background glow sweep */}
      {!isLight && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, transparent 60%)" }} />
      )}

      <div className="relative flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orbit-blue animate-ping" />
            <div>
              <span className="font-mono text-[10px] font-bold text-orbit-blue uppercase tracking-[0.2em]">
                {heading}
              </span>
              <p className={`font-space text-base font-bold mt-0.5 leading-snug ${isLight ? "text-gray-900" : "text-white"}`}>
                {mission.goal}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-1.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
              isLight 
                ? "border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-red-500" 
                : "border-gray-700 hover:border-red-400/30 hover:bg-red-400/10 text-gray-500 hover:text-red-400"
            }`}
          >
            <X size={13} />
          </button>
        </div>

        {/* Lead agents row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? "text-gray-400" : "text-gray-500"}`}>Lead Agents</span>
          {(["Polaris", "Vega", "Nova", "Atlas", "Luna"] as const).map(a => {
            const meta = AGENT_META[a];
            return (
              <div key={a} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
                <span className="font-mono text-[9px] font-bold" style={{ color: meta.color }}>{a}</span>
              </div>
            );
          })}
        </div>

        {/* Status + progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mission.step !== "ready" && mission.step !== "dispatched" && (
                <Loader2 size={11} className="text-orbit-blue animate-spin" />
              )}
              {(mission.step === "ready" || mission.step === "dispatched") && (
                <CheckCircle2 size={11} className="text-orbit-success" />
              )}
              <span className={`font-mono text-[10px] ${isLight ? "text-gray-700" : "text-gray-300"}`}>{stepLabels[mission.step]}</span>
            </div>
            <span className="font-mono text-[10px] text-orbit-blue font-bold">{pct}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-gray-100" : "bg-gray-800"}`}>
            <div
              className="h-full rounded-full transition-all duration-750"
              style={{
                width: `${pct}%`,
                background: pct === 100
                  ? "linear-gradient(90deg, #22C55E, #16A34A)"
                  : "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                boxShadow: isLight ? undefined : `0 0 10px ${pct === 100 ? "#22C55E60" : "#3B82F660"}`,
              }}
            />
          </div>
        </div>

        {/* Metrics row (visible once we have data) */}
        {mission.audienceCount > 0 && (
          <div className={`flex items-center gap-4 pt-1 border-t ${isLight ? "border-gray-100" : "border-gray-800/60"}`}>
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-orbit-blue animate-pulse" />
              <span className={`font-mono text-[10px] ${isLight ? "text-gray-600" : "text-gray-300"}`}>
                <span className={`font-bold ${isLight ? "text-gray-950" : "text-white"}`}>{mission.audienceCount}</span> targets
              </span>
            </div>
            {mission.predictedRevenue > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-orbit-success animate-pulse" />
                <span className={`font-mono text-[10px] ${isLight ? "text-gray-650" : "text-gray-300"}`}>
                  <span className="text-orbit-success font-bold">₹{mission.predictedRevenue.toLocaleString()}</span> forecast
                </span>
              </div>
            )}
            {mission.predictedRoi > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap size={11} className="text-yellow-500 animate-pulse" />
                <span className={`font-mono text-[10px] ${isLight ? "text-gray-655" : "text-gray-300"}`}>
                  <span className="text-yellow-600 font-bold">{mission.predictedRoi}x</span> ROI
                </span>
              </div>
            )}
            {mission.selectedChannel && mission.step !== "analyzing" && (
              <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px]">
                <span>{CHANNEL_ICONS[mission.selectedChannel] || "✉"}</span>
                <span className={`${isLight ? "text-gray-500" : "text-gray-400"}`}>{mission.selectedChannel}</span>
                <span className={`${isLight ? "text-gray-400" : "text-gray-600"}`}>recommended</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MISSION OUTCOME CARDS
───────────────────────────────────────────────────────────── */
const MissionOutcomeCards: React.FC<{
  mission: ReturnType<typeof useOrbit>["mission"];
  onSelectAgent: (agent: "Polaris" | "Vega" | "Nova" | "Atlas" | "Luna") => void;
}> = ({ mission, onSelectAgent }) => {
  const { theme } = useOrbit();
  const isLight = theme === "executive";

  const cards = [
    {
      agent: "Polaris" as const,
      icon: Users,
      title: "Audience Identified",
      value: `${mission.audienceCount} customers`,
      detail: "Behaviorally clustered, DNA-tagged, churn-risk scored",
      action: "View in Galaxy →",
      color: "#3B82F6",
    },
    {
      agent: "Vega" as const,
      icon: TrendingUp,
      title: "Revenue Forecast",
      value: `₹${mission.predictedRevenue.toLocaleString()}`,
      detail: `${mission.predictedRoi}x predicted ROI · 87% model confidence`,
      action: "View Analytics →",
      color: "#8B5CF6",
    },
    {
      agent: "Nova" as const,
      icon: Sparkles,
      title: "Campaign Generated",
      value: "4 channel variants",
      detail: "Email, WhatsApp, SMS, RCS — hyper-personalized copy ready",
      action: "Preview in Studio →",
      color: "#EC4899",
    },
    {
      agent: "Atlas" as const,
      icon: Radio,
      title: "Channel Selected",
      value: mission.selectedChannel,
      detail: "Optimal delivery window computed. Atlas nodes verified.",
      action: `Launch via ${mission.selectedChannel} →`,
      color: "#22C55E",
    },
    {
      agent: "Luna" as const,
      icon: Activity,
      title: "Revenue Recovery",
      value: "₹12,000 potential",
      detail: "Luna detected 17 abandoned leads and generated follow-up hooks.",
      action: "Review Opportunities →",
      color: "#F59E0B",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const meta = AGENT_META[card.agent];
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl border p-4 flex flex-col gap-3 hover:scale-[1.01] transition-all duration-300 ${
              isLight 
                ? "border-gray-200 bg-white shadow-sm hover:border-gray-300 hover:shadow-md" 
                : `${meta.border} ${meta.bg}`
            }`}
            style={{
              animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
              boxShadow: isLight ? undefined : `0 0 20px ${meta.glow}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => onSelectAgent(card.agent)} title={`Click to view ${card.agent} profile`}>
                <Icon size={14} style={{ color: card.color }} />
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider" style={{ color: card.color }}>
                  {card.agent}
                </span>
              </div>
              <span className="font-mono text-[8px] text-orbit-success border border-orbit-success/30 bg-orbit-success/5 px-1.5 py-0.5 rounded-full font-semibold">
                COMPLETE
              </span>
            </div>
            <div>
              <p className={`font-mono text-[10px] uppercase tracking-wider ${isLight ? "text-gray-500" : "text-gray-450"}`}>{card.title}</p>
              <p className="font-space text-lg font-bold mt-0.5" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
            <p className={`font-mono text-[9px] leading-relaxed ${isLight ? "text-gray-600" : "text-gray-400"}`}>{card.detail}</p>
            <div className="mt-auto flex items-center gap-1 font-mono text-[9px] cursor-pointer" style={{ color: card.color }}>
              <span>{card.action}</span>
              <ChevronRight size={10} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   LAUNCH SEQUENCE
───────────────────────────────────────────────────────────── */
const LaunchSequence: React.FC<{
  mission: ReturnType<typeof useOrbit>["mission"];
  onLaunch: () => void;
  onCancel: () => void;
}> = ({ mission, onLaunch, onCancel }) => {
  const { theme } = useOrbit();
  const isLight = theme === "executive";
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleArm = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { onLaunch(); return; }
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onLaunch]);

  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 ${
        isLight ? "border-emerald-200 bg-emerald-50/20 shadow-sm" : "border-orbit-success/30 bg-orbit-success/5"
      }`}
      style={{ 
        boxShadow: isLight ? undefined : "0 0 40px rgba(34,197,94,0.1)", 
        animation: "fadeInUp 0.5s ease both" 
      }}
    >
      <div className="flex items-center gap-3">
        <Play size={16} className="text-orbit-success animate-pulse" />
        <div>
          <p className="font-mono text-[10px] font-bold text-orbit-success uppercase tracking-widest">Launch Sequence Ready</p>
          <p className={`font-mono text-[9px] mt-0.5 ${isLight ? "text-gray-500" : "text-gray-500"}`}>All neural components aligned. Atlas dispatch buffer cleared.</p>
        </div>
      </div>

      {/* Pre-launch checklist */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Audience locked", ok: true },
          { label: "Content generated", ok: true },
          { label: "Channel optimized", ok: true },
          { label: "Nodes responsive", ok: true },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-1.5 p-2 rounded-lg border ${
            isLight ? "bg-white border-gray-200" : "bg-gray-900/40 border-gray-800"
          }`}>
            <CheckCircle2 size={11} className="text-orbit-success shrink-0" />
            <span className={`font-mono text-[9px] ${isLight ? "text-gray-700" : "text-gray-300"}`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className={`flex items-center gap-6 py-2.5 px-4 rounded-xl border ${
        isLight ? "bg-white border-gray-200" : "bg-gray-950/60 border-gray-800"
      }`}>
        <div className="text-center flex-1">
          <p className={`font-space text-lg font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{mission.audienceCount}</p>
          <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wider">Targets</p>
        </div>
        <ArrowRight size={14} className="text-gray-750 shrink-0" />
        <div className="text-center flex-1">
          <p className="font-space text-lg font-bold" style={{ color: "#22C55E" }}>
            {CHANNEL_ICONS[mission.selectedChannel] || "✉"} {mission.selectedChannel}
          </p>
          <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wider">Channel</p>
        </div>
        <ArrowRight size={14} className="text-gray-750 shrink-0" />
        <div className="text-center flex-1">
          <p className="font-space text-lg font-bold text-orbit-success">₹{mission.predictedRevenue.toLocaleString()}</p>
          <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wider">Forecast</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {countdown === null ? (
          <>
            <button
              onClick={handleArm}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orbit-success to-emerald-400 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              style={{ boxShadow: "0 0 25px rgba(34,197,94,0.3)" }}
            >
              <Play size={14} />
              Confirm Dispatch
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-3 rounded-xl border border-gray-800 text-gray-400 font-mono text-xs hover:border-red-400/30 hover:text-red-400 transition-all cursor-pointer"
            >
              Abort
            </button>
          </>
        ) : (
          <div className="flex-1 py-3 rounded-xl border border-orbit-success/40 bg-orbit-success/10 flex items-center justify-center gap-3">
            <span className="font-space text-2xl font-bold text-orbit-success tabular-nums animate-ping">
              {countdown > 0 ? countdown : "🚀"}
            </span>
            <span className="font-mono text-[10px] text-orbit-success uppercase tracking-wider animate-pulse">
              {countdown > 0 ? `DISPATCHING IN ${countdown}...` : "LAUNCHED"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

