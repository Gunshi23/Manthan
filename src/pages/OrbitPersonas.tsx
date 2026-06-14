import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import type { Persona } from "../context/OrbitContext";
import { 
  Crown, Sparkles, Battery, Percent, UserPlus, Fingerprint, 
  RefreshCw, TrendingUp, MessageSquare, Zap, Target, Award
} from "lucide-react";

const getAvatarIcon = (avatar: string) => {
  switch (avatar) {
    case "crown": return Crown;
    case "sparkles": return Sparkles;
    case "battery-low": return Battery;
    case "percent": return Percent;
    case "user-plus": return UserPlus;
    default: return Fingerprint;
  }
};

const getPersonaColorClass = (id: string, isLight: boolean) => {
  if (id.includes("vip")) return { 
    text: isLight ? "text-purple-600 animate-pulse" : "text-purple-400", 
    border: isLight ? "border-purple-200" : "border-purple-500/30", 
    bg: isLight ? "bg-purple-50" : "bg-purple-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(168,85,247,0.2)]", 
    badge: isLight ? "bg-purple-100 text-purple-700" : "bg-purple-500/20 text-purple-300" 
  };
  if (id.includes("trend")) return { 
    text: isLight ? "text-pink-600 animate-pulse" : "text-pink-400", 
    border: isLight ? "border-pink-200" : "border-pink-500/30", 
    bg: isLight ? "bg-pink-50" : "bg-pink-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(236,72,153,0.2)]", 
    badge: isLight ? "bg-pink-100 text-pink-700" : "bg-pink-500/20 text-pink-300" 
  };
  if (id.includes("dormant")) return { 
    text: isLight ? "text-amber-600 animate-pulse" : "text-amber-400", 
    border: isLight ? "border-amber-200" : "border-amber-500/30", 
    bg: isLight ? "bg-amber-50" : "bg-amber-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(245,158,11,0.2)]", 
    badge: isLight ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-300" 
  };
  if (id.includes("value")) return { 
    text: isLight ? "text-orange-600 animate-pulse" : "text-orange-400", 
    border: isLight ? "border-orange-200" : "border-orange-500/30", 
    bg: isLight ? "bg-orange-50" : "bg-orange-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(249,115,22,0.2)]", 
    badge: isLight ? "bg-orange-100 text-orange-700" : "bg-orange-500/20 text-orange-300" 
  };
  if (id.includes("new")) return { 
    text: isLight ? "text-emerald-600 animate-pulse" : "text-emerald-400", 
    border: isLight ? "border-emerald-200" : "border-emerald-500/30", 
    bg: isLight ? "bg-emerald-50" : "bg-emerald-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(16,185,129,0.2)]", 
    badge: isLight ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/20 text-emerald-300" 
  };
  return { 
    text: isLight ? "text-blue-600 animate-pulse" : "text-blue-400", 
    border: isLight ? "border-blue-200" : "border-blue-500/30", 
    bg: isLight ? "bg-blue-50" : "bg-blue-500/10", 
    glow: isLight ? "shadow-sm" : "shadow-[0_0_15px_rgba(59,130,246,0.2)]", 
    badge: isLight ? "bg-blue-100 text-blue-700" : "bg-blue-500/20 text-blue-300" 
  };
};

const getRiskGlowClass = (level: string, isLight: boolean) => {
  switch (level.toLowerCase()) {
    case "critical": return isLight ? "bg-red-50 text-red-750 border border-red-200" : "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    case "high": return isLight ? "bg-orange-50 text-orange-750 border border-orange-200" : "bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
    case "medium": return isLight ? "bg-yellow-50 text-yellow-755 border border-yellow-200" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
    default: return isLight ? "bg-green-50 text-green-750 border border-green-200" : "bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
  }
};

