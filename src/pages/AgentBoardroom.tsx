import React, { useState, useEffect, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import { 
  Zap, MessageSquare, Cpu, Users, BarChart2, Sparkles, 
  Radio, CheckCircle2, Activity, ChevronDown, ChevronUp, 
  Terminal 
} from "lucide-react";
import { AgentCardModal } from "../components/AgentCardModal";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface BoardroomMessage {
  agent: "Polaris" | "Nova" | "Vega" | "Atlas" | "Luna";
  message: string;
  confidence: number;
  reasoning: string;
  timestamp: string;
  stats?: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    name: "Inactive Customer Win-Back",
    description: "Re-engaging dormant segment VIPs with customized credits drop.",
    script: [
      { 
        agent: "Polaris" as const, 
        message: "Sector scan complete. I've discovered 432 high-ltv customers showing zero activity for 90 days. Churn risk clusters at 78% in group B.", 
        confidence: 94, 
        reasoning: "Dormancy pattern triggers match historical slippage thresholds. Customer DNA marks: 'VIP', 'Organic Preferred'.",
        stats: "432 targets flagged"
      },
      { 
        agent: "Vega" as const, 
        message: "Revenue opportunity is evaluated at ₹1.2L. Calculating ROI projections gives 3.8x baseline return under current parameters.", 
        confidence: 87, 
        reasoning: "60-feature regression model runs. Estimated conversion threshold is 28% model yields. Risk delta: -4.5%.",
        stats: "₹1.2L opp · 3.8x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Personalized win-back layout generated. Selecting urgency-framed copy variants optimized for WhatsApp delivery.", 
        confidence: 91, 
        reasoning: "A/B test archives show urgency copy yields 23% higher CTR on mobile channel segments over classic email formats.",
        stats: "WhatsApp variant locked"
      },
      { 
        agent: "Atlas" as const, 
        message: "Optimal delivery window computed. Dispatch nodes responsive. Ready to route campaign. Awaiting authorization.", 
        confidence: 96, 
        reasoning: "Channel capacity analysis reports 0ms queue latency. Dispatch time locked to Tuesday 10:30 AM timezone peaks.",
        stats: "Dispatch ready"
      },
    ]
  },
  {
    name: "Quantum Deck Cross-Sell",
    description: "Targeting tech-enthusiasts for cross-selling upgrades.",
    script: [
      { 
        agent: "Polaris" as const, 
        message: "Scanning active Loyalist graphs. Identified 120 tech cohort profiles matching 'Early Adopter' and 'Quantum Deck' affinity tags.", 
        confidence: 93, 
        reasoning: "Cross-cohort behavior models match upgrade velocity indexes. Average LTV baseline: ₹3,500.",
        stats: "120 early adopters flagged"
      },
      { 
        agent: "Vega" as const, 
        message: "Opportunity projection sets conversion yields at 42%. Predicted revenue generated is ₹2.4L. Churn correlation risk is negligible.", 
        confidence: 90, 
        reasoning: "Likelihood score computed via random forest. Customer buying capacity shows 1.5x scale multiplier.",
        stats: "₹2.4L forecast · 42% yield"
      },
      { 
        agent: "Nova" as const, 
        message: "Generated high-fidelity RCS card copy with embedded upgrade pathways and rich interactive visuals.", 
        confidence: 89, 
        reasoning: "RCS rich templates return 3.4x higher conversion metrics compared to plain SMS text nodes on tech segments.",
        stats: "RCS Rich Cards generated"
      },
      { 
        agent: "Atlas" as const, 
        message: "Routing channels confirmed. Pre-sales dispatch cadence scheduled. Delivery buffers cleared for launch.", 
        confidence: 95, 
        reasoning: "Scheduling is configured with pre-sale notification +48h follow-up cadences. Webhooks armed.",
        stats: "Launch armed"
      },
    ]
  },
  {
    name: "VIP Churn Mitigation",
    description: "Mitigating high churn probabilities in premium segments.",
    script: [
      { 
        agent: "Polaris" as const, 
        message: "Critical Warning: Slipping Away VIP cohort segment displays a 78% attrition hazard rating. 18 accounts are marked active danger.", 
        confidence: 95, 
        reasoning: "Risk spikes match critical indicators: 30-day session decline + repeated cart abandonments on core items.",
        stats: "18 critical VIP nodes"
      },
      { 
        agent: "Vega" as const, 
        message: "Averted churn value calculated at ₹85,000. Suggested campaign ROI threshold: 4.2x. WhatsApp has highest recovery rate.", 
        confidence: 88, 
        reasoning: "Customer recovery probability is 64% when reached within a 24h window. SMS acts as fallback channel node.",
        stats: "₹85K value saved · 4.2x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Generated personalized re-engagement layouts, injecting past purchases and dedicated loyalty recovery values.", 
        confidence: 92, 
        reasoning: "Loyalty compensation structures decrease VIP exit rates by 40% based on historical mitigation loops.",
        stats: "Dynamic copy personalized"
      },
      { 
        agent: "Atlas" as const, 
        message: "Operations dispatch pipeline verified. Trigger buffers loaded. Channels ready for automatic activation.", 
        confidence: 97, 
        reasoning: "Webhook handlers mapped. Automatic dispatcher active. Real-time delivery monitors online.",
        stats: "Operational loop armed"
      },
    ]
  },
  {
    name: "Growth Recovery & Reactivation",
    description: "Luna recovers dormant revenue and leakage through automated re-engagement.",
    script: [
      { 
        agent: "Polaris" as const, 
        message: "Dormant user scan finished. I have mapped 712 churn-risk accounts with no login events in 120 days. Historical average basket value: ₹4,200.", 
        confidence: 95, 
        reasoning: "Dormancy behavior triggers are confirmed across customer segments with active historical purchases but flatline 120-day web session logs.",
        stats: "712 idle profiles mapped"
      },
      { 
        agent: "Luna" as const, 
        message: "I've cross-referenced those 712 accounts. 284 profiles are high-affinity recovery candidates with abandoned checkouts. Leakage recovery protocols initialized.", 
        confidence: 96, 
        reasoning: "Analyzing abandonment pathways. High recovery probability detected due to previous checkout tokens remaining in local basket cache.",
        stats: "284 recovery targets found"
      },
      { 
        agent: "Vega" as const, 
        message: "Evaluating recoverable revenue delta. Estimated recovery pipeline stands at ₹1.8L. Calculating a 4.1x ROI projection on targeted incentives.", 
        confidence: 89, 
        reasoning: "Calculated with a 35% expected reactivation rate based on localized conversion coefficients and custom incentive weightings.",
        stats: "₹1.8L opp · 4.1x ROI"
      },
      { 
        agent: "Nova" as const, 
        message: "Re-engagement creatives compiled. Injecting dynamic discount codes and cart restoring links into personalized SMS and email variants.", 
        confidence: 92, 
        reasoning: "Dynamic recovery links coupled with custom urgency discounts drive 34% higher reactivation margins over standard generic email alerts.",
        stats: "Multi-channel variants compiled"
      },
      { 
        agent: "Atlas" as const, 
        message: "Distribution paths cleared. Automated reactivation campaign queues armed. Initiating dispatch buffers upon manager approval.", 
        confidence: 97, 
        reasoning: "Gateway handshake verified. Channel throttling values set to 50 messages/sec to prevent mailserver SPAM flags.",
        stats: "Reactivation campaign armed"
      },
    ]
  }
];

