import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, ChevronRight, Compass, Sparkles, AlertTriangle, 
  CheckCircle2, Target, Brain, Rocket, BarChart3, Users, Play, Cpu, 
  MessageCircle, Mail, Phone, Layers, Info, Award, Clock, TrendingUp, Check, Loader2,
  CalendarDays, Flame, BarChart4
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  daysLeft: number;
  channel: string;
  projectedRevenue: number;
  expectedConversion: number;
  confidence: number;
  audience: string;
}

export const SeasonalIntelligence: React.FC = () => {
  const { businessType, startMission, customers } = useOrbit();
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentStats, setCurrentStats] = useState({
    currentSeason: "Pre-Diwali",
    marketHeat: 92,
    purchaseIntent: "High",
    predictedRevenueWindow: "Next 14 Days"
  });

  const [activeEventId, setActiveEventId] = useState<string>("diwali");
  const [activeEvent, setActiveEvent] = useState<TimelineEvent | null>(null);

  // AI Forecast state (Vega)
  const [forecast, setForecast] = useState<any>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // AI Campaigns state (Nova)
  const [campaignData, setCampaignData] = useState<any>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCopyVersion, setSelectedCopyVersion] = useState<number>(0);
  const [selectedCopyChannel, setSelectedCopyChannel] = useState<string>("whatsapp");

  // Simulator state (Atlas/Polaris/Vega/Nova/Luna)
  const [simState, setSimState] = useState<{
    running: boolean;
    step: number;
    timeline: Array<{ agent: string; message: string }>;
    results: any;
  }>({
    running: false,
    step: -1,
    timeline: [],
    results: null
  });

  // Launch state
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<any>(null);

  // Load timeline events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seasonal-intel/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setCurrentStats({
          currentSeason: data.currentSeason,
          marketHeat: data.marketHeat,
          purchaseIntent: data.purchaseIntent,
          predictedRevenueWindow: data.predictedRevenueWindow
        });
        
        if (data.events && data.events.length > 0) {
          // Default to diwali or first event
          const diwali = data.events.find((e: any) => e.id === "diwali");
          if (diwali) {
            setActiveEventId(diwali.id);
            setActiveEvent(diwali);
          } else {
            setActiveEventId(data.events[0].id);
            setActiveEvent(data.events[0]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load seasonal events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Fetch forecast and campaign data when active event changes
  useEffect(() => {
    if (!activeEventId || events.length === 0) return;
    const ev = events.find(e => e.id === activeEventId) || null;
    setActiveEvent(ev);
    if (!ev) return;

    const loadEventAIData = async () => {
      try {
        setLoadingForecast(true);
        setLoadingCampaigns(true);

        const [forecastRes, campaignRes] = await Promise.all([
          fetch("/api/seasonal-intel/forecast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: ev.id, businessType })
          }),
          fetch("/api/seasonal-intel/generate-campaign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: ev.id, businessType })
          })
        ]);

        if (forecastRes.ok) {
          const fData = await forecastRes.json();
          setForecast(fData);
        }
        if (campaignRes.ok) {
          const cData = await campaignRes.json();
          setCampaignData(cData);
        }
      } catch (err) {
        console.error("Failed to fetch event AI data:", err);
      } finally {
        setLoadingForecast(false);
        setLoadingCampaigns(false);
      }
    };

    loadEventAIData();
  }, [activeEventId, events, businessType]);

  // Run simulation
  const handleSimulate = async () => {
    if (!activeEvent) return;
    setSimState({
      running: true,
      step: 0,
      timeline: [],
      results: null
    });

    try {
      const res = await fetch("/api/seasonal-intel/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEvent.id, businessType })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Simulating sequence steps with small intervals
        for (let i = 0; i < data.timeline.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setSimState(prev => ({
            ...prev,
            step: i,
            timeline: [...prev.timeline, data.timeline[i]]
          }));
        }
        
        setSimState(prev => ({
          ...prev,
          running: false,
          step: data.timeline.length,
          results: data
        }));
      }
    } catch (err) {
      console.error("Simulation failed:", err);
      setSimState(prev => ({ ...prev, running: false }));
    }
  };

  // Launch autonomous mission
  const handleLaunchMission = async () => {
    if (!activeEvent || !forecast || !campaignData) return;
    setLaunching(true);
    setLaunchResult(null);

    try {
      const res = await fetch("/api/seasonal-intel/launch-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEvent.id,
          campaignName: `${activeEvent.name} Festival Campaign`,
          recommendedChannel: activeEvent.channel,
          targetAudience: activeEvent.audience,
          expectedRevenue: forecast.recommended?.revenue || activeEvent.projectedRevenue,
          roi: forecast.recommended?.roi || 4.8
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLaunchResult(data);
        startMission(`${activeEvent.name} Festival Campaign`);
        
        // Clear result alert after 4 seconds
        setTimeout(() => {
          setLaunchResult(null);
        }, 5000);
      } else {
        alert("Failed to launch seasonal mission.");
      }
    } catch (err) {
      console.error("Error launching mission:", err);
      alert("Error occurred while communicating with mission control.");
    } finally {
      setLaunching(false);
    }
  };

  // Dynamic launch dates engine helper
  const launchDates = useMemo(() => {
    if (!activeEvent) return null;
    const eventDate = new Date(activeEvent.date);
    const launch = new Date(eventDate.getTime() - 15 * 24 * 60 * 60 * 1000);
    const reminder = new Date(eventDate.getTime() - 10 * 24 * 60 * 60 * 1000);
    const urgency = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const opt = { month: "short", day: "numeric", year: "numeric" } as const;
    return {
      launch: launch.toLocaleDateString("en-US", opt),
      reminder: reminder.toLocaleDateString("en-US", opt),
      urgency: urgency.toLocaleDateString("en-US", opt),
      offerTiming: "15 Days Prior"
    };
  }, [activeEvent]);

  // Dynamic Opportunities calculation
  const opportunities = useMemo(() => {
    if (!activeEvent) return [];
    const base = activeEvent.projectedRevenue;
    const conf = activeEvent.confidence;
    return [
      {
        title: `${activeEvent.name} Collection Drop`,
        revenue: base,
        roi: `${(conf / 20).toFixed(1)}x`,
        confidence: conf,
        channel: activeEvent.channel,
        audienceSize: "800 Subscribers"
      },
      {
        title: `Winter Sale & Clearance`,
        revenue: Math.round(base * 0.5),
        roi: `${((conf - 5) / 20).toFixed(1)}x`,
        confidence: Math.max(70, conf - 5),
        channel: "Email",
        audienceSize: "500 Customers"
      },
      {
        title: `VIP Festival Access`,
        revenue: Math.round(base * 0.3),
        roi: `${((conf + 4) / 20).toFixed(1)}x`,
        confidence: Math.min(99, conf + 3),
        channel: "WhatsApp",
        audienceSize: "150 Loyalists"
      }
    ];
  }, [activeEvent]);

  // Dynamic customer segment analytics
  const activeSegmentData = useMemo(() => {
    if (!activeEvent || !customers) return { count: 320, spend: 3200, prob: 84 };
    const cohort = activeEvent.audience;
    const filtered = customers.filter(c => c.segment === cohort || c.segment === "Loyalists");
    const count = filtered.length > 0 ? filtered.length : 124;
    const spend = cohort.toLowerCase().includes("vip") ? 4500 : cohort.toLowerCase().includes("loyal") ? 3200 : 1800;
    const prob = activeEvent.expectedConversion * 3 > 90 ? 88 : activeEvent.expectedConversion * 3 || 84;
    return {
      count,
      spend,
      prob
    };
  }, [activeEvent, customers]);

  // Heatmap Data matrix (Section 11)
  const HEATMAP_DATA = [
    { month: "Jan", demand: 60, revenue: 55000, competition: "Medium", activity: "Active" },
    { month: "Feb", demand: 65, revenue: 48000, competition: "Medium", activity: "Active" },
    { month: "Mar", demand: 78, revenue: 90000, competition: "High", activity: "Active" },
    { month: "Apr", demand: 82, revenue: 110000, competition: "Medium", activity: "Active" },
    { month: "May", demand: 50, revenue: 40000, competition: "Low", activity: "Normal" },
    { month: "Jun", demand: 40, revenue: 30000, competition: "Low", activity: "Stable" },
    { month: "Jul", demand: 45, revenue: 35000, competition: "Low", activity: "Normal" },
    { month: "Aug", demand: 72, revenue: 95000, competition: "Medium", activity: "Active" },
    { month: "Sep", demand: 55, revenue: 48000, competition: "Medium", activity: "Normal" },
    { month: "Oct", demand: 95, revenue: 150000, competition: "High", activity: "Peak" },
    { month: "Nov", demand: 90, revenue: 82000, competition: "High", activity: "Peak" },
    { month: "Dec", demand: 85, revenue: 98000, competition: "Medium", activity: "Peak" }
  ];

  // Render SVG Chart for Section 3
  const renderForecastChart = () => {
    if (!forecast) return null;
    const cons = forecast.conservative?.revenue || 0;
    const rec = forecast.recommended?.revenue || 0;
    const agg = forecast.aggressive?.revenue || 0;
    const maxVal = Math.max(cons, rec, agg) || 1;

    // Normalizing heights based on SVG viewbox
    const h1 = (cons / maxVal) * 95;
    const h2 = (rec / maxVal) * 95;
    const h3 = (agg / maxVal) * 95;

    return (
      <div className="relative">
        <svg className="w-full h-40 font-mono text-[9px] mt-2" viewBox="0 0 320 140">
          <line x1="30" y1="15" x2="300" y2="15" stroke="#111827" strokeDasharray="3 3" />
          <line x1="30" y1="50" x2="300" y2="50" stroke="#1f2937" strokeDasharray="3 3" />
          <line x1="30" y1="85" x2="300" y2="85" stroke="#1f2937" strokeDasharray="3 3" />
          <line x1="30" y1="120" x2="300" y2="120" stroke="#374151" strokeWidth="1.5" />

          {/* Conservative */}
          <rect x="50" y={120 - h1} width="38" height={h1} fill="url(#chartBlue)" rx="3" className="transition-all duration-500" />
          <text x="69" y={114 - h1} textAnchor="middle" fill="#60a5fa" className="font-bold">
            ₹{(cons / 1000).toFixed(0)}k
          </text>
          <text x="69" y="132" textAnchor="middle" fill="#9ca3af" className="text-[8px]">Cons</text>

          {/* Recommended */}
          <rect x="140" y={120 - h2} width="38" height={h2} fill="url(#chartPurple)" rx="3" className="transition-all duration-500" />
          <text x="159" y={114 - h2} textAnchor="middle" fill="#a78bfa" className="font-bold">
            ₹{(rec / 1000).toFixed(0)}k
          </text>
          <text x="159" y="132" textAnchor="middle" fill="#9ca3af" className="text-[8px]">Recommended</text>

          {/* Aggressive */}
          <rect x="230" y={120 - h3} width="38" height={h3} fill="url(#chartPink)" rx="3" className="transition-all duration-500" />
          <text x="249" y={114 - h3} textAnchor="middle" fill="#f472b6" className="font-bold">
            ₹{(agg / 1000).toFixed(0)}k
          </text>
          <text x="249" y="132" textAnchor="middle" fill="#9ca3af" className="text-[8px]">Aggressive</text>

          <defs>
            <linearGradient id="chartBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="chartPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="chartPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative font-inter text-gray-300">
      <div className="pointer-events-none absolute inset-0 space-grid opacity-30 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-10 z-0" />
      <div className="scanlines" />

      {/* Main Container */}
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto relative z-10 border-r border-gray-900">
        
        {/* Header HUD */}
        <PageHeaderHUD
          title="Seasonal Intelligence"
          subtitle="AUTONOMOUS REVENUE FORECASTING & MARKETING DIRECTIVES"
          onSelectAgent={setSelectedAgent}
        />

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-orbit-blue animate-spin" />
            <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Calibrating Seasonal Radar...</span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* SECTION 1: SEASONAL COMMAND CENTER */}
            <div className="orbit-panel relative overflow-hidden bg-gradient-to-r from-gray-950 via-slate-950 to-purple-950/20 border-l-4 border-l-orbit-blue">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orbit-blue/10 pointer-events-none filter blur-3xl" />
              
              <div className="p-5 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Current Season</span>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-orbit-blue animate-pulse" />
                    <span className="font-space text-lg font-bold text-white uppercase tracking-tight">{currentStats.currentSeason}</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-gray-900 pl-4 md:pl-6">
                  <span className="font-mono text-[9px] text-gray-550 uppercase tracking-wider block">Market Heat Score</span>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span className="font-space text-lg font-bold text-amber-400 font-mono">{currentStats.marketHeat}%</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-gray-900 pl-4 md:pl-6">
                  <span className="font-mono text-[9px] text-gray-550 uppercase tracking-wider block">Consumer Intent Index</span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-orbit-success" />
                    <span className="font-space text-lg font-bold text-orbit-success uppercase">{currentStats.purchaseIntent}</span>
                  </div>
                </div>

                <div className="space-y-1 border-l border-gray-900 pl-4 md:pl-6">
                  <span className="font-mono text-[9px] text-gray-550 uppercase tracking-wider block">Predicted Revenue Window</span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orbit-purple" />
                    <span className="font-space text-sm font-bold text-orbit-purple uppercase">{currentStats.predictedRevenueWindow}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: SEASONAL REVENUE TIMELINE */}
            <div className="space-y-3">
              <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-orbit-blue" />
                Seasonal Revenue Timeline
              </h3>
              
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {events.map((e) => {
                  const isActive = activeEventId === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => setActiveEventId(e.id)}
                      className={`orbit-panel text-left p-4 min-w-[200px] flex-shrink-0 relative transition-all cursor-pointer ${
                        isActive 
                          ? "border-orbit-blue/60 bg-gray-900/35 ring-1 ring-orbit-blue/35 scale-[1.02]" 
                          : "opacity-75 hover:opacity-100 hover:border-gray-800 bg-gray-950/20"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-space text-[10.5px] font-bold text-white uppercase truncate pr-1">{e.name}</span>
                        <span className={`font-mono text-[8px] border px-1.5 py-0.5 rounded-full uppercase ${
                          isActive ? "border-orbit-blue/40 text-orbit-blue bg-orbit-blue/5" : "border-gray-900 text-gray-550"
                        }`}>{e.daysLeft}d left</span>
                      </div>
                      
                      <div className="space-y-1 mb-2.5">
                        <div className="text-[14px] font-space font-bold text-orbit-success">₹{e.projectedRevenue.toLocaleString()}</div>
                        <div className="font-mono text-[8.5px] text-gray-500">Conv Rate: <span className="text-white font-bold">{e.expectedConversion}%</span></div>
                      </div>

                      <div className="border-t border-gray-900/50 pt-2 font-mono text-[8px] text-gray-550 flex items-center justify-between">
                        <span>Cohort: {e.audience}</span>
                        <ChevronRight className="w-3 h-3 text-orbit-blue" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRID OF SECTIONS 3, 4, 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SECTION 3: AI REVENUE FORECAST (Vega) */}
              <div className="orbit-panel p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-900 pb-2.5">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart4 className="w-4 h-4 text-orbit-purple" />
                    AI Revenue Forecast (Vega)
                  </h3>
                  {forecast && (
                    <div className="flex items-center gap-1 font-mono text-[9px] bg-orbit-purple/5 border border-orbit-purple/20 px-2 py-0.5 rounded text-orbit-purple">
                      <Brain className="w-3.5 h-3.5" />
                      {forecast.confidenceScore || 91}% Conf
                    </div>
                  )}
                </div>

                {loadingForecast ? (
                  <div className="h-44 flex items-center justify-center flex-col space-y-2">
                    <Loader2 className="w-6 h-6 text-orbit-purple animate-spin" />
                    <span className="font-mono text-[9px] text-gray-650 uppercase">Vega projecting curves...</span>
                  </div>
                ) : forecast ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="bg-black/35 border border-gray-950 p-2.5 rounded-xl">
                        <span className="text-[7.5px] text-gray-550 uppercase">Conservative</span>
                        <div className="text-[11px] font-bold text-orbit-blue mt-0.5">₹{forecast.conservative?.revenue?.toLocaleString()}</div>
                        <span className="text-[7px] text-gray-600 block mt-0.5">ROI: {forecast.conservative?.roi}x</span>
                      </div>
                      <div className="bg-black/50 border border-orbit-purple/25 p-2.5 rounded-xl ring-1 ring-orbit-purple/10">
                        <span className="text-[7.5px] text-orbit-purple uppercase font-bold">Recommended</span>
                        <div className="text-[11px] font-bold text-white mt-0.5">₹{forecast.recommended?.revenue?.toLocaleString()}</div>
                        <span className="text-[7px] text-orbit-success block mt-0.5">ROI: {forecast.recommended?.roi}x</span>
                      </div>
                      <div className="bg-black/35 border border-gray-950 p-2.5 rounded-xl">
                        <span className="text-[7.5px] text-gray-550 uppercase">Aggressive</span>
                        <div className="text-[11px] font-bold text-pink-500 mt-0.5">₹{forecast.aggressive?.revenue?.toLocaleString()}</div>
                        <span className="text-[7px] text-gray-600 block mt-0.5">ROI: {forecast.aggressive?.roi}x</span>
                      </div>
                    </div>

                    {renderForecastChart()}
                  </div>
                ) : (
                  <div className="text-center py-10 font-mono text-[9.5px] text-gray-600">Select an event to load Vega projections</div>
                )}
              </div>

              {/* SECTION 4: SEASONAL OPPORTUNITIES */}
              <div className="orbit-panel p-5 space-y-4">
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
                  <Sparkles className="w-4 h-4 text-orbit-blue" />
                  Seasonal Opportunities
                </h3>

                <div className="space-y-3">
                  {opportunities.map((opp, idx) => (
                    <div key={idx} className="bg-black/40 border border-gray-900 rounded-xl p-3 space-y-1.5 hover:border-gray-800 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-space text-[10px] font-bold text-white uppercase">{opp.title}</span>
                        <span className="font-mono text-[8px] text-orbit-success border border-orbit-success/30 px-1.5 py-0.2 rounded bg-orbit-success/5">{opp.roi} ROI</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-white">
                        <span>₹{opp.revenue.toLocaleString()} potential</span>
                        <span className="text-gray-500 text-[8.5px]">Conf: {opp.confidence}%</span>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-550 border-t border-gray-950 pt-1.5 mt-1">
                        <span>Channel: {opp.channel}</span>
                        <span>Size: {opp.audienceSize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: WHY THIS EVENT MATTERS */}
              <div className="orbit-panel p-5 space-y-4">
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
                  <Brain className="w-4 h-4 text-amber-500" />
                  Why This Event Matters
                </h3>

                {loadingForecast ? (
                  <div className="h-44 flex items-center justify-center flex-col space-y-2">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    <span className="font-mono text-[9px] text-gray-650 uppercase">Vega reading market trends...</span>
                  </div>
                ) : forecast ? (
                  <div className="space-y-4">
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 font-mono text-[10px] text-amber-300/95 leading-relaxed relative overflow-hidden">
                      <Info className="w-3.5 h-3.5 absolute top-3 right-3 text-amber-500 opacity-60" />
                      <p className="whitespace-pre-line">{forecast.whyThisEventMatters}</p>
                    </div>

                    <div className="bg-black/35 border border-gray-950 rounded-xl p-3 font-mono text-[9px] text-gray-500 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Expected Revenue Opportunity:</span>
                        <span className="text-orbit-success font-bold">₹{forecast.recommended?.revenue?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Campaign Risk Index:</span>
                        <span className="text-white font-bold">{forecast.recommended?.customerFatigue === "Low" ? "Stable" : "Elevated"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Opt-out Probability:</span>
                        <span className="text-red-400 font-bold">{forecast.recommended?.optOutRate}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 font-mono text-[9.5px] text-gray-650">Select an event to retrieve insights</div>
                )}
              </div>
            </div>

            {/* SECTIONS 6 & 7: AI GENERATED CAMPAIGNS & BEST LAUNCH DATE ENGINE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SECTION 6: AI GENERATED CAMPAIGNS (Nova) */}
              <div className="orbit-panel p-5 lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-900 pb-2.5">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-orbit-blue" />
                    AI Generated Campaigns (Nova)
                  </h3>

                  {campaignData && (
                    <div className="flex gap-1 bg-black/40 border border-gray-900 p-0.5 rounded-lg font-mono text-[9px]">
                      {campaignData.versions?.map((_: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedCopyVersion(index)}
                          className={`px-2.5 py-1 rounded transition-colors ${
                            selectedCopyVersion === index 
                              ? "bg-orbit-blue/20 text-white font-bold" 
                              : "text-gray-500 hover:text-white"
                          }`}
                        >
                          {index === 0 ? "Version A (Value)" : "Version B (Urgency)"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {loadingCampaigns ? (
                  <div className="h-56 flex items-center justify-center flex-col space-y-2">
                    <Loader2 className="w-6 h-6 text-orbit-blue animate-spin" />
                    <span className="font-mono text-[9px] text-gray-650 uppercase">Nova copywriting text...</span>
                  </div>
                ) : campaignData ? (
                  <div className="space-y-4">
                    <div className="bg-black/35 border border-gray-950 p-3 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[9.5px]">
                      <div>
                        <span className="text-[7.5px] text-gray-600 uppercase">Offer Directive</span>
                        <div className="font-bold text-white mt-0.5">{campaignData.offerRecommendation}</div>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-gray-600 uppercase">Target cohort</span>
                        <div className="font-bold text-white mt-0.5">{campaignData.targetCohort}</div>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-gray-600 uppercase">Call to Action</span>
                        <div className="font-bold text-orbit-blue mt-0.5">{campaignData.cta}</div>
                      </div>
                    </div>

                    {/* Copy Templates */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* Copy tabs */}
                      <div className="flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-visible">
                        {[
                          { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                          { id: "email", label: "Email Template", icon: Mail },
                          { id: "sms", label: "SMS Short", icon: Phone },
                          { id: "instagram", label: "IG Caption", icon: Target }
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => setSelectedCopyChannel(ch.id)}
                            className={`px-3 py-2 rounded-xl border text-left font-mono text-[9px] flex items-center gap-1.5 transition-all ${
                              selectedCopyChannel === ch.id
                                ? "bg-orbit-blue/10 border-orbit-blue/35 text-white"
                                : "bg-transparent border-transparent text-gray-600 hover:text-white"
                            }`}
                          >
                            <ch.icon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{ch.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Display panel */}
                      <div className="sm:col-span-3 bg-[#080d1f] border border-gray-950 rounded-xl p-4 font-mono text-[10px] text-gray-300 leading-relaxed whitespace-pre-line relative overflow-hidden min-h-[120px]">
                        <div className="absolute top-2 right-3 text-[7.5px] text-gray-600 font-bold uppercase tracking-wider">
                          Nova Output ({selectedCopyChannel.toUpperCase()})
                        </div>

                        {selectedCopyChannel === "email" ? (
                          <div className="space-y-3">
                            <div className="border-b border-gray-900 pb-2">
                              <span className="text-gray-550">Subject: </span>
                              <span className="text-white font-bold">{campaignData.versions?.[selectedCopyVersion]?.email?.subject}</span>
                            </div>
                            <div>
                              {campaignData.versions?.[selectedCopyVersion]?.email?.body}
                            </div>
                          </div>
                        ) : (
                          <div>
                            {campaignData.versions?.[selectedCopyVersion]?.[selectedCopyChannel]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 font-mono text-[9.5px] text-gray-650">Select an event to load campaigns</div>
                )}
              </div>

              {/* SECTION 7: BEST LAUNCH DATE ENGINE */}
              <div className="orbit-panel p-5 space-y-4">
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
                  <Calendar className="w-4 h-4 text-amber-500 animate-pulse" />
                  Best Launch Date Engine
                </h3>

                {launchDates ? (
                  <div className="space-y-4">
                    <p className="font-mono text-[9px] text-gray-550 leading-relaxed">
                      Vega and Atlas calculated maximum target response timelines based on historical checkout surges.
                    </p>

                    <div className="relative border-l border-gray-900 ml-3.5 pl-6 space-y-4 py-1.5 font-mono text-[10px]">
                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 bg-orbit-blue/20 border border-orbit-blue rounded-full p-0.5 text-orbit-blue">
                          <Play className="w-2.5 h-2.5 rotate-90" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-550 text-[8px] uppercase">Launch Date Recommended</span>
                          <div className="font-bold text-white">{launchDates.launch}</div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 bg-orbit-purple/20 border border-orbit-purple rounded-full p-0.5 text-orbit-purple">
                          <Clock className="w-2.5 h-2.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-550 text-[8px] uppercase">Best Reminder Date</span>
                          <div className="font-bold text-white">{launchDates.reminder}</div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className="absolute -left-[30px] top-0.5 bg-pink-500/20 border border-pink-500 rounded-full p-0.5 text-pink-500 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-gray-550 text-[8px] uppercase">Urgency Push Dispatch</span>
                          <div className="font-bold text-white">{launchDates.urgency}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 border border-gray-950 p-2.5 rounded-xl flex justify-between items-center font-mono text-[9px] text-gray-650">
                      <span>Best Offer Timing:</span>
                      <span className="text-white font-bold">{launchDates.offerTiming}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 font-mono text-[9.5px] text-gray-650">Select an event to run launch dates engine</div>
                )}
              </div>
            </div>

            {/* SECTIONS 8, 9, 11: CUSTOMER INSIGHTS, SIMULATOR, HEATMAP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SECTION 8: SEASONAL CUSTOMER INSIGHTS */}
              <div className="orbit-panel p-5 space-y-4">
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
                  <Users className="w-4 h-4 text-orbit-blue" />
                  Seasonal Customer Insights
                </h3>

                <div className="space-y-3.5 font-mono">
                  <div className="bg-black/40 border border-gray-900 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 uppercase">Most Active Segment</span>
                      <span className="text-[10.5px] font-bold text-white uppercase border border-orbit-blue/30 bg-orbit-blue/5 px-2 py-0.5 rounded">
                        {activeEvent?.audience || "VIP Customers"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 uppercase">Target Audience Size</span>
                      <span className="text-[11px] font-bold text-white">{activeSegmentData.count} Customers</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 uppercase">Expected Spend (AOV)</span>
                      <span className="text-[11px] font-bold text-orbit-success">₹{activeSegmentData.spend.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 uppercase">Conversion Probability</span>
                      <span className="text-[11px] font-bold text-orbit-success">{activeSegmentData.prob}%</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600 uppercase">Preferred Channel</span>
                      <span className="text-[11px] font-bold text-white">{activeEvent?.channel || "WhatsApp"}</span>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-550 leading-relaxed">
                    VIP segment spends approximately <span className="text-white font-bold">2.1x</span> higher during festival seasons compared to regular quarters.
                  </p>
                </div>
              </div>

              {/* SECTION 9: FESTIVAL SIMULATOR */}
              <div className="orbit-panel p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-900 pb-2.5">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-orbit-blue" />
                    Festival Simulator
                  </h3>

                  <button
                    onClick={handleSimulate}
                    disabled={simState.running || !activeEvent}
                    className="px-3 py-1 bg-orbit-blue/20 hover:bg-orbit-blue/30 text-orbit-blue border border-orbit-blue/30 rounded-lg font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {simState.running ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Simulate Campaign
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 font-mono text-[9.5px]">
                  {simState.step >= 0 && (
                    <div className="border border-gray-950 bg-black/45 rounded-xl p-3 max-h-[110px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                      {simState.timeline.map((log, idx) => (
                        <div key={idx} className="flex gap-1.5 items-start text-[8.5px]">
                          <span className="text-orbit-blue font-bold">[{log.agent}]</span>
                          <span className="text-gray-400">{log.message}</span>
                        </div>
                      ))}
                      {simState.running && (
                        <div className="flex items-center gap-1.5 text-gray-500 animate-pulse text-[8px] uppercase">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Boardroom analyzing next stage...
                        </div>
                      )}
                    </div>
                  )}

                  {simState.results ? (
                    <div className="bg-orbit-blue/5 border border-orbit-blue/20 rounded-xl p-3.5 space-y-2.5">
                      <div className="text-[10.5px] font-bold text-white uppercase flex items-center gap-1 border-b border-gray-900/50 pb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-orbit-success" />
                        Simulation Yield Summary
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                        <div className="bg-black/35 p-1.5 rounded-lg border border-gray-950">
                          <span className="text-gray-650 block text-[8px]">Expected Rev</span>
                          <span className="font-bold text-orbit-success">₹{simState.results.expectedRevenue?.toLocaleString()}</span>
                        </div>
                        <div className="bg-black/35 p-1.5 rounded-lg border border-gray-950">
                          <span className="text-gray-650 block text-[8px]">Expected ROI</span>
                          <span className="font-bold text-white">{simState.results.roi}x</span>
                        </div>
                        <div className="bg-black/35 p-1.5 rounded-lg border border-gray-950">
                          <span className="text-gray-650 block text-[8px]">Conversions</span>
                          <span className="font-bold text-white">{simState.results.conversions} units</span>
                        </div>
                        <span className="col-span-2 text-gray-500 text-[7.5px] uppercase pt-1 text-right">Risk Factor: {simState.results.riskScore}%</span>
                      </div>
                    </div>
                  ) : !simState.running && (
                    <div className="bg-black/25 border border-dashed border-gray-900 rounded-xl p-8 text-center text-gray-550 text-[9px] flex flex-col items-center justify-center space-y-1">
                      <Play className="w-5 h-5 text-gray-650" />
                      <span>Trigger simulation to test 5-agent boardroom timeline output</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 11: SEASONAL OPPORTUNITY HEATMAP */}
              <div className="orbit-panel p-5 space-y-4">
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
                  <BarChart3 className="w-4 h-4 text-orbit-blue" />
                  Seasonal Opportunity Heatmap
                </h3>

                <div className="max-h-[175px] overflow-y-auto space-y-1.5 pr-1 font-mono scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                  {HEATMAP_DATA.map((h, idx) => {
                    const isPeak = h.activity === "Peak";
                    const isCurrent = h.month === "Jun"; // Current local month
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-1.5 rounded-lg border text-[9px] ${
                          isCurrent 
                            ? "bg-orbit-blue/5 border-orbit-blue/40 ring-1 ring-orbit-blue/10" 
                            : "bg-black/30 border-gray-950"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-7 text-center font-bold ${isCurrent ? "text-orbit-blue" : "text-gray-400"}`}>{h.month}</span>
                          <div className="w-16 bg-gray-900 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isPeak ? "bg-pink-500" : "bg-orbit-blue"}`}
                              style={{ width: `${h.demand}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-[8.5px]">{h.demand}%</span>
                        </div>

                        <div className="flex gap-3 text-right">
                          <span className="font-bold text-white">₹{(h.revenue / 1000).toFixed(0)}k</span>
                          <span className={`w-10 text-center font-bold text-[8px] uppercase ${
                            isPeak ? "text-pink-400" : h.activity === "Active" ? "text-amber-400" : "text-gray-500"
                          }`}>{h.activity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* ════════════════════════════════════════
          RIGHT COLUMN: SIDEBAR EXECUTIVE CONTROL
      ════════════════════════════════════════ */}
      <aside className="w-80 shrink-0 flex flex-col bg-gray-950/45 backdrop-blur-md p-5 space-y-5 overflow-y-auto relative z-10">
        
        {/* SECTION 12: EXECUTIVE RECOMMENDATION PANEL */}
        <div className="orbit-panel p-4 space-y-4 bg-gradient-to-b from-gray-950 to-slate-950/50">
          <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-900 pb-2.5">
            <Award className="w-4 h-4 text-amber-400" />
            Executive Panel
          </h3>

          {activeEvent ? (
            <div className="space-y-4 font-mono text-[9.5px]">
              <div className="space-y-2">
                <span className="text-gray-650 uppercase text-[8px] block">Top Festival Opportunity</span>
                <div className="font-space text-md font-bold text-white uppercase leading-tight">{activeEvent.name}</div>
              </div>

              <div className="space-y-2.5 bg-black/40 border border-gray-900 p-3 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-gray-550">Expected Revenue:</span>
                  <span className="text-orbit-success font-bold font-mono">₹{forecast?.recommended?.revenue?.toLocaleString() || activeEvent.projectedRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-550">Recommended Audience:</span>
                  <span className="text-white font-bold">{activeEvent.audience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-550">Optimal Channel:</span>
                  <span className="text-white font-bold">{activeEvent.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-550">Best Launch Window:</span>
                  <span className="text-orbit-purple font-bold">{launchDates?.launch || "15 Days Prior"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-650 uppercase text-[8px] block">AI Recommendation</span>
                <p className="text-gray-400 text-[9px] leading-relaxed">
                  Bypass generic catalog broadcasts. Establish automated WhatsApp drops targeting loyal repeat customers within the next 7 days. Expected response yields 4.8x ROI.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-650 font-mono text-[9px]">Select an event to run recommendations</div>
          )}
        </div>

        {/* SECTION 10: AUTONOMOUS SEASONAL MISSION */}
        <div className="orbit-panel p-4 space-y-4 relative overflow-hidden border border-orbit-purple/30 bg-purple-950/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orbit-purple/5 pointer-events-none filter blur-xl" />
          
          <div className="space-y-1.5 relative z-10">
            <span className="font-mono text-[8.5px] text-orbit-purple border border-orbit-purple/30 bg-orbit-purple/5 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
              Autonomous Scheduler
            </span>
            <h4 className="font-space text-xs font-bold text-white uppercase">Dispatch Control</h4>
            <p className="font-mono text-[8.5px] leading-relaxed text-gray-500">
              Atlas will configure cron triggers, deploy Nova copy templates to channels, and synchronize Firestore missions.
            </p>
          </div>

          <button
            onClick={handleLaunchMission}
            disabled={launching || !activeEvent || !forecast || !campaignData}
            className="w-full py-2.5 bg-gradient-to-r from-orbit-blue to-orbit-purple text-white font-mono text-[9px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 hover:opacity-95 disabled:opacity-40 cursor-pointer shadow-orbit-glow"
          >
            {launching ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Launching Mission...</span>
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5" />
                <span>Launch Seasonal Mission</span>
              </>
            )}
          </button>

          {launchResult && (
            <div className="p-3 bg-orbit-success/15 border border-orbit-success/30 rounded-xl space-y-1 font-mono text-[8.5px] text-orbit-success animate-fade-in">
              <div className="flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" />
                Mission Dispatched!
              </div>
              <p className="text-[7.5px] text-gray-400">
                Created mission: {launchResult.missionId}. Campaigns queued in database.
              </p>
            </div>
          )}
        </div>

        {/* Live suggestions */}
        <div className="font-mono text-[8px] text-gray-650 flex justify-between px-1">
          <span>BOARDROOM STATUS: SYNCD</span>
          <span>CALENDAR: JUN-2026 OK</span>
        </div>

      </aside>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};

export default SeasonalIntelligence;
