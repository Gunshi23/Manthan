import React, { useState, useEffect } from "react";
import { Check, Cpu } from "lucide-react";

interface OrbitInitializationProps {
  onComplete: () => void;
}

export const OrbitInitialization: React.FC<OrbitInitializationProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [completedLines, setCompletedLines] = useState<Set<number>>(new Set());

  const steps = [
    { text: "Initializing orbit.ai Core...", type: "header", delay: 100 },
    { text: "Neural Intelligence Online", type: "check", delay: 500 },
    { text: "Audience Intelligence Online", type: "check", delay: 900 },
    { text: "Campaign Engine Online", type: "check", delay: 1300 },
    { text: "Analytics Engine Online", type: "check", delay: 1700 },
    { text: "Communication Layer Connected", type: "check", delay: 2100 },
    { text: "Activating Agents...", type: "header", delay: 2600 },
    { text: "Polaris Online (Audience Discovery)", type: "check", delay: 3000 },
    { text: "Nova Online (Campaign Creator)", type: "check", delay: 3400 },
    { text: "Vega Online (Predictive Analytics)", type: "check", delay: 3800 },
    { text: "Atlas Online (Campaign Operations)", type: "check", delay: 4200 },
    { text: "System Stable.", type: "header", delay: 4800 },
    { text: "Entering Command Center...", type: "header", delay: 5300 }
  ];

  useEffect(() => {
    // Percentage ticker
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 55);

    // Logging trigger
    const timeouts: number[] = [];
    steps.forEach((step, idx) => {
      const t = window.setTimeout(() => {
        setLogs(prev => [...prev, step.text]);
        if (step.type === "check") {
          setCompletedLines(prev => {
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
        }
      }, step.delay);
      timeouts.push(t);
    });

    const completionTimer = window.setTimeout(() => {
      onComplete();
    }, 6200);

    return () => {
      clearInterval(interval);
      timeouts.forEach(t => clearTimeout(t));
      clearTimeout(completionTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-orbit-bg space-grid flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      <div className="scanlines" />

      {/* Futuristic orbit.ai Core animation ring */}
      <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full border border-orbit-blue/30 animate-orbit-pulse" />
        {/* Spinning Outer Ring */}
        <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-b-2 border-transparent border-t-orbit-purple border-r-orbit-blue border-b-pink-500 animate-orbit-spin-slow" />
        {/* Reversing Inner Ring */}
        <div className="absolute inset-6 rounded-full border-2 border-dashed border-orbit-blue/20 animate-orbit-spin-reverse" />
        
        {/* Core processor dot */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orbit-blue to-orbit-purple flex items-center justify-center shadow-orbit-glow">
          <Cpu className="text-white animate-pulse" size={20} />
        </div>
      </div>

      {/* Boot Logs Panel */}
      <div className="w-full max-w-xl bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-6 sm:p-8 shadow-orbit-glow-inset flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4 font-mono text-xs text-gray-500">
          <span>SEQUENCE INITIALIZER</span>
          <span>BOOT {percent}%</span>
        </div>

        {/* Text output stack */}
        <div className="font-mono text-xs space-y-2.5 h-72 overflow-y-auto pr-2">
          {steps.map((step, idx) => {
            const isLogged = logs.includes(step.text);
            if (!isLogged) return null;

            if (step.type === "header") {
              return (
                <div key={idx} className="text-gray-400 font-bold uppercase tracking-wide pt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orbit-purple animate-ping" />
                  {step.text}
                </div>
              );
            }

            return (
              <div key={idx} className="flex items-center gap-3 pl-4 text-white">
                <span className={`w-4 h-4 rounded flex items-center justify-center border text-[9px] ${
                  completedLines.has(idx) 
                    ? "bg-orbit-success/10 border-orbit-success/40 text-orbit-success" 
                    : "bg-gray-800 border-gray-700 text-transparent"
                }`}>
                  <Check size={10} strokeWidth={3} className={completedLines.has(idx) ? "scale-100" : "scale-0"} />
                </span>
                <span className={completedLines.has(idx) ? "text-gray-200" : "text-gray-500"}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full bg-gray-950 rounded-full h-1.5 mt-6 border border-gray-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orbit-blue to-orbit-purple transition-all duration-100 ease-out" 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
