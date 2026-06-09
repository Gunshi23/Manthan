import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, Play, VolumeX, Radio } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { AgentCardModal } from "../components/AgentCardModal";

interface VoiceLog {
  type: "user" | "orbit";
  text: string;
  agent?: string;
  timestamp: string;
}

const VOICE_COMMANDS = [
  "Launch campaign",
  "Reduce churn",
  "Show analytics",
  "Which segment has highest churn risk?",
  "Show me revenue forecast for this week",
  "Recover lost revenue",
];

const ORBIT_RESPONSES: Record<string, { agent: string; text: string }> = {
  "Launch campaign": { agent: "Atlas", text: "Directive accepted. Dispatching campaign via recommended WhatsApp channel. Mapped 24 targets, sending creatives now." },
  "Reduce churn": { agent: "Polaris", text: "Mitigation directive armed. Identified 18 VIP accounts under slipping status. Nova is personalizing win-back copy." },
  "Show analytics": { agent: "Vega", text: "Opening growth ledger. Total revenue achieved ₹1.4L with 87% open rates. Conversion curves nominal." },
  "Which segment has highest churn risk?": { agent: "Polaris", text: "Slipping Away sector exhibits 78% average churn risk. 18 premium accounts flag critical status." },
  "Show me revenue forecast for this week": { agent: "Vega", text: "Expected weekly yield is ₹1.4L. Confidence interval: 87%. Next engagement spike predicted Tuesday morning." },
  "Recover lost revenue": { agent: "Luna", text: "Leakage recovery protocol engaged. Identified 17 abandoned Instagram enquiries (₹12,000 potential) and 12 inactive VIP customers (₹8,500 potential). Suggesting immediate campaign launch." },
};

