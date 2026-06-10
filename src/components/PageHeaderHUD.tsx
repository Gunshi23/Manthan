import React, { useState, useEffect } from "react";
import { useOrbit } from "../context/OrbitContext";

interface PageHeaderHUDProps {
  title: string;
  subtitle: string;
  statusLabel?: string;
  actions?: React.ReactNode;
  onSelectAgent?: (agent: "Polaris" | "Vega" | "Nova" | "Atlas" | "Luna") => void;
}

export const PageHeaderHUD: React.FC<PageHeaderHUDProps> = ({
  title,
  subtitle,
  statusLabel = "All Systems Nominal",
  actions,
  onSelectAgent
}) => {
  const { theme } = useOrbit();
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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-6 shrink-0 relative z-20"
         style={{ borderColor: isLight ? "#e5e7eb" : "#1f2937" }}>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-orbit-success animate-pulse" />
          <span className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
            isLight ? "text-emerald-600 font-bold" : "text-orbit-success"
          }`}>
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className={`font-space text-2xl lg:text-3xl font-bold tracking-tight ${
            isLight ? "text-gray-900" : "text-white"
          }`}>
            {title}
          </h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        <p className={`text-[10px] font-mono mt-1 tracking-widest uppercase ${
          isLight ? "text-gray-500" : "text-gray-450"
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
          <div className={`font-mono text-lg font-bold tracking-widest tabular-nums ${isLight ? "text-gray-900" : "text-white"}`}>
            {now.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className={`font-mono text-[8.5px] uppercase tracking-wider ${isLight ? "text-gray-450" : "text-gray-500"}`}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        <div className="w-px h-8 hidden sm:block" style={{ backgroundColor: isLight ? "#e5e7eb" : "#1f2937" }} />

        <div className="flex flex-col gap-1">
          {["POLARIS", "VEGA", "NOVA", "ATLAS", "LUNA"].map((a, i) => (
            <div 
              key={a} 
              onClick={() => onSelectAgent?.(a.charAt(0) + a.slice(1).toLowerCase() as any)}
              className={`flex items-center gap-1.5 ${onSelectAgent ? "cursor-pointer hover:opacity-85" : ""}`}
              title={onSelectAgent ? `View ${a} premium card` : undefined}
            >
              <span className="w-1 h-1 rounded-full bg-orbit-success animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }} />
              <span className={`font-mono text-[8px] uppercase tracking-wider ${isLight ? "text-gray-550" : "text-gray-400"}`}>{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
