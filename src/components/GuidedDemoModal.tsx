import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Play, Pause, RotateCcw, X, ArrowRight, SkipForward,
  Target, Cpu, Radio, MessageSquare, Shield, CheckCircle2, Loader2,
  TrendingUp
} from "lucide-react";
import confetti from "canvas-confetti";

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterOS: () => void;
}

type DemoStep = 
  | "goal-input" 
  | "agent-scan" 
  | "boardroom" 
  | "simulator" 
  | "ready-package" 
  | "mission-live";

interface Agent {
  name: string;
  role: string;
  color: string;
  glow: string;
  icon: React.FC<any>;
  logs: string[];
  outputs: { label: string; value: string }[];
}

const AGENTS: Agent[] = [
  {
    name: "Drishti",
    role: "Audience Intelligence",
    color: "#3B82F6",
    glow: "rgba(59, 130, 246, 0.3)",
    icon: Target,
    logs: [
      "Analyzing customer cohort distribution...",
      "Clustering historical purchase frequency...",
      "Identified segment: 150 high-affinity repeat buyers.",
      "Calculated retention index: 84.6/100."
    ],
    outputs: [
      { label: "Target Segment", value: "Repeat Buyers" },
      { label: "Cohort Size", value: "150 customers" },
      { label: "Affinity Score", value: "94%" }
    ]
  },
  {
    name: "Pragya",
    role: "Opportunity Detection",
    color: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.3)",
    icon: Radio,
    logs: [
      "Scanning transactional leaks...",
      "Detecting cart abandonment triggers...",
      "Mapped 17 abandoned cart entries.",
      "Recoup opportunity calculated: ₹18,500."
    ],
    outputs: [
      { label: "Abandoned Leads", value: "17 targets" },
      { label: "Dormant VIPs", value: "12 targets" },
      { label: "Recoup Value", value: "₹18,500" }
    ]
  },
  {
    name: "Khoj",
    role: "Predictive Analytics",
    color: "#8B5CF6",
    glow: "rgba(139, 92, 246, 0.3)",
    icon: Cpu,
    logs: [
      "Forecasting future revenue paths...",
      "Simulating 3 outlook timelines...",
      "Selected recommended strategy: 4.8x ROI.",
      "Calibrating conversion probability (89%)."
    ],
    outputs: [
      { label: "Expected Yield", value: "₹42,000" },
      { label: "ROI Multiple", value: "4.8x" },
      { label: "Confidence", value: "89%" }
    ]
  },
  {
    name: "Rachna",
    role: "Campaign Creator",
    color: "#EC4899",
    glow: "rgba(236, 72, 153, 0.3)",
    icon: MessageSquare,
    logs: [
      "Querying Brand DNA copy guidelines...",
      "Generating personalized WhatsApp templates...",
      "Drafting email engagement sequences...",
      "A/B copy variants compiled successfully."
    ],
    outputs: [
      { label: "Copy Variants", value: "4 templates" },
      { label: "Channels Active", value: "WhatsApp, Email" },
      { label: "Discount Token", value: "15% Loyalty offer" }
    ]
  },
  {
    name: "Saarthi",
    role: "Operations Dispatch",
    color: "#22C55E",
    glow: "rgba(34, 197, 94, 0.3)",
    icon: Shield,
    logs: [
      "Initializing execution route nodes...",
      "Testing SMS & WhatsApp gateway latency...",
      "Verifying load balancer allocations...",
      "Armed dispatch systems for execution."
    ],
    outputs: [
      { label: "Gateway Status", value: "Active" },
      { label: "Queue Latency", value: "0.12s" },
      { label: "Safety Score", value: "97%" }
    ]
  }
];

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({ isOpen, onClose, onEnterOS }) => {
  const [step, setStep] = useState<DemoStep>("goal-input");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [typedGoal, setTypedGoal] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [activeScanAgent, setActiveScanAgent] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [boardroomSpeakerIdx, setBoardroomSpeakerIdx] = useState(0);
  const [activeTimeline, setActiveTimeline] = useState<"conservative" | "recommended" | "aggressive">("recommended");
  const [selectedScenario, setSelectedScenario] = useState<string>("repeat");
  const [scenarioMult, setScenarioMult] = useState<number>(1.0);
  const [selectedChannel, setSelectedChannel] = useState<string>("whatsapp");
  const [channelMult, setChannelMult] = useState<number>(1.0);
  const [simulationDays, setSimulationDays] = useState<number>(14);

  const baseConservative = 31000;
  const baseRecommended = 42000;
  const baseAggressive = 58000;

  const currentMult = scenarioMult * channelMult * (simulationDays === 7 ? 0.75 : simulationDays === 30 ? 1.45 : 1.0);

  const finalConservative = Math.round(baseConservative * currentMult);
  const finalRecommended = Math.round(baseRecommended * currentMult);
  const finalAggressive = Math.round(baseAggressive * currentMult);

  const clampY = (y: number) => Math.max(2, Math.min(95, y));

  // Step timings in seconds
  const stepDurations: Record<DemoStep, number> = {
    "goal-input": 5.5,
    "agent-scan": 11,
    "boardroom": 11,
    "simulator": 7,
    "ready-package": 4.5,
    "mission-live": 20
  };

  // Step list
  const steps: DemoStep[] = ["goal-input", "agent-scan", "boardroom", "simulator", "ready-package", "mission-live"];
  const currentStepIndex = steps.indexOf(step);

  // Background floating particles state
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate background particles once
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 20
    }));
    setParticles(newParticles);
  }, []);

  // Reset values when steps change
  useEffect(() => {
    setProgress(0);
    
    if (step === "goal-input") {
      setTypedGoal("");
      setIsTypingComplete(false);
      let goalText = "Increase Repeat Purchases by 20%";
      let idx = 0;
      const interval = setInterval(() => {
        if (idx <= goalText.length) {
          setTypedGoal(goalText.slice(0, idx));
          idx++;
        } else {
          setIsTypingComplete(true);
          clearInterval(interval);
        }
      }, 70);
      return () => clearInterval(interval);
    }

    if (step === "agent-scan") {
      setActiveScanAgent(0);
      setScanProgress(0);
      setScanLogs(["[SYSTEM] Launch sequence authorized.", "[SYSTEM] Initializing Agent Node Handshakes..."]);
    }

    if (step === "boardroom") {
      setBoardroomSpeakerIdx(0);
    }
  }, [step]);

  // Handle auto-play progress tracking
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 50; // Update progress bar every 50ms
    const totalMs = stepDurations[step] * 1000;
    const stepIncrement = (intervalTime / totalMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNextStep();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [step, isPlaying]);

  // Sequence scan logic for Agent Scanning step
  useEffect(() => {
    if (step !== "agent-scan") return;

    const totalAgents = AGENTS.length;
    const agentDuration = (stepDurations["agent-scan"] - 1) / totalAgents; // distribute time
    const intervalTime = 100; // ms
    const increment = (intervalTime / (agentDuration * 1000)) * 100;

    const timer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          // Add logs from the completed agent
          const completedAgent = AGENTS[activeScanAgent];
          setScanLogs((prevLogs) => [
            ...prevLogs,
            ...completedAgent.logs.map(log => `[${completedAgent.name}] ${log}`),
            `[${completedAgent.name}] Node fully calibrated.`
          ]);

          if (activeScanAgent < totalAgents - 1) {
            setActiveScanAgent(activeScanAgent + 1);
            return 0;
          } else {
            clearInterval(timer);
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [step, activeScanAgent]);

  // Boardroom dialog speaker rotation logic
  useEffect(() => {
    if (step !== "boardroom") return;

    // Distribute courtroom speech across agents
    const timer = setInterval(() => {
      setBoardroomSpeakerIdx((prev) => {
        if (prev < AGENTS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [step]);

  // Trigger confetti burst on final step activation
  useEffect(() => {
    if (step === "mission-live") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [step]);

  // Live Metrics Simulator for Mission Live dashboard
  const [liveOrders, setLiveOrders] = useState(0);
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [liveMessagesSent, setLiveMessagesSent] = useState(0);
  const [liveActivity, setLiveActivity] = useState<string[]>([]);

  useEffect(() => {
    if (step !== "mission-live") return;
    
    const initialRevenue = Math.round(finalRecommended * 0.045);
    setLiveOrders(2);
    setLiveRevenue(initialRevenue);
    setLiveMessagesSent(12);
    setLiveActivity([
      "[SYSTEM] Autonomous campaign launched successfully.",
      `[Saarthi] Dispatched initial wave (12/150 targets).`,
      "[Pragya] Checking recoup triggers on WhatsApp...",
      `[SYSTEM] First conversion recorded: Order #1892 (₹${initialRevenue.toLocaleString()})`
    ]);

    const interval = setInterval(() => {
      setLiveMessagesSent(prev => {
        const next = Math.min(prev + Math.floor(Math.random() * 8) + 4, 150);
        return next;
      });

      // Chance to convert and add revenue/orders
      if (Math.random() > 0.4) {
        const orderVal = Math.round((finalRecommended / 20) * (0.8 + Math.random() * 0.4));
        setLiveOrders(o => o + 1);
        setLiveRevenue(r => r + orderVal);
        
        const names = ["Aarav S.", "Priya K.", "Rohit M.", "Ananya G.", "Kabir D.", "Zara H."];
        const randomName = names[Math.floor(Math.random() * names.length)];
        const channelName = selectedChannel === "whatsapp" ? "WhatsApp" : "Email";

        setLiveActivity(act => [
          ...act,
          `[Saarthi] Cohort conversion detected via ${channelName}.`,
          `[SYSTEM] Recouped ₹${orderVal.toLocaleString()} from ${randomName}.`
        ]);
      } else {
        const diagnostics = [
          "[Khoj] Retuning send-time delay index.",
          "[Rachna] Micro-optimizing content delivery headers.",
          "[Saarthi] Checking delivery status indicators... 100% success rate.",
          "[Drishti] Re-evaluating fallback segments."
        ];
        const randomDiag = diagnostics[Math.floor(Math.random() * diagnostics.length)];
        setLiveActivity(act => [...act, randomDiag]);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [step, finalRecommended, selectedChannel]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]);
    } else {
      // Completed last step, loop or close
      setIsPlaying(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]);
    }
  };

  const handleReplay = () => {
    setStep("goal-input");
    setIsPlaying(true);
    setProgress(0);
    setLiveOrders(0);
    setLiveRevenue(0);
    setLiveMessagesSent(0);
    setLiveActivity([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050816] flex flex-col justify-between overflow-hidden text-white font-inter">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="absolute inset-0 space-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-Manthan-glow-blue opacity-[0.08]" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full bg-Manthan-glow-purple opacity-[0.08]" />
        
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "100%", x: `${p.x}vw`, opacity: 0.1 }}
            animate={{ y: "-10%", opacity: [0.1, 0.4, 0.1] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute rounded-full bg-blue-400"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </div>

      {/* Interactive Scanlines Overlay */}
      <div className="scanlines z-0 pointer-events-none absolute inset-0" />

      {/* TOP HUD BAR */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/5 backdrop-blur-lg bg-[#050816]/75">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-Manthan-blue to-Manthan-purple flex items-center justify-center shadow-Manthan-glow animate-pulse">
            <span className="font-space font-bold text-white text-sm">O</span>
          </div>
          <div>
            <h2 className="font-space font-bold text-sm tracking-widest uppercase flex items-center gap-1.5">
              Manthan Guided Tour
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-Manthan-blue/30 bg-Manthan-blue/10 text-Manthan-blue tracking-normal normal-case">Cinematic Demonstration</span>
            </h2>
            <span className="text-[10px] font-mono text-gray-500 uppercase">SYSTEM STATUS: INTERACTIVE SHOWCASE</span>
          </div>
        </div>

        {/* Dynamic Timeline Nav */}
        <div className="hidden md:flex items-center gap-2">
          {steps.map((s, idx) => (
            <React.Fragment key={s}>
              <button
                onClick={() => {
                  setStep(s);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition-all ${
                  step === s 
                    ? "bg-[#1E293B] text-white border border-white/10 shadow-Manthan-glow-inset"
                    : currentStepIndex > idx
                    ? "text-Manthan-success opacity-85 hover:text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                0{idx + 1}. {s.replace("-", " ")}
              </button>
              {idx < steps.length - 1 && <span className="text-gray-700 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          {/* Pause / Play Control */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-lg border border-white/5 bg-[#0F172A] hover:bg-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-sm"
            title={isPlaying ? "Pause Autoplay" : "Play Autoplay"}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>

          {/* Close Showcase */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-all cursor-pointer"
            title="Exit Showcase"
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* AUTO-PLAY TIMELINE PROGRESS BAR */}
      <div className="relative z-10 w-full h-[2px] bg-white/5 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-Manthan-blue via-Manthan-purple to-Manthan-success"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: GOAL INPUT */}
          {step === "goal-input" && (
            <motion.div
              key="goal-input"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl w-full text-center space-y-6"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-Manthan-blue/30 bg-Manthan-blue/5 text-Manthan-blue font-mono text-[9px] uppercase tracking-wider animate-pulse mx-auto">
                <Sparkles size={11} />
                Step 1: Input Objective
              </div>

              <h1 className="font-space text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                What would you like Manthan to achieve?
              </h1>
              
              <div className="relative rounded-2xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-md p-5 text-left transition-all duration-300 shadow-2xl">
                <div className="absolute top-2.5 right-3 text-[8px] font-mono text-gray-500 uppercase tracking-widest">command console</div>
                <div className="font-mono text-sm leading-relaxed min-h-[50px] text-white flex items-center gap-1">
                  <span>{typedGoal}</span>
                  {!isTypingComplete && <span className="w-1.5 h-4 bg-Manthan-blue animate-pulse shrink-0" />}
                </div>
              </div>

              <div className="relative">
                <button
                  disabled
                  className={`w-full py-4 rounded-xl font-mono text-[11px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                    isTypingComplete 
                      ? "bg-gradient-to-r from-Manthan-blue to-Manthan-purple border-white/10 text-white shadow-Manthan-glow scale-[1.01]" 
                      : "bg-[#0F172A]/50 border-white/5 text-gray-600"
                  }`}
                >
                  <Play size={12} className={isTypingComplete ? "animate-pulse" : ""} />
                  Initiating Autonomous Mission
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AGENT SCANNING SEQUENCE */}
          {step === "agent-scan" && (
            <motion.div
              key="agent-scan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left Column: Agent Node List */}
              <div className="md:col-span-2 space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <div>
                    <span className="font-mono text-[8px] text-red-500 uppercase tracking-widest block animate-pulse">● Neural Organization Scanning</span>
                    <h2 className="font-space text-lg font-bold uppercase tracking-tight text-white mt-0.5">Sequential Activation Loop</h2>
                  </div>
                  <span className="font-mono text-[9px] text-gray-500 uppercase">Phase 0{activeScanAgent + 1} / 05</span>
                </div>

                <div className="space-y-2.5">
                  {AGENTS.map((agent, idx) => {
                    const Icon = agent.icon;
                    const isActive = idx === activeScanAgent;
                    const isPassed = idx < activeScanAgent;
                    
                    return (
                      <div
                        key={agent.name}
                        className={`rounded-xl border p-3.5 flex items-center justify-between transition-all duration-300 ${
                          isActive ? "bg-[#1E293B]/70" : "bg-[#0F172A]/40"
                        }`}
                        style={{
                          borderColor: isActive ? agent.color : isPassed ? `${agent.color}35` : "rgba(255, 255, 255, 0.04)",
                          boxShadow: isActive ? `0 0 20px ${agent.color}15` : undefined
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300"
                            style={{
                              backgroundColor: isActive ? `${agent.color}20` : isPassed ? `${agent.color}10` : "rgba(255, 255, 255, 0.02)",
                              borderColor: isActive || isPassed ? agent.color : "rgba(255, 255, 255, 0.08)",
                            }}
                          >
                            <Icon size={16} style={{ color: isActive || isPassed ? agent.color : "#4b5563" }} className={isActive ? "animate-pulse" : ""} />
                          </div>
                          <div>
                            <span className="font-mono text-[8px] block" style={{ color: isActive || isPassed ? agent.color : "#4b5563" }}>
                              AGENT 0{idx + 1} — {isActive ? "SCANNING" : isPassed ? "RESOLVED" : "STANDBY"}
                            </span>
                            <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider mt-0.5">{agent.name}</h3>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="flex items-center gap-3">
                          {isActive && (
                            <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block border border-white/5">
                              <div className="h-full rounded-full transition-all duration-100" style={{ width: `${scanProgress}%`, backgroundColor: agent.color }} />
                            </div>
                          )}
                          <span className="font-mono text-[9px] font-bold" style={{ color: isActive ? agent.color : isPassed ? "#22C55E" : "#4b5563" }}>
                            {isActive ? `${Math.round(scanProgress)}%` : isPassed ? "ONLINE" : "LOCKED"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Console Log outputs */}
              <div className="rounded-xl border border-white/5 bg-black/45 p-4 flex flex-col justify-between h-[300px] md:h-auto font-mono text-[9px]">
                <div className="space-y-2 overflow-y-auto flex-1 text-green-400 select-none scrollbar-thin">
                  <div className="text-gray-500 border-b border-white/5 pb-2 mb-2 uppercase text-[8px] tracking-widest font-bold">
                    Console Logs Feed
                  </div>
                  {scanLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap">
                      <span className="text-gray-600 mr-1">»</span>
                      {log}
                    </div>
                  ))}
                  {step === "agent-scan" && (
                    <div className="flex items-center gap-1.5 text-Manthan-blue animate-pulse mt-1">
                      <Loader2 size={8} className="animate-spin" />
                      <span>{AGENTS[activeScanAgent]?.logs[Math.min(Math.floor(scanProgress / 25), 3)] || "Completing loops..."}</span>
                    </div>
                  )}
                </div>

                {/* Status bar */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-gray-500 text-[8px] uppercase">
                  <span>Output Channel</span>
                  <span className="text-Manthan-blue animate-pulse">Telemetry active</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AGENT BOARDROOM */}
          {step === "boardroom" && (
            <motion.div
              key="boardroom"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl w-full flex flex-col items-center space-y-6"
            >
              <div className="text-center space-y-1.5">
                <span className="font-mono text-[8px] text-Manthan-purple uppercase tracking-[0.2em] animate-pulse">● HOLOGRAPHIC ROUNDTABLE CORE</span>
                <h2 className="font-space text-xl md:text-2xl font-bold uppercase tracking-tight text-white">Boardroom Alignment</h2>
                <p className="font-mono text-[10px] text-gray-400">Watch the agents coordinate and synthesize the strategy.</p>
              </div>

              {/* Roundtable visualization */}
              <div className="relative w-64 h-64 flex items-center justify-center my-3">
                <div className="absolute inset-0 rounded-full border border-white/5 animate-Manthan-spin-slow" />
                <div className="absolute inset-8 rounded-full border border-dashed border-white/10" />
                
                {/* Center Core */}
                <div className="absolute w-20 h-20 rounded-full border border-Manthan-purple/20 bg-Manthan-purple/5 flex items-center justify-center animate-pulse shadow-Manthan-glow-purple">
                  <div className="w-12 h-12 rounded-full bg-Manthan-purple/10 border border-Manthan-purple/30 flex items-center justify-center">
                    <Cpu size={16} className="text-white animate-spin-slow" />
                  </div>
                </div>

                {/* Circular Agents Positioning */}
                {AGENTS.map((p, idx) => {
                  const angle = (idx * 72 * Math.PI) / 180;
                  const x = 128 + Math.cos(angle) * 96;
                  const y = 128 + Math.sin(angle) * 96;
                  
                  const isSpeaker = boardroomSpeakerIdx === idx;
                  const hasSpoken = boardroomSpeakerIdx > idx;
                  const Icon = p.icon;

                  return (
                    <div
                      key={p.name}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 bg-[#0F172A]"
                        style={{ 
                          borderColor: isSpeaker ? p.color : hasSpoken ? `${p.color}50` : "rgba(255, 255, 255, 0.08)",
                          boxShadow: isSpeaker ? `0 0 25px ${p.color}40` : undefined,
                          transform: isSpeaker ? "scale(1.15)" : "scale(1)"
                        }}
                      >
                        <Icon size={14} style={{ color: isSpeaker || hasSpoken ? p.color : "#64748b" }} />
                      </div>
                      <span className="font-mono text-[7px] font-bold text-gray-500 uppercase mt-1.5">{p.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Speech Bubble Dialog Panel */}
              <div className="w-full max-w-lg border border-white/10 bg-[#0F172A]/75 backdrop-blur-md p-4 rounded-xl relative min-h-[90px] flex items-center shadow-lg">
                <div className="w-full">
                  <span 
                    className="font-mono text-[8px] uppercase tracking-wider block font-bold transition-colors duration-300"
                    style={{ color: AGENTS[boardroomSpeakerIdx]?.color }}
                  >
                    {AGENTS[boardroomSpeakerIdx]?.name} ({AGENTS[boardroomSpeakerIdx]?.role}) Speaks
                  </span>
                  <p className="font-inter text-xs leading-relaxed text-gray-200 mt-1.5 font-medium italic">
                    "{
                      [
                        "I have clustered 150 premium repeat purchase prospects. Affinity correlation stands at 94%.",
                        "Opportunity detected in leakage logs. Found ₹18,500 in cart leaks ready for reactivation.",
                        "Forecast model successfully simulated. Recommended curve promises a 4.8x ROI multiplier.",
                        "Created matching high-converting copies for WhatsApp & Email, incorporating discount tokens.",
                        "Nodes checked. Delivery pipelines armed. 150 targets locked and ready for deployment."
                      ][boardroomSpeakerIdx]
                    }"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FUTURE SIMULATOR */}
          {step === "simulator" && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Side: Timelines Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border-b border-white/5 pb-2.5">
                  <span className="font-mono text-[8px] text-Manthan-blue uppercase tracking-widest block">Simulation Outlook Ledger</span>
                  <h2 className="font-space text-lg font-bold uppercase tracking-tight text-white mt-0.5">Timeline Forecast Comparison</h2>
                </div>

                {/* Recruiter Showcase Option Toggles */}
                <div className="bg-[#0F172A]/80 border border-white/5 rounded-xl p-3.5 space-y-3.5 shadow-md">
                  <span className="font-space text-[10px] font-bold text-white uppercase tracking-wider block border-b border-white/5 pb-1">Guided Simulation Sandbox</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Option 1: Directive Scenario */}
                    <div className="space-y-1 text-left">
                      <span className="font-mono text-[8px] text-gray-550 uppercase block">Directive Target</span>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: "repeat", label: "Repeat Purchases (1.0x)", mult: 1.0 },
                          { id: "inactive", label: "Reactivate VIPs (1.35x)", mult: 1.35 },
                          { id: "festive", label: "Festive Promo (2.1x)", mult: 2.1 }
                        ].map((scenario) => (
                          <button
                            key={scenario.id}
                            onClick={() => {
                              setSelectedScenario(scenario.id);
                              setScenarioMult(scenario.mult);
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-mono border text-left transition-all cursor-pointer ${
                              selectedScenario === scenario.id
                                ? "bg-Manthan-blue/15 border-Manthan-blue text-white shadow-Manthan-glow-inset font-bold"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            {scenario.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Option 2: Active Channel Selector */}
                    <div className="space-y-1 text-left">
                      <span className="font-mono text-[8px] text-gray-550 uppercase block">Active Channel</span>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: "whatsapp", label: "WhatsApp Only (1.0x)", mult: 1.0 },
                          { id: "omnichannel", label: "Omnichannel (1.15x)", mult: 1.15 }
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => {
                              setSelectedChannel(ch.id);
                              setChannelMult(ch.mult);
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-mono border text-left transition-all cursor-pointer ${
                              selectedChannel === ch.id
                                ? "bg-Manthan-purple/15 border-Manthan-purple text-white shadow-Manthan-glow-inset font-bold"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            {ch.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Option 3: Simulation Horizon Duration */}
                    <div className="space-y-1 text-left">
                      <span className="font-mono text-[8px] text-gray-555 uppercase block">Simulation Horizon</span>
                      <div className="flex flex-col gap-1">
                        {[
                          { days: 7, label: "7 Days (0.75x)" },
                          { days: 14, label: "14 Days (1.0x)" },
                          { days: 30, label: "30 Days (1.45x)" }
                        ].map((horizon) => (
                          <button
                            key={horizon.days}
                            onClick={() => {
                              setSimulationDays(horizon.days);
                            }}
                            className={`px-2 py-1 rounded text-[9px] font-mono border text-left transition-all cursor-pointer ${
                              simulationDays === horizon.days
                                ? "bg-Manthan-success/15 border-Manthan-success text-white shadow-Manthan-glow-inset font-bold"
                                : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                            }`}
                          >
                            {horizon.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Conservative Timeline */}
                  <button
                    onClick={() => setActiveTimeline("conservative")}
                    className={`rounded-xl border p-4 text-left transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer ${
                      activeTimeline === "conservative" 
                        ? "bg-[#0F172A] border-blue-500/50 shadow-Manthan-glow-blue scale-[1.01]"
                        : "bg-[#0F172A]/40 border-white/5 hover:border-white/10 opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-space text-[10px] font-bold text-white uppercase">Timeline A</span>
                      <span className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 uppercase">Conservative</span>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-gray-500 block uppercase">Forecast Revenue</span>
                      <span className="font-space text-lg font-bold text-blue-400">₹{finalConservative.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 font-mono text-[8px] text-gray-400 border-t border-white/5 pt-2 w-full">
                      <div className="flex justify-between"><span>ROI Multiple:</span><span className="text-white font-bold">{(2.8 * (channelMult === 1.15 ? 1.1 : 1.0)).toFixed(1)}x</span></div>
                      <div className="flex justify-between"><span>Confidence:</span><span className="text-white font-bold">91%</span></div>
                      <div className="flex justify-between"><span>Fatigue Risk:</span><span className="text-Manthan-success font-bold">None</span></div>
                    </div>
                  </button>

                  {/* Recommended Timeline */}
                  <button
                    onClick={() => setActiveTimeline("recommended")}
                    className={`rounded-xl border p-4 text-left transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer ${
                      activeTimeline === "recommended" 
                        ? "bg-[#0F172A] border-green-500/50 shadow-Manthan-glow-green scale-[1.01]"
                        : "bg-[#0F172A]/40 border-white/5 hover:border-white/10 opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-space text-[10px] font-bold text-white uppercase">Timeline B</span>
                      <span className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 uppercase animate-pulse">Recommended</span>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-gray-550 block uppercase">Forecast Revenue</span>
                      <span className="font-space text-lg font-bold text-green-400">₹{finalRecommended.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 font-mono text-[8px] text-gray-400 border-t border-white/5 pt-2 w-full">
                      <div className="flex justify-between"><span>ROI Multiple:</span><span className="text-white font-bold">{(4.8 * (channelMult === 1.15 ? 1.1 : 1.0)).toFixed(1)}x</span></div>
                      <div className="flex justify-between"><span>Confidence:</span><span className="text-white font-bold">89%</span></div>
                      <div className="flex justify-between"><span>Fatigue Risk:</span><span className="text-yellow-400 font-bold">Low</span></div>
                    </div>
                  </button>

                  {/* Aggressive Timeline */}
                  <button
                    onClick={() => setActiveTimeline("aggressive")}
                    className={`rounded-xl border p-4 text-left transition-all duration-300 flex flex-col justify-between space-y-3 cursor-pointer ${
                      activeTimeline === "aggressive" 
                        ? "bg-[#0F172A] border-purple-500/50 shadow-Manthan-glow-purple scale-[1.01]"
                        : "bg-[#0F172A]/40 border-white/5 hover:border-white/10 opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-space text-[10px] font-bold text-white uppercase">Timeline C</span>
                      <span className="font-mono text-[7px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 uppercase">Aggressive</span>
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-gray-550 block uppercase">Forecast Revenue</span>
                      <span className="font-space text-lg font-bold text-purple-400">₹{finalAggressive.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 font-mono text-[8px] text-gray-400 border-t border-white/5 pt-2 w-full">
                      <div className="flex justify-between"><span>ROI Multiple:</span><span className="text-white font-bold">{(6.2 * (channelMult === 1.15 ? 1.1 : 1.0)).toFixed(1)}x</span></div>
                      <div className="flex justify-between"><span>Confidence:</span><span className="text-white font-bold">69%</span></div>
                      <div className="flex justify-between"><span>Fatigue Risk:</span><span className="text-red-400 font-bold">High</span></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Side: Chart visualization */}
              <div className="rounded-xl border border-white/5 bg-[#0F172A]/50 p-4 flex flex-col justify-between space-y-4">
                <span className="font-mono text-[8px] text-gray-500 uppercase block tracking-wider">Projection Analytics</span>
                
                {/* SVG Curves Graph */}
                <div className="h-32 w-full relative border-l border-b border-white/10 mt-1">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="33" x2="100" y2="33" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="0" y1="66" x2="100" y2="66" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    
                    {/* Conservative Timeline A Curve */}
                    <motion.path
                      d={`M 0 95 Q 40 70 100 ${clampY(95 - 45 * currentMult)}`}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth={activeTimeline === "conservative" ? "2.5" : "1"}
                      opacity={activeTimeline === "conservative" ? "1" : "0.35"}
                      key={`conservative-${currentMult}`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2 }}
                    />
                    {/* Recommended Timeline B Curve */}
                    <motion.path
                      d={`M 0 95 Q 35 50 100 ${clampY(95 - 70 * currentMult)}`}
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth={activeTimeline === "recommended" ? "2.5" : "1.2"}
                      opacity={activeTimeline === "recommended" ? "1" : "0.35"}
                      key={`recommended-${currentMult}`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2 }}
                    />
                    {/* Aggressive Timeline C Curve */}
                    <motion.path
                      d={`M 0 95 Q 30 35 100 ${clampY(95 - 90 * currentMult)}`}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth={activeTimeline === "aggressive" ? "2.5" : "1"}
                      opacity={activeTimeline === "aggressive" ? "1" : "0.35"}
                      key={`aggressive-${currentMult}`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.2 }}
                    />
                  </svg>
                  <div className="absolute bottom-1 right-2 font-mono text-[7px] text-gray-500">Day {simulationDays}</div>
                  <div className="absolute top-1 left-1 font-mono text-[7px] text-gray-500">Target revenue</div>
                </div>

                <div className="text-[10px] font-mono text-gray-400 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                  <span className="text-green-400 font-bold block text-[8px] uppercase tracking-widest mb-0.5">Khoj Insights</span>
                  Timeline B leverages a staggered discount trigger over a {simulationDays}-day cycle, balancing ROI with customer fatigue.
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: FINAL MISSION PACKAGE */}
          {step === "ready-package" && (
            <motion.div
              key="ready-package"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl w-full text-center space-y-6"
            >
              <div className="w-12 h-12 rounded-full border border-green-500/20 bg-green-500/5 flex items-center justify-center mx-auto text-green-400 animate-pulse shadow-Manthan-glow-green">
                <CheckCircle2 size={22} />
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[8px] text-Manthan-success uppercase tracking-[0.2em] font-bold">consensus reached</span>
                <h1 className="font-space text-3xl font-bold uppercase tracking-tight text-white">Mission Package Prepared</h1>
                <p className="font-mono text-[10px] text-gray-400">All neural systems nominal. Verification parameters verified.</p>
              </div>

              {/* Strategy highlights panel */}
              <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-md p-6 grid grid-cols-2 sm:grid-cols-5 gap-4 shadow-xl">
                <div className="text-center p-2 rounded bg-white/[0.01]">
                  <span className="text-gray-550 block font-mono text-[8px] uppercase">Audience</span>
                  <span className="text-white font-space font-bold text-sm block mt-1">150 Users</span>
                </div>
                <div className="text-center p-2 rounded bg-white/[0.01]">
                  <span className="text-gray-550 block font-mono text-[8px] uppercase">Channel</span>
                  <span className="text-Manthan-blue font-space font-bold text-sm block mt-1">
                    {selectedChannel === "whatsapp" ? "WhatsApp" : "Omnichannel"}
                  </span>
                </div>
                <div className="text-center p-2 rounded bg-white/[0.01]">
                  <span className="text-gray-550 block font-mono text-[8px] uppercase">Confidence</span>
                  <span className="text-Manthan-purple font-space font-bold text-sm block mt-1">89%</span>
                </div>
                <div className="text-center p-2 rounded bg-white/[0.01]">
                  <span className="text-gray-550 block font-mono text-[8px] uppercase">Revenue Forecast</span>
                  <span className="text-Manthan-success font-space font-bold text-sm block mt-1">
                    ₹{finalRecommended.toLocaleString()}
                  </span>
                </div>
                <div className="text-center p-2 rounded bg-white/[0.01] col-span-2 sm:col-span-1">
                  <span className="text-gray-550 block font-mono text-[8px] uppercase">Expected ROI</span>
                  <span className="text-yellow-400 font-space font-bold text-sm block mt-1">
                    {(4.8 * (channelMult === 1.15 ? 1.1 : 1.0)).toFixed(1)}x
                  </span>
                </div>
              </div>

              <button
                disabled
                className="w-full py-4 rounded-xl bg-green-500 text-white font-mono text-[11px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_0_30px_rgba(34,197,94,0.45)]"
              >
                <span>Deploy Campaign Node</span>
                <ArrowRight size={12} className="animate-pulse" />
              </button>
            </motion.div>
          )}

          {/* STEP 6: LIVE MISSION CONTROL */}
          {step === "mission-live" && (
            <motion.div
              key="mission-live"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
              className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-4 gap-6 text-left"
            >
              {/* Dashboard Left Grid: Core stats */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <span className="font-mono text-[8px] text-Manthan-success uppercase tracking-widest block animate-pulse">● LIVE CAMPAIGN RUNNING</span>
                    <h2 className="font-space text-lg font-bold uppercase tracking-tight text-white mt-0.5">Mission Control Console</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-555">
                      OBJECTIVE: {
                        selectedScenario === "repeat" 
                          ? "INCREASE REPEAT PURCHASES BY 20%" 
                          : selectedScenario === "inactive" 
                          ? "RECOVER INACTIVE CUSTOMERS" 
                          : "PROMOTE FESTIVE SALE"
                      }
                    </span>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Revenue Recouped */}
                  <div className="rounded-xl border border-white/10 bg-[#0F172A]/85 p-4 space-y-2 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 filter blur-xl" />
                    <span className="font-mono text-[8px] text-gray-550 block uppercase">Recouped Revenue</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-space text-2xl font-bold text-green-400">₹{liveRevenue.toLocaleString()}</span>
                      <span className="text-xs text-green-500 font-mono flex items-center">
                        <TrendingUp size={11} className="mr-0.5" /> +100%
                      </span>
                    </div>
                    <span className="font-mono text-[8px] text-gray-555 block">Forecast Target: ₹{finalRecommended.toLocaleString()}</span>
                  </div>

                  {/* Cohort Conversions */}
                  <div className="rounded-xl border border-white/10 bg-[#0F172A]/85 p-4 space-y-2 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 filter blur-xl" />
                    <span className="font-mono text-[8px] text-gray-550 block uppercase">Conversions Secured</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-space text-2xl font-bold text-white">{liveOrders} Orders</span>
                      <span className="text-[9px] text-blue-400 font-mono">12.4% conv rate</span>
                    </div>
                    <span className="font-mono text-[8px] text-gray-555 block">Target: 30 conversions</span>
                  </div>

                  {/* Messages Dispatch */}
                  <div className="rounded-xl border border-white/10 bg-[#0F172A]/85 p-4 space-y-2 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 filter blur-xl" />
                    <span className="font-mono text-[8px] text-gray-550 block uppercase">Dispatched Queue</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-space text-2xl font-bold text-white">{liveMessagesSent} / 150</span>
                      <span className="text-[9px] text-pink-400 font-mono">
                        {selectedChannel === "whatsapp" ? "WhatsApp Only" : "WhatsApp + Email"}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-Manthan-blue to-Manthan-purple" style={{ width: `${(liveMessagesSent/150)*100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Subsystem Handshakes */}
                <div className="rounded-xl border border-white/10 bg-[#0F172A]/60 p-4 space-y-3">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                    Neural Agent Handshakes
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "Drishti", desc: "Audience Targeter", color: "text-Manthan-blue" },
                      { name: "Khoj", desc: "Forecasting Multiplier", color: "text-Manthan-purple" },
                      { name: "Rachna", desc: "Copy Generator", color: "text-Manthan-pink" },
                      { name: "Saarthi", desc: "Delivery Gateway", color: "text-Manthan-success" }
                    ].map((ag) => (
                      <div key={ag.name} className="flex items-center gap-2.5 p-2 rounded-lg border border-white/[0.04] bg-[#0F172A]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <div>
                          <span className="font-space font-bold text-[10px] text-white block">{ag.name}</span>
                          <span className="font-mono text-[8px] text-gray-550 block">{ag.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dashboard Right Grid: Live timeline events */}
              <div className="rounded-xl border border-white/10 bg-black/45 p-4 flex flex-col justify-between h-[340px] md:h-auto font-mono text-[9px] lg:col-span-1 shadow-lg">
                <div className="flex-1 overflow-y-auto space-y-2.5 text-green-400 select-none scrollbar-thin">
                  <div className="text-gray-500 border-b border-white/5 pb-2 mb-2 uppercase text-[8px] tracking-widest font-bold flex items-center justify-between">
                    <span>Active Telemetry</span>
                    <span className="inline-flex items-center gap-1 text-Manthan-success animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      Live Feed
                    </span>
                  </div>
                  {liveActivity.slice().reverse().map((act, i) => (
                    <div key={i} className="leading-relaxed border-b border-white/[0.02] pb-1.5 animate-fade-in-up">
                      <span className="text-gray-650 mr-1">»</span>
                      {act}
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-2">
                  <button
                    onClick={onEnterOS}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-Manthan-blue to-Manthan-purple hover:scale-[1.01] text-white font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-Manthan-glow"
                  >
                    <span>Boot Real OS</span>
                    <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={handleReplay}
                    className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-[#0F172A]/50"
                  >
                    <RotateCcw size={11} />
                    Replay Demo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER BAR WITH NAVIGATION CONTROLS */}
      <footer className="relative z-10 px-6 py-4 border-t border-white/5 bg-[#050816]/75 backdrop-blur-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className={`px-3.5 py-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all ${
              currentStepIndex === 0 
                ? "border-white/5 text-gray-700 cursor-not-allowed" 
                : "border-white/10 hover:bg-[#1E293B] text-gray-300 hover:text-white"
            }`}
          >
            ← Previous
          </button>
          
          <button
            onClick={handleNextStep}
            disabled={currentStepIndex === steps.length - 1}
            className={`px-4 py-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all ${
              currentStepIndex === steps.length - 1 
                ? "border-white/5 text-gray-700 cursor-not-allowed" 
                : "bg-white text-black hover:bg-gray-200 border-transparent shadow-sm"
            }`}
          >
            Next Step →
          </button>
        </div>

        <span className="text-[10px] font-mono text-gray-500 hidden sm:inline-block">
          STEP 0{currentStepIndex + 1} / 06 — {step.replace("-", " ").toUpperCase()}
        </span>

        <div>
          {step !== "mission-live" && (
            <button
              onClick={() => {
                setStep("mission-live");
                setIsPlaying(false);
              }}
              className="px-4 py-2 rounded-lg border border-white/10 hover:bg-[#1E293B] text-xs font-mono text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              Skip Walkthrough
              <SkipForward size={12} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
