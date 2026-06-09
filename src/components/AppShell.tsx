import React from "react";
import { 
  Terminal, Activity, Star, Zap, Users, Mic, BarChart2, 
  Settings, Moon, Sun, Radio, ChevronRight
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

type Page = 
  | "command-center" 
  | "mission-control" 
  | "customer-galaxy" 
  | "growth-engine" 
  | "agent-boardroom" 
  | "voice-console" 
  | "analytics" 
  | "system-config";

interface ShellProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
  missionGoal?: string;
}

const navItems: { id: Page; icon: React.FC<any>; label: string; shortLabel: string }[] = [
  { id: "command-center", icon: Terminal, label: "Command Center", shortLabel: "CMD" },
  { id: "mission-control", icon: Activity, label: "Mission Control", shortLabel: "MCT" },
  { id: "customer-galaxy", icon: Star, label: "Customer Galaxy", shortLabel: "GLX" },
  { id: "growth-engine", icon: Zap, label: "Growth Engine", shortLabel: "GRW" },
  { id: "agent-boardroom", icon: Users, label: "Agent Boardroom", shortLabel: "BRD" },
  { id: "voice-console", icon: Mic, label: "Voice Console", shortLabel: "VOX" },
  { id: "analytics", icon: BarChart2, label: "Orbit Analytics", shortLabel: "ANL" },
  { id: "system-config", icon: Settings, label: "System Config", shortLabel: "SYS" },
];

export const AppShell: React.FC<ShellProps> = ({ activePage, onNavigate, children, missionGoal }) => {
  const { theme, setTheme, agentLogs, mission, networkHealth } = useOrbit();
  const isLight = theme === "executive";
  const latestLog = agentLogs[0];

  return (
    <div className={`h-screen flex flex-col ${isLight ? "bg-gray-50 text-gray-900" : "bg-orbit-bg text-white"}`}>
      {/* Top Header Bar */}
      <header className={`h-12 flex items-center justify-between px-4 border-b shrink-0 z-30 ${
        isLight ? "bg-white border-gray-200 shadow-sm" : "bg-gray-950/80 border-gray-800/60 backdrop-blur-sm"
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orbit-blue to-orbit-purple flex items-center justify-center shadow-orbit-glow animate-orbit-pulse">
            <span className="font-space font-black text-white text-xs">O</span>
          </div>
          <span className={`font-space font-bold text-sm tracking-widest uppercase ${isLight ? "text-gray-900" : "text-white"}`}>
            Orbit
          </span>
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border hidden sm:inline ${
            isLight ? "border-gray-200 text-gray-400" : "border-gray-800 text-gray-500"
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
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-14 lg:w-48 shrink-0 flex flex-col border-r pt-4 pb-4 overflow-y-auto z-20 ${
          isLight ? "bg-white border-gray-200" : "bg-gray-950/60 border-gray-800/60 backdrop-blur-sm"
        }`}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg transition-all text-left ${
                  isActive
                    ? isLight
                      ? "bg-orbit-blue/10 text-orbit-blue border border-orbit-blue/20"
                      : "bg-orbit-blue/15 text-orbit-blue border border-orbit-blue/20 shadow-orbit-glow"
                    : isLight
                      ? "text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                      : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300 border border-transparent"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider hidden lg:block">{item.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto hidden lg:block opacity-60" />}
              </button>
            );
          })}

          {/* Bottom: latest agent log */}
          {latestLog && (
            <div className={`mt-auto mx-2 p-3 rounded-lg border text-[9px] font-mono leading-relaxed hidden lg:block ${
              isLight ? "border-gray-200 bg-gray-50 text-gray-400" : "border-gray-800 bg-gray-900/40 text-gray-500"
            }`}>
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
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
