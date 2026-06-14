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

const getPersonaColorClass = (id: string) => {
  if (id.includes("vip")) return { text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]", badge: "bg-purple-500/20 text-purple-300" };
  if (id.includes("trend")) return { text: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/10", glow: "shadow-[0_0_15px_rgba(236,72,153,0.2)]", badge: "bg-pink-500/20 text-pink-300" };
  if (id.includes("dormant")) return { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]", badge: "bg-amber-500/20 text-amber-300" };
  if (id.includes("value")) return { text: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", glow: "shadow-[0_0_15px_rgba(249,115,22,0.2)]", badge: "bg-orange-500/20 text-orange-300" };
  if (id.includes("new")) return { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-[0_0_15px_rgba(16,185,129,0.2)]", badge: "bg-emerald-500/20 text-emerald-300" };
  return { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]", badge: "bg-blue-500/20 text-blue-300" };
};

const getRiskGlowClass = (level: string) => {
  switch (level.toLowerCase()) {
    case "critical": return "bg-red-500/10 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    case "high": return "bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
    case "medium": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]";
    default: return "bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
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
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* ─── Page Header HUD ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orbit-purple animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-orbit-purple font-bold uppercase">DNA Analysis Lab</span>
          </div>
          <h1 className="text-2xl font-space font-bold tracking-tight">Orbit Personas</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-xs text-gray-400">Customer DNA Intelligence Lab & Archetype Clusters</p>
            {workspaceDna && (
              <span className="font-mono text-[8px] bg-orbit-blue/10 border border-orbit-blue/30 text-orbit-blue px-2 py-0.5 rounded-full uppercase font-bold">
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
              ? "bg-gray-900 border-gray-800 text-white hover:bg-gray-800" 
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
            ? "bg-purple-50/50 border-purple-200 text-gray-800" 
            : "bg-purple-950/15 border-purple-500/25 text-gray-200"
        }`}>
          {/* Neon side indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orbit-purple to-orbit-pink" />
          
          <div className={`p-2.5 rounded-lg shrink-0 ${isLight ? "bg-purple-100 text-purple-600" : "bg-purple-500/10 text-purple-400 border border-purple-500/25"}`}>
            <Zap size={18} className="animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-1">
            <span className="font-space font-bold text-xs uppercase tracking-wider text-orbit-purple block">AI Persona Briefing</span>
            <p className="text-xs font-mono leading-relaxed">
              {highestRevenuePersona ? (
                <>
                  <span className="font-bold text-white">{highestRevenuePersona.name}</span> generates{" "}
                  <span className="text-orbit-success font-bold">{highestRevenuePersona.revenueContributionPct}% of revenue</span> representing only{" "}
                  <span className="font-bold">{Math.round((highestRevenuePersona.customerCount / totalCustomers) * 100)}% of customers</span>.
                </>
              ) : (
                "Scanning segment metrics..."
              )}
              {riskPersona && (
                <>
                  {" "}Warning: <span className="text-orbit-amber font-bold">{riskPersona.name}</span> represents a significant churn threat.
                </>
              )}
            </p>
          </div>
          
          <div className="flex gap-2 font-mono text-[10px] uppercase font-bold shrink-0 self-end md:self-center">
            <div className={`px-2.5 py-1 rounded border ${isLight ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-gray-900 border-gray-800 text-gray-400"}`}>
              LTV Recovery Value: <span className="text-orbit-success">₹{(riskPersona?.predictedLtv || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Grid of Persona Cards (60%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-space text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Award size={14} className="text-orbit-blue" />
              <span>Customer Segments ({personas.length})</span>
            </h2>
            <span className="font-mono text-[10px] text-gray-500">Select card to inspect DNA details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personas.map((persona) => {
              const Icon = getAvatarIcon(persona.avatar);
              const styling = getPersonaColorClass(persona.id);
              const isSelected = persona.id === activePersonaId;
              const contributionPct = persona.revenueContributionPct;
              
              return (
                <div
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative ${
                    isSelected 
                      ? `${styling.border} ${styling.glow} ${isLight ? "bg-gray-50 border-gray-400 shadow-md" : "bg-[#1E293B]/70 border-orbit-purple shadow-[0_0_20px_rgba(139,92,246,0.15)]"}` 
                      : isLight 
                      ? "bg-white border-gray-200 hover:border-gray-400 hover:shadow-sm" 
                      : "bg-[#0F172A]/70 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#0F172A]"
                  }`}
                >
                  {/* Selection indicator border glow */}
                  {isSelected && (
                    <span className="absolute -inset-[1px] border border-orbit-purple rounded-xl animate-pulse pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${styling.bg} ${styling.text} border ${styling.border}`}>
                      <Icon size={16} />
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[9px] text-gray-500 uppercase block">Risk Factor</span>
                      <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full inline-block mt-0.5 ${getRiskGlowClass(persona.riskLevel)}`}>
                        {persona.riskLevel} ({persona.riskScore}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-1 gap-2">
                    <h3 className="font-space font-bold text-sm tracking-tight text-white group-hover:text-orbit-blue transition-colors truncate">
                      {persona.name}
                    </h3>
                    <span className="font-mono text-[9px] text-orbit-purple font-bold shrink-0">Age: {persona.ageRange || "18-24"}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2 h-7 font-mono leading-normal mb-3">
                    {persona.description}
                  </p>

                  <div className="grid grid-cols-2 gap-y-2.5 pt-3 border-t border-[rgba(255,255,255,0.06)] font-mono text-[10px]">
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Customers</span>
                      <span className="font-bold text-white">{persona.customerCount}</span>
                      <span className="text-gray-500 text-[9px] ml-1">({Math.round((persona.customerCount / totalCustomers) * 100)}%)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] uppercase">Rev Share</span>
                      <span className="font-bold text-orbit-success">{contributionPct}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[9px] uppercase">Avg Spend</span>
                      <span className="font-bold text-white">₹{(persona.averageSpend).toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] uppercase">Pred LTV</span>
                      <span className="font-bold text-orbit-blue">₹{(persona.predictedLtv).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[8.5px] font-mono text-gray-500 border-t border-[rgba(255,255,255,0.04)] pt-2 flex justify-between gap-2">
                    <span className="shrink-0 uppercase">Preferred Products:</span>
                    <span className="text-gray-300 font-bold truncate max-w-[150px]">{persona.preferredProducts || "N/A"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Detail / Analytics Tabs (40%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-1">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("insights")}
                className={`pb-2 font-mono text-[11px] font-bold uppercase tracking-wider relative transition-colors cursor-pointer ${
                  activeTab === "insights" ? "text-orbit-purple" : "text-gray-500 hover:text-gray-300"
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
                  activeTab === "analytics" ? "text-orbit-blue" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Analytics & Heatmaps
                {activeTab === "analytics" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orbit-blue" />
                )}
              </button>
            </div>
            {activePersona && (
              <span className="font-mono text-[9px] px-2 py-0.5 bg-gray-900 border border-gray-800 text-orbit-purple rounded-full uppercase">
                Active ID: {activePersona.id}
              </span>
            )}
          </div>

          {activePersona ? (
            <div className={`p-5 rounded-xl border ${
              isLight 
                ? "bg-white border-gray-200 text-gray-850" 
                : "bg-[#0F172A]/70 border-[rgba(255,255,255,0.08)]"
            }`}>
              {activeTab === "insights" ? (
                /* Tab 1: AI Insights Details */
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${getPersonaColorClass(activePersona.id).bg} ${getPersonaColorClass(activePersona.id).text} border ${getPersonaColorClass(activePersona.id).border}`}>
                      {React.createElement(getAvatarIcon(activePersona.avatar), { size: 20 })}
                    </div>
                    <div>
                      <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block">Customer DNA Archetype</span>
                      <h3 className="font-space font-bold text-base text-white">{activePersona.name}</h3>
                      <div className="flex flex-wrap gap-2 items-center mt-1 text-[9px] font-mono text-orbit-purple font-bold">
                        <span>Age Range: {activePersona.ageRange}</span>
                        <span className="text-gray-750 font-normal">•</span>
                        <span>Channel: {activePersona.preferredChannel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 bg-gray-950/40 p-3 rounded-lg border border-[rgba(255,255,255,0.04)] font-mono text-[10px]">
                    <span className="text-gray-500 uppercase text-[8px] tracking-wider block">Lifestyle & Description</span>
                    <p className="text-white leading-relaxed">{activePersona.description}</p>
                    <p className="text-gray-400 leading-relaxed mt-1">{activePersona.lifestyle}</p>
                  </div>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-white mb-1 uppercase tracking-wider">
                        <TrendingUp size={12} className="text-orbit-purple" />
                        <span>Buying Motivation</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 pl-4">{activePersona.motivation}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-white mb-1 uppercase tracking-wider">
                        <Target size={12} className="text-orbit-pink" />
                        <span>Buying Triggers</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 pl-4">{activePersona.buyingTriggers}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-white mb-1 uppercase tracking-wider">
                        <Award size={12} className="text-orbit-blue" />
                        <span>Preferred Products</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 pl-4">{activePersona.preferredProducts} (e.g. {activePersona.whatTheyBuy})</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-white mb-1 uppercase tracking-wider">
                        <Zap size={12} className="text-orbit-amber" />
                        <span>AI Insights & Targeting Strategy</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-300 pl-4 leading-normal bg-blue-500/5 p-2 rounded border border-blue-500/10">{activePersona.aiInsightsTargeting}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-white mb-1 uppercase tracking-wider">
                        <MessageSquare size={12} className="text-emerald-400" />
                        <span>Best Communication Channel</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 pl-4">{activePersona.bestCommChannel}</p>
                    </div>

                    <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-2 bg-purple-950/5 p-3 rounded-lg border border-purple-500/10">
                      <div className="flex items-center gap-1.5 font-space text-xs font-bold text-orbit-purple uppercase tracking-wider">
                        <Zap size={12} className="text-orbit-purple animate-pulse" />
                        <span>Recommended Campaign</span>
                      </div>
                      <p className="text-[11px] font-mono text-white font-bold">{activePersona.suggestedCampaign}</p>
                      <p className="text-[10px] font-mono text-gray-400 leading-relaxed pt-0.5">{activePersona.recommendedStrategy}</p>
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
                    <h4 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Revenue Contribution</span>
                      <span className="font-mono text-[10px] text-orbit-success">₹{(activePersona.predictedLtv * activePersona.customerCount).toLocaleString()} Total LTV</span>
                    </h4>
                    <div className="space-y-2.5">
                      {personas.map(p => {
                        const style = getPersonaColorClass(p.id);
                        return (
                          <div key={p.id} className="space-y-1">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className={p.id === activePersona.id ? "text-white font-bold" : "text-gray-400"}>{p.name}</span>
                              <span className="text-white font-bold">{p.revenueContributionPct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-[rgba(255,255,255,0.04)]">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  style.text === "text-purple-400" ? "bg-purple-500" :
                                  style.text === "text-pink-400" ? "bg-pink-500" :
                                  style.text === "text-amber-400" ? "bg-amber-500" :
                                  style.text === "text-orange-400" ? "bg-orange-500" : "bg-emerald-500"
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
                    <h4 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Persona Risk Heatmap
                    </h4>
                    <div className="space-y-2">
                      {[...personas].sort((a,b) => b.riskScore - a.riskScore).map(p => {
                        const score = p.riskScore;
                        let badgeColor = "bg-green-500/10 text-green-400 border border-green-500/25";
                        if (score >= 70) badgeColor = "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse";
                        else if (score >= 40) badgeColor = "bg-orange-500/15 text-orange-400 border border-orange-500/25";
                        else if (score >= 20) badgeColor = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";

                        return (
                          <div key={p.id} className="flex justify-between items-center p-2 rounded bg-gray-950/40 border border-[rgba(255,255,255,0.02)]">
                            <span className="font-mono text-[10px] text-gray-300">{p.name}</span>
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
                    <h4 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Revenue Growth Potential
                    </h4>
                    <div className="space-y-3 font-mono text-[10px]">
                      <div className="p-3 bg-gray-950/40 border border-[rgba(255,255,255,0.03)] rounded-lg space-y-2">
                        <div className="flex justify-between text-gray-400">
                          <span>Current average LTV:</span>
                          <span className="text-white">₹{activePersona.predictedLtv.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Target Revenue Potential:</span>
                          <span className="text-orbit-success font-bold">₹{activePersona.revenuePotential.toLocaleString()}</span>
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
                    <h4 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-3">
                      Persona Channel Preference Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {["WhatsApp", "Email", "SMS", "RCS"].map(channel => {
                        const channelPersonas = personas.filter(p => p.preferredChannel === channel);
                        const share = Math.round((channelPersonas.reduce((sum, p) => sum + p.customerCount, 0) / totalCustomers) * 100);
                        return (
                          <div key={channel} className="p-2.5 rounded bg-gray-950/40 border border-[rgba(255,255,255,0.03)] font-mono text-[10px] space-y-1">
                            <span className="text-gray-400 uppercase block text-[8px]">{channel}</span>
                            <div className="flex justify-between items-baseline">
                              <span className="text-white font-bold">{share}%</span>
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
            <div className="p-8 text-center text-gray-500 font-mono text-xs border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl">
              No persona selected. Re-run scan to synchronize customer base.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
