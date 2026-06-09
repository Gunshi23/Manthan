import React, { useState, useMemo } from "react";
import { 
  Radio, ArrowRight, Sparkles, RefreshCw
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface OpportunityNode {
  id: string;
  name: string;
  type: "Lead" | "Inactive" | "VIP" | "Prospect";
  value: number;
  count: number;
  angle: number; // For radar plot
  distance: number; // For radar plot (radius %)
  details: string;
  color: string;
}

export const OpportunityRadar: React.FC = () => {
  const { lunaMetrics, businessType, startMission } = useOrbit();
  const [isScanning, setIsScanning] = useState(true);

  // Generate target coordinates procedurally based on category to make it feel organic
  const opportunityNodes = useMemo<OpportunityNode[]>(() => {
    const isEnterprise = businessType === "Enterprise";
    const isJewellery = businessType === "Jewellery & Accessories";
    const baseRev = isEnterprise ? 380000 : isJewellery ? 45000 : 20550;

    return [
      {
        id: "node_1",
        name: "Abandoned checkout carts",
        type: "Lead",
        value: Math.round(baseRev * 0.58),
        count: lunaMetrics.abandonedLeads,
        angle: 45,
        distance: 65,
        details: `${lunaMetrics.abandonedLeads} carts left with items. High conversion probability (91% confidence).`,
        color: "text-amber-400 bg-amber-400"
      },
      {
        id: "node_2",
        name: "Slipping high-ltv accounts",
        type: "Inactive",
        value: Math.round(baseRev * 0.42),
        count: lunaMetrics.inactiveCustomers,
        angle: 160,
        distance: 80,
        details: `${lunaMetrics.inactiveCustomers} loyalists exhibiting severe activity declines (churn risk > 70%).`,
        color: "text-orbit-purple bg-orbit-purple"
      },
      {
        id: "node_3",
        name: "Untapped VIP buying capacity",
        type: "VIP",
        value: Math.round(baseRev * 0.35),
        count: isEnterprise ? 2 : isJewellery ? 5 : 8,
        angle: 290,
        distance: 45,
        details: `${isEnterprise ? 2 : isJewellery ? 5 : 8} VIP stars with high replenishment frequency signals.`,
        color: "text-orbit-success bg-orbit-success"
      },
      {
        id: "node_4",
        name: "High-affinity signup enquiries",
        type: "Prospect",
        value: Math.round(baseRev * 0.2),
        count: isEnterprise ? 4 : isJewellery ? 9 : 17,
        angle: 110,
        distance: 35,
        details: "Social DM enquiries awaiting initial product campaign activation.",
        color: "text-blue-400 bg-blue-400"
      }
    ];
  }, [businessType, lunaMetrics]);

  // Selected node detailed view
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node_1");
  const selectedNode = opportunityNodes.find(n => n.id === selectedNodeId) || opportunityNodes[0];

  const handleLaunchCampaign = (goal: string) => {
    startMission(goal);
    alert(`Calibrated core objectives. Redirecting to Command Center to track "${goal}" mission progress!`);
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
        <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-6">
          <div>
            <h1 className="font-space text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Radio className="text-pink-400 animate-pulse" size={18} />
              Opportunity Radar
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">CONTINUOUS REVENUE LEAK DETECTION NODE · POWERED BY LUNA</p>
          </div>
          
          <button
            onClick={() => {
              setIsScanning(true);
              setTimeout(() => setIsScanning(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 border border-gray-900 rounded-lg text-gray-400 font-mono text-[9px] cursor-pointer hover:border-gray-800 hover:text-white transition-all"
          >
            <RefreshCw size={11} className={isScanning ? "animate-spin" : ""} />
            <span>Scan Channels</span>
          </button>
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
            {opportunityNodes.map((n) => {
              // Convert polar coordinates to X/Y
              const rad = (n.angle * Math.PI) / 180;
              const radiusPixels = (n.distance / 100) * 160; // 160 is max radius (half of 320)
              const x = 160 + Math.cos(rad) * radiusPixels;
              const y = 160 + Math.sin(rad) * radiusPixels;
              
              const isSelected = selectedNodeId === n.id;
              
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeId(n.id)}
                  style={{ left: `${(x / 320) * 100}%`, top: `${(y / 320) * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20 focus:outline-none"
                >
                  <span className={`absolute -inset-2.5 rounded-full border animate-ping ${
                    isSelected ? "border-pink-400 bg-pink-400/5 opacity-80" : "border-gray-800 opacity-20"
                  }`} style={{ animationDuration: '3s' }} />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 border-[#050816] flex items-center justify-center transition-all ${
                    isSelected ? "bg-pink-400 scale-125 shadow-[0_0_15px_rgba(236,72,153,0.6)]" : `${n.color.split(" ")[1]} hover:scale-110`
                  }`} />
                  
                  {/* Tooltip detail tag */}
                  <span className="absolute left-5 top-0 bg-gray-950 border border-gray-900 rounded px-1.5 py-0.5 text-[8px] font-mono text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{n.value.toLocaleString()} ({n.type})
                  </span>
                </button>
              );
            })}

            {/* Telemetry labels around the radar */}
            <div className="absolute top-1 left-1 font-mono text-[7px] text-gray-650">AZ: 045°</div>
            <div className="absolute top-1 right-1 font-mono text-[7px] text-gray-650">RANGE: WIDE</div>
            <div className="absolute bottom-1 left-1 font-mono text-[7px] text-gray-650">FREQ: 14.2GHz</div>
            <div className="absolute bottom-1 right-1 font-mono text-[7px] text-gray-650">NODE: LUNA_RDR</div>
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
                strokeDashoffset={2 * Math.PI * 46 * (1 - lunaMetrics.opportunityScore / 100)} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-[7px] text-gray-550 uppercase">Opportunity</span>
              <span className="text-xl font-bold text-white tracking-tight">{lunaMetrics.opportunityScore}%</span>
              <span className="text-[7px] text-pink-400 font-bold uppercase mt-0.5">Optimal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full text-left font-mono text-[9px] border-t border-gray-900 pt-3">
            <div>
              <span className="text-gray-550 block text-[7px] uppercase">Recoverable Rev</span>
              <span className="text-orbit-success font-bold">₹{lunaMetrics.recoverableRevenue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-550 block text-[7px] uppercase">Target Leaks</span>
              <span className="text-white font-bold">{lunaMetrics.abandonedLeads + lunaMetrics.inactiveCustomers} nodes</span>
            </div>
          </div>
        </div>

        {/* Selected blip node breakdown */}
        <div className="orbit-panel p-4 space-y-3.5">
          <div className="border-b border-gray-900 pb-2.5">
            <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest block">Opportunity Node Focus</span>
            <h3 className="font-space text-xs font-bold text-white uppercase tracking-tight mt-0.5">{selectedNode.name}</h3>
          </div>

          <div className="space-y-2.5 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Segment category:</span>
              <span className="text-white font-bold uppercase">{selectedNode.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Node volume:</span>
              <span className="text-white font-bold">{selectedNode.count} targets</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Potential revenue yield:</span>
              <span className="text-orbit-success font-bold">₹{selectedNode.value.toLocaleString()}</span>
            </div>
            
            <p className="text-gray-400 text-[8.5px] leading-relaxed border-t border-gray-900/60 pt-2.5 mt-2.5">
              {selectedNode.details}
            </p>
          </div>

          <button
            onClick={() => handleLaunchCampaign(
              selectedNode.type === "Lead" ? "Recover Lost Revenue" :
              selectedNode.type === "Inactive" ? "Reduce Customer Churn" :
              selectedNode.type === "VIP" ? "Increase Customer LTV" : "Acquire New Customers"
            )}
            className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Launch Recovery Mission</span>
            <ArrowRight size={10} />
          </button>
        </div>

        {/* AI Recommendations */}
        <div className="orbit-panel p-4 space-y-3 flex-1">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2">
            <Sparkles size={12} className="text-orbit-purple" />
            Luna Actions
          </h3>

          <div className="space-y-3">
            {[
              { title: "Recover Lost Leads", desc: "Launch auto recovery WhatsApp messages targeting cart abandonments.", yield: `₹${Math.round(lunaMetrics.recoverableRevenue * 0.58).toLocaleString()}`, conf: "91%" },
              { title: "Launch Reactivation Campaign", desc: "Target high-value slipping accounts with customized DNA vouchers.", yield: `₹${Math.round(lunaMetrics.recoverableRevenue * 0.42).toLocaleString()}`, conf: "88%" },
              { title: "Reward VIP Customers", desc: "Inject early access collection invites to maintain high LTV index.", yield: `₹${Math.round(lunaMetrics.recoverableRevenue * 0.35).toLocaleString()}`, conf: "94%" }
            ].map((rec, i) => (
              <div key={i} className="bg-black/30 border border-gray-900 p-2.5 rounded-lg space-y-1 font-mono text-[8.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{rec.title}</span>
                  <span className="text-orbit-success font-bold">{rec.yield}</span>
                </div>
                <p className="text-gray-500 leading-normal">{rec.desc}</p>
                <div className="flex justify-between text-[7.5px] text-gray-650 border-t border-gray-900/60 pt-1 mt-1">
                  <span>Confidence: {rec.conf}</span>
                  <span className="text-orbit-purple font-semibold hover:underline cursor-pointer" onClick={() => handleLaunchCampaign(rec.title)}>Launch Directive</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
};
export default OpportunityRadar;
