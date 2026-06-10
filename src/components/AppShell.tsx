import React, { useState, useRef, useEffect } from "react";
import { 
  Terminal, Activity, Star, Zap, Users, Mic, BarChart2, 
  Settings, Moon, Sun, Radio, ChevronRight, Cpu,
  Calendar, Compass, Sparkles, MicOff, Send, MessageSquare, X, ArrowRight, LogOut
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";

type Page = 
  | "command-center" 
  | "mission-control" 
  | "customer-galaxy" 
  | "growth-engine" 
  | "future-simulator"
  | "opportunity-radar"
  | "seasonal-intel"
  | "competitor-intel"
  | "agent-boardroom" 
  | "voice-console" 
  | "analytics" 
  | "system-config";

interface ShellProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  missionGoal?: string;
  onLogout?: () => void;
}

const navItems: { id: Page; icon: React.FC<any>; label: string; shortLabel: string }[] = [
  { id: "command-center", icon: Terminal, label: "Command Center", shortLabel: "CMD" },
  { id: "mission-control", icon: Activity, label: "Mission Control", shortLabel: "MCT" },
  { id: "customer-galaxy", icon: Star, label: "Customer Galaxy", shortLabel: "GLX" },
  { id: "growth-engine", icon: Zap, label: "Growth Engine", shortLabel: "GRW" },
  { id: "future-simulator", icon: Cpu, label: "Future Simulator", shortLabel: "FUT" },
  { id: "opportunity-radar", icon: Radio, label: "Opportunity Radar", shortLabel: "RDR" },
  { id: "seasonal-intel", icon: Calendar, label: "Seasonal Intel", shortLabel: "SEA" },
  { id: "competitor-intel", icon: Compass, label: "Competitor Intel", shortLabel: "CMP" },
  { id: "agent-boardroom", icon: Users, label: "Agent Boardroom", shortLabel: "BRD" },
  { id: "voice-console", icon: Mic, label: "Voice Console", shortLabel: "VOX" },
  { id: "analytics", icon: BarChart2, label: "Orbit Analytics", shortLabel: "ANL" },
  { id: "system-config", icon: Settings, label: "System Config", shortLabel: "SYS" },
];