export const VoiceConsole: React.FC = () => {
  const { config, addAgentLog } = useOrbit();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([
    { type: "orbit", text: "Voice console online. Instruct ORBIT using verbal directives.", agent: "System", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | undefined>(undefined);
  const recognitionRef = useRef<any>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [voiceLogs]);

  // Morphing circular fluid visualizer (OpenAI Advanced Voice Mode style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      // Twinkle background circles
      const baseR = 60 + (isListening ? Math.abs(Math.sin(tick * 0.04)) * 14 : 0);

      // Deep space radial glow behind the sphere
      const blurGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseR * 2);
      blurGrad.addColorStop(0, isListening ? "rgba(59, 130, 246, 0.15)" : "rgba(139, 92, 246, 0.08)");
      blurGrad.addColorStop(1, "transparent");
      ctx.fillStyle = blurGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Render 4 layers of fluid glowing sine wave lines
      for (let layer = 0; layer < 4; layer++) {
        ctx.strokeStyle = layer === 0 ? "rgba(59, 130, 246, 0.85)" :
                          layer === 1 ? "rgba(139, 92, 246, 0.65)" :
                          layer === 2 ? "rgba(236, 72, 153, 0.55)" : "rgba(34, 197, 94, 0.45)";
        ctx.lineWidth = 2.0;
        ctx.beginPath();

        const points = 100;
        const phaseOffset = layer * Math.PI * 0.5 + tick * 0.025;

        for (let j = 0; j <= points; j++) {
          const angle = (j / points) * Math.PI * 2;
          const waveLevel = isListening ? 15 : 3;
          const r = baseR + Math.sin(angle * 6 + phaseOffset) * Math.sin(tick * 0.04 + layer) * waveLevel;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      tick++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isListening]);

  const handleVoiceCommand = (cmd: string) => {
    const trimmed = cmd.trim().replace(/\.$/, "");
    // Fuzzy matching against presets
    let matchedKey = Object.keys(ORBIT_RESPONSES).find(k => 
      trimmed.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(trimmed.toLowerCase())
    );

    const userLog: VoiceLog = { type: "user", text: cmd, timestamp: new Date().toLocaleTimeString() };
    setVoiceLogs(prev => [...prev, userLog]);
    setTranscript(cmd);

    const response = matchedKey ? ORBIT_RESPONSES[matchedKey] : {
      agent: "System",
      text: `Directive received: "${cmd}". Parsing NLP semantics. Routing to executive agent board.`
    };

    setTimeout(() => {
      const orbitLog: VoiceLog = { type: "orbit", text: response.text, agent: response.agent, timestamp: new Date().toLocaleTimeString() };
      setVoiceLogs(prev => [...prev, orbitLog]);
      addAgentLog(response.agent as any, response.text, "chat");

      if (config.voiceSynthesis && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        // set synthesis parameters based on speaking agent
        if (response.agent === "Polaris") utterance.pitch = 1.15;
        if (response.agent === "Vega") utterance.pitch = 0.9;
        if (response.agent === "Nova") utterance.pitch = 1.25;
        if (response.agent === "Luna") { utterance.pitch = 1.1; utterance.rate = 1.15; }
        window.speechSynthesis.speak(utterance);
      }
    }, 900);
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        const heard = e.results[0][0].transcript;
        setTranscript(heard);
        handleVoiceCommand(heard);
        setIsListening(false);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } else {
      // Offline fallback simulation
      setIsListening(true);
      const simulatedCmd = VOICE_COMMANDS[Math.floor(Math.random() * VOICE_COMMANDS.length)];
      setTimeout(() => {
        setIsListening(false);
        handleVoiceCommand(simulatedCmd);
      }, 2400);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* Main Workspace (Left/Center) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 border-r border-gray-800/60">
        
        {/* Title Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-800/60 flex items-center justify-between bg-gray-950/20">
          <div>
            <h1 className="font-space text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Mic size={18} className="text-blue-400" />
              Voice Console
            </h1>
            <p className="font-mono text-[9px] text-gray-550 mt-0.5 uppercase tracking-widest">
              Natural Language Voice Command Deck
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-[9px]">
            {config.voiceSynthesis ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orbit-blue/10 border border-orbit-blue/30 text-orbit-blue">
                <Volume2 size={11} /> SYNTHESIS ACTIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 border border-gray-800 text-gray-500">
                <VolumeX size={11} /> SYNTHESIS OFF
              </span>
            )}
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold ${
              isListening ? "border-red-500/30 bg-red-500/10 text-red-400 animate-pulse" : "border-gray-800 bg-gray-900/40 text-gray-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-gray-650"}`} />
              {isListening ? "LISTENING" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Interactive Voice Mode Sphere Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="relative w-80 h-80 flex items-center justify-center">
            
            {/* Morphing Sine Wave Visualizer */}
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="absolute pointer-events-none"
            />

            {/* Glowing Microphone Button */}
            <button
              onClick={toggleListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center border transition-all duration-300 relative z-10 cursor-pointer shadow-2xl ${
                isListening
                  ? "border-red-500 bg-red-500/15 shadow-red-500/20 scale-105"
                  : "border-blue-500/35 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              }`}
            >
              {isListening ? (
                <MicOff size={32} className="text-red-400 animate-pulse" />
              ) : (
                <Mic size={32} className="text-blue-400" />
              )}
            </button>
          </div>

          <div className="text-center space-y-1.5 max-w-sm">
            <h3 className="font-space text-sm font-bold text-white uppercase tracking-wider">
              {isListening ? "Orbit Voice Synthesizer listening..." : "Tap to Speak"}
            </h3>
            <p className="font-mono text-[9px] text-gray-500 leading-relaxed uppercase">
              Verbal directives map directly to autonomous marketing routines
            </p>
          </div>

          {/* Transcript HUD panel */}
          {transcript && (
            <div className="w-full max-w-md bg-gray-950/70 border border-gray-900 rounded-xl p-4 text-center font-mono animate-fade-in-up">
              <span className="text-[8px] text-gray-550 uppercase tracking-widest block mb-1">TRANSCRIPTION DATA STREAM</span>
              <p className="text-xs text-white leading-relaxed font-semibold">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* Presets grid footer */}
        <div className="shrink-0 p-5 border-t border-gray-800/60 bg-gray-950/20 space-y-3">
          <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest block">Verbal Command Presets</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {VOICE_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                onClick={() => handleVoiceCommand(cmd)}
                disabled={isListening}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-850 bg-gray-900/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group cursor-pointer duration-200"
              >
                <Play size={10} className="text-gray-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                <span className="font-mono text-[10px] text-gray-300 group-hover:text-white leading-snug truncate">{cmd}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* History Log (Right Panel) */}
      <aside className="w-72 shrink-0 flex flex-col bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-hidden relative z-10">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-orbit-purple" />
            <span className="font-space text-xs font-bold text-white uppercase tracking-wider">Voice Session Logs</span>
          </div>
          <span className="font-mono text-[8px] text-gray-550">{voiceLogs.length} EVENTS</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
          {voiceLogs.map((log, i) => (
            <div 
              key={i} 
              className={`flex flex-col max-w-[85%] ${log.type === "user" ? "self-end items-end ml-auto" : "self-start items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[8px] font-mono text-gray-550">
                <span 
                  onClick={() => log.agent && log.agent !== "System" && setSelectedAgent(log.agent as any)}
                  className={log.type !== "user" && log.agent !== "System" ? "cursor-pointer hover:text-white" : ""}
                >
                  {log.type === "user" ? "OPERATOR" : log.agent?.toUpperCase()}
                </span>
                <span>·</span>
                <span>{log.timestamp}</span>
              </div>
              <div 
                className={`p-3 rounded-xl border leading-relaxed text-[11px] ${
                  log.type === "user"
                    ? "border-blue-500/30 bg-blue-500/5 text-blue-300 font-semibold"
                    : "border-gray-850 bg-gray-900/40 text-gray-350"
                }`}
              >
                {log.text}
              </div>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Live status telemetry widget */}
        <div className="border-t border-gray-800/60 pt-3.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Radio size={11} className="text-orbit-success animate-pulse" />
            <span className="font-mono text-[8px] text-gray-450 uppercase tracking-widest">Channel Signal Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[8px]">
            <div className="p-2 bg-gray-900/20 rounded border border-gray-900 flex justify-between">
              <span className="text-gray-500">NLP PARSER:</span>
              <span className="text-orbit-success font-bold">ONLINE</span>
            </div>
            <div className="p-2 bg-gray-900/20 rounded border border-gray-900 flex justify-between">
              <span className="text-gray-500">TTS SYNCS:</span>
              <span className="text-orbit-success font-bold">READY</span>
            </div>
          </div>
        </div>
      </aside>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default VoiceConsole;
