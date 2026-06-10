import React, { useMemo, useState } from "react";
import { 
  Sparkles, Activity, ArrowRight, Compass
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

export const CompetitorIntelligence: React.FC = () => {
  const { businessType, startMission } = useOrbit();
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  // Dynamic industry benchmarks calibrated by category to feel completely personalized
  const benchmarks = useMemo(() => {
    const isFashion = businessType === "Fashion & Apparel";
    const isBeauty = businessType === "Beauty & Skincare";
    const isFood = businessType === "Food & Bakery";
    const isJewellery = businessType === "Jewellery & Accessories";
    const isEnterprise = businessType === "Enterprise";

    const labelCategory = isFashion ? "Fashion brands" 
                        : isBeauty ? "Beauty & Skincare brands" 
                        : isFood ? "Bakery/Food delivery brands" 
                        : isJewellery ? "Jewellery & Luxury brands" 
                        : isEnterprise ? "Enterprise SaaS tech"
                        : "D2C brands";

    const benchmarkChannel = isFashion ? "WhatsApp" : isBeauty ? "WhatsApp" : isEnterprise ? "Email" : "RCS";
    const benchmarkPct = isFashion ? 23 : isBeauty ? 31 : isFood ? 18 : isJewellery ? 42 : 15;
    const contentPref = isEnterprise ? "deep-dive technical SLA case studies" : "interactive visual cards & short-form text copy";

    return {
      labelCategory,
      benchmarkChannel,
      benchmarkPct,
      contentPref,
      avgCTR: isEnterprise ? "8.5%" : isJewellery ? "14.2%" : "12.8%",
      competitorCTR: isEnterprise ? "11.2%" : isJewellery ? "19.5%" : "15.4%"
    };
  }, [businessType]);

  const handleLaunchCampaign = () => {
    startMission("Increase Repeat Purchases");
    alert("Competitor parameters loaded. Proceeding to Command Center to dispatch recommendations!");
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative font-inter">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-10 z-0" />
      <div className="scanlines" />

      {/* ════════════════════════════════════════
          LEFT COLUMN: MARKET INTELLIGENCE GRAPHS
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative z-10 border-r border-gray-900">
        
        {/* Header */}
        <PageHeaderHUD
          title="Competitor Intelligence"
          subtitle="AI-POWERED MARKET SIGNAL & BRAND COMPARISON RADAR"
          onSelectAgent={setSelectedAgent}
        />

        {/* Benchmarking callout banner */}
        <div className="orbit-panel p-5 mb-6 border-l-4 border-orbit-purple bg-gradient-to-r from-orbit-purple/10 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orbit-purple/10 pointer-events-none filter blur-2xl" />
          <div className="flex gap-4 items-start font-mono">
            <Sparkles size={16} className="text-orbit-purple shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-2 text-[10px] leading-relaxed text-gray-300">
              <p>
                <span className="text-white font-bold">{benchmarks.labelCategory}</span> similar to yours are seeing <span className="text-orbit-success font-bold">{benchmarks.benchmarkPct}% higher</span> engagement on <span className="text-white font-bold">{benchmarks.benchmarkChannel}</span>.
              </p>
              <p>
                Customers currently exhibit high preferences for <span className="text-orbit-purple font-bold">{benchmarks.contentPref}</span>.
              </p>
              <div className="pt-2">
                <span className="font-bold text-white uppercase block text-[8px] tracking-widest mb-1.5">Recommended action</span>
                <button
                  onClick={handleLaunchCampaign}
                  className="px-3 py-1.5 rounded bg-orbit-purple text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <span>Launch WhatsApp Campaign</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Graphs: Channel Engagement benchmarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart 1: Average CTR Comparison */}
          <div className="orbit-panel p-4 flex flex-col justify-between min-h-[220px]">
            <div className="border-b border-gray-950 pb-2.5 mb-4">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Engagement Benchmarks (CTR)</span>
            </div>
            
            <div className="flex items-end justify-around h-24 font-mono text-[9px] relative">
              {/* ORBIT brand */}
              <div className="flex flex-col items-center gap-1.5 w-16 text-center">
                <span className="text-orbit-purple font-bold">{benchmarks.avgCTR}</span>
                <div className="w-8 bg-orbit-purple/35 border border-orbit-purple/60 rounded-t-md h-12" />
                <span className="text-gray-550 block text-[8px]">Your Brand</span>
              </div>
              
              {/* Competitors average */}
              <div className="flex flex-col items-center gap-1.5 w-16 text-center">
                <span className="text-gray-400 font-bold">{benchmarks.competitorCTR}</span>
                <div className="w-8 bg-gray-800 border border-gray-750 rounded-t-md h-20" />
                <span className="text-gray-550 block text-[8px]">Competitors</span>
              </div>
            </div>
          </div>

          {/* Chart 2: Channel Preference Yield */}
          <div className="orbit-panel p-4 flex flex-col justify-between min-h-[220px]">
            <div className="border-b border-gray-950 pb-2.5 mb-4">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Market Channel Share</span>
            </div>
            
            <div className="space-y-3 font-mono text-[9px]">
              {[
                { ch: "WhatsApp", pct: businessType === "Enterprise" ? 35 : 78, color: "bg-emerald-500" },
                { ch: "RCS Cards", pct: businessType === "Jewellery & Accessories" ? 64 : 45, color: "bg-purple-500" },
                { ch: "Email", pct: businessType === "Enterprise" ? 85 : 30, color: "bg-blue-500" },
                { ch: "SMS / RCS", pct: 18, color: "bg-yellow-500" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[8px] text-gray-550">
                    <span>{item.ch}</span>
                    <span>{item.pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* ════════════════════════════════════════
          RIGHT COLUMN: TRENDS & MARKET SIGNALS
      ════════════════════════════════════════ */}
      <aside className="w-72 lg:w-80 shrink-0 flex flex-col bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        
        {/* Competitive Positioning Map */}
        <div className="orbit-panel p-4 space-y-3">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2">
            <Compass size={12} className="text-orbit-blue animate-pulse" />
            Competitive Position Map
          </h3>
          
          {/* Custom 2D positioning coordinate map */}
          <div className="relative w-full h-32 bg-black/40 border border-gray-900 rounded-xl flex items-center justify-center font-mono">
            {/* crosshairs */}
            <line x1="0" y1="64" x2="100%" y2="64" stroke="#111827" strokeWidth="1" />
            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#111827" strokeWidth="1" />
            
            {/* labels */}
            <span className="absolute top-1 text-[7px] text-gray-650 uppercase">Low Cost</span>
            <span className="absolute bottom-1 text-[7px] text-gray-650 uppercase">Premium</span>
            <span className="absolute left-1 text-[7px] text-gray-650 uppercase">Slow</span>
            <span className="absolute right-1 text-[7px] text-gray-650 uppercase font-bold">Fast Growth</span>

            {/* Competitor clusters */}
            <span className="absolute top-8 left-12 w-2 h-2 rounded-full bg-gray-800" title="Competitor A" />
            <span className="absolute bottom-6 left-20 w-2.5 h-2.5 rounded-full bg-gray-800" title="Competitor B" />
            <span className="absolute top-10 right-28 w-2 h-2 rounded-full bg-gray-700" title="Competitor C" />

            {/* Your Brand blip */}
            <div className="absolute bottom-12 right-16 flex flex-col items-center">
              <span className="w-3.5 h-3.5 rounded-full bg-orbit-purple border-2 border-[#050816] animate-pulse shadow-orbit-glow-purple" />
              <span className="text-[7px] text-white font-bold uppercase mt-1">Orbit Core</span>
            </div>
          </div>
        </div>

        {/* Market Signals list */}
        <div className="orbit-panel p-4 space-y-3.5 flex-1">
          <div className="border-b border-gray-900 pb-2.5">
            <span className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} className="text-orbit-success" />
              Real-time Market Signals
            </span>
          </div>

          <div className="space-y-3 font-mono text-[9px] text-gray-400">
            {[
              { title: "Engagement Trends", desc: "Interactive rich templates show a 2.3x higher conversion rate in skincare and fashion cohorts." },
              { title: "Delivery Sockets Shift", desc: "Carrier routers report minor RCS latency. Twilio RCS endpoints are functioning optimally." },
              { title: "Consumer Fatigue Warning", desc: "Brands running duplicate campaigns daily report a 30% drop in clickthrough velocity." }
            ].map((sig, i) => (
              <div key={i} className="bg-black/30 border border-gray-900 p-2.5 rounded-lg space-y-1">
                <span className="font-bold text-white block">{sig.title}</span>
                <p className="text-gray-500 leading-normal text-[8.5px]">{sig.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* telemetry */}
        <div className="font-mono text-[8px] text-gray-650 flex justify-between">
          <span>PORT: MARKET-FEED-V</span>
          <span>INTELLIGENCE LOCKED</span>
        </div>

      </aside>
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default CompetitorIntelligence;