export const OrbitPersonas: React.FC = () => {
  const { 
    personas, 
    riskPersona, 
    highestRevenuePersona, 
    generatePersonas, 
    theme,
    workspaceDna
  } = useOrbit();

  const isLight = theme === "executive";
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");

  // Fallback to first persona if none selected
  const activePersonaId = selectedPersonaId || (personas.length > 0 ? personas[0].id : null);
  const activePersona: Persona | null = personas.find(p => p.id === activePersonaId) || null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePersonas();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalCustomers = personas.reduce((sum, p) => sum + p.customerCount, 0) || 1;

  return (
    <div className={`flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 ${isLight ? "bg-slate-50" : ""}`}>
      {/* ─── Page Header HUD ─────────────────────────────────────── */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? "border-slate-200" : "border-[rgba(255,255,255,0.07)]"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orbit-purple animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-orbit-purple font-bold uppercase">DNA Analysis Lab</span>
          </div>
          <h1 className={`text-2xl font-space font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>Orbit Personas</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className={`font-mono text-xs ${isLight ? "text-slate-500" : "text-gray-400"}`}>Customer DNA Intelligence Lab & Archetype Clusters</p>
            {workspaceDna && (
              <span className={`font-mono text-[8px] border px-2 py-0.5 rounded-full uppercase font-bold ${
                isLight ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-orbit-blue/10 border-orbit-blue/30 text-orbit-blue"
              }`}>
                {workspaceDna.industryType}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
            isLight 
              ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 shadow-sm" 
              : "bg-orbit-purple/20 border-orbit-purple/40 text-orbit-purple hover:bg-orbit-purple/30 shadow-orbit-glow-purple"
          } disabled:opacity-50`}
        >
          <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
          <span>{isGenerating ? "Analyzing DNA..." : "Re-Scan Customer DNA"}</span>
        </button>
      </div>

      {/* ─── AI Persona Briefing Alert ───────────────────────────── */}
      {personas.length > 0 && (
        <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-4 ${
          isLight 
            ? "bg-purple-50/50 border-purple-200 text-slate-800" 
            : "bg-purple-950/15 border-purple-500/25 text-gray-200"
        }`}>
          {/* Neon side indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orbit-purple to-orbit-pink" />
          
          <div className={`p-2.5 rounded-lg shrink-0 ${isLight ? "bg-purple-100 text-purple-600" : "bg-purple-500/10 text-purple-400 border border-purple-500/25"}`}>
            <Zap size={18} className="animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-1">
            <span className="font-space font-bold text-xs uppercase tracking-wider text-orbit-purple block">AI Persona Briefing</span>
            <p className={`text-xs font-mono leading-relaxed ${isLight ? "text-slate-700" : "text-gray-400"}`}>
              {highestRevenuePersona ? (
                <>
                  <span className={`font-bold ${isLight ? "text-slate-850" : "text-white"}`}>{highestRevenuePersona.name}</span> generates{" "}
                  <span className="text-emerald-600 font-bold">{highestRevenuePersona.revenueContributionPct}% of revenue</span> representing only{" "}
                  <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{Math.round((highestRevenuePersona.customerCount / totalCustomers) * 100)}% of customers</span>.
                </>
              ) : (
                "Scanning segment metrics..."
              )}
              {riskPersona && (
                <>
                  {" "}Warning: <span className="text-amber-600 font-bold">{riskPersona.name}</span> represents a significant churn threat.
                </>
              )}
            </p>
          </div>
          
          <div className="flex gap-2 font-mono text-[10px] uppercase font-bold shrink-0 self-end md:self-center">
            <div className={`px-2.5 py-1 rounded border ${isLight ? "bg-white border-slate-200 text-slate-700" : "bg-gray-900 border-gray-800 text-gray-400"}`}>
              LTV Recovery Value: <span className="text-emerald-600">₹{(riskPersona?.predictedLtv || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Grid of Persona Cards (60%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`font-space text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? "text-slate-600" : "text-gray-400"}`}>
              <Award size={14} className="text-orbit-blue" />
              <span>Customer Segments ({personas.length})</span>
            </h2>
            <span className="font-mono text-[10px] text-gray-500">Select card to inspect DNA details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personas.map((persona) => {
              const Icon = getAvatarIcon(persona.avatar);
              const styling = getPersonaColorClass(persona.id, isLight);
              const isSelected = persona.id === activePersonaId;
              const contributionPct = persona.revenueContributionPct;
              
              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  style={{
                    background: isLight 
                      ? isSelected 
                        ? "linear-gradient(135deg, #DBEAFE, #FFFFFF)" 
                        : "#FFFFFF" 
                      : undefined
                  }}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative ${
                    isSelected 
                      ? `${styling.border} ${styling.glow} ${isLight ? "border-blue-400 shadow-md scale-[1.01]" : "bg-[#1E293B]/70 border-orbit-purple shadow-[0_0_20px_rgba(139,92,246,0.15)]"}` 
                      : isLight 
                      ? "bg-white border-slate-200 hover:border-slate-350 hover:shadow-sm" 
                      : "bg-[#0F172A]/70 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#0F172A]"
                  }`}
                >
                  {/* Selection indicator border glow */}
                  {isSelected && !isLight && (
                    <span className="absolute -inset-[1px] border border-orbit-purple rounded-xl animate-pulse pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${styling.bg} ${styling.text} border ${styling.border}`}>
                      <Icon size={16} />
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[9px] text-gray-550 uppercase block">Risk Factor</span>
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full inline-block mt-0.5 ${getRiskGlowClass(persona.riskLevel, isLight)}`}>
                        {persona.riskLevel} ({persona.riskScore}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <h3 className={`font-space font-bold text-sm tracking-tight group-hover:text-orbit-blue transition-colors truncate ${
                      isLight ? "text-slate-800" : "text-white"
                    }`}>
                      {persona.name}
                    </h3>
                    <span className="font-mono text-[9px] text-orbit-purple font-bold shrink-0">Age: {persona.ageRange || "18-24"}</span>
                  </div>
                  <p className={`text-[10px] line-clamp-2 h-7 font-mono leading-normal mb-3 ${isLight ? "text-slate-500" : "text-gray-400"}`}>
                    {persona.description}
                  </p>

                  <div className={`grid grid-cols-2 gap-y-2.5 pt-3 border-t font-mono text-[10px] ${
                    isLight ? "border-slate-150" : "border-[rgba(255,255,255,0.06)]"
                  }`}>
                    <div>
                      <span className="text-gray-550 block text-[9px] uppercase">Customers</span>
                      <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{persona.customerCount}</span>
                      <span className="text-gray-500 text-[9px] ml-1">({Math.round((persona.customerCount / totalCustomers) * 100)}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-550 block text-[9px] uppercase">Rev Share</span>
                      <span className="font-bold text-emerald-600">{contributionPct}%</span>
                    </div>
                    <div>
                      <span className="text-gray-550 block text-[9px] uppercase">Avg Spend</span>
                      <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>₹{(persona.averageSpend).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-550 block text-[9px] uppercase">Pred LTV</span>
                      <span className="font-bold text-blue-600">₹{(persona.predictedLtv).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={`mt-2.5 text-[8.5px] font-mono border-t pt-2 flex justify-between gap-2 ${
                    isLight ? "border-slate-150 text-slate-500" : "border-[rgba(255,255,255,0.04)] text-gray-550"
                  }`}>
                    <span className="shrink-0 uppercase">Preferred Products:</span>
                    <span className={`font-bold truncate max-w-[150px] ${isLight ? "text-slate-700" : "text-gray-300"}`}>{persona.preferredProducts || "N/A"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Detail / Analytics Tabs (40%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`flex items-center justify-between border-b pb-1 ${isLight ? "border-slate-200" : "border-[rgba(255,255,255,0.08)]"}`}>
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("insights")}
                className={`pb-2 font-mono text-[11px] font-bold uppercase tracking-wider relative transition-colors cursor-pointer ${
                  activeTab === "insights" ? "text-orbit-purple" : isLight ? "text-slate-400 hover:text-slate-600" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                AI Explanation Panel
                {activeTab === "insights" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orbit-purple" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`pb-2 font-mono text-[11px] font-bold uppercase tracking-wider relative transition-colors cursor-pointer ${
                  activeTab === "analytics" ? "text-orbit-blue" : isLight ? "text-slate-400 hover:text-slate-600" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Analytics & Heatmaps
                {activeTab === "analytics" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orbit-blue" />
                )}
              </button>
            </div>
            {activePersona && (
              <span className={`font-mono text-[9px] px-2 py-0.5 border rounded-full uppercase ${
                isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-gray-900 border-gray-800 text-orbit-purple"
              }`}>
                Active ID: {activePersona.id}
              </span>
            )}
          </div>

          {activePersona ? (
            <div className={`p-5 rounded-xl border ${
              isLight 
                ? "bg-white border-slate-250 text-slate-800 shadow-sm" 
                : "bg-[#0F172A]/70 border-[rgba(255,255,255,0.08)]"
            }`}>
              {activeTab === "insights" ? (
                /* Tab 1: AI Insights Details */
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${getPersonaColorClass(activePersona.id, isLight).bg} ${getPersonaColorClass(activePersona.id, isLight).text} border ${getPersonaColorClass(activePersona.id, isLight).border}`}>
                      {React.createElement(getAvatarIcon(activePersona.avatar), { size: 20 })}
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-gray-550 uppercase tracking-widest block">Customer DNA Archetype</span>
                      <h3 className={`font-space font-bold text-base ${isLight ? "text-slate-800" : "text-white"}`}>{activePersona.name}</h3>
                      <div className="flex flex-wrap gap-2 items-center mt-1 text-[9px] font-mono text-orbit-purple font-bold">
                        <span>Age Range: {activePersona.ageRange}</span>
                        <span className="text-gray-500 font-normal">•</span>
                        <span>Channel: {activePersona.preferredChannel}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-1 p-3 rounded-lg border font-mono text-[10px] ${
                    isLight ? "bg-slate-50 border-slate-150 text-slate-700" : "bg-gray-950/40 border-white/5"
                  }`}>
                    <span className="text-gray-500 uppercase text-[8px] tracking-wider block">Lifestyle & Description</span>
                    <p className={`leading-relaxed ${isLight ? "text-slate-800" : "text-white"}`}>{activePersona.description}</p>
                    <p className={`leading-relaxed mt-1 ${isLight ? "text-slate-500" : "text-gray-400"}`}>{activePersona.lifestyle}</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <div className={`flex items-center gap-1.5 font-space text-xs font-bold mb-1 uppercase tracking-wider ${isLight ? "text-slate-800" : "text-white"}`}>
                        <TrendingUp size={12} className="text-orbit-purple" />
                        <span>Buying Motivation</span>
                      </div>
                      <p className={`text-[11px] font-mono pl-4 ${isLight ? "text-slate-600" : "text-gray-400"}`}>{activePersona.motivation}</p>
                    </div>

                    <div>
                      <div className={`flex items-center gap-1.5 font-space text-xs font-bold mb-1 uppercase tracking-wider ${isLight ? "text-slate-800" : "text-white"}`}>
                        <Target size={12} className="text-orbit-pink" />
                        <span>Buying Triggers</span>
                      </div>
                      <p className={`text-[11px] font-mono pl-4 ${isLight ? "text-slate-660" : "text-gray-400"}`}>{activePersona.buyingTriggers}</p>
                    </div>

                    <div>
                      <div className={`flex items-center gap-1.5 font-space text-xs font-bold mb-1 uppercase tracking-wider ${isLight ? "text-slate-800" : "text-white"}`}>
                        <Award size={12} className="text-orbit-blue" />
                        <span>Preferred Products</span>
                      </div>
                      <p className={`text-[11px] font-mono pl-4 ${isLight ? "text-slate-600" : "text-gray-400"}`}>{activePersona.preferredProducts} (e.g. {activePersona.whatTheyBuy})</p>
                    </div>

                    <div>
                      <div className={`flex items-center gap-1.5 font-space text-xs font-bold mb-1 uppercase tracking-wider ${isLight ? "text-slate-800" : "text-white"}`}>
                        <Zap size={12} className="text-orbit-amber" />
                        <span>AI Insights & Targeting Strategy</span>
                      </div>
                      <p className={`text-[11px] font-mono pl-4 leading-normal p-2 rounded border ${
                        isLight ? "bg-blue-50/50 border-blue-100 text-slate-700" : "bg-blue-500/5 border-blue-500/10 text-gray-350"
                      }`}>{activePersona.aiInsightsTargeting}</p>
                    </div>

                    <div>
                      <div className={`flex items-center gap-1.5 font-space text-xs font-bold mb-1 uppercase tracking-wider ${isLight ? "text-slate-800" : "text-white"}`}>
                        <MessageSquare size={12} className="text-emerald-500" />
                        <span>Best Communication Channel</span>
                      </div>
                      <p className={`text-[11px] font-mono pl-4 ${isLight ? "text-slate-600" : "text-gray-400"}`}>{activePersona.bestCommChannel}</p>
                    </div>

                    <div className={`pt-3 border-t space-y-2 p-3 rounded-lg border ${
                      isLight ? "border-purple-200 bg-purple-50/50 text-slate-700" : "border-purple-500/10 bg-purple-950/5"
                    }`}>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-orbit-purple uppercase tracking-wider">
                        <Zap size={12} className="text-orbit-purple animate-pulse" />
                        <span>Recommended Campaign</span>
                      </div>
                      <p className={`text-[11px] font-mono font-bold ${isLight ? "text-slate-850" : "text-white"}`}>{activePersona.suggestedCampaign}</p>
                      <p className={`text-[10px] font-mono leading-relaxed pt-0.5 ${isLight ? "text-slate-500" : "text-gray-400"}`}>{activePersona.recommendedStrategy}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono pt-2 text-gray-500">
                        <span>Revenue Opportunity:</span>
                        <span className="text-orbit-success font-bold">₹{activePersona.revenuePotential.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab 2: Analytics Breakdown */
                <div className="space-y-6">
                  {/* Revenue Contribution */}
                  <div>
                    <h4 className={`font-space text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between ${
                      isLight ? "text-slate-800" : "text-white"
                    }`}>
                      <span>Revenue Contribution</span>
                      <span className="font-mono text-[10px] text-orbit-success">₹{(activePersona.predictedLtv * activePersona.customerCount).toLocaleString()} Total LTV</span>
                    </h4>
                    <div className="space-y-2.5">
                      {personas.map(p => {
                        const style = getPersonaColorClass(p.id, isLight);
                        return (
                          <div key={p.id} className="space-y-1">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className={p.id === activePersona.id ? isLight ? "text-slate-800 font-bold" : "text-white font-bold" : "text-gray-400"}>{p.name}</span>
                              <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{p.revenueContributionPct}%</span>
                            </div>
                            <div className={`h-1.5 rounded-full overflow-hidden border ${isLight ? "bg-slate-100 border-slate-200" : "bg-gray-900 border-white/5"}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  style.text.includes("purple") ? "bg-purple-500" :
                                  style.text.includes("pink") ? "bg-pink-500" :
                                  style.text.includes("amber") ? "bg-amber-500" :
                                  style.text.includes("orange") ? "bg-orange-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${p.revenueContributionPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Churn Risk Heatmap */}
                  <div>
                    <h4 className={`font-space text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? "text-slate-800" : "text-white"}`}>
                      Persona Risk Heatmap
                    </h4>
                    <div className="space-y-2">
                      {[...personas].sort((a,b) => b.riskScore - a.riskScore).map(p => {
                        const score = p.riskScore;
                        let badgeColor = isLight ? "bg-green-50 text-green-700 border border-green-200" : "bg-green-500/10 text-green-400 border border-green-500/25";
                        if (score >= 70) badgeColor = isLight ? "bg-red-50 text-red-700 border border-red-200" : "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse";
                        else if (score >= 40) badgeColor = isLight ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-orange-500/15 text-orange-400 border border-orange-500/25";
                        else if (score >= 20) badgeColor = isLight ? "bg-yellow-50 text-yellow-750 border border-yellow-200" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";

                        return (
                          <div key={p.id} className={`flex justify-between items-center p-2 rounded border ${
                            isLight ? "bg-slate-50 border-slate-150" : "bg-gray-950/40 border-white/5"
                          }`}>
                            <span className={`font-mono text-[10px] ${isLight ? "text-slate-700" : "text-gray-300"}`}>{p.name}</span>
                            <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${badgeColor}`}>
                              {p.riskLevel} ({score}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Growth Potential Chart */}
                  <div>
                    <h4 className={`font-space text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? "text-slate-800" : "text-white"}`}>
                      Revenue Growth Potential
                    </h4>
                    <div className="space-y-3 font-mono text-[10px]">
                      <div className={`p-3 border rounded-lg space-y-2 ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-gray-950/40 border-white/5"
                      }`}>
                        <div className="flex justify-between text-gray-400">
                          <span>Current average LTV:</span>
                          <span className={isLight ? "text-slate-700 font-bold" : "text-white"}>₹{activePersona.predictedLtv.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Target Revenue Potential:</span>
                          <span className="text-emerald-600 font-bold">₹{activePersona.revenuePotential.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Untapped headroom:</span>
                          <span className="text-orbit-blue font-bold">₹{(activePersona.revenuePotential - activePersona.predictedLtv).toLocaleString()} (+{Math.round(((activePersona.revenuePotential - activePersona.predictedLtv)/activePersona.predictedLtv)*100)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Channel Preference Breakdown */}
                  <div>
                    <h4 className={`font-space text-xs font-bold uppercase tracking-wider mb-3 ${isLight ? "text-slate-800" : "text-white"}`}>
                      Persona Channel Preference Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["WhatsApp", "Email", "SMS", "RCS"].map(channel => {
                        const channelPersonas = personas.filter(p => p.preferredChannel === channel);
                        const share = Math.round((channelPersonas.reduce((sum, p) => sum + p.customerCount, 0) / totalCustomers) * 100);
                        return (
                          <div key={channel} className={`p-2.5 rounded border font-mono text-[10px] space-y-1 ${
                            isLight ? "bg-slate-50 border-slate-200" : "bg-gray-950/40 border-white/5"
                          }`}>
                            <span className="text-gray-500 block text-[8px] uppercase">{channel}</span>
                            <div className="flex justify-between items-baseline">
                              <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{share}%</span>
                              <span className="text-gray-500 text-[8px]">{channelPersonas.length} Archetype{channelPersonas.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-8 text-center font-mono text-xs border border-dashed rounded-xl ${
              isLight ? "border-slate-300 text-slate-400 bg-white" : "border-[rgba(255,255,255,0.1)] text-gray-550"
            }`}>
              No persona selected. Re-run scan to synchronize customer base.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
