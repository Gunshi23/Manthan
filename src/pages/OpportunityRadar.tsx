import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Radio, ArrowRight, Sparkles, RefreshCw, Terminal,
  MapPin, Award, ShieldAlert, TrendingUp
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

interface OpportunityNode {
  id: string;
  title: string;
  type: "Lead" | "Inactive" | "VIP" | "Prospect";
  description: string;
  potentialRevenue: number;
  confidence: number;
  audienceSize: number;
  priorityScore: number;
  recommendedAction: "Recover Lost Revenue" | "Reduce Customer Churn" | "Increase Customer LTV" | "Acquire New Customers";
  reasoning: string;
  color: "Green" | "Yellow" | "Red" | "Purple";
  angle: number;
  distance: number;
}

interface OpportunityRadarProps {
  onNavigate?: (page: any) => void;
}

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({ onNavigate }) => {
  const { theme, lunaMetrics, updateLunaMetrics, startMission, personas, latestVerdict } = useOrbit();
  const [selectedAgent, setSelectedAgent] = useState<"Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya" | null>(null);

  const isLight = theme === "executive";

  const [opportunitiesData, setOpportunitiesData] = useState<{
    totalPotentialRevenue: number;
    highestPriority: string;
    opportunities: OpportunityNode[];
  } | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scanLogs, isScanning]);

  const getFallbackPayload = (): {
    totalPotentialRevenue: number;
    highestPriority: string;
    opportunities: OpportunityNode[];
  } => {
    if (personas && personas.length > 0) {
      const opps = personas.map((p, idx): OpportunityNode => {
        let nodeType: "Lead" | "Inactive" | "VIP" | "Prospect" = "Lead";
        if (p.id.includes("vip") || p.id.includes("premium")) nodeType = "VIP";
        else if (p.id.includes("dormant") || p.id.includes("homemaker") || p.id.includes("traditional") || p.id.includes("festival")) nodeType = "Inactive";
        else if (p.id.includes("new") || p.id.includes("genz")) nodeType = "Prospect";

        let recommendedAction: OpportunityNode["recommendedAction"] = "Increase Customer LTV";
        if (p.id.includes("vip") || p.id.includes("premium")) recommendedAction = "Increase Customer LTV";
        else if (p.id.includes("dormant") || p.id.includes("homemaker") || p.id.includes("traditional")) recommendedAction = "Reduce Customer Churn";
        else if (p.id.includes("value") || p.id.includes("festival")) recommendedAction = "Recover Lost Revenue";
        else if (p.id.includes("new") || p.id.includes("genz") || p.id.includes("professional")) recommendedAction = "Acquire New Customers";

        let color: "Purple" | "Yellow" | "Green" | "Red" = "Yellow";
        if (p.id.includes("vip") || p.id.includes("premium")) color = "Purple";
        else if (p.id.includes("dormant") || p.id.includes("homemaker") || p.id.includes("traditional")) color = "Yellow";
        else if (p.id.includes("trend") || p.id.includes("festival")) color = "Red";
        else if (p.id.includes("value")) color = "Red";
        else if (p.id.includes("new") || p.id.includes("genz") || p.id.includes("professional")) color = "Green";

        const angles = [45, 110, 160, 220, 290, 340, 75, 200];
        const distances = [65, 80, 45, 70, 55, 75, 60, 85];

        const potentialRev = Math.round(p.revenuePotential) || 15000;

        return {
          id: `opp_${p.id}`,
          title: p.name,
          type: nodeType,
          description: p.recommendedStrategy,
          potentialRevenue: potentialRev,
          confidence: p.loyaltyScore,
          audienceSize: p.customerCount,
          priorityScore: Math.round((p.revenueContributionPct + p.loyaltyScore) / 2),
          recommendedAction,
          reasoning: `${p.name} represents ${p.customerCount} customers contributing ${p.revenueContributionPct}% of revenue. Recommended Strategy: ${p.recommendedStrategy}. Why they buy: ${p.whyTheyBuy}`,
          color,
          angle: angles[idx % angles.length],
          distance: distances[idx % distances.length]
        };
      });

      const totalPotentialRevenue = opps.reduce((sum, o) => sum + o.potentialRevenue, 0);
      const highestPriority = opps.reduce((max, o) => o.priorityScore > max.priorityScore ? o : max, opps[0]).title;

      return {
        totalPotentialRevenue,
        highestPriority,
        opportunities: opps
      };
    }

    // Default static fallback if personas empty
    return {
      totalPotentialRevenue: 45600,
      highestPriority: "Abandoned Cart Recovery",
      opportunities: [
        {
          id: "opp_cart_recovery",
          title: "Abandoned Cart Recovery",
          type: "Lead",
          description: "17 customer nodes left checkout with items.",
          potentialRevenue: 11919,
          confidence: 91,
          audienceSize: 17,
          priorityScore: 95,
          recommendedAction: "Recover Lost Revenue",
          reasoning: "Pragya detected a 34% increase in abandoned checkout events over the last 7 days. Customers who abandoned carts have historically converted at 28% when contacted via WhatsApp within 24 hours.",
          color: "Yellow",
          angle: 45,
          distance: 65
        }
      ]
    };
  };

  const performScan = async () => {
    setIsScanning(true);
    setScanLogs([]);
    setSelectedNodeId("");
    setOpportunitiesData(null);

    const logs = [
      "[Pragya] Detecting revenue leaks across gateways...",
      "[Drishti] Clustering affected target audiences...",
      "[Khoj] Computing ROI & conversion forecasts...",
      "[Rachna] Preparing copywriting templates...",
      "[Saarthi] Verifying queue status and dispatch nodes..."
    ];

    const fetchPromise = fetch("/api/opportunities").then(async (res) => {
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return res.json();
    });

    try {
      for (let i = 0; i < logs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setScanLogs(prev => [...prev, `[System] Node ${i + 1}/5: ${logs[i]}`]);
      }

      let data = await fetchPromise;
      if (personas && personas.length > 0) {
        data = getFallbackPayload();
      }
      setOpportunitiesData(data);
      
      if (data && data.opportunities) {
        updateLunaMetrics({
          recoverableRevenue: data.totalPotentialRevenue || 45600,
          abandonedLeads: data.opportunities.filter((o: any) => o.type === "Lead" || o.type === "Prospect").reduce((sum: number, o: any) => sum + (o.audienceSize || 0), 0),
          inactiveCustomers: data.opportunities.filter((o: any) => o.type === "Inactive").reduce((sum: number, o: any) => sum + (o.audienceSize || 0), 0),
          recoveryConfidence: Math.round(data.opportunities.reduce((sum: number, o: any) => sum + (o.confidence || 0), 0) / data.opportunities.length) || 90
        });
      }
      
      setScanLogs(prev => [...prev, "[System] Scan complete. 100% of channels mapped successfully."]);
      setIsScanning(false);
    } catch (err: any) {
      console.warn("Scan failed, loading fallback metrics:", err);
      const fallback = getFallbackPayload();
      setOpportunitiesData(fallback);
      
      updateLunaMetrics({
        recoverableRevenue: fallback.totalPotentialRevenue,
        abandonedLeads: fallback.opportunities.filter(o => o.type === "Lead").reduce((sum, o) => sum + o.audienceSize, 0),
        inactiveCustomers: fallback.opportunities.filter(o => o.type === "Inactive").reduce((sum, o) => sum + o.audienceSize, 0),
        recoveryConfidence: 91
      });
      
      setScanLogs(prev => [
        ...prev, 
        `[Warning] Backend service error: ${err.message || err}`,
        "[System] Loaded default pre-computed opportunity registers."
      ]);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    performScan();
  }, []);

  const opportunities = opportunitiesData?.opportunities || [];

  const selectedNode = useMemo(() => {
    return opportunities.find(n => n.id === selectedNodeId) || opportunities[0];
  }, [opportunities, selectedNodeId]);

  useEffect(() => {
    if (opportunities.length > 0 && !selectedNodeId) {
      setSelectedNodeId(opportunities[0].id);
    }
  }, [opportunities, selectedNodeId]);

  const handleLaunchCampaign = async (goal: string) => {
    setIsLaunching(true);
    setLaunchStatus("Initializing core objectives...");
    startMission(goal);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setLaunchStatus("Calibrating agent coordination pathways...");
    await new Promise(resolve => setTimeout(resolve, 600));
    setLaunchStatus("Redirecting dispatcher node...");
    await new Promise(resolve => setTimeout(resolve, 400));
    
    setIsLaunching(false);
    if (onNavigate) {
      onNavigate("command-center");
    }
  };

  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case "Red":
        return {
          text: isLight ? "text-red-600" : "text-red-400",
          bg: isLight ? "bg-red-500" : "bg-red-400",
          border: isLight ? "border-red-200" : "border-red-500/35",
          glow: isLight ? "bg-white shadow-sm border border-slate-200" : "shadow-Manthan-glow-red bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Yellow":
        return {
          text: isLight ? "text-amber-600" : "text-amber-400",
          bg: isLight ? "bg-amber-500" : "bg-amber-400",
          border: isLight ? "border-amber-200" : "border-amber-500/35",
          glow: isLight ? "bg-white shadow-sm border border-slate-200" : "shadow-Manthan-glow-amber bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Green":
        return {
          text: isLight ? "text-emerald-600" : "text-Manthan-success",
          bg: isLight ? "bg-emerald-500" : "bg-Manthan-success",
          border: isLight ? "border-emerald-200" : "border-green-500/35",
          glow: isLight ? "bg-white shadow-sm border border-slate-200" : "shadow-Manthan-glow-green bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Purple":
      default:
        return {
          text: isLight ? "text-purple-600" : "text-Manthan-purple",
          bg: isLight ? "bg-purple-500" : "bg-Manthan-purple",
          border: isLight ? "border-purple-200" : "border-purple-500/35",
          glow: isLight ? "bg-white shadow-sm border border-slate-200" : "shadow-Manthan-glow-purple bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
    }
  };

  return (
    <div className={`flex-1 flex overflow-hidden relative font-inter ${isLight ? "bg-slate-50" : "bg-[#050816]"}`}>
      {/* Background Matrix overlays */}
      <div className={`pointer-events-none absolute inset-0 space-grid z-0 ${isLight ? "opacity-15" : "opacity-30"}`} />
      <div className="pointer-events-none absolute inset-0 bg-Manthan-glow-blue opacity-10 z-0" />
      {!isLight && <div className="scanlines" />}

      {/* ════════════════════════════════════════
          LEFT PANEL: RADAR GRAPHICS CHAMBER
      ════════════════════════════════════════ */}
      <main className={`flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative z-10 border-r ${
        isLight ? "border-slate-200" : "border-gray-900"
      }`}>
        
        {/* Header */}
        <PageHeaderHUD
          title="Opportunity Radar"
          subtitle="CONTINUOUS REVENUE LEAK DETECTION NODE · POWERED BY Pragya"
          onSelectAgent={setSelectedAgent}
          actions={
            <button
              onClick={performScan}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg font-mono text-[9px] cursor-pointer transition-all disabled:opacity-50 ${
                isLight ? "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 shadow-sm" : "bg-gray-950 border-gray-900 text-gray-455 hover:border-gray-800 hover:text-white"
              }`}
            >
              <RefreshCw size={11} className={isScanning ? "animate-spin" : ""} />
              <span>Scan Channels</span>
            </button>
          }
        />

        {/* Sleek Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-4 font-mono text-[9px]">
          <div className={`Manthan-panel p-3 border rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-950/45 border-gray-900"
          }`}>
            <span className="text-gray-555 text-[7.5px] uppercase tracking-wider">Recoverable Revenue</span>
            <span className="text-emerald-600 text-sm font-bold tracking-tight">
              {opportunitiesData ? `₹${opportunitiesData.totalPotentialRevenue.toLocaleString()}` : "₹0"}
            </span>
            <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-Manthan-success/40 animate-pulse" />
          </div>
          <div className={`Manthan-panel p-3 border rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-950/45 border-gray-900"
          }`}>
            <span className="text-gray-555 text-[7.5px] uppercase tracking-wider">Active Nodes</span>
            <span className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>
              {opportunitiesData ? `${opportunitiesData.opportunities.length} Nodes` : "0 Nodes"}
            </span>
          </div>
          <div className={`Manthan-panel p-3 border rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-950/45 border-gray-900"
          }`}>
            <span className="text-gray-555 text-[7.5px] uppercase tracking-wider">Highest Priority</span>
            <span className="text-pink-500 text-sm font-bold tracking-tight uppercase truncate block max-w-full">
              {opportunitiesData ? opportunitiesData.highestPriority : "Scanning..."}
            </span>
          </div>
          <div className={`Manthan-panel p-3 border rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-gray-950/45 border-gray-900"
          }`}>
            <span className="text-gray-555 text-[7.5px] uppercase tracking-wider">Avg AI Confidence</span>
            <span className="text-Manthan-purple text-sm font-bold tracking-tight">
              {opportunitiesData && opportunitiesData.opportunities.length > 0
                ? `${Math.round(opportunitiesData.opportunities.reduce((acc, o) => acc + o.confidence, 0) / opportunitiesData.opportunities.length)}%` 
                : "0%"}
            </span>
          </div>
        </div>

        {/* Circular Radar Sweep visual */}
        <div className="flex-1 flex items-center justify-center min-h-[350px] relative">
          
          {/* Main concentric radar frame */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* outer rings */}
            <div className={`absolute inset-0 rounded-full border ${isLight ? "border-blue-500/10" : "border-pink-500/10"}`} />
            <div className={`absolute inset-8 rounded-full border ${isLight ? "border-blue-500/10" : "border-pink-500/10"}`} />
            <div className={`absolute inset-16 rounded-full border ${isLight ? "border-blue-500/15" : "border-pink-500/15"}`} />
            <div className={`absolute inset-24 rounded-full border border-dashed ${isLight ? "border-blue-500/20" : "border-pink-500/20"}`} />
            <div className={`absolute inset-32 rounded-full border ${isLight ? "border-blue-500/25" : "border-pink-500/25"} flex items-center justify-center`}>
              <Radio size={24} className={`${isLight ? "text-blue-500" : "text-pink-400"} animate-ping`} />
            </div>

            {/* Sweep sweep scanning line */}
            {isScanning && (
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-transparent pointer-events-none animate-radar-sweep ${
                  isLight ? "via-blue-500/5" : "via-pink-500/5"
                }`}
                style={{ transformOrigin: "center center" }}
              />
            )}

            {/* Opportunity coordinate blips */}
            {!isScanning && opportunities.map((n) => {
              // Convert polar coordinates to X/Y
              const rad = (n.angle * Math.PI) / 180;
              const radiusPixels = (n.distance / 100) * 160; // 160 is max radius (half of 320)
              const x = 160 + Math.cos(rad) * radiusPixels;
              const y = 160 + Math.sin(rad) * radiusPixels;
              
              const isSelected = selectedNodeId === n.id;
              const colorConfig = getColorClasses(n.color);
              
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  style={{ 
                    left: `${(x / 320) * 100}%`, 
                    top: `${(y / 320) * 100}%`,
                    transform: `translate(-50%, -50%) scale(${0.8 + Math.min(1.2, (n.potentialRevenue / 30000) * 0.8)})`
                  }}
                  className="absolute group cursor-pointer z-20 focus:outline-none"
                >
                  <span className={`absolute -inset-2.5 rounded-full border animate-ping ${
                    isSelected 
                      ? isLight ? "border-blue-400 bg-blue-400/5 opacity-80" : "border-pink-400 bg-pink-400/5 opacity-80" 
                      : "border-gray-800 opacity-20"
                  }`} style={{ animationDuration: '3s' }} />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isLight ? "border-white" : "border-[#050816]"
                  } ${
                    isSelected 
                      ? isLight ? "bg-blue-600 scale-125 shadow-[0_0_15px_rgba(37,99,235,0.6)]" : "bg-pink-400 scale-125 shadow-[0_0_15px_rgba(236,72,153,0.6)]"
                      : `${colorConfig.bg} hover:scale-110`
                  }`} />
                  
                  {/* Tooltip detail tag */}
                  <span className={`absolute left-5 top-0 border rounded px-1.5 py-0.5 text-[8px] font-mono pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 ${
                    isLight ? "bg-white border-slate-200 text-slate-600 shadow-md" : "bg-gray-950 border-gray-900 text-gray-400"
                  }`}>
                    ₹{n.potentialRevenue.toLocaleString()} ({n.type})
                  </span>
                </button>
              );
            })}

            {/* Telemetry labels around the radar */}
            <div className="absolute top-1 left-1 font-mono text-[7px] text-gray-655">AZ: 045°</div>
            <div className="absolute top-1 right-1 font-mono text-[7px] text-gray-655">RANGE: WIDE</div>
            <div className="absolute bottom-1 left-1 font-mono text-[7px] text-gray-655">FREQ: 14.2GHz</div>
            <div className="absolute bottom-1 right-1 font-mono text-[7px] text-gray-655">NODE: LUNA_RDR</div>
          </div>
        </div>

        {/* Telemetry Console Log */}
        <div className={`mt-4 border rounded-xl p-3 flex flex-col space-y-1 font-mono text-[9px] leading-relaxed select-none relative overflow-hidden text-left ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "border-gray-900 bg-gray-950/70"
        }`}>
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-400 animate-ping" : "bg-emerald-600 animate-pulse"}`} />
            <span className="text-[7.5px] text-gray-550 uppercase tracking-widest">{isScanning ? "Scanning Channels" : "Telemetry Standby"}</span>
          </div>
          <div className={`font-bold border-b pb-1.5 mb-1.5 flex items-center gap-1 text-left ${
            isLight ? "border-slate-100 text-slate-600" : "border-gray-900 text-gray-500"
          }`}>
            <Terminal size={11} className={isLight ? "text-blue-500" : "text-pink-400"} />
            <span>CHANNEL DISCOVERY TELEMETRY CONSOLE</span>
          </div>
          
          <div className="h-20 overflow-y-auto space-y-1 scrollbar-thin text-left pr-2">
            {scanLogs.length === 0 ? (
              <div className="text-gray-655 italic">System ready. Click "Scan Channels" to initiate detection.</div>
            ) : (
              scanLogs.map((log, idx) => {
                let colorClass = isLight ? "text-slate-600" : "text-gray-450";
                if (log.includes("[Warning]")) colorClass = "text-red-500";
                else if (log.includes("[System]")) colorClass = isLight ? "text-blue-600 font-bold" : "text-pink-400 font-bold";
                else if (log.includes("[Pragya]")) colorClass = "text-amber-600";
                else if (log.includes("[Drishti]")) colorClass = "text-blue-600";
                else if (log.includes("[Khoj]")) colorClass = "text-purple-600";
                else if (log.includes("[Rachna]")) colorClass = isLight ? "text-pink-600 animate-pulse" : "text-pink-400";
                else if (log.includes("[Saarthi]")) colorClass = "text-emerald-600";
                
                return (
                  <div key={idx} className={`${colorClass} flex gap-1.5`}>
                    <span className="text-gray-650 font-bold select-none">&gt;&gt;</span>
                    <p className="flex-1 whitespace-pre-wrap">{log}</p>
                  </div>
                );
              })
            )}
            {isScanning && (
              <div className={`text-[9px] flex gap-1.5 ${isLight ? "text-blue-500/80" : "text-pink-400/70"}`}>
                <span className="text-gray-650 font-bold select-none">&gt;&gt;</span>
                <span className="animate-pulse">Mapping digital coordinates...</span>
                <span className={`inline-block w-1 animate-pulse h-3 ${isLight ? "bg-blue-500" : "bg-pink-400"}`} />
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT COLUMN: DETAILS & ACTIONS
      ════════════════════════════════════════ */}
      <aside className={`w-72 lg:w-80 shrink-0 flex flex-col p-4 space-y-4 overflow-y-auto relative z-10 border-l ${
        isLight ? "bg-white border-slate-200" : "bg-gray-950/45 border-gray-900/60 backdrop-blur-md"
      }`}>
        
        {/* Opportunity Score Indicator */}
        <div className={`Manthan-panel p-4 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden ${
          isLight ? "bg-slate-50 border-slate-200" : "bg-gray-950/45 border-gray-900"
        }`}>
          <div className={`absolute top-0 right-0 w-16 h-16 pointer-events-none filter blur-xl ${isLight ? "bg-blue-500/5" : "bg-pink-500/10"}`} />
          <h2 className={`font-space text-xs font-bold uppercase tracking-wider block border-b w-full pb-2 mb-1 ${
            isLight ? "border-slate-200 text-slate-700" : "border-gray-900 text-white"
          }`}>
            Global Revenue Leakage
          </h2>
          
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" fill="transparent" stroke={isLight ? "#E2E8F0" : "#111827"} strokeWidth="6" />
              <circle 
                cx="56" 
                cy="56" 
                r="46" 
                fill="transparent" 
                stroke={isLight ? "#2563EB" : "#EC4899"} 
                strokeWidth="6" 
                strokeDasharray={2 * Math.PI * 46} 
                strokeDashoffset={2 * Math.PI * 46 * (1 - (lunaMetrics.opportunityScore || 85) / 100)} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-[7px] text-gray-550 uppercase">Opportunity</span>
              <span className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-800" : "text-white"}`}>{lunaMetrics.opportunityScore || 85}%</span>
              <span className={`text-[7px] font-bold uppercase mt-0.5 ${isLight ? "text-blue-600" : "text-pink-400"}`}>Optimal</span>
            </div>
          </div>

          <div className={`grid grid-cols-2 gap-2 w-full text-left font-mono text-[9px] border-t pt-3 ${
            isLight ? "border-slate-200" : "border-gray-900"
          }`}>
            <div>
              <span className="text-gray-555 block text-[7px] uppercase font-semibold">Recoverable Rev</span>
              <span className="text-emerald-600 font-bold">₹{(lunaMetrics.recoverableRevenue || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-555 block text-[7px] uppercase font-semibold">Target Leaks</span>
              <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{(lunaMetrics.abandonedLeads || 0) + (lunaMetrics.inactiveCustomers || 0)} nodes</span>
            </div>
          </div>
        </div>

        {/* Selected blip node breakdown */}
        {selectedNode ? (
          <div className={`Manthan-panel p-4 space-y-3.5 transition-all duration-300 border shadow-lg rounded-xl text-left ${
            isLight ? "bg-white border-slate-200" : `bg-gradient-to-br from-[#0F172A] to-[#1E293B] ${getColorClasses(selectedNode.color).border}`
          }`}>
            <div className={`border-b pb-2.5 ${isLight ? "border-slate-100" : "border-gray-900/60"}`}>
              <span className="font-mono text-[8px] text-gray-555 uppercase tracking-widest block">Opportunity Node Focus</span>
              <h3 className={`font-space text-xs font-bold uppercase tracking-tight mt-0.5 ${
                isLight ? "text-slate-800" : "text-white"
              }`}>{selectedNode.title}</h3>
            </div>

            <div className={`space-y-2.5 font-mono text-[9px] ${isLight ? "text-slate-650" : "text-gray-300"}`}>
              <div className="flex justify-between">
                <span className="text-gray-555">Segment category:</span>
                <span className={`font-bold uppercase ${isLight ? "text-slate-700" : "text-white"}`}>{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-555">Node volume:</span>
                <span className={`font-bold ${isLight ? "text-slate-700" : "text-white"}`}>{selectedNode.audienceSize} targets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-555">Potential revenue yield:</span>
                <span className="text-emerald-600 font-bold">₹{selectedNode.potentialRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-555">AI Confidence:</span>
                <span className={`font-bold ${isLight ? "text-blue-600" : "text-pink-400"}`}>{selectedNode.confidence}%</span>
              </div>
              
              <p className={`text-[8.5px] leading-relaxed border-t pt-2.5 mt-2.5 ${
                isLight ? "border-slate-100 text-slate-500" : "border-gray-900/60 text-gray-450"
              }`}>
                {selectedNode.description}
              </p>

              {/* WHY Pragya FOUND THIS */}
              <div className={`border-t pt-2.5 mt-2.5 ${isLight ? "border-slate-100" : "border-gray-900/60"}`}>
                <span className={`font-bold block mb-1 uppercase text-[8px] tracking-wider ${
                  isLight ? "text-blue-600" : "text-pink-400"
                }`}>Why Pragya Found This:</span>
                <p className={`text-[8.5px] leading-relaxed italic p-2 rounded border ${
                  isLight ? "bg-slate-50 border-slate-150 text-slate-600" : "bg-black/20 border-gray-900 text-gray-455"
                }`}>
                  "{selectedNode.reasoning}"
                </p>
              </div>
            </div>

            <button
              onClick={() => handleLaunchCampaign(selectedNode.recommendedAction)}
              disabled={isLaunching}
              className={`w-full py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                isLight ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-pink-500 hover:bg-pink-600 text-white"
              }`}
            >
              {isLaunching ? (
                <span className="animate-pulse">{launchStatus}</span>
              ) : (
                <>
                  <span>Launch Recovery Mission</span>
                  <ArrowRight size={10} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {latestVerdict ? (
              <div className={`Manthan-panel p-4 space-y-3 text-left ${isLight ? "bg-slate-50 border-slate-200" : "bg-gray-900 border-gray-800"}`}>
                <h3 className={`font-space text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 ${
                  isLight ? "border-slate-200 text-slate-800" : "border-gray-900 text-white"
                }`}>
                  <ShieldAlert size={12} className={`${isLight ? "text-blue-500" : "text-pink-500"} animate-pulse`} />
                  Active Trend Intel
                </h3>
                
                <div className="font-mono text-[9px] space-y-2.5">
                  {/* Trend Shift Alert */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-gray-500 uppercase font-bold tracking-wider block flex items-center gap-1">
                      <TrendingUp size={9} className={isLight ? "text-blue-500" : "text-pink-400"} />
                      Trend Shift Alert
                    </span>
                    <p className={`text-xs leading-relaxed p-2 rounded border ${
                      isLight ? "bg-white border-slate-200 text-slate-700" : "bg-black/20 border-gray-900 text-gray-300"
                    }`}>
                      Active consumer demand shift in <span className={`font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{latestVerdict.region}</span> from <span className="text-red-500 font-semibold">{latestVerdict.currentTrend}</span> to <span className="text-emerald-600 font-semibold">{latestVerdict.futureTrend}</span>.
                    </p>
                  </div>

                  {/* Persona Demand Changes */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-gray-500 uppercase font-bold tracking-wider block flex items-center gap-1">
                      <Award size={9} className="text-blue-500" />
                      Persona Demand Changes
                    </span>
                    <div className={`p-2 rounded border space-y-1 ${
                      isLight ? "bg-white border-slate-200 text-slate-600" : "bg-black/20 border-gray-900 text-gray-400"
                    }`}>
                      <div>
                        Cohort: <span className="text-blue-600 font-bold">{latestVerdict.targetPersona}</span>
                      </div>
                      <div>
                        Adoption Speed: <span className={isLight ? "text-slate-800" : "text-white"}>Accelerating</span>
                      </div>
                      <div>
                        Target ROI: <span className={`font-bold ${isLight ? "text-slate-850" : "text-white"}`}>{latestVerdict.expectedRoi}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Regional Opportunities */}
                  <div className="space-y-1">
                    <span className="text-[7.5px] text-gray-500 uppercase font-bold tracking-wider block flex items-center gap-1">
                      <MapPin size={9} className="text-Manthan-purple" />
                      Regional Opportunity
                    </span>
                    <div className={`p-2 rounded border flex items-center justify-between ${
                      isLight ? "bg-white border-slate-200 text-slate-600" : "bg-black/20 border-gray-900 text-gray-455"
                    }`}>
                      <div>
                        Zone: <span className={isLight ? "text-slate-850 font-bold" : "text-white font-bold"}>{latestVerdict.region}</span>
                      </div>
                      <div>
                        Value: <span className="text-emerald-600 font-bold">₹{latestVerdict.revenueOpportunity.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="Manthan-panel p-4 text-center text-gray-555 font-mono text-[9.5px]">
                No opportunity node focused. Run a scan to discover active nodes.
              </div>
            )}
          </div>
        )}

        {/* AI Recommendations */}
        <div className={`Manthan-panel p-4 space-y-3 flex-1 flex flex-col min-h-[220px] ${
          isLight ? "bg-slate-50 border-slate-200" : "bg-gray-950/45 border-gray-900"
        }`}>
          <h3 className={`font-space text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 shrink-0 text-left ${
            isLight ? "border-slate-200 text-slate-800" : "border-gray-900 text-white"
          }`}>
            <Sparkles size={12} className="text-Manthan-purple" />
            Pragya Actions
          </h3>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            {opportunities.map((opp) => {
              const colorConfig = getColorClasses(opp.color);
              const isSelected = selectedNodeId === opp.id;
              
              return (
                <div 
                  key={opp.id} 
                  onClick={() => setSelectedNodeId(opp.id)}
                  className={`border p-2.5 rounded-lg space-y-1 font-mono text-[8.5px] transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left ${
                    isSelected 
                      ? isLight ? "border-blue-400 bg-blue-50/50 shadow-sm" : "border-pink-500/50 bg-pink-500/5 shadow-[0_0_10px_rgba(236,72,153,0.1)]" 
                      : isLight ? "border-slate-200 bg-white hover:border-slate-300" : `${colorConfig.border} bg-[#0F172A]/80 hover:border-gray-800`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${colorConfig.text}`}>{opp.title}</span>
                    <span className="text-emerald-600 font-bold">₹{opp.potentialRevenue.toLocaleString()}</span>
                  </div>
                  <p className={`leading-normal line-clamp-2 ${isLight ? "text-slate-500" : "text-gray-300"}`}>{opp.description}</p>
                  <div className={`flex justify-between text-[7.5px] border-t pt-1 mt-1 ${
                    isLight ? "border-slate-100" : "border-[rgba(255,255,255,0.06)]"
                  }`}>
                    <span className="text-gray-555">Confidence: {opp.confidence}%</span>
                    <span 
                      className={`font-semibold hover:underline cursor-pointer ${colorConfig.text}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchCampaign(opp.recommendedAction);
                      }}
                    >
                      Launch Directive
                    </span>
                  </div>
                </div>
              );
            })}
            {opportunities.length === 0 && !isScanning && (
              <div className="text-gray-655 italic text-center py-4">No recommendations available.</div>
            )}
            {isScanning && (
              <div className="text-gray-655 italic text-center py-4 animate-pulse">Running AI analysis...</div>
            )}
          </div>
        </div>

      </aside>
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default OpportunityRadar;
