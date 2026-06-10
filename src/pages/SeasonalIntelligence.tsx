import React, { useState, useEffect } from "react";
import { 
  Calendar, ChevronRight, ArrowRight, Compass
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

interface SeasonOpportunity {
  id: string;
  name: string;
  daysRemaining: number;
  expectedRevenue: number;
  audience: string;
  campaign: string;
  copyIdea: string;
  confidence: number;
  active: boolean;
}

export const SeasonalIntelligence: React.FC = () => {
  const { businessType, startMission } = useOrbit();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  // Dynamic ticking countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Preset seasonal opportunities calibrated by category
  const seasonalList = Object.freeze<SeasonOpportunity[]>([
    {
      id: "diwali",
      name: "Diwali festival",
      daysRemaining: 14,
      expectedRevenue: businessType === "Enterprise" ? 180000 : 45000,
      audience: "Loyalists & Past Buyers",
      campaign: "Festive Collection Launch",
      copyIdea: "✨ ORBIT FESTIVE PREVIEW ✨\nHey {{name}}, light up your celebrations! We have unlocked early collection bookings with a special 15% credits drop based on your past activity. Tap here: https://orbit.io/light",
      confidence: 91,
      active: true
    },
    {
      id: "black_friday",
      name: "Black Friday sale",
      daysRemaining: 32,
      expectedRevenue: businessType === "Enterprise" ? 340000 : 82000,
      audience: "Cart Abandoners & Slipping",
      campaign: "VIP Early Access Blast",
      copyIdea: "⚡ ORBIT VIP ALERT ⚡\nHey {{name}}, bypass the public queues. Vega predicted high interest in these upgrades. Your early Black Friday key is active for 24h: https://orbit.io/bf",
      confidence: 87,
      active: false
    },
    {
      id: "christmas",
      name: "Christmas holidays",
      daysRemaining: 45,
      expectedRevenue: businessType === "Enterprise" ? 220000 : 68000,
      audience: "Repeat Buyers",
      campaign: "Holiday Gift Bundle Drops",
      copyIdea: "🎁 HOLIDAY SPECIAL 🎁\nHi {{name}}, elevate your gifting this year. Explore custom curated gift boxes recommendations made specifically for your profile. Free express delivery inside: https://orbit.io/gift",
      confidence: 94,
      active: false
    }
  ]);

  const [focusedSeasonId, setFocusedSeasonId] = useState<string>("diwali");
  const focusedSeason = seasonalList.find(s => s.id === focusedSeasonId) || seasonalList[0];

  // Tick calculations for timer (simulated ending in N days from today)
  const formatCountdown = (daysAway: number) => {
    // Target date is N days from current time at midnight
    const targetDate = new Date(currentTime.getTime() + daysAway * 24 * 60 * 60 * 1000);
    targetDate.setHours(0, 0, 0, 0);

    const diff = targetDate.getTime() - currentTime.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds };
  };

  const timerValues = formatCountdown(focusedSeason.daysRemaining);

  const handleLaunchCampaign = (goal: string) => {
    startMission(goal);
    alert(`Seasonal calibration complete. Starting "${goal}" campaign directive!`);
  };

  // Mock Seasonal Calendar representation
  const renderCalendar = () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const highlightedDays = [12, 13, 14, 15]; // Diwali campaign run window
    return (
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px]">
        {["S", "M", "T", "W", "T", "F", "S"].map(d => (
          <span key={d} className="text-gray-650 font-bold uppercase">{d}</span>
        ))}
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={`empty_${i}`} className="text-transparent">0</span>
        ))}
        {days.map(d => {
          const isHighValue = highlightedDays.includes(d);
          return (
            <span 
              key={d} 
              className={`p-1 rounded ${
                isHighValue 
                  ? "bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold animate-pulse" 
                  : "border border-gray-950 text-gray-500"
              }`}
            >
              {d}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative font-inter">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-10 z-0" />
      <div className="scanlines" />

      {/* ════════════════════════════════════════
          LEFT COLUMN: SEASONAL OPPORTUNITIES INDEX
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative z-10 border-r border-gray-900">
        
        {/* Header */}
        <PageHeaderHUD
          title="Seasonal Intelligence"
          subtitle="PROACTIVE FESTIVAL & HOLIDAY PROJECTIONS INDEX"
          onSelectAgent={setSelectedAgent}
        />

        {/* Live Active Countdown Timer Board */}
        <div className="orbit-panel p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orbit-purple/10 pointer-events-none filter blur-2xl" />
          
          <div className="space-y-2">
            <span className="font-mono text-[8px] text-orbit-purple border border-orbit-purple/30 bg-orbit-purple/5 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Countdown to {focusedSeason.name}
            </span>
            <h2 className="font-space text-xl font-bold text-white uppercase tracking-tight">{focusedSeason.campaign}</h2>
            <p className="font-mono text-[9.5px] leading-relaxed text-gray-400 max-w-sm">
              Predicted spike in consumer intent: <span className="text-orbit-success font-bold">2.4x</span>. Expected yield: <span className="text-orbit-success font-bold">₹{focusedSeason.expectedRevenue.toLocaleString()}</span>.
            </p>
          </div>

          {/* Real-time Ticker Clocks */}
          <div className="flex items-center gap-2.5 font-mono">
            {[
              { val: timerValues.days, unit: "Days" },
              { val: timerValues.hours, unit: "Hrs" },
              { val: timerValues.minutes, unit: "Min" },
              { val: timerValues.seconds, unit: "Sec" }
            ].map((t, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="bg-gray-950 border border-gray-900 rounded-xl px-3 py-2 text-white font-bold text-sm min-w-[40px] text-center shadow-inner tracking-widest tabular-nums animate-pulse-slow">
                  {t.val.toString().padStart(2, "0")}
                </div>
                <span className="text-[7.5px] text-gray-550 uppercase tracking-widest mt-1 block">{t.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities list index */}
        <div className="space-y-4">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={13} className="text-orbit-blue" />
            Upcoming Campaign Opportunities
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasonalList.map((s) => {
              const isSelected = focusedSeasonId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setFocusedSeasonId(s.id)}
                  className={`orbit-panel text-left p-4 relative overflow-hidden transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                    isSelected 
                      ? "border-orbit-blue/50 bg-gray-900/30 ring-1 ring-white/5" 
                      : "opacity-65 hover:opacity-95 hover:border-gray-800 bg-gray-950/20"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-space text-[11px] font-bold text-white uppercase">{s.name}</span>
                      <span className={`font-mono text-[8px] border px-1.5 py-0.5 rounded uppercase ${
                        isSelected ? "border-orbit-blue/30 text-orbit-blue bg-orbit-blue/5" : "border-gray-900 text-gray-650"
                      }`}>{s.daysRemaining}d away</span>
                    </div>
                    <span className="font-space text-lg font-bold text-orbit-success block">₹{s.expectedRevenue.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-gray-900/60 pt-2.5 mt-2.5 font-mono text-[8px] text-gray-550 flex items-center justify-between">
                    <span>Yield ROI: {s.confidence}% conf</span>
                    <ChevronRight size={10} className="text-orbit-blue" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      {/* ════════════════════════════════════════
          RIGHT COLUMN: CAMPAIGN IDEA & CALENDAR
      ════════════════════════════════════════ */}
      <aside className="w-72 lg:w-80 shrink-0 flex flex-col bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        
        {/* Seasonal Campaign Window Calendar */}
        <div className="orbit-panel p-4 space-y-3">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2">
            <Calendar size={12} className="text-amber-500 animate-pulse" />
            Seasonal Window Calendar
          </h3>
          
          <p className="font-mono text-[8.5px] leading-relaxed text-gray-550">
            Diwali purchase activity forecast peaks between Day 12 to Day 15. Scheduling early campaigns is recommended.
          </p>

          <div className="bg-black/40 border border-gray-900 p-3 rounded-xl">
            {renderCalendar()}
          </div>
        </div>

        {/* AI Copy Recommendation card */}
        <div className="orbit-panel p-4 space-y-3.5">
          <div className="border-b border-gray-900 pb-2.5">
            <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest block">AI-Generated Campaign Template</span>
            <h3 className="font-space text-xs font-bold text-white uppercase tracking-tight mt-0.5">{focusedSeason.campaign} Idea</h3>
          </div>

          <div className="bg-gray-950 border border-gray-900 rounded-xl p-3 font-mono text-[9px] text-gray-300 leading-relaxed whitespace-pre-line relative overflow-hidden">
            <div className="absolute top-1 right-2 font-mono text-[7px] text-orbit-purple font-semibold animate-pulse">NOVA GENERATOR</div>
            {focusedSeason.copyIdea}
          </div>

          <div className="space-y-2.5 font-mono text-[9px] text-gray-550 border-t border-gray-900/60 pt-2.5 mt-2.5">
            <div className="flex justify-between">
              <span>Target Cohort:</span>
              <span className="text-white font-bold">{focusedSeason.audience}</span>
            </div>
            <div className="flex justify-between">
              <span>Expected conversion:</span>
              <span className="text-orbit-success font-bold">18% - 24%</span>
            </div>
          </div>

          <button
            onClick={() => handleLaunchCampaign(focusedSeason.campaign)}
            className="w-full py-2.5 bg-gradient-to-r from-orbit-blue to-orbit-purple text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 hover:opacity-95 cursor-pointer shadow-orbit-glow"
          >
            <span>Start Seasonal Mission</span>
            <ArrowRight size={10} />
          </button>
        </div>

        {/* Live suggestions */}
        <div className="font-mono text-[8px] text-gray-650 flex justify-between">
          <span>SYNC STATUS: CALIBRATED</span>
          <span>CALENDAR: NOV-DEC OK</span>
        </div>

      </aside>
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default SeasonalIntelligence;