const AGENT_META = {
  Polaris: { 
    role: "Audience Intelligence", 
    color: "#3B82F6", 
    border: "border-blue-500/20", 
    bg: "bg-blue-500/5", 
    text: "text-blue-400",
    icon: Users,
    x: 120, y: 35
  },
  Vega: { 
    role: "Predictive Analytics", 
    color: "#8B5CF6", 
    border: "border-violet-500/20", 
    bg: "bg-violet-500/5", 
    text: "text-violet-400",
    icon: BarChart2,
    x: 201, y: 94
  },
  Nova: { 
    role: "Campaign Creator", 
    color: "#EC4899", 
    border: "border-pink-500/20", 
    bg: "bg-pink-500/5", 
    text: "text-pink-400",
    icon: Sparkles,
    x: 170, y: 189
  },
  Atlas: { 
    role: "Operations Dispatch", 
    color: "#22C55E", 
    border: "border-green-500/20", 
    bg: "bg-green-500/5", 
    text: "text-green-400",
    icon: Radio,
    x: 70, y: 189
  },
  Luna: { 
    role: "Growth Recovery Agent", 
    color: "#F59E0B", 
    border: "border-amber-500/20", 
    bg: "bg-amber-500/5", 
    text: "text-amber-400",
    icon: Activity,
    x: 39, y: 94
  }
};

