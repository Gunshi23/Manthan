import React, { useState } from "react";
import { TrendingUp, UserMinus, Rocket, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

interface MissionSetupProps {
  onSetupComplete: (goal: string) => void;
}

export const MissionSetup: React.FC<MissionSetupProps> = ({ onSetupComplete }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genLogs, setGenLogs] = useState<string[]>([]);

  const missions = [
    {
      id: "repeat",
      title: "Increase Repeat Purchases",
      desc: "Activate Polaris behavioral filters to find regular buyers and schedule Nova incentive triggers.",
      icon: TrendingUp,
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400"
    },
    {
      id: "churn",
      title: "Reduce Customer Churn",
      desc: "Initialize Vega churn risk predictors. Isolate accounts showing slipping activity and alert Atlas operations.",
      icon: UserMinus,
      color: "from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400"
    },
    {
      id: "product",
      title: "Launch Product Campaign",
      desc: "Draft multi-channel layouts with Nova creator and broadcast across optimal customer interest streams.",
      icon: Rocket,
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400"
    },
    {
      id: "ltv",
      title: "Increase Customer LTV",
      desc: "Analyze purchase frequency DNA. Inject automated cross-selling recommendation loops to expand checkout value.",
      icon: ShieldCheck,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400"
    }
  ];

  const handleSelect = (title: string) => {
    setSelectedGoal(title);
  };

  const handleStartOnboarding = () => {
    if (!selectedGoal) return;
    setIsGenerating(true);

    const onboardingLogs = [
      `Initializing neural framework for goal: "${selectedGoal}"...`,
      "Polaris: Syncing customer segment clusters...",
      "Vega: Calibrating conversion threshold models...",
      "Nova: Spinning copy drafting networks...",
      "Atlas: Mapping active dispatch channels...",
      "Configuration locked. Target orbit stabilized."
    ];

    onboardingLogs.forEach((log, index) => {
      setTimeout(() => {
        setGenLogs(prev => [...prev, log]);
        if (index === onboardingLogs.length - 1) {
          setTimeout(() => {
            onSetupComplete(selectedGoal);
          }, 1000);
        }
      }, (index + 1) * 800);
    });
  };

  return (
    <div className="relative min-h-screen bg-orbit-bg space-grid flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      <div className="scanlines" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orbit-glow-blue pointer-events-none" />

      {!isGenerating ? (
        <div className="relative w-full max-w-4xl flex flex-col items-center">
          <div className="text-center mb-12">
            <span className="font-mono text-[10px] tracking-widest text-orbit-blue uppercase border border-orbit-blue/30 px-3 py-1 rounded-full bg-orbit-blue/5">
              MISSION SETUP SEQUENCE
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-space mt-4 mb-3">
              Establish Core Objective
            </h1>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Select an objective node. ORBIT will calibrate its AI agent boardroom weights to optimize segmentation, copy, and channel execution for this priority.
            </p>
          </div>

          {/* Grid list of goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
            {missions.map(item => {
              const Icon = item.icon;
              const isSelected = selectedGoal === item.title;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.title)}
                  className={`p-6 rounded-xl text-left border bg-gray-900/40 backdrop-blur-md transition-all duration-300 flex gap-5 hover:border-white/20 hover:bg-gray-900/70 group ${
                    isSelected 
                      ? "border-orbit-blue bg-gray-900/90 shadow-orbit-glow" 
                      : "border-gray-800"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-tr ${item.color} flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-space text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-mono">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <button
            onClick={handleStartOnboarding}
            disabled={!selectedGoal}
            className={`px-8 py-3.5 rounded-lg text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2 transition-all ${
              selectedGoal 
                ? "bg-gradient-to-r from-orbit-blue to-orbit-purple text-white shadow-orbit-glow active:scale-95"
                : "bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Generate AI-Powered Onboarding
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        /* Generation Log Overlay */
        <div className="relative w-full max-w-lg bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-6 sm:p-8 shadow-orbit-glow flex flex-col">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
            <Loader2 size={16} className="text-orbit-blue animate-spin" />
            <span className="font-mono text-xs text-gray-400">CALIBRATING AGENT BOARDS...</span>
          </div>

          <div className="font-mono text-xs space-y-2 h-48 overflow-y-auto text-green-400 pr-2">
            {genLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-blue-400">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
            <span className="font-mono text-[10px] text-gray-500">STABILIZING REVENUE ORBITAL CHANNELS...</span>
          </div>
        </div>
      )}
    </div>
  );
};
