import React, { useState, useEffect, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import {
  TrendingUp, Target, Zap, Shield, Radio,
  Activity, ChevronUp, ChevronDown, Cpu,
  ArrowUpRight, Layers, Star
} from "lucide-react";
import { AgentCardModal } from "../components/AgentCardModal";

/* ─── Animated Counter Hook ─────────────────────────────────── */
function useCounter(target: number, duration = 1200, prefix = "", suffix = "") {
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
  value, max = 100, color, label, size = 90, isLight = false
}) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 overflow-visible">
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"} strokeWidth="8" />
          {/* Progress */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center rotate-90">
          <span className={`font-space font-bold text-sm ${isLight ? "text-gray-900" : "text-white"}`}>{value}%</span>
        </div>
      </div>
      <span className={`font-mono text-[9px] uppercase tracking-widest text-center ${isLight ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
    </div>
  );
};

/* ─── Live Ticker Row ───────────────────────────────────────── */
interface TickerEvent {
  id: string;
  type: "sent" | "delivered" | "opened" | "clicked" | "purchased";
  name: string;
  campaign: string;
  amount?: number;
  ts: string;
}

const TYPE_CONFIG = {
  sent:      { label: "SENT",      color: "text-gray-400",        dot: "bg-gray-500",        icon: "→" },
  delivered: { label: "DELIVERED", color: "text-orbit-blue",      dot: "bg-orbit-blue",      icon: "✓" },
  opened:    { label: "OPENED",    color: "text-orbit-purple",    dot: "bg-orbit-purple",    icon: "👁" },
  clicked:   { label: "CLICKED",   color: "text-yellow-400",      dot: "bg-yellow-400",      icon: "⚡" },
  purchased: { label: "PURCHASED", color: "text-orbit-success",   dot: "bg-orbit-success",   icon: "✦" },
};

/* ─── Agent Config ──────────────────────────────────────────── */
const AGENTS = [
  {
    name: "Polaris",
    role: "Audience Intelligence",
    color: "#3B82F6",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    tasks: [
      "Clustering 432 inactive segments",
      "Running cohort similarity analysis",
      "Mapping behavioral DNA signatures",
      "Flagging 18 VIP churn risks",
    ],
    confidence: 94,
  },
  {
    name: "Nova",
    role: "Campaign Creator",
    color: "#EC4899",
    border: "border-pink-400/30",
    bg: "bg-pink-400/5",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.15)]",
    tasks: [
      "Drafting WhatsApp personalization copy",
      "A/B testing subject lines",
      "Generating RCS rich card variants",
      "Injecting DNA tokens into templates",
    ],
    confidence: 91,
  },
  {
    name: "Vega",
    role: "Predictive Analytics",
    color: "#8B5CF6",
    border: "border-violet-500/30",
    bg: "bg-violet-500/5",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.15)]",
    tasks: [
      "Forecasting Q3 revenue trajectory",
      "Computing churn probability deltas",
      "Running 60-feature regression model",
      "Calculating optimal send-time windows",
    ],
    confidence: 88,
  },
  {
    name: "Atlas",
    role: "Operations Dispatch",
    color: "#22C55E",
    border: "border-green-500/30",
    bg: "bg-green-500/5",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
    tasks: [
      "Routing 654 messages via WhatsApp",
      "Monitoring delivery node latency",
      "Load balancing channel throughput",
      "Processing webhook event stream",
    ],
    confidence: 96,
  },
  {
    name: "Luna",
    role: "Growth Recovery Agent",
    color: "#F59E0B",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    tasks: [
      "Scanning customer universe...",
      "Analyzing engagement signals...",
      "Detecting revenue leaks...",
      "Building recovery audiences...",
      "Campaign recovery ready...",
    ],
    confidence: 93,
  },
];

const NAMES = ["Arjun S.", "Priya M.", "Rahul K.", "Neha V.", "Kabir R.", "Sara J.", "Dev P.", "Aisha B.", "Marcus L.", "Elena D."];
const CAMPAIGNS = ["Q2 Win-back", "Quantum Cross-sell", "New Signup Flow", "LTV Booster", "Loyalty Loop"];

function makeTickerEvent(): TickerEvent {
  const types: TickerEvent["type"][] = ["sent", "delivered", "opened", "clicked", "purchased"];
  const weights = [0.2, 0.35, 0.25, 0.12, 0.08];
  const r = Math.random();
  let cum = 0, chosenType = types[0];
  for (let i = 0; i < types.length; i++) {
    cum += weights[i];
    if (r < cum) { chosenType = types[i]; break; }
  }
  return {
    id: `evt_${Date.now()}_${Math.random()}`,
    type: chosenType,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    campaign: CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)],
    amount: chosenType === "purchased" ? 400 + Math.floor(Math.random() * 1600) : undefined,
    ts: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export const MissionControl: React.FC = () => {
  const { campaigns, orders, agentLogs, growthScore, networkHealth, revenueGoal, theme, lunaMetrics } = useOrbit();
  const isLight = theme === "executive";
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* Live clock */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Latency telemetry monitor values (last 12 measurements) */
  const [latencyHistory, setLatencyHistory] = useState<number[]>(() =>
    Array.from({ length: 12 }, () => 12 + Math.floor(Math.random() * 15))
  );
  useEffect(() => {
    const t = setInterval(() => {
      setLatencyHistory(prev => [...prev.slice(1), 10 + Math.floor(Math.random() * 20)]);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* Interactive diagnostic ping simulator */
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [isPingRunning, setIsPingRunning] = useState(false);
  const [pingStep, setPingStep] = useState(0);

  const handlePingTest = () => {
    if (isPingRunning) return;
    setIsPingRunning(true);
    setPingStep(1);
    setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] INITIATING ROUTER DIRECTORY PING...`, ...prev]);
    
    // Step 1: Ping Polaris
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] POLARIS -> PING OK (RTT: 4.2ms)`, ...prev]);
      setPingStep(2);
    }, 500);

    // Step 2: Nova
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] NOVA -> PING OK (RTT: 5.8ms)`, ...prev]);
      setPingStep(3);
    }, 1000);

    // Step 3: Vega
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] VEGA -> PING OK (RTT: 7.1ms)`, ...prev]);
      setPingStep(4);
    }, 1500);

    // Step 4: Ping Atlas
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] ATLAS -> PING OK (RTT: 3.9ms)`, ...prev]);
      setPingStep(5);
    }, 2000);

    // Step 5: Ping Luna
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] LUNA -> PING OK (RTT: 4.8ms)`, ...prev]);
      setPingStep(6);
    }, 2500);

    // Step 6: Finished
    setTimeout(() => {
      setPingLogs(prev => [`[${new Date().toLocaleTimeString()}] DIAGNOSTICS NOMINAL. COGNITIVE LEDGER SYNCED.`, ...prev]);
      setIsPingRunning(false);
      setPingStep(0);
    }, 3000);
  };

  /* Ticker feed */
  const [ticker, setTicker] = useState<TickerEvent[]>(() =>
    Array.from({ length: 8 }, makeTickerEvent)
  );
  useEffect(() => {
    const t = setInterval(() => {
      setTicker(prev => [makeTickerEvent(), ...prev].slice(0, 30));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  /* Agent task rotation */
  const [agentTaskIdx, setAgentTaskIdx] = useState([0, 0, 0, 0, 0]);
  useEffect(() => {
    const t = setInterval(() => {
      setAgentTaskIdx(prev => prev.map((idx, i) => (idx + 1) % AGENTS[i].tasks.length));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  /* Sparkline data */
  const [spark] = useState(() => ({
    revenue: Array.from({ length: 14 }, (_, i) => 40000 + i * 6000 + Math.random() * 8000),
    growth:  Array.from({ length: 14 }, (_, i) => 60 + i * 2 + Math.random() * 5),
  }));

  /* Computed metrics */
  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const completedCamps = campaigns.filter(c => c.status === "Completed");
  const runningCamps   = campaigns.filter(c => c.status === "Running");
  const forecastRevenue = Math.round(totalRevenue * 1.28);

  const deliveryRate = completedCamps.length
    ? Math.round(completedCamps.reduce((s, c) => s + (c.sentCount ? ((c as any).deliveredCount ?? c.sentCount * 0.96) / c.sentCount : 0), 0) / completedCamps.length * 100) : 96;
  const openRate = completedCamps.length
    ? Math.round(completedCamps.reduce((s, c) => s + (c.sentCount ? c.openedCount / c.sentCount : 0), 0) / completedCamps.length * 100) : 71;
  const convRate = completedCamps.length
    ? Math.round(completedCamps.reduce((s, c) => s + (c.clickedCount ? c.purchaseCount / c.clickedCount : 0), 0) / completedCamps.length * 100) : 22;

  /* Animated counter targets */
  const revCounter   = useCounter(totalRevenue, 1400, "₹");
  const goalCounter  = useCounter(revenueGoal, 1000, "₹");
  const foreCounter  = useCounter(forecastRevenue, 1600, "₹");
  const growCounter  = useCounter(Math.round(growthScore * 10), 900, "", "");

  return (
    <div className={`flex-1 min-h-0 overflow-y-auto relative transition-colors duration-300 ${isLight ? "bg-gray-50/50" : "bg-[#050816]"}`}>

      {/* ── AMBIENT GLOWS ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full transition-opacity duration-300 ${isLight ? "opacity-5" : "opacity-20"}`}
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }} />
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full transition-opacity duration-300 ${isLight ? "opacity-5" : "opacity-15"}`}
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />
      </div>

      {/* ── SPACE GRID ── */}
      <div className={`pointer-events-none fixed inset-0 space-grid transition-opacity duration-300 ${isLight ? "opacity-40" : "opacity-60"}`} />

      <div className="relative z-10 p-6 space-y-5">

        {/* ══════════════ HEADER ══════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 rounded-full bg-orbit-success animate-pulse" />
              <span className={`font-mono text-[10px] tracking-[0.2em] uppercase ${isLight ? "text-emerald-600 font-bold" : "text-orbit-success"}`}>
                All Systems Nominal
              </span>
            </div>
            <h1 className={`font-space text-3xl font-bold tracking-tight ${isLight ? "text-gray-900" : "text-white"}`}>
              Mission Control
            </h1>
            <p className="text-xs text-gray-550 font-mono mt-0.5">
              AUTONOMOUS OPERATIONS CENTER — ORBIT v4.81 VANGUARD
            </p>
          </div>

          {/* Live clock + uptime + latency graph */}
          <div className="flex items-center gap-4">
            {/* Thread Latency mini-chart */}
            <div className="flex items-end gap-0.5 h-6 shrink-0 border-l pl-3" style={{ borderColor: isLight ? "#e5e7eb" : "#1f2937" }}>
              {latencyHistory.map((l, idx) => {
                const pctHeight = (l / 40) * 100;
                return (
                  <div
                    key={idx}
                    className="w-1 bg-orbit-blue rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${pctHeight}%`,
                      opacity: 0.3 + (idx / 12) * 0.7,
                    }}
                    title={`Latency: ${l}ms`}
                  />
                );
              })}
            </div>

            <div className="text-right hidden sm:block">
              <div className={`font-mono text-xl font-bold tracking-widest tabular-nums ${isLight ? "text-gray-900" : "text-white"}`}>
                {now.toLocaleTimeString("en-US", { hour12: false })}
              </div>
              <div className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? "text-gray-400" : "text-gray-555"}`}>
                {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="w-px h-10 hidden sm:block" style={{ backgroundColor: isLight ? "#e5e7eb" : "#1f2937" }} />
            <div className="flex flex-col gap-1">
              {["POLARIS", "VEGA", "NOVA", "ATLAS", "LUNA"].map((a, i) => (
                <div 
                  key={a} 
                  onClick={() => setSelectedAgent(a.charAt(0) + a.slice(1).toLowerCase() as any)}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80"
                  title={`View ${a} premium card`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }} />
                  <span className={`font-mono text-[8px] uppercase tracking-wider ${isLight ? "text-gray-500" : "text-gray-400"}`}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════ SECTION 1 — REVENUE OVERVIEW ══════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Revenue Achieved",
              value: revCounter,
              raw: totalRevenue,
              goal: revenueGoal,
              color: "#22C55E",
              glow: "rgba(34,197,94,0.15)",
              delta: "+12.4%",
              up: true,
              spark: spark.revenue,
              icon: TrendingUp,
            },
            {
              label: "Revenue Goal",
              value: goalCounter,
              raw: revenueGoal,
              goal: revenueGoal,
              color: "#3B82F6",
              glow: "rgba(59,130,246,0.15)",
              delta: "Q2 Target",
              up: null,
              spark: null,
              icon: Target,
            },
            {
              label: "Forecast Revenue",
              value: foreCounter,
              raw: forecastRevenue,
              goal: revenueGoal,
              color: "#8B5CF6",
              glow: "rgba(139,92,246,0.15)",
              delta: "+28% projected",
              up: true,
              spark: spark.revenue.map(v => v * 1.28),
              icon: Zap,
            },
            {
              label: "Growth Score",
              value: `${growCounter}`,
              raw: growthScore,
              goal: 100,
              color: "#EC4899",
              glow: "rgba(236,72,153,0.15)",
              delta: "+2.3 pts this week",
              up: true,
              spark: spark.growth,
              icon: Activity,
            },
          ].map((card, i) => {
            const Icon = card.icon;
            const pct = Math.min(100, Math.round((card.raw / card.goal) * 100));
            return (
              <div
                key={i}
                className={`relative rounded-xl border p-5 flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
                  isLight
                    ? "bg-white border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-gray-300"
                    : "bg-gray-900/50 border-gray-800/80 hover:border-gray-700"
                }`}
                style={{ boxShadow: isLight ? undefined : `0 0 30px ${card.glow}` }}
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[9px] uppercase tracking-widest ${isLight ? "text-gray-500" : "text-gray-400"}`}>{card.label}</span>
                  <Icon size={13} style={{ color: card.color }} />
                </div>

                {/* Value */}
                <div>
                  <span className="font-space text-2xl font-bold tabular-nums" style={{ color: card.color }}>
                    {card.value}
                  </span>
                  {card.label === "Growth Score" && (
                    <span className="font-space text-2xl font-bold" style={{ color: card.color }}> /100</span>
                  )}
                </div>

                {/* Delta badge */}
                <div className="flex items-center gap-1.5">
                  {card.up === true && <ChevronUp size={12} className="text-orbit-success" />}
                  {card.up === false && <ChevronDown size={12} className="text-red-400" />}
                  <span className={`font-mono text-[10px] ${card.up === true ? "text-orbit-success" : card.up === false ? "text-red-400" : isLight ? "text-gray-500" : "text-gray-500"}`}>
                    {card.delta}
                  </span>
                </div>

                {/* Sparkline */}
                {card.spark && (
                  <div className="mt-auto">
                    <Sparkline values={card.spark} color={card.color} height={36} />
                  </div>
                )}

                {/* Progress bar */}
                {card.label !== "Growth Score" && (
                  <div className={`w-full h-0.5 rounded-full overflow-hidden ${isLight ? "bg-gray-200" : "bg-gray-800"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: card.color }}
                    />
                  </div>
                )}

                {/* Corner glow */}
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-300 ${isLight ? "opacity-10" : "opacity-20"}`}
                  style={{ background: `radial-gradient(circle, ${card.color}, transparent)` }} />
              </div>
            );
          })}
        </div>

        {/* ══════════════ MIDDLE ROW ══════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── SECTION 2 — ACTIVE MISSIONS ── */}
          <div className={`rounded-xl border p-5 flex flex-col gap-4 ${
            isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orbit-blue animate-pulse" />
                <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Active Missions</span>
              </div>
              <span className={`font-mono text-[9px] ${isLight ? "text-gray-400" : "text-gray-550"}`}>
                {campaigns.length} TOTAL
              </span>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Running", val: runningCamps.length, color: "text-orbit-blue" },
                { label: "Complete", val: completedCamps.length, color: "text-orbit-success" },
                { label: "Draft", val: campaigns.filter(c => c.status === "Draft").length, color: isLight ? "text-gray-550" : "text-gray-400" },
              ].map((s, i) => (
                <div key={i} className={`rounded-lg p-3 border ${isLight ? "bg-gray-50 border-gray-150" : "bg-gray-950/40 border-gray-800"}`}>
                  <span className={`font-space text-xl font-bold ${s.color}`}>{s.val}</span>
                  <span className={`font-mono text-[9px] uppercase block mt-0.5 ${isLight ? "text-gray-555" : "text-gray-555"}`}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Campaign list */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-52">
              {campaigns.length === 0 && (
                <div className="text-center py-6 text-gray-600 font-mono text-xs">
                  No campaigns yet. Launch a mission.
                </div>
              )}
              {campaigns.map((camp, i) => {
                const pct = camp.sentCount > 0 ? Math.round((camp.openedCount / camp.sentCount) * 100) : 0;
                const statusColor = camp.status === "Running" ? "#3B82F6" : camp.status === "Completed" ? "#22C55E" : "#6B7280";
                return (
                  <div key={i} className={`p-3 rounded-lg border transition-colors ${
                    isLight ? "bg-gray-55 border-gray-150 hover:border-gray-300" : "bg-gray-950/40 border-gray-800 hover:border-gray-700"
                  }`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-mono text-[10px] font-bold truncate ${isLight ? "text-gray-900" : "text-white"}`}>{camp.name}</p>
                        <p className="font-mono text-[9px] text-gray-500 mt-0.5">{camp.channel} · {camp.sentCount} targets</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                        <span className="font-mono text-[8px] uppercase" style={{ color: statusColor }}>{camp.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-1 rounded-full overflow-hidden ${isLight ? "bg-gray-200" : "bg-gray-800"}`}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: statusColor }}
                        />
                      </div>
                      <span className={`font-mono text-[9px] shrink-0 ${isLight ? "text-gray-500" : "text-gray-400"}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 3 — NETWORK HEALTH + SECTION 5 FORECAST ── */}
          <div className="flex flex-col gap-4">
            {/* Network Health */}
            <div className={`rounded-xl border p-5 flex flex-col gap-4 ${
              isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
                <div className="flex items-center gap-2">
                  <Shield size={13} className="text-orbit-success" />
                  <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Orbit Network Health</span>
                </div>
                <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border ${
                  isLight ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-orbit-success border-orbit-success/30 bg-orbit-success/5"
                }`}>
                  {networkHealth}% UPTIME
                </span>
              </div>

              <div className="flex items-center justify-around py-2">
                <RadialGauge value={deliveryRate} color="#3B82F6" label="Delivery Rate" isLight={isLight} />
                <RadialGauge value={openRate} color="#8B5CF6" label="Open Rate" isLight={isLight} />
                <RadialGauge value={convRate} color="#22C55E" label="Conversion" isLight={isLight} />
              </div>

              {/* Extra Core Telemetry: SpaceX style */}
              <div className={`grid grid-cols-3 gap-2 p-2 rounded-lg border text-center ${
                isLight ? "bg-gray-50 border-gray-150" : "bg-gray-950/40 border-gray-800"
              }`}>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 block uppercase">CPU Load</span>
                  <span className={`font-mono text-[10px] font-bold ${isLight ? "text-gray-800" : "text-gray-300"}`}>3.4%</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 block uppercase">Queue Rate</span>
                  <span className={`font-mono text-[10px] font-bold ${isLight ? "text-gray-800" : "text-gray-300"}`}>18 msg/s</span>
                </div>
                <div>
                  <span className="font-mono text-[7px] text-gray-500 block uppercase">DB Latency</span>
                  <span className={`font-mono text-[10px] font-bold ${isLight ? "text-gray-800" : "text-gray-300"}`}>12 ms</span>
                </div>
              </div>

              <div className={`grid grid-cols-5 gap-2 pt-1 border-t ${isLight ? "border-gray-150" : "border-gray-800"}`}>
                {[
                  { label: "Polaris", val: "99.8%" },
                  { label: "Vega",    val: "98.2%" },
                  { label: "Nova",    val: "100%"  },
                  { label: "Atlas",   val: "97.6%" },
                  { label: "Luna",    val: "99.1%" },
                ].map((n, i) => (
                  <div key={i} className="text-center">
                    <p className="font-mono text-[8px] text-gray-500 uppercase">{n.label}</p>
                    <p className="font-mono text-[10px] text-orbit-success font-bold">{n.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Forecast */}
            <div className={`rounded-xl border p-5 flex flex-col gap-3 ${
              isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-orbit-purple" />
                  <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Revenue Forecast</span>
                </div>
                <span className="font-mono text-[9px] text-orbit-purple">AI VEGA MODEL</span>
              </div>

              {[
                { period: "Next 7 Days",  amount: forecastRevenue * 0.25, conf: 94, color: "#3B82F6" },
                { period: "Next 30 Days", amount: forecastRevenue * 0.72, conf: 87, color: "#8B5CF6" },
                { period: "Next 90 Days", amount: forecastRevenue * 1.8,  conf: 71, color: "#EC4899" },
              ].map((row, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`font-mono text-[10px] ${isLight ? "text-gray-700" : "text-gray-300"}`}>{row.period}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-space text-sm font-bold ${isLight ? "text-gray-900" : "text-white"}`}>
                        ₹{Math.round(row.amount / 1000)}K
                      </span>
                      <span className={`font-mono text-[8px] ${isLight ? "text-gray-400" : "text-gray-550"}`}>{row.conf}% conf</span>
                    </div>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-gray-200" : "bg-gray-800"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${row.conf}%`, backgroundColor: row.color }}
                    />
                  </div>
                </div>
              ))}

              <div className={`mt-2 p-3 rounded-lg border ${
                isLight ? "bg-purple-50/50 border-purple-100 text-purple-950" : "bg-orbit-purple/5 border-orbit-purple/20 text-gray-400"
              }`}>
                <p className="font-mono text-[9px] leading-relaxed">
                  💡 <span className={isLight ? "text-purple-700 font-bold" : "text-orbit-purple"}>Vega</span>: Loyalist segment poised to drive ₹{Math.round(forecastRevenue * 0.42 / 1000)}K of next 30-day revenue. Recommend Nova cross-sell activation.
                </p>
              </div>
            </div>

            {/* Revenue Recovery Radar (Luna) */}
            <div 
              onClick={() => setSelectedAgent("Luna")}
              className={`rounded-xl border p-5 flex flex-col gap-3 cursor-pointer hover:border-amber-500/50 hover:scale-[1.01] transition-all duration-300 ${
                isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
              }`}
              title="Click to view Luna premium recovery card"
            >
              <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-amber-500 animate-pulse" />
                  <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Revenue Recovery Radar</span>
                </div>
                <span className="font-mono text-[9px] text-amber-500">AI LUNA MODEL</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Spinning Radar scanner graphic */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0 bg-gray-950/40 rounded-full border border-gray-805/20">
                  <svg className="absolute inset-0 w-full h-full animate-orbit-spin-slow" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="1" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(245,158,11,0.1)" strokeWidth="1" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(245,158,11,0.05)" strokeWidth="1" />
                    <line x1="50" y1="50" x2="50" y2="5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="absolute w-2 h-2 rounded-full bg-purple-500 animate-ping top-3 left-4" />
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-amber-500 top-8 right-3 animate-pulse" />
                </div>

                <div className="flex-1 grid grid-cols-2 gap-2 text-left font-mono">
                  <div>
                    <span className="text-[8px] text-gray-550 block uppercase">Recoverable</span>
                    <span className={`text-xs font-bold font-space ${isLight ? "text-gray-900" : "text-white"}`}>₹{lunaMetrics.recoverableRevenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-555 block uppercase">Lost Opps</span>
                    <span className={`text-xs font-bold font-space ${isLight ? "text-gray-900" : "text-white"}`}>{lunaMetrics.abandonedLeads} leads</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-550 block uppercase">Inactive</span>
                    <span className={`text-xs font-bold font-space ${isLight ? "text-gray-900" : "text-white"}`}>{lunaMetrics.inactiveCustomers} VIPs</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-550 block uppercase">Opp Score</span>
                    <span className="text-xs font-bold text-amber-500 font-space">{lunaMetrics.opportunityScore}/100</span>
                  </div>
                </div>
              </div>

              <div className={`mt-1 p-2.5 rounded-lg border ${
                isLight ? "bg-amber-50/50 border-amber-100 text-amber-950" : "bg-amber-500/5 border-amber-500/20 text-gray-400"
              }`}>
                <p className="font-mono text-[9px] leading-relaxed">
                  📡 <span className={isLight ? "text-amber-800 font-bold" : "text-amber-500"}>Luna</span>: Scanning customer universe... Detected {lunaMetrics.abandonedLeads} abandoned enquiries and checkout leads with high purchase affinity scores.
                </p>
              </div>
            </div>
          </div>

          {/* ── SECTION 4 — LIVE DISPATCH FEED ── */}
          <div className={`rounded-xl border p-5 flex flex-col gap-3 ${
            isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
              <div className="flex items-center gap-2">
                <Radio size={13} className="text-orbit-success animate-pulse" />
                <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Live Dispatch Feed</span>
              </div>
              <div className={`flex items-center gap-1.5 font-mono text-[9px] ${isLight ? "text-emerald-700 font-bold" : "text-orbit-success"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-ping" />
                LIVE
              </div>
            </div>

            {/* Aggregate totals */}
            <div className="grid grid-cols-5 gap-1">
              {(["sent","delivered","opened","clicked","purchased"] as const).map(type => {
                const cfg = TYPE_CONFIG[type];
                const count = ticker.filter(t => t.type === type).length;
                return (
                  <div key={type} className={`flex flex-col items-center gap-0.5 rounded-lg p-1.5 border ${isLight ? "bg-gray-50 border-gray-150" : "bg-gray-950/40 border-gray-800"}`}>
                    <span className={`font-mono text-[8px] uppercase tracking-wider ${cfg.color}`}>{cfg.icon}</span>
                    <span className={`font-space text-xs font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Scrolling events */}
            <div className="flex-1 overflow-hidden relative min-h-0" style={{ maxHeight: 320 }}>
              <div className="space-y-1.5 overflow-y-auto h-full pr-1 scrollbar-thin">
                {ticker.map((evt, i) => {
                  const cfg = TYPE_CONFIG[evt.type];
                  return (
                    <div
                      key={evt.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                        isLight ? "bg-gray-50 border-gray-150 hover:border-gray-200" : "bg-gray-950/40 border-gray-800/50 hover:border-gray-700"
                      }`}
                      style={{
                        animationName: i === 0 ? "fadeInUp" : undefined,
                        animationDuration: "0.4s",
                        animationFillMode: "both",
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[9px] font-bold truncate ${isLight ? "text-gray-800" : "text-white"}`}>{evt.name}</span>
                          <span className={`font-mono text-[8px] font-bold uppercase tracking-wider ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className={`font-mono text-[8px] truncate ${isLight ? "text-gray-500" : "text-gray-650"}`}>{evt.campaign}</div>
                      </div>
                      <div className="text-right shrink-0">
                        {evt.amount && (
                          <span className="font-mono text-[9px] text-orbit-success font-bold">+₹{evt.amount.toLocaleString()}</span>
                        )}
                        <span className={`font-mono text-[8px] block ${isLight ? "text-gray-550" : "text-gray-650"}`}>{evt.ts}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Fade out at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                style={{ background: isLight ? "linear-gradient(to bottom, transparent, rgba(255,255,255,0.9))" : "linear-gradient(to bottom, transparent, rgba(17,24,39,0.9))" }} />
            </div>
          </div>
        </div>

        {/* ══════════════ SECTION 6 — AGENT STATUS GRID ══════════════ */}
        <div className={`rounded-xl border p-5 ${
          isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-900/50 border-gray-800/80 backdrop-blur-md"
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-5 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-orbit-purple" />
              <span className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-gray-900" : "text-white"}`}>Agent Intelligence Grid</span>
            </div>
            <span className={`font-mono text-[9px] border px-2 py-0.5 rounded-full ${
              isLight ? "text-emerald-700 border-emerald-200 bg-emerald-50" : "text-orbit-success border-orbit-success/30 bg-orbit-success/5"
            }`}>
              5/5 AGENTS ONLINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {AGENTS.map((agent, i) => {
              const currentTask = agent.tasks[agentTaskIdx[i]];
              return (
                <div
                  key={agent.name}
                  className={`relative rounded-xl border p-5 flex flex-col gap-3 overflow-hidden transition-all duration-500 ${
                    isLight
                      ? "bg-gray-50 border-gray-150 hover:border-gray-250 hover:bg-gray-100/30"
                      : `${agent.border} ${agent.bg} ${agent.glow}`
                  }`}
                  style={isLight ? undefined : { boxShadow: `0 0 20px ${agent.color}25` }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className={`font-space text-base font-bold ${isLight ? "text-gray-900" : "text-white"}`}>{agent.name}</span>
                    </div>
                    <span
                      className="font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border"
                      style={{ color: agent.color, borderColor: `${agent.color}40`, background: `${agent.color}10` }}
                    >
                      ONLINE
                    </span>
                  </div>

                  {/* Role */}
                  <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: agent.color }}>
                    {agent.role}
                  </p>

                  {/* Current task */}
                  <div className={`rounded-lg p-3 border min-h-[52px] flex flex-col justify-center ${
                    isLight ? "bg-white border-gray-150" : "bg-gray-950/40 border-gray-800"
                  }`}>
                    <p className={`font-mono text-[9px] uppercase tracking-wider mb-1 ${isLight ? "text-gray-400" : "text-gray-500"}`}>Current Task</p>
                    <p
                      className={`font-mono text-[10px] leading-relaxed transition-all duration-500 ${isLight ? "text-gray-800" : "text-white"}`}
                      key={currentTask}
                      style={{ animation: "fadeInUp 0.4s ease" }}
                    >
                      {currentTask}
                    </p>
                  </div>

                  {/* Confidence meter */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? "text-gray-550" : "text-gray-450"}`}>Confidence</span>
                      <span className={`font-mono text-[10px] font-bold ${isLight ? "text-gray-800" : "text-white"}`}>{agent.confidence}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-gray-200" : "bg-gray-800"}`}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${agent.confidence}%`,
                          backgroundColor: agent.color,
                          boxShadow: `0 0 8px ${agent.color}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recent log */}
                  {agentLogs.find(l => l.agent === agent.name) && (
                    <div className={`border-t pt-3 ${isLight ? "border-gray-150" : "border-gray-800"}`}>
                      <p className={`font-mono text-[9px] leading-relaxed line-clamp-2 ${isLight ? "text-gray-500" : "text-gray-500"}`}>
                        {agentLogs.find(l => l.agent === agent.name)!.message}
                      </p>
                    </div>
                  )}

                  {/* Corner accent */}
                  <div
                    className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${agent.color}25, transparent)` }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════ BOTTOM STATUS BAR ══════════════ */}
        <div className={`rounded-xl border px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2.5 ${
          isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-955/60 border-gray-800/80 backdrop-blur-md"
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orbit-success animate-pulse" />
            <span className={`font-mono text-[9px] uppercase tracking-wider ${isLight ? "text-gray-600" : "text-gray-400"}`}>
              Orbit Core <span className={isLight ? "text-emerald-700 font-bold" : "text-orbit-success"}>v4.81-Vanguard</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Layers size={10} className="text-orbit-blue" />
            <span className={`font-mono text-[9px] ${isLight ? "text-gray-500" : "text-gray-500"}`}>
              {campaigns.length} Campaigns · {orders.length} Orders · {ticker.length} Live Events
            </span>
          </div>

          {/* Interactive Ping Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePingTest}
              disabled={isPingRunning}
              className={`px-2.5 py-1 rounded border font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                isPingRunning
                  ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400 animate-pulse"
                  : isLight
                    ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-150"
                    : "border-gray-800 bg-gray-950 text-gray-300 hover:border-gray-700 hover:text-white"
              }`}
            >
              <Activity size={10} className={isPingRunning ? "animate-spin" : ""} />
              {isPingRunning ? `PINGING (STG ${pingStep}/5)` : "Run Core Diagnostics PING"}
            </button>
            {pingLogs.length > 0 && (
              <div className={`font-mono text-[8px] truncate max-w-[200px] md:max-w-[350px] ${isLight ? "text-gray-500" : "text-gray-400"}`}>
                <span className="text-orbit-blue font-bold">»</span> {pingLogs[0]}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ArrowUpRight size={10} className="text-orbit-success" />
            <span className={`font-mono text-[9px] ${isLight ? "text-gray-650" : "text-gray-400"}`}>
              All agents nominal · Dispatch queue: <span className={isLight ? "text-gray-900 font-bold" : "text-white"}>Active</span>
            </span>
          </div>
        </div>

      </div>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default MissionControl;
