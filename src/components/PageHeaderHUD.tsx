import React, { useState, useEffect, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import { X, Mic, PhoneOff, Radio } from "lucide-react";
import { VOICE_AGENT_SETTINGS } from "../config/voiceAgentSettings";

interface PageHeaderHUDProps {
  title: string;
  subtitle: string;
  statusLabel?: string;
  actions?: React.ReactNode;
  onSelectAgent?: (agent: "Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya") => void;
}

export const PageHeaderHUD: React.FC<PageHeaderHUDProps> = ({
  title,
  subtitle,
  statusLabel = "All Systems Nominal",
  actions,
  onSelectAgent
}) => {
  const { theme, config, updateConfig } = useOrbit();
  const isLight = theme === "executive";

  /* Live clock state */
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

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState(config.geminiKey);
  const [deepgramKeyInput, setDeepgramKeyInput] = useState(config.deepgramKey);
  const [isVoiceAgentOpen, setIsVoiceAgentOpen] = useState(false);

  /* Deepgram Voice Call states */
  const [callStatus, setCallStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [speechLog, setSpeechLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [speechLog]);

  const endCall = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }
    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setCallStatus(prev => (prev === "error" ? "error" : "idle"));
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  const startCall = async () => {
    if (!config.deepgramKey) return;
    setCallStatus("connecting");
    setSpeechLog([]);
    setErrorMsg("");

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
      audioContextRef.current = ctx;
      nextStartTimeRef.current = ctx.currentTime;

      const ws = new WebSocket(`wss://agent.deepgram.com/agent?key=${config.deepgramKey}`);
      socketRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = async () => {
        // Send settings payload immediately
        ws.send(JSON.stringify(VOICE_AGENT_SETTINGS));
        setCallStatus("connected");

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const source = ctx.createMediaStreamSource(stream);
          audioSourceRef.current = source;

          const processor = ctx.createScriptProcessor(2048, 1, 1);
          audioProcessorRef.current = processor;

          source.connect(processor);
          processor.connect(ctx.destination);

          processor.onaudioprocess = (e) => {
            if (isMuted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const buffer = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(buffer.buffer);
            }
          };
        } catch (micErr: any) {
          console.error("Microphone capture failed:", micErr);
          setErrorMsg("Microphone permission denied.");
          setCallStatus("error");
          endCall();
        }
      };

      ws.onmessage = (msg) => {
        if (typeof msg.data === "string") {
          try {
            const data = JSON.parse(msg.data);
            if (data.type === "ConversationText") {
              setSpeechLog(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === data.role) {
                  return [...prev.slice(0, -1), { role: data.role, text: data.text }];
                }
                return [...prev, { role: data.role, text: data.text }];
              });
            }
          } catch (e) {
            // non-json text
          }
        } else if (msg.data instanceof ArrayBuffer) {
          const arrayBuffer = msg.data;
          const int16 = new Int16Array(arrayBuffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
          }
          if (ctx.state === "suspended") {
            ctx.resume();
          }
          const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
          audioBuffer.getChannelData(0).set(float32);

          const sourceNode = ctx.createBufferSource();
          sourceNode.buffer = audioBuffer;
          sourceNode.connect(ctx.destination);

          const currentTime = ctx.currentTime;
          let playTime = nextStartTimeRef.current;
          if (playTime < currentTime) {
            playTime = currentTime + 0.05;
          }
          sourceNode.start(playTime);
          nextStartTimeRef.current = playTime + audioBuffer.duration;
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setErrorMsg("Voice connection error occurred.");
        setCallStatus("error");
      };

      ws.onclose = () => {
        setCallStatus("idle");
      };

    } catch (err: any) {
      console.error("Call startup failed:", err);
      setErrorMsg("Voice Uplink failed to initialize.");
      setCallStatus("error");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 shrink-0 relative z-20"
         style={{ borderColor: isLight ? "#e5e7eb" : "#1f2937" }}>
      <div>
        <div className="flex items-center gap-3.5 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-Manthan-success animate-pulse" />
            <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
              isLight ? "text-emerald-600 font-bold" : "text-Manthan-success"
            }`}>
              {statusLabel}
            </span>
          </div>
          <span className="text-gray-800 text-[9px] font-mono">|</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { 
                setKeyInput(config.geminiKey); 
                setDeepgramKeyInput(config.deepgramKey); 
                setIsKeyModalOpen(true); 
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[8.5px] cursor-pointer hover:border-gray-700 transition-colors ${
                isLight ? "border-gray-200 bg-gray-100/50" : "border-gray-800 bg-gray-950/40"
              }`}
              title="Configure API Keys"
            >
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.geminiKey ? "bg-Manthan-success" : "bg-red-500"}`} />
              <span className={isLight ? "text-gray-500" : "text-gray-400"}>COGNITIVE NODE:</span>
              <span className={config.geminiKey ? "text-Manthan-success font-bold" : "text-red-400 font-bold"}>
                {config.geminiKey ? "ONLINE" : "OFFLINE"}
              </span>
            </button>

            <button 
              onClick={() => {
                if (config.deepgramKey) {
                  setIsVoiceAgentOpen(true);
                } else {
                  setKeyInput(config.geminiKey);
                  setDeepgramKeyInput(config.deepgramKey);
                  setIsKeyModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-mono text-[8.5px] cursor-pointer hover:border-gray-700 transition-colors ${
                isLight ? "border-gray-200 bg-gray-100/50" : "border-gray-800 bg-gray-950/40"
              }`}
              title={config.deepgramKey ? "Open Neural Voice Uplink" : "Configure Deepgram Key to Enable Voice"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.deepgramKey ? "bg-Manthan-success animate-pulse" : "bg-red-500"}`} />
              <span className={isLight ? "text-gray-500" : "text-gray-400"}>VOICE NODE:</span>
              <span className={config.deepgramKey ? "text-Manthan-success font-bold" : "text-red-400 font-bold"}>
                {config.deepgramKey ? "UPLINK READY" : "OFFLINE"}
              </span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className={`font-space text-2xl lg:text-3xl font-bold tracking-tight ${
            isLight ? "text-gray-900" : "text-white"
          }`}>
            {title}
          </h1>
          {actions && <div className="flex items-center gap-2 max-w-full overflow-x-auto scrollbar-none">{actions}</div>}
        </div>
        <p className={`text-[10px] font-mono mt-1 tracking-widest uppercase ${
          isLight ? "text-gray-500" : "text-gray-400"
        }`}>
          {subtitle}
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
                className="w-1 bg-Manthan-blue rounded-t-sm transition-all duration-300"
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
          <div className={`font-mono text-lg font-bold tracking-widest tabular-nums ${isLight ? "text-gray-900" : "text-white"}`}>
            {now.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className={`font-mono text-[8.5px] uppercase tracking-wider ${isLight ? "text-gray-450" : "text-gray-500"}`}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        <div className="w-px h-8 hidden sm:block" style={{ backgroundColor: isLight ? "#e5e7eb" : "#1f2937" }} />

        <div className="flex flex-col gap-1">
          {["Drishti", "Khoj", "Rachna", "Saarthi", "Pragya"].map((a, i) => (
            <div 
              key={a} 
              onClick={() => onSelectAgent?.(a.charAt(0) + a.slice(1).toLowerCase() as any)}
              className={`flex items-center gap-1.5 ${onSelectAgent ? "cursor-pointer hover:opacity-85" : ""}`}
              title={onSelectAgent ? `View ${a} premium card` : undefined}
            >
              <span className="w-1 h-1 rounded-full bg-Manthan-success animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }} />
              <span className={`font-mono text-[8px] uppercase tracking-wider ${isLight ? "text-gray-500" : "text-gray-400"}`}>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-xl border p-5 space-y-4 shadow-2xl relative text-left ${
            isLight ? "bg-white border-gray-200 text-gray-900" : "bg-[#0c0f20] border-gray-800 text-white"
          }`}>
            <div className={`flex justify-between items-center border-b pb-2.5 ${isLight ? "border-gray-200" : "border-gray-800"}`}>
              <span className="font-space text-xs font-bold uppercase tracking-wider text-Manthan-blue flex items-center gap-1.5">
                Configure Credentials
              </span>
              <button onClick={() => setIsKeyModalOpen(false)} className={`cursor-pointer hover:text-white ${isLight ? "text-gray-400" : "text-gray-500"}`}>
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="space-y-1">
                <label className={`uppercase tracking-wider block ${isLight ? "text-gray-600" : "text-gray-400"}`}>Gemini API Key</label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 ${
                    isLight ? "bg-white border-gray-300 text-gray-900" : "bg-gray-950 border-gray-800 text-white"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className={`uppercase tracking-wider block ${isLight ? "text-gray-600" : "text-gray-400"}`}>Deepgram API Key</label>
                <input
                  type="password"
                  value={deepgramKeyInput}
                  onChange={e => setDeepgramKeyInput(e.target.value)}
                  placeholder="5b17..."
                  className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 ${
                    isLight ? "bg-white border-gray-300 text-gray-900" : "bg-gray-950 border-gray-800 text-white"
                  }`}
                />
              </div>
              <p className={`text-[7.5px] leading-relaxed uppercase ${isLight ? "text-gray-500" : "text-gray-550"}`}>
                * Input valid credentials to activate dynamic AI reasoning and browser-based real-time voice streaming operations.
              </p>
              <button
                onClick={() => {
                  updateConfig({ geminiKey: keyInput, deepgramKey: deepgramKeyInput });
                  setIsKeyModalOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-Manthan-blue hover:bg-blue-600 text-white font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer shadow-Manthan-glow"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Futuristic Voice Agent Drawer */}
      {isVoiceAgentOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md border-l flex flex-col h-full shadow-2xl relative animate-in slide-in-from-right duration-300 ${
            isLight ? "bg-white border-gray-200 text-gray-900" : "bg-[#0b0c16]/95 border-gray-800 text-white"
          }`}>
            {/* Drawer Header */}
            <div className={`flex justify-between items-center p-4 border-b ${isLight ? "border-gray-200" : "border-gray-800"}`}>
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${callStatus === "connected" ? "text-Manthan-success animate-pulse" : "text-gray-450"}`} />
                <span className="font-space text-xs font-bold uppercase tracking-widest text-Manthan-blue">
                  Neural Voice Uplink
                </span>
              </div>
              <button 
                onClick={() => {
                  endCall();
                  setIsVoiceAgentOpen(false);
                }} 
                className={`cursor-pointer hover:scale-105 p-1 rounded hover:bg-gray-500/10 ${isLight ? "text-gray-500" : "text-gray-400"}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Audio Wave Visualizer Area */}
            <div className={`h-40 flex flex-col items-center justify-center relative border-b ${
              isLight ? "bg-gray-50 border-gray-200" : "bg-gray-950/40 border-gray-800"
            }`}>
              {callStatus === "connected" ? (
                <div className="flex items-center gap-1.5 h-12">
                  {[...Array(15)].map((_, i) => {
                    const animationDelay = `${i * 0.1}s`;
                    return (
                      <div
                        key={i}
                        className="w-1 bg-Manthan-blue rounded-full animate-bounce"
                        style={{
                          height: "100%",
                          animationDuration: `${0.6 + Math.random() * 0.8}s`,
                          animationDelay
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border border-dashed border-gray-500/30 flex items-center justify-center text-gray-500">
                  <Mic size={20} className={callStatus === "connecting" ? "animate-pulse text-Manthan-blue" : ""} />
                </div>
              )}
              
              <div className="mt-3 font-mono text-[9px] uppercase tracking-wider text-gray-450">
                {callStatus === "idle" && "Link Status: Standby"}
                {callStatus === "connecting" && "Link Status: Establishing Handshake..."}
                {callStatus === "connected" && "Link Status: Uplink Active (48kHz)"}
                {callStatus === "error" && `Link Status: Error - ${errorMsg || "Handshake failed"}`}
              </div>
            </div>

            {/* Transcription Feed */}
            <div 
              ref={logContainerRef}
              className={`flex-1 overflow-y-auto p-4 space-y-4 font-mono text-[10px] ${
                isLight ? "bg-gray-50/50" : "bg-black/20"
              }`}
            >
              {speechLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-center uppercase tracking-wider p-6">
                  <span className="text-[9px] opacity-60">No speech records in buffer.</span>
                  {callStatus === "connected" && (
                    <span className="text-[8px] text-Manthan-blue mt-1">Start speaking to begin transcribing.</span>
                  )}
                </div>
              ) : (
                speechLog.map((log, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border leading-relaxed ${
                    log.role === "user" 
                      ? isLight 
                        ? "bg-gray-100 border-gray-200 text-gray-700" 
                        : "bg-gray-900/40 border-gray-800 text-gray-400"
                      : isLight 
                        ? "bg-blue-50 border-blue-100 text-blue-900 font-medium" 
                        : "bg-blue-950/20 border-blue-900/30 text-blue-200 font-medium"
                  }`}>
                    <div className="text-[7.5px] uppercase tracking-wider text-gray-500 mb-1">
                      {log.role === "user" ? "Operator Node" : "Manthan.ai Core Voice"}
                    </div>
                    <div>{log.text}</div>
                  </div>
                ))
              )}
            </div>

            {/* Call Action Bar */}
            <div className={`p-4 border-t space-y-3 ${isLight ? "border-gray-200" : "border-gray-800"}`}>
              {callStatus === "connected" && (
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={`w-full py-2 rounded-lg border font-bold uppercase text-[9px] tracking-widest transition-colors cursor-pointer ${
                    isMuted 
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                      : "bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20"
                  }`}
                >
                  {isMuted ? "Unmute Microphone" : "Mute Microphone"}
                </button>
              )}

              {callStatus === "idle" || callStatus === "error" ? (
                <button
                  onClick={startCall}
                  className="w-full py-2.5 rounded-lg bg-Manthan-success hover:opacity-90 text-black font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer shadow-Manthan-glow"
                >
                  Initiate Voice Uplink
                </button>
              ) : (
                <button
                  onClick={endCall}
                  className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PhoneOff size={12} />
                  Terminate Uplink
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
