import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Radio, ArrowRight, Sparkles, RefreshCw, Terminal
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
  const { lunaMetrics, updateLunaMetrics, startMission } = useOrbit();
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

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
  } => ({
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
        reasoning: "Luna detected a 34% increase in abandoned checkout events over the last 7 days. Customers who abandoned carts have historically converted at 28% when contacted via WhatsApp within 24 hours.",
        color: "Yellow",
        angle: 45,
        distance: 65
      },
      {
        id: "opp_inactive_winback",
        title: "Inactive Customer Win-back",
        type: "Inactive",
        description: "Re-engage top VIP tier spenders inactive for 60+ days.",
        potentialRevenue: 15400,
        confidence: 88,
        audienceSize: 12,
        priorityScore: 88,
        recommendedAction: "Reduce Customer Churn",
        reasoning: "These high-value accounts have churn risk scores over 75% due to 60+ days of dormancy, representing a total revenue leak of ₹15,400.",
        color: "Purple",
        angle: 160,
        distance: 80
      },
      {
        id: "opp_vip_early_access",
        title: "VIP Early Access Opportunity",
        type: "VIP",
        description: "Reward top active VIP customers with early collection drops.",
        potentialRevenue: 18281,
        confidence: 94,
        audienceSize: 8,
        priorityScore: 92,
        recommendedAction: "Increase Customer LTV",
        reasoning: "Top loyalty tier customers exhibit positive feedback loops when engaged with early product releases, increasing LTV capacity.",
        color: "Green",
        angle: 290,
        distance: 45
      }
    ]
  });

  const performScan = async () => {
    setIsScanning(true);
    setScanLogs([]);
    setSelectedNodeId("");
    setOpportunitiesData(null);

    const logs = [
      "[Luna] Detecting revenue leaks across gateways...",
      "[Polaris] Clustering affected target audiences...",
      "[Vega] Computing ROI & conversion forecasts...",
      "[Nova] Preparing copywriting templates...",
      "[Atlas] Verifying queue status and dispatch nodes..."
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

      const data = await fetchPromise;
      setOpportunitiesData(data);
      
      if (data && data.opportunities) {
        updateLunaMetrics({
          recoverableRevenue: data.totalPotentialRevenue || 45600,
          abandonedLeads: data.opportunities.filter((o: any) => o.type === "Lead").reduce((sum: number, o: any) => sum + (o.audienceSize || 0), 0),
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
          text: "text-red-400",
          bg: "bg-red-400",
          border: "border-red-500/35",
          glow: "shadow-orbit-glow-red bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Yellow":
        return {
          text: "text-amber-400",
          bg: "bg-amber-400",
          border: "border-amber-500/35",
          glow: "shadow-orbit-glow-amber bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Green":
        return {
          text: "text-orbit-success",
          bg: "bg-orbit-success",
          border: "border-green-500/35",
          glow: "shadow-orbit-glow-green bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
      case "Purple":
      default:
        return {
          text: "text-orbit-purple",
          bg: "bg-orbit-purple",
          border: "border-purple-500/35",
          glow: "shadow-orbit-glow-purple bg-gradient-to-br from-[#0F172A] to-[#1E293B]"
        };
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative font-inter">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-10 z-0" />
      <div className="scanlines" />

      {/* ════════════════════════════════════════
          LEFT PANEL: RADAR GRAPHICS CHAMBER
      ════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative z-10 border-r border-gray-900">
        
        {/* Header */}
        <PageHeaderHUD
          title="Opportunity Radar"
          subtitle="CONTINUOUS REVENUE LEAK DETECTION NODE · POWERED BY LUNA"
          onSelectAgent={setSelectedAgent}
          actions={
            <button
              onClick={performScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 border border-gray-900 rounded-lg text-gray-450 font-mono text-[9px] cursor-pointer hover:border-gray-800 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={11} className={isScanning ? "animate-spin" : ""} />
              <span>Scan Channels</span>
            </button>
          }
        />

        {/* Sleek Summary Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-4 font-mono text-[9px]">
          <div className="orbit-panel p-3 bg-gray-950/45 border border-gray-900 rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left">
            <span className="text-gray-550 text-[7.5px] uppercase tracking-wider">Recoverable Revenue</span>
            <span className="text-orbit-success text-sm font-bold tracking-tight">
              {opportunitiesData ? `₹${opportunitiesData.totalPotentialRevenue.toLocaleString()}` : "₹0"}
            </span>
            <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-orbit-success/40 animate-pulse" />
          </div>
          <div className="orbit-panel p-3 bg-gray-950/45 border border-gray-900 rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left">
            <span className="text-gray-550 text-[7.5px] uppercase tracking-wider">Active Nodes</span>
            <span className="text-white text-sm font-bold tracking-tight">
              {opportunitiesData ? `${opportunitiesData.opportunities.length} Nodes` : "0 Nodes"}
            </span>
          </div>
          <div className="orbit-panel p-3 bg-gray-950/45 border border-gray-900 rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left">
            <span className="text-gray-550 text-[7.5px] uppercase tracking-wider">Highest Priority</span>
            <span className="text-pink-400 text-sm font-bold tracking-tight uppercase truncate block max-w-full">
              {opportunitiesData ? opportunitiesData.highestPriority : "Scanning..."}
            </span>
          </div>
          <div className="orbit-panel p-3 bg-gray-950/45 border border-gray-900 rounded-xl flex flex-col space-y-1 relative overflow-hidden text-left">
            <span className="text-gray-550 text-[7.5px] uppercase tracking-wider">Avg AI Confidence</span>
            <span className="text-orbit-purple text-sm font-bold tracking-tight">
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
            <div className="absolute inset-0 rounded-full border border-pink-500/10" />
            <div className="absolute inset-8 rounded-full border border-pink-500/10" />
            <div className="absolute inset-16 rounded-full border border-pink-500/15" />
            <div className="absolute inset-24 rounded-full border border-dashed border-pink-500/20" />
            <div className="absolute inset-32 rounded-full border border-pink-500/25 flex items-center justify-center">
              <Radio size={24} className="text-pink-400 animate-ping" />
            </div>

            {/* Sweep sweep scanning line */}
            {isScanning && (
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-pink-500/5 to-transparent pointer-events-none animate-radar-sweep"
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
                    isSelected ? "border-pink-400 bg-pink-400/5 opacity-80" : "border-gray-800 opacity-20"
                  }`} style={{ animationDuration: '3s' }} />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-[#050816] flex items-center justify-center transition-all ${
                    isSelected ? "bg-pink-400 scale-125 shadow-[0_0_15px_rgba(236,72,153,0.6)]" : `${colorConfig.bg} hover:scale-110`
                  }`} />
                  
                  {/* Tooltip detail tag */}
                  <span className="absolute left-5 top-0 bg-gray-950 border border-gray-900 rounded px-1.5 py-0.5 text-[8px] font-mono text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
        <div className="mt-4 border border-gray-900 bg-gray-950/70 rounded-xl p-3 flex flex-col space-y-1 font-mono text-[9px] leading-relaxed select-none relative overflow-hidden">
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-400 animate-ping" : "bg-orbit-success animate-pulse"}`} />
            <span className="text-[7.5px] text-gray-550 uppercase tracking-widest">{isScanning ? "Scanning Channels" : "Telemetry Standby"}</span>
          </div>
          <div className="text-gray-500 font-bold border-b border-gray-900 pb-1.5 mb-1.5 flex items-center gap-1 text-left">
            <Terminal size={11} className="text-pink-400" />
            <span>CHANNEL DISCOVERY TELEMETRY CONSOLE</span>
          </div>
          
          <div className="h-20 overflow-y-auto space-y-1 scrollbar-thin text-left pr-2">
            {scanLogs.length === 0 ? (
              <div className="text-gray-655 italic">System ready. Click "Scan Channels" to initiate detection.</div>
            ) : (
              scanLogs.map((log, idx) => {
                let colorClass = "text-gray-450";
                if (log.includes("[Warning]")) colorClass = "text-red-400";
                else if (log.includes("[System]")) colorClass = "text-pink-400 font-bold";
                else if (log.includes("[Luna]")) colorClass = "text-amber-400";
                else if (log.includes("[Polaris]")) colorClass = "text-orbit-blue";
                else if (log.includes("[Vega]")) colorClass = "text-orbit-purple";
                else if (log.includes("[Nova]")) colorClass = "text-pink-400";
                else if (log.includes("[Atlas]")) colorClass = "text-orbit-success";
                
                return (
                  <div key={idx} className={`${colorClass} flex gap-1.5`}>
                    <span className="text-gray-650 font-bold select-none">&gt;&gt;</span>
                    <p className="flex-1 whitespace-pre-wrap">{log}</p>
                  </div>
                );
              })
            )}
            {isScanning && (
              <div className="flex gap-1.5 text-pink-400/70 text-[9px]">
                <span className="text-gray-650 font-bold select-none">&gt;&gt;</span>
                <span className="animate-pulse">Mapping digital coordinates...</span>
                <span className="inline-block w-1 bg-pink-400 animate-pulse h-3" />
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════
          RIGHT COLUMN: DETAILS & ACTIONS
      ════════════════════════════════════════ */}
      <aside className="w-72 lg:w-80 shrink-0 flex flex-col bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        
        {/* Opportunity Score Indicator */}
        <div className="orbit-panel p-4 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 pointer-events-none filter blur-xl" />
          <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider block border-b border-gray-900 w-full pb-2 mb-1">
            Global Revenue Leakage
          </h2>
          
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" fill="transparent" stroke="#111827" strokeWidth="6" />
              <circle 
                cx="56" 
                cy="56" 
                r="46" 
                fill="transparent" 
                stroke="#EC4899" 
                strokeWidth="6" 
                strokeDasharray={2 * Math.PI * 46} 
                strokeDashoffset={2 * Math.PI * 46 * (1 - (lunaMetrics.opportunityScore || 85) / 100)} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-[7px] text-gray-550 uppercase">Opportunity</span>
              <span className="text-xl font-bold text-white tracking-tight">{lunaMetrics.opportunityScore || 85}%</span>
              <span className="text-[7px] text-pink-400 font-bold uppercase mt-0.5">Optimal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full text-left font-mono text-[9px] border-t border-gray-900 pt-3">
            <div>
              <span className="text-gray-555 block text-[7px] uppercase font-semibold">Recoverable Rev</span>
              <span className="text-orbit-success font-bold">₹{(lunaMetrics.recoverableRevenue || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-555 block text-[7px] uppercase font-semibold">Target Leaks</span>
              <span className="text-white font-bold">{(lunaMetrics.abandonedLeads || 0) + (lunaMetrics.inactiveCustomers || 0)} nodes</span>
            </div>
          </div>
        </div>

        {/* Selected blip node breakdown */}
        {selectedNode ? (
          <div className={`orbit-panel p-4 space-y-3.5 transition-all duration-300 border ${
            getColorClasses(selectedNode.color).border
          } bg-gradient-to-br from-[#0F172A] to-[#1E293B] shadow-lg rounded-xl text-left`}>
            <div className="border-b border-gray-900/60 pb-2.5">
              <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest block">Opportunity Node Focus</span>
              <h3 className="font-space text-xs font-bold text-white uppercase tracking-tight mt-0.5">{selectedNode.title}</h3>
            </div>

            <div className="space-y-2.5 font-mono text-[9px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Segment category:</span>
                <span className="text-white font-bold uppercase">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Node volume:</span>
                <span className="text-white font-bold">{selectedNode.audienceSize} targets</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Potential revenue yield:</span>
                <span className="text-orbit-success font-bold">₹{selectedNode.potentialRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">AI Confidence:</span>
                <span className="text-pink-400 font-bold">{selectedNode.confidence}%</span>
              </div>
              
              <p className="text-gray-450 text-[8.5px] leading-relaxed border-t border-gray-900/60 pt-2.5 mt-2.5">
                {selectedNode.description}
              </p>

              {/* WHY LUNA FOUND THIS */}
              <div className="border-t border-gray-900/60 pt-2.5 mt-2.5">
                <span className="font-bold text-white block mb-1 uppercase text-[8px] tracking-wider text-pink-400">Why Luna Found This:</span>
                <p className="text-gray-450 text-[8.5px] leading-relaxed italic bg-black/20 p-2 rounded border border-gray-900">
                  "{selectedNode.reasoning}"
                </p>
              </div>
            </div>

            <button
              onClick={() => handleLaunchCampaign(selectedNode.recommendedAction)}
              disabled={isLaunching}
              className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
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
          <div className="orbit-panel p-4 text-center text-gray-550 font-mono text-[9.5px]">
            No opportunity node focused. Run a scan to discover active nodes.
          </div>
        )}

        {/* AI Recommendations */}
        <div className="orbit-panel p-4 space-y-3 flex-1 flex flex-col min-h-[220px]">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2 shrink-0 text-left">
            <Sparkles size={12} className="text-orbit-purple" />
            Luna Actions
          </h3>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            {opportunities.map((opp) => {
              const colorConfig = getColorClasses(opp.color);
              const isSelected = selectedNodeId === opp.id;
              
              return (
                <div 
                  key={opp.id} 
                  onClick={() => setSelectedNodeId(opp.id)}
                  className={`border p-2.5 rounded-lg space-y-1 font-mono text-[8.5px] bg-[#0F172A]/80 transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left ${
                    isSelected ? "border-pink-500/50 bg-pink-500/5 shadow-[0_0_10px_rgba(236,72,153,0.1)]" : `${colorConfig.border} hover:border-gray-800`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${colorConfig.text}`}>{opp.title}</span>
                    <span className="text-orbit-success font-bold">₹{opp.potentialRevenue.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-300 leading-normal line-clamp-2">{opp.description}</p>
                  <div className="flex justify-between text-[7.5px] border-t border-[rgba(255,255,255,0.06)] pt-1 mt-1">
                    <span className="text-gray-400">Confidence: {opp.confidence}%</span>
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