export const AppShell: React.FC<ShellProps> = ({ activePage, onNavigate, children, missionGoal, onLogout }) => {
  const { theme, setTheme, agentLogs, mission, networkHealth, config, businessType } = useOrbit();
  const isLight = theme === "executive";
  const latestLog = agentLogs[0];

  // ORBIT COPILOT State variables
  const [isOpenCopilot, setIsOpenCopilot] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotListening, setIsCopilotListening] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState<{ sender: "user" | "copilot"; text: string; timestamp: string; action?: { label: string; page: Page } }[]>([
    {
      sender: "copilot",
      text: "Hello! I am your ORBIT Copilot co-founder. I have access to your Brand DNA, Customer Data, Campaigns, and Agent Insights. Ask me anything about your growth operations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const copilotEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpenCopilot) {
      copilotEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [copilotHistory, isCopilotThinking, isOpenCopilot]);

  const handleCopilotSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || copilotInput;
    if (!query.trim() || isCopilotThinking) return;

    setCopilotHistory(prev => [...prev, {
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setCopilotInput("");
    setIsCopilotThinking(true);

    const lowerQuery = query.toLowerCase();
    const steps = [
      "Consulting Polaris cohort graphs...",
      "Consulting Vega conversion equations...",
      "Auditing Luna recovery leak registries..."
    ];

    steps.forEach((stepText, idx) => {
      setTimeout(() => {
        setThinkingStep(stepText);
      }, idx * 500);
    });

    const minWait = new Promise(res => setTimeout(res, steps.length * 500 + 300));

    let replyText = "";
    let action: { label: string; page: Page } | undefined;
    let geminiSuccess = false;

    // Try to run Copilot response on the Express backend
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query })
      });
      if (response.ok) {
        const parsed = await response.json();
        if (parsed && parsed.replyText) {
          replyText = parsed.replyText;
          if (parsed.action && parsed.action.label && parsed.action.page) {
            action = parsed.action;
          }
          geminiSuccess = true;
        }
      } else {
        throw new Error(`HTTP Error ${response.status}`);
      }
    } catch (err: any) {
      console.warn("Backend copilot failed. Falling back to client-side logic:", err);
      
      if (config.geminiKey) {
        try {
          const systemPrompt = `You are Orbit Copilot, a co-founder AI assistant for ORBIT. You have access to the user's business metadata (category: "${businessType}").
Respond to the user's query about their business or campaigns in a concise, professional, growth-focused tone, speaking as their AI co-founder partner.
Suggest a next action step if appropriate, which we can map to a dashboard page in ORBIT.
Format your response as a valid JSON object matching this schema:
{
  "replyText": "your response speech here...",
  "action": {
    "label": "Next Action Button Label",
    "page": "command-center" | "mission-control" | "customer-galaxy" | "growth-engine" | "future-simulator" | "opportunity-radar" | "seasonal-intel" | "competitor-intel" | "agent-boardroom" | "analytics" | "system-config"
  }
}
Note: the "action" field is optional. Only include it if there is a highly relevant dashboard page to navigate to.
Return ONLY the raw JSON object. Do not include markdown tags or extra explanations.`;

          const userPrompt = `User Query: "${query}"`;
          const resText = await callGeminiAPI(userPrompt, systemPrompt, config.geminiKey);
          const parsed = parseGeminiJson<{ replyText: string; action?: { label: string; page: Page } } | null>(resText, null);
          if (parsed && parsed.replyText) {
            replyText = parsed.replyText;
            if (parsed.action && parsed.action.label && parsed.action.page) {
              action = parsed.action;
            }
            geminiSuccess = true;
          }
        } catch (clientErr) {
          console.warn("Gemini API error in client-side Orbit Copilot fallback:", clientErr);
        }
      }
    }

    if (!geminiSuccess) {
      // Fallback mock logic
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
      } else {
        replyText = "Copilot: Calibrated boardroom registers. I suggest reviewing our upcoming Diwali campaign window (14 days away) which projects ₹45,000 in expected revenue.";
        action = { label: "Open Seasonal Calendar", page: "seasonal-intel" };
      }
    }

    // Ensure we wait for the thinking steps animation to finish
    await minWait;

    setCopilotHistory(prev => [...prev, {
      sender: "copilot",
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action
    }]);
    setIsCopilotThinking(false);
  };

  const handleCopilotVoice = () => {
    setIsCopilotListening(true);
    setTimeout(() => {
      setIsCopilotListening(false);
      handleCopilotSubmit(undefined, "Show my biggest opportunity.");
    }, 2000);
  };

  return (
    <div className={`h-screen flex flex-col ${isLight ? "bg-gray-50 text-gray-900" : "bg-orbit-bg text-white"}`}>
      {/* Top Header Bar */}
      <header className={`h-12 flex items-center justify-between px-4 border-b shrink-0 z-30 ${
        isLight ? "bg-white border-gray-200 shadow-sm" : "bg-[#050816]/90 border-[rgba(255,255,255,0.1)] backdrop-blur-sm"
      }`} style={{ boxShadow: isLight ? undefined : "0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orbit-blue to-orbit-purple flex items-center justify-center shadow-orbit-glow animate-glow-pulse">
            <span className="font-space font-bold text-white text-xs">O</span>
          </div>
          <span className={`font-space font-bold text-sm tracking-widest uppercase ${isLight ? "text-gray-900" : "text-white"}`}>
            Orbit
          </span>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border hidden sm:inline ${
            isLight ? "border-gray-200 text-gray-400" : "border-orbit-blue/30 text-orbit-blue/70 bg-orbit-blue/5"
          }`}>v4.81</span>
        </div>

        {/* Center: Mission Status */}
        <div className="hidden md:flex items-center gap-3 font-mono text-[10px]">
          {mission.isActive ? (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              isLight ? "border-orbit-blue/30 bg-orbit-blue/5 text-orbit-blue" : "border-orbit-blue/30 bg-orbit-blue/10 text-orbit-blue"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-orbit-blue animate-ping" />
              Mission Active: {mission.goal.slice(0, 40)}{mission.goal.length > 40 ? "..." : ""}
            </div>
          ) : missionGoal ? (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              isLight ? "border-gray-200 text-gray-400" : "border-gray-800 text-gray-500"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-orbit-success" />
              {missionGoal.slice(0, 40)}{missionGoal.length > 40 ? "..." : ""}
            </div>
          ) : null}
        </div>

        {/* Right: System status + theme toggle */}
        <div className="flex items-center gap-3">
          <div className={`hidden sm:flex items-center gap-1.5 font-mono text-[9px] ${
            isLight ? "text-gray-400" : "text-gray-500"
          }`}>
            <Radio size={10} className="text-orbit-success" />
            <span>NET {networkHealth}%</span>
          </div>
          
          <button
            onClick={() => setTheme(isLight ? "command-center" : "executive")}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight 
                ? "border-gray-200 hover:bg-gray-100 text-gray-500" 
                : "border-gray-800 hover:bg-gray-800 text-gray-400"
            }`}
            title={isLight ? "Switch to Command Center Mode" : "Switch to Executive View"}
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight 
                  ? "border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-red-500" 
                  : "border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-red-400"
              }`}
              title="Sign Out Operator Node"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-14 lg:w-48 shrink-0 flex flex-col border-r pt-4 pb-4 overflow-y-auto z-20 ${
          isLight ? "bg-white border-gray-200" : "bg-[#050816]/80 border-[rgba(255,255,255,0.07)] backdrop-blur-sm"
        }`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group relative flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isActive
                    ? isLight
                      ? "bg-orbit-blue/10 text-orbit-blue border border-orbit-blue/25"
                      : "bg-orbit-blue/20 text-orbit-blue border border-orbit-blue/30"
                    : isLight
                      ? "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                      : "text-gray-500 hover:bg-[#1E293B]/60 hover:text-gray-200 border border-transparent"
                }`}
                style={isActive && !isLight ? { boxShadow: "0 0 20px rgba(59,130,246,0.2), inset 0 0 15px rgba(59,130,246,0.05)" } : undefined}
              >
                {/* Active indicator bar */}
                {isActive && !isLight && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-orbit-blue" style={{ boxShadow: "0 0 8px rgba(59,130,246,1)" }} />
                )}
                <Icon size={16} className="shrink-0" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider hidden lg:block">{item.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto hidden lg:block opacity-70" />}
              </button>
            );
          })}

          {/* Bottom: latest agent log */}
          {latestLog && (
            <div
              className={`mt-auto mx-2 p-3 rounded-lg border text-[9px] font-mono leading-relaxed hidden lg:block ${
                isLight ? "border-gray-200 bg-gray-50 text-gray-400" : "border-[rgba(255,255,255,0.08)] text-gray-400"
              }`}
              style={!isLight ? {
                backgroundColor: latestLog.agent === "Polaris" ? "rgba(59,130,246,0.08)" :
                                  latestLog.agent === "Luna"    ? "rgba(245,158,11,0.08)" :
                                  latestLog.agent === "Vega"    ? "rgba(139,92,246,0.08)" :
                                  latestLog.agent === "Nova"    ? "rgba(236,72,153,0.08)" :
                                  latestLog.agent === "Atlas"   ? "rgba(34,197,94,0.08)" : "rgba(15,23,42,0.6)",
                borderColor: latestLog.agent === "Polaris" ? "rgba(59,130,246,0.25)" :
                             latestLog.agent === "Luna"    ? "rgba(245,158,11,0.25)" :
                             latestLog.agent === "Vega"    ? "rgba(139,92,246,0.25)" :
                             latestLog.agent === "Nova"    ? "rgba(236,72,153,0.25)" :
                             latestLog.agent === "Atlas"   ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"
              } : undefined}
            >
              <span className={`font-bold uppercase block mb-0.5 ${
                latestLog.agent === "Polaris" ? "text-orbit-blue" :
                latestLog.agent === "Vega" ? "text-orbit-purple" :
                latestLog.agent === "Nova" ? "text-pink-400" :
                latestLog.agent === "Atlas" ? "text-orbit-success" :
                latestLog.agent === "Luna" ? "text-amber-500" : "text-gray-400"
              }`}>{latestLog.agent}</span>
              <p className="line-clamp-3">{latestLog.message}</p>
            </div>
          )}
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0 relative">
          {children}

          {/* ════════════════════════════════════════
              ORBIT COPILOT FLOATING BUTTON
          ════════════════════════════════════════ */}
          <button
            onClick={() => setIsOpenCopilot(!isOpenCopilot)}
            className={`fixed bottom-5 right-5 w-13 h-13 rounded-full z-45 flex items-center justify-center border transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ${
              isOpenCopilot 
                ? "bg-red-500 border-red-400 text-white" 
                : "bg-gradient-to-tr from-orbit-blue to-orbit-purple border-orbit-purple/60 text-white"
            }`}
            style={!isOpenCopilot ? { boxShadow: "0 0 25px rgba(139,92,246,0.6), 0 0 60px rgba(59,130,246,0.25), 0 4px 15px rgba(0,0,0,0.5)" } : undefined}
            title="Toggle ORBIT Copilot Assistant"
          >
            {isOpenCopilot ? <X size={20} /> : <MessageSquare size={20} className="animate-pulse" />}
          </button>

          {/* ════════════════════════════════════════
              ORBIT COPILOT SIDE DRAWER
          ════════════════════════════════════════ */}
          {isOpenCopilot && (
            <div 
              className={`absolute top-0 right-0 h-full w-80 md:w-96 border-l z-40 flex flex-col shadow-2xl transition-all duration-300 ${
                isLight 
                  ? "bg-white border-gray-200" 
                  : "bg-gray-950/95 border-gray-800/80 backdrop-blur-md"
              }`}
              style={{ animation: "fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-900/60 flex justify-between items-center bg-gray-950/20">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-orbit-purple animate-pulse" />
                  <div>
                    <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider leading-none">Orbit Copilot</h3>
                    <span className="font-mono text-[7px] text-gray-550 uppercase tracking-widest mt-0.5 block">AI Co-founder Assistant</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[8px] text-orbit-success border border-orbit-success/30 bg-orbit-success/5 px-2 py-0.5 rounded-full uppercase">91% Conf</span>
                  <button 
                    onClick={() => setIsOpenCopilot(false)}
                    className="text-gray-550 hover:text-gray-300 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Drawer Chat logs scroll */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {copilotHistory.map((msg, index) => {
                  const isCopilot = msg.sender === "copilot";
                  return (
                    <div key={index} className={`flex gap-2.5 items-start ${isCopilot ? "" : "justify-end"}`}>
                      {isCopilot && (
                        <div className="w-6 h-6 rounded-full bg-orbit-purple/15 border border-orbit-purple/40 text-orbit-purple font-space font-bold text-[10px] flex items-center justify-center shrink-0">
                          C
                        </div>
                      )}
                      <div className={`space-y-1.5 max-w-[80%] ${isCopilot ? "" : "text-right"}`}>
                        <div className={`p-3 rounded-xl border text-gray-300 font-mono text-[9.5px] leading-relaxed ${
                          isCopilot ? "bg-gray-900/30 border-gray-900 text-left" : "bg-orbit-blue/10 border-orbit-blue/30 text-left"
                        }`}>
                          <p>{msg.text}</p>
                          
                          {/* Copilot Action buttons */}
                          {msg.action && (
                            <button
                              onClick={() => {
                                onNavigate(msg.action!.page);
                                setIsOpenCopilot(false);
                              }}
                              className="mt-3 w-full py-1.5 bg-orbit-purple hover:bg-purple-600 text-white font-bold rounded-lg text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>{msg.action.label}</span>
                              <ArrowRight size={9} />
                            </button>
                          )}
                        </div>
                        <span className="text-[7.5px] text-gray-655 block px-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                })}

                {/* AI Thinking animation */}
                {isCopilotThinking && (
                  <div className="flex gap-2.5 items-start">
                    <div className="w-6 h-6 rounded-full bg-orbit-purple/15 border border-orbit-purple/40 text-orbit-purple font-space font-bold text-[10px] flex items-center justify-center shrink-0">
                      C
                    </div>
                    <div className="space-y-1.5">
                      <div className="p-3 bg-gray-900/30 border border-gray-900 rounded-xl flex flex-col gap-2 min-w-[120px]">
                        <span className="font-mono text-[8px] text-gray-555 uppercase animate-pulse">{thinkingStep}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                          <div className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                          <div className="w-1.5 h-1.5 rounded-full bg-orbit-purple typing-dot" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={copilotEndRef} />
              </div>

              {/* Quick suggestions panel */}
              <div className="p-3 bg-gray-950/20 border-t border-gray-900/60 flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto scrollbar-thin">
                {[
                  "How can I increase sales?",
                  "Why did this campaign fail?",
                  "Show my biggest opportunity.",
                  "Create a WhatsApp campaign.",
                  "Predict next month's revenue."
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopilotSubmit(undefined, q)}
                    className="px-2 py-1 rounded bg-gray-950 border border-gray-900 text-gray-400 font-mono text-[8px] cursor-pointer hover:border-gray-800 hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Drawer voice wave indicators */}
              {isCopilotListening && (
                <div className="px-4 py-2 bg-blue-500/10 border-t border-gray-900/60 flex items-center gap-3 animate-pulse">
                  <div className="flex items-center gap-1.5 h-5">
                    {[...Array(6)].map((_, idx) => (
                      <span
                        key={idx}
                        className="w-0.5 rounded-full bg-blue-500 bar-anim"
                        style={{
                          height: 6,
                          animationDelay: `${idx * 0.12}s`,
                          animationDuration: `${0.4 + Math.random() * 0.6}s`
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[8px] text-blue-400 uppercase animate-pulse">Listening...</span>
                </div>
              )}

              {/* Drawer Chat Input */}
              <form onSubmit={handleCopilotSubmit} className="p-3 border-t border-gray-900/60 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopilotVoice}
                  className={`p-2 border rounded-xl transition-all cursor-pointer ${
                    isCopilotListening 
                      ? "border-red-500 bg-red-500/10 text-red-400" 
                      : "border-gray-800 text-gray-550 hover:border-gray-700"
                  }`}
                >
                  {isCopilotListening ? <MicOff size={13} /> : <Mic size={13} />}
                </button>
                
                <input
                  type="text"
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  placeholder="Ask Copilot assistant..."
                  className="flex-1 bg-gray-950 border border-gray-900 rounded-xl px-3 py-2 text-[10px] font-mono text-white focus:outline-none focus:border-orbit-purple/40 placeholder-gray-650"
                />
                
                <button
                  type="submit"
                  disabled={!copilotInput.trim() || isCopilotThinking}
                  className="px-3 bg-orbit-purple hover:bg-purple-650 text-white rounded-xl flex items-center justify-center transition-colors disabled:bg-gray-900 disabled:text-gray-655 cursor-pointer"
                >
                  <Send size={12} />
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