/* ─────────────────────────────────────────────────────────────
   AGENT BOARDROOM
───────────────────────────────────────────────────────────── */
export const AgentBoardroom: React.FC = () => {
  const { addAgentLog } = useOrbit();
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [debateActive, setDebateActive] = useState(false);
  const [debateMsgs, setDebateMsgs] = useState<BoardroomMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<"Polaris" | "Nova" | "Vega" | "Atlas" | "Luna" | null>(null);

  /* selected agent profile card state */
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* Accordion state for deep reasoning */
  const [openReasoning, setOpenReasoning] = useState<Record<number, boolean>>({});

  /* Consensus Checklist state */
  const [consensus, setConsensus] = useState({
    segmentFound: false,
    leaksRecovered: false,
    roiForecasted: false,
    copyGenerated: false,
    dispatchArmed: false
  });

  /* Telemetry activity ticker */
  const [telemetry, setTelemetry] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [debateMsgs]);

  const addTelemetry = (msg: string) => {
    setTelemetry(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
  };

  /* Initialize Debate Scenario */
  const triggerBoardroomDebate = () => {
    if (debateActive) return;
    
    const scenario = SCENARIOS[selectedScenario];
    setDebateActive(true);
    setDebateMsgs([]);
    setActiveSpeaker(null);
    setOpenReasoning({});
    setConsensus({
      segmentFound: false,
      leaksRecovered: false,
      roiForecasted: false,
      copyGenerated: false,
      dispatchArmed: false
    });

    addTelemetry(`BOARDROOM DIRECTIVE INITIATED: ${scenario.name}`);
    addTelemetry("Connecting neural executive nodes...");

    scenario.script.forEach((msg, i) => {
      // Step interval of 2.8s per agent speak
      setTimeout(() => {
        const timestamped: BoardroomMessage = {
          ...msg,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setDebateMsgs(prev => [...prev, timestamped]);
        setActiveSpeaker(msg.agent);
        addAgentLog(msg.agent, msg.message, "chat");

        // trigger consensus checklist markings
        if (msg.agent === "Polaris") {
          setConsensus(c => ({ ...c, segmentFound: true }));
          addTelemetry("Polaris mapping complete. Target cohort locked.");
        }
        if (msg.agent === "Luna") {
          setConsensus(c => ({ ...c, leaksRecovered: true }));
          addTelemetry("Luna completed leakage audit. Recovery sequences prepared.");
        }
        if (msg.agent === "Vega") {
          setConsensus(c => ({ ...c, roiForecasted: true }));
          addTelemetry("Vega forecasting yield parameters. ROI curves calculated.");
        }
        if (msg.agent === "Nova") {
          setConsensus(c => ({ ...c, copyGenerated: true }));
          addTelemetry("Nova assembled personalization tokens. Copy compiled.");
        }
        if (msg.agent === "Atlas") {
          setConsensus(c => ({ ...c, dispatchArmed: true }));
          addTelemetry("Atlas clearing delivery buffers. Dispatch window scheduled.");
        }

        // Auto-expand reasoning for the latest message
        setOpenReasoning(prev => ({ ...prev, [i]: true }));

        // last message completion
        if (i === scenario.script.length - 1) {
          setTimeout(() => {
            setActiveSpeaker(null);
            setDebateActive(false);
            addTelemetry("Boardroom consensus reached. Operational directive armed.");
          }, 2200);
        }
      }, i * 3200);
    });
  };

  const toggleReasoning = (idx: number) => {
    setOpenReasoning(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* ════════════════════════════════════════
          LEFT PANEL — MISSION CONTEXT & AGENT STATS
      ════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        {/* Mission Context */}
        <div className="orbit-panel p-3.5 border border-gray-850 bg-gray-900/10 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orbit-glow-blue opacity-25 pointer-events-none" />
          <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <Cpu size={13} className="text-blue-400" />
            Executive Context
          </h2>
          <div className="space-y-2.5">
            <div>
              <span className="font-mono text-[8px] text-gray-550 uppercase tracking-wider block">Directive Agenda</span>
              <select
                value={selectedScenario}
                onChange={e => setSelectedScenario(Number(e.target.value))}
                disabled={debateActive}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 font-mono text-[10px] text-white focus:outline-none focus:border-blue-500/50 mt-1 cursor-pointer"
              >
                {SCENARIOS.map((sc, idx) => (
                  <option key={idx} value={idx}>{sc.name.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <p className="font-mono text-[9px] text-gray-400 leading-relaxed bg-black/40 p-2 rounded-lg border border-gray-900">
              {SCENARIOS[selectedScenario].description}
            </p>
          </div>
        </div>

        {/* Live Agent Status */}
        <div className="space-y-2 flex-1">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <Users size={13} className="text-orbit-purple" />
            Executive Board
          </h3>
          
          <div className="flex flex-col gap-2">
            {(["Polaris", "Vega", "Nova", "Atlas", "Luna"] as const).map(agent => {
              const meta = AGENT_META[agent];
              const isSpeaking = activeSpeaker === agent;
              // dynamic load metric
              const loadVal = isSpeaking ? 88 : 12 + Math.floor(Math.sin(Date.now() / 8000) * 10);
              return (
                <div
                  key={agent}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3 rounded-xl border cursor-pointer hover:border-current hover:scale-[1.02] transition-all duration-300 ${meta.border} ${meta.bg} ${
                    isSpeaking ? "shadow-[0_0_20px_rgba(59,130,246,0.12)] border-blue-500/35" : ""
                  }`}
                  title={`View ${agent} profile`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? "animate-ping" : "animate-pulse"}`} style={{ backgroundColor: meta.color }} />
                      <span className="font-space font-bold text-xs text-white">{agent}</span>
                    </div>
                    <span className={`font-mono text-[8px] font-bold border px-1.5 py-0.5 rounded-full ${
                      isSpeaking ? "text-blue-400 border-blue-500/30 bg-blue-500/10 animate-pulse" : "text-orbit-success border-orbit-success/30 bg-orbit-success/5"
                    }`}>
                      {isSpeaking ? "SPEAKING" : "STANDBY"}
                    </span>
                  </div>
                  
                  <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wide">{meta.role}</p>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-gray-550">
                      <span>Thread Activity</span>
                      <span>{loadVal}% capacity</span>
                    </div>
                    <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${loadVal}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          CENTER PANEL — DISCUSSION ROUNDTABLE
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Workspace Title Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-800/60 flex items-center justify-between bg-gray-950/20">
          <div>
            <h1 className="font-space text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap size={16} className="text-orbit-purple" />
              Agent Boardroom
            </h1>
            <p className="font-mono text-[9px] text-gray-550 mt-0.5 uppercase tracking-widest">
              Live AI Collaboration Chamber
            </p>
          </div>

          <button
            onClick={triggerBoardroomDebate}
            disabled={debateActive}
            className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              debateActive
                ? "bg-gray-850 text-gray-550 border border-gray-800 cursor-not-allowed"
                : "bg-gradient-to-r from-orbit-purple to-pink-500 text-white shadow-orbit-glow-purple hover:opacity-90 hover:scale-[1.02] active:scale-95 duration-200"
            }`}
          >
            <Zap size={13} className={debateActive ? "animate-spin" : ""} />
            {debateActive ? "Deliberations Active..." : "Initialize Executive Debate"}
          </button>
        </div>

        {/* Center content container split: top roundtable, bottom scrolls */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Circular Holographic Roundtable Visualizer */}
          <div className="shrink-0 h-56 bg-gray-950/25 border-b border-gray-900/60 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 radar-dots opacity-20" />
            
            {/* Pulsing Core center glow */}
            <div className="absolute w-20 h-20 rounded-full border border-purple-500/10 bg-purple-500/5 flex items-center justify-center animate-orbit-pulse">
              <div className="w-12 h-12 rounded-full bg-orbit-purple/10 border border-orbit-purple/20 flex items-center justify-center">
                <Cpu size={16} className="text-orbit-purple animate-pulse" />
              </div>
            </div>

            {/* Roundtable SVG lines and nodes */}
            <svg className="w-64 h-64 relative overflow-visible z-10">
              <defs>
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Central table perimeter ring */}
              <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
              <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeDasharray="3, 6" />

              {/* Laser connecting lines from active speaker to table core */}
              {activeSpeaker && (
                <line
                  x1={AGENT_META[activeSpeaker].x}
                  y1={AGENT_META[activeSpeaker].y}
                  x2="120"
                  y2="120"
                  stroke="url(#laserGrad)"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* Render Roundtable nodes for each executive agent */}
              {(["Polaris", "Vega", "Nova", "Atlas", "Luna"] as const).map(agent => {
                const meta = AGENT_META[agent];
                const isSpeaking = activeSpeaker === agent;
                const Icon = meta.icon;

                return (
                  <g key={agent} className="transition-all duration-300 cursor-pointer hover:opacity-80" onClick={() => setSelectedAgent(agent)}>
                    <title>{`View ${agent} premium card`}</title>
                    {/* Ripple outer circle if speaking */}
                    {isSpeaking && (
                      <circle 
                        cx={meta.x} 
                        cy={meta.y} 
                        r="26" 
                        fill="none" 
                        stroke={meta.color} 
                        strokeWidth="1" 
                        className="animate-ping opacity-45"
                      />
                    )}

                    {/* Node background */}
                    <circle
                      cx={meta.x}
                      cy={meta.y}
                      r="18"
                      fill="#050816"
                      stroke={isSpeaking ? meta.color : "rgba(255,255,255,0.05)"}
                      strokeWidth={isSpeaking ? "2" : "1"}
                      style={isSpeaking ? { filter: `drop-shadow(0 0 8px ${meta.color})` } : {}}
                    />

                    {/* Agent Icon */}
                    <foreignObject x={meta.x - 7} y={meta.y - 7} width="14" height="14">
                      <Icon size={14} style={{ color: isSpeaking ? "#ffffff" : "#4b5563" }} />
                    </foreignObject>

                    {/* Micro sound wave equalizer bars if speaking */}
                    {isSpeaking && (
                      <g transform={`translate(${meta.x - 12}, ${meta.y + 22})`}>
                        {[...Array(5)].map((_, idx) => (
                          <rect
                            key={idx}
                            x={idx * 5}
                            y={0}
                            width="2.5"
                            height="4"
                            fill={meta.color}
                            className="bar-anim"
                            style={{
                              animationDelay: `${idx * 0.1}s`,
                              animationDuration: `${0.4 + Math.random() * 0.5}s`,
                              transformOrigin: "bottom"
                            }}
                          />
                        ))}
                      </g>
                    )}

                    {/* Agent Name HUD Label */}
                    <text
                      x={meta.x}
                      y={meta.y + (meta.y > 120 ? 32 : -25)}
                      fontFamily="monospace"
                      fontSize="7"
                      fontWeight="bold"
                      fill={isSpeaking ? "#ffffff" : "#4b5563"}
                      textAnchor="middle"
                      letterSpacing="1px"
                    >
                      {agent.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* AI Discussion Stream */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 pr-3">
            {debateMsgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-gray-850 flex items-center justify-center animate-pulse">
                  <MessageSquare size={20} className="text-gray-650" />
                </div>
                <div>
                  <h3 className="font-space text-sm font-bold text-white">Roundtable Standby</h3>
                  <p className="font-mono text-[9px] text-gray-550 max-w-xs leading-relaxed mt-1">
                    Select a directive agenda on the left and initialize the boardroom debate to start real-time agent deliberations.
                  </p>
                </div>
              </div>
            )}

            {debateMsgs.map((msg, idx) => {
              const meta = AGENT_META[msg.agent];
              const isReasoningOpen = !!openReasoning[idx];
              return (
                <div 
                  key={idx} 
                  className="flex flex-col gap-2.5 animate-fade-in-up"
                  style={{ animationDelay: "50ms" }}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-85" onClick={() => setSelectedAgent(msg.agent)} title={`View ${msg.agent} profile`}>
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${meta.text}`}>
                        {msg.agent}
                      </span>
                      <span className="font-mono text-[8px] text-gray-600">{msg.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.stats && (
                        <span className="font-mono text-[8px] text-gray-450 border border-gray-900 bg-gray-950 px-2 py-0.5 rounded-md uppercase">
                          {msg.stats}
                        </span>
                      )}
                      <span className="font-mono text-[8px] text-gray-400 border border-gray-800 bg-gray-900/40 px-2 py-0.5 rounded-full">
                        {msg.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  {/* Speech Bubble */}
                  <div className={`p-4 rounded-xl border ${meta.border} ${meta.bg} relative`}>
                    <p className="text-xs font-inter text-gray-200 leading-relaxed">{msg.message}</p>
                    
                    {/* Glowing highlight point */}
                    <span className="absolute top-3 left-3 w-1 h-1 rounded-full animate-ping" style={{ backgroundColor: meta.color }} />
                  </div>

                  {/* Expandable Reasoning Accordion */}
                  <div className="pl-3 border-l-2 border-gray-850 ml-1">
                    <button
                      onClick={() => toggleReasoning(idx)}
                      className="flex items-center gap-1 font-mono text-[8px] text-gray-500 hover:text-gray-300 uppercase tracking-wider cursor-pointer"
                    >
                      {isReasoningOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      <span>Deep Reasoning Trace</span>
                    </button>

                    {isReasoningOpen && (
                      <div className="mt-1.5 p-3 rounded-lg border border-gray-900 bg-black/40 font-mono text-[9px] text-gray-400 leading-relaxed animate-fade-in-up">
                        <div className="flex items-center gap-1.5 text-gray-500 mb-1 border-b border-gray-950 pb-1.5">
                          <Terminal size={10} className="text-purple-400" />
                          <span>ALGORITHM CRITERIA & DATA INPUTS</span>
                        </div>
                        <p className="italic">💭 {msg.reasoning}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Deliberations thinking dots indicator */}
            {debateActive && activeSpeaker && (
              <div className="flex items-center gap-3 text-gray-500 py-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider animate-pulse">
                  Executive nodes synchronizing...
                </span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT PANEL — CONSENSUS & SYSTEM TELEMETRY
      ════════════════════════════════════════ */}
      <aside className="w-64 shrink-0 flex flex-col border-l border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        
        {/* Consensus checklist */}
        <div className="orbit-panel p-3.5 border border-gray-850 bg-gray-900/10 space-y-3">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <CheckCircle2 size={13} className="text-orbit-success" />
            Directive Consensus
          </h3>

          <div className="flex flex-col gap-2 font-mono text-[10px]">
            {[
              { id: "segmentFound", label: "Cohort Mapped", ok: consensus.segmentFound, agent: "Polaris" },
              { id: "leaksRecovered", label: "Leaks Audited", ok: consensus.leaksRecovered, agent: "Luna" },
              { id: "roiForecasted", label: "Yield ROI Predicted", ok: consensus.roiForecasted, agent: "Vega" },
              { id: "copyGenerated", label: "Campaign Assembled", ok: consensus.copyGenerated, agent: "Nova" },
              { id: "dispatchArmed", label: "Dispatch Channels Locked", ok: consensus.dispatchArmed, agent: "Atlas" },
            ].map(item => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  item.ok 
                    ? "border-green-500/20 bg-green-500/5 text-green-400" 
                    : "border-gray-900 bg-transparent text-gray-550"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className={item.ok ? "text-green-400" : "text-gray-800"} />
                  <span className="font-semibold">{item.label}</span>
                </div>
                <span className="text-[8px] opacity-75">{item.agent}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity Feed Ticker */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-blue-400" />
            Executive Activity Feed
          </h3>
          <p className="font-mono text-[8px] text-gray-550 uppercase">Background operations log</p>

          <div className="flex-1 overflow-y-auto bg-black/60 border border-gray-900 rounded-xl p-3 font-mono text-[8px] text-gray-450 space-y-2 scrollbar-thin">
            {telemetry.length === 0 ? (
              <p className="text-center py-6 text-gray-650">[ CONSOLE STANDBY ]</p>
            ) : (
              telemetry.map((log, i) => (
                <div 
                  key={i} 
                  className={`leading-relaxed border-b border-gray-950 pb-1 transition-all ${
                    log.includes("BOARDROOM") ? "text-orbit-purple font-bold" :
                    log.includes("complete") || log.includes("consensus") ? "text-green-400" : ""
                  }`}
                  style={{ animation: "fadeInUp 0.3s ease" }}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Corner Diagnostic indicator */}
        <div className="border-t border-gray-800/60 pt-3 flex items-center justify-between font-mono text-[8px] text-gray-650">
          <span>CONSENSUS PORT: 8443</span>
          <span className="text-blue-500 animate-pulse">NOMINAL LINK</span>
        </div>
      </aside>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
