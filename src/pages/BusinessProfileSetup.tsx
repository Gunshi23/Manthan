import React, { useState } from "react";
import { 
  Shirt, Sparkles, Coffee, Gem, ShoppingBag, Briefcase, 
  Wand2, ArrowRight, Loader2, CheckCircle2, MessageCircle, 
  Mail, Layers, Zap
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface BusinessProfileSetupProps {
  onSetupComplete: () => void;
}

interface BusinessCard {
  id: string;
  title: string;
  desc: string;
  size: string;
  channels: string[];
  icon: React.FC<any>;
  primaryChannel: string;
  opportunity: string;
  challenge: string;
  missions: string[];
  color: string;
}

const BUSINESS_PROFILES: BusinessCard[] = [
  {
    id: "fashion",
    title: "Fashion & Apparel",
    desc: "Streetwear, boutique retail, and casual collections.",
    size: "5,000 - 25,000 customers",
    channels: ["WhatsApp", "RCS", "SMS"],
    icon: Shirt,
    primaryChannel: "Instagram (DM Sync)",
    opportunity: "Repeat Purchases & Loyalty Upgrades",
    challenge: "Abandoned Cart Enquiries",
    missions: ["Recover Leads", "Launch Collection", "Increase Repeat Purchases"],
    color: "from-amber-500/15 to-orange-500/15 border-amber-500/30 text-amber-400"
  },
  {
    id: "beauty",
    title: "Beauty & Skincare",
    desc: "Cosmetics, wellness formulas, and serum subscriptions.",
    size: "2,500 - 15,000 customers",
    channels: ["WhatsApp", "SMS", "Email"],
    icon: Sparkles,
    primaryChannel: "WhatsApp Broadcast",
    opportunity: "Serum Replenishment Subscription",
    challenge: "High Drop-off on Detail Pages",
    missions: ["Skin Routine Follow-up", "Replenish Reminders", "Dormant Beauty Reactivation"],
    color: "from-pink-500/15 to-rose-500/15 border-pink-500/30 text-pink-400"
  },
  {
    id: "food",
    title: "Food & Bakery",
    desc: "Gourmet pastries, custom breads, and delivery packages.",
    size: "1,200 - 8,000 customers",
    channels: ["WhatsApp", "SMS"],
    icon: Coffee,
    primaryChannel: "SMS Delivery Sync",
    opportunity: "Brunch Re-ordering Velocity",
    challenge: "Low Customer Retention Rates",
    missions: ["Weekend Brunch Alert", "Morning Repeat Trigger", "Dormant Foodie Reactivation"],
    color: "from-yellow-500/15 to-amber-500/15 border-yellow-500/30 text-yellow-400"
  },
  {
    id: "jewellery",
    title: "Jewellery & Accessories",
    desc: "High-ticket aura pendants, luxury rings, and quartz watches.",
    size: "800 - 4,000 customers",
    channels: ["RCS", "Email", "WhatsApp"],
    icon: Gem,
    primaryChannel: "RCS Rich Cards",
    opportunity: "High-Ticket LTV Upgrades",
    challenge: "Long Consideration & Checkout Hesitation",
    missions: ["VIP Cart Recovery", "Pre-sale VIP Invites", "LTV Booster Sequences"],
    color: "from-violet-500/15 to-purple-500/15 border-violet-500/30 text-violet-400"
  },
  {
    id: "d2c",
    title: "D2C Brand",
    desc: "Eco-conscious utility packs, smart caps, and acoustic accessories.",
    size: "10,000 - 50,000 customers",
    channels: ["WhatsApp", "RCS", "SMS", "Email"],
    icon: ShoppingBag,
    primaryChannel: "WhatsApp Automation",
    opportunity: "Cross-selling Core Accessories",
    challenge: "High Customer Acquisition Cost",
    missions: ["Abandoned Basket Recovery", "Loyalty Loop Boosters", "Cross-sell Campaign"],
    color: "from-blue-500/15 to-cyan-500/15 border-blue-500/30 text-blue-400"
  },
  {
    id: "enterprise",
    title: "Enterprise",
    desc: "SaaS software licensing, custom DB APIs, and cloud services.",
    size: "100 - 500 accounts",
    channels: ["Email", "RCS"],
    icon: Briefcase,
    primaryChannel: "Secure Email Gateway",
    opportunity: "Cloud License Seat Add-ons",
    challenge: "Stale Contract Renewal Proposals",
    missions: ["Contract Renewal Alert", "SLA Health Audits", "License Extension Briefs"],
    color: "from-green-500/15 to-emerald-500/15 border-green-500/30 text-green-400"
  },
  {
    id: "custom",
    title: "Custom Business",
    desc: "Unique custom nodes, niche segments, and specialized objectives.",
    size: "Variable size",
    channels: ["Email", "WhatsApp", "SMS", "RCS"],
    icon: Zap,
    primaryChannel: "All Dispatch Sockets",
    opportunity: "Custom Segment Target Calibration",
    challenge: "Irregular Engagement Signals",
    missions: ["Custom Objective Setup", "Dormant Custom Loop", "Targeted Cross-sell"],
    color: "from-gray-500/15 to-slate-500/15 border-gray-700/60 text-gray-300"
  }
];

export const BusinessProfileSetup: React.FC<BusinessProfileSetupProps> = ({ onSetupComplete }) => {
  const { personalizeForBusiness, theme } = useOrbit();
  const isLight = theme === "executive";
  const [selectedProfile, setSelectedProfile] = useState<string>("fashion");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibLogs, setCalibLogs] = useState<string[]>([]);
  const [logProgress, setLogProgress] = useState(0);

  const selectedData = BUSINESS_PROFILES.find(p => p.id === selectedProfile) || BUSINESS_PROFILES[0];
  const ProfileIcon = selectedData.icon;

  const handleStartCalibration = () => {
    setIsCalibrating(true);
    setLogProgress(0);
    setCalibLogs([]);

    const steps = [
      `Initializing neural framework for profile: "${selectedData.title}"...`,
      `Polaris: Mapping customer DNA segments for ${selectedData.title} parameters...`,
      `Vega: Adjusting conversion models for ${selectedData.primaryChannel} yield calculations...`,
      `Nova: Formatting specialized content copywriting nodes...`,
      `Luna: Calibrating Recovery Radar (Targeting: ${selectedData.challenge})...`,
      `Atlas: Setting up outbound throttles on primary channels: ${selectedData.channels.join(", ")}...`,
      `Synchronizing sandboxed customer records & order ledger...`,
      `Personalization locked. ORBIT Core fully optimized.`
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setCalibLogs(prev => [...prev, step]);
        const progress = Math.round(((index + 1) / steps.length) * 100);
        setLogProgress(progress);
        
        if (index === steps.length - 1) {
          setTimeout(() => {
            // Apply personalization in context
            personalizeForBusiness(selectedData.title);
            onSetupComplete();
          }, 1000);
        }
      }, (index + 1) * 750);
    });
  };

  return (
    <div className={`relative min-h-screen space-grid flex flex-col items-center justify-center p-6 overflow-y-auto transition-colors duration-300 ${
      isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"
    }`}>
      {/* Scanlines Overlay */}
      <div className={`pointer-events-none fixed inset-0 space-grid transition-opacity duration-300 ${isLight ? "opacity-30" : "opacity-60"}`} />
      
      {/* Ambient Radial Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none transition-opacity duration-300 ${
        isLight ? "opacity-5" : "opacity-20"
      }`} 
        style={{
          background: `radial-gradient(circle, ${isLight ? "#3B82F6" : "#8B5CF6"} 0%, transparent 70%)`
        }} 
      />

      {!isCalibrating ? (
        <div className="relative w-full max-w-6xl flex flex-col items-center py-8">
          {/* Header */}
          <div className="text-center mb-10 space-y-3">
            <span className={`font-mono text-[9px] tracking-[0.2em] uppercase border px-3 py-1 rounded-full ${
              isLight 
                ? "border-blue-500/30 bg-blue-500/5 text-blue-600 font-bold" 
                : "border-orbit-blue/30 bg-orbit-blue/5 text-orbit-blue"
            }`}>
              SYSTEM ADAPTATION SEQUENCE
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-space tracking-tight">
              Tell ORBIT About Your Business
            </h1>
            <p className={`text-xs md:text-sm max-w-2xl mx-auto leading-relaxed ${
              isLight ? "text-gray-655" : "text-gray-400"
            }`}>
              We'll personalize your AI agents, insights, campaigns, and recommendations. Select your category to calibrate database records.
            </p>
          </div>

          {/* Main Layout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full mb-10 items-stretch">
            {/* Left side: Business Cards */}
            <div className="lg:col-span-7 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {BUSINESS_PROFILES.map((card) => {
                const CardIcon = card.icon;
                const isSelected = selectedProfile === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedProfile(card.id)}
                    className={`p-4 rounded-xl text-left border backdrop-blur-md transition-all duration-300 flex items-center gap-4 group cursor-pointer ${
                      isSelected
                        ? isLight
                          ? "border-blue-600 bg-blue-50/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]"
                          : "border-orbit-blue bg-gray-900/90 shadow-orbit-glow"
                        : isLight
                          ? "border-gray-250 bg-white hover:border-gray-350 hover:bg-gray-50"
                          : "border-gray-800 bg-gray-950/45 hover:border-gray-700 hover:bg-gray-950/70"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform`}>
                      <CardIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="font-space text-sm font-bold truncate">{card.title}</h3>
                        <span className={`font-mono text-[7px] border px-1.5 py-0.5 rounded uppercase ${
                          isLight ? "border-gray-300 text-gray-500" : "border-gray-800 text-gray-600"
                        }`}>{card.size.split(" ")[0]}</span>
                      </div>
                      <p className={`text-[10px] leading-relaxed truncate mt-0.5 ${isLight ? "text-gray-550" : "text-gray-400"}`}>{card.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right side: AI Personalization Preview ( futuristic ) */}
            <div className="lg:col-span-5 flex">
              <div className={`w-full p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden backdrop-blur-md ${
                isLight 
                  ? "bg-white border-gray-200 shadow-xl" 
                  : "bg-gray-900/30 border-gray-850 shadow-[0_0_30px_rgba(139,92,246,0.06)]"
              }`}>
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedData.color} opacity-20 blur-2xl pointer-events-none`} />

                <div className="space-y-4">
                  {/* Title Header */}
                  <div className="border-b border-gray-800/40 pb-3 mb-2 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-tr ${selectedData.color} border flex items-center justify-center`}>
                      <ProfileIcon size={16} />
                    </div>
                    <div>
                      <span className="font-mono text-[8px] text-gray-500 uppercase tracking-wider block">AI CALIBRATION PREVIEW</span>
                      <h4 className="font-space text-base font-bold">{selectedData.title}</h4>
                    </div>
                  </div>

                  {/* Structured Parameters */}
                  <div className="space-y-3 font-mono text-[9px]">
                    <div>
                      <span className="text-gray-500 uppercase block">Primary Dispatch Channel</span>
                      <span className="text-white font-bold text-xs flex items-center gap-1.5 mt-0.5">
                        {selectedData.primaryChannel.includes("Instagram") && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        )}
                        {selectedData.primaryChannel.includes("WhatsApp") && <MessageCircle size={11} className="text-emerald-500" />}
                        {selectedData.primaryChannel.includes("SMS") && <Layers size={11} className="text-yellow-400" />}
                        {selectedData.primaryChannel.includes("RCS") && <Layers size={11} className="text-purple-400" />}
                        {selectedData.primaryChannel.includes("Email") && <Mail size={11} className="text-blue-400" />}
                        {selectedData.primaryChannel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-gray-500 uppercase block">Primary Opportunity</span>
                        <span className="text-emerald-400 font-bold block mt-0.5">{selectedData.opportunity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 uppercase block">Common Challenge</span>
                        <span className="text-amber-500 font-bold block mt-0.5">{selectedData.challenge}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 uppercase block">Database Scale</span>
                      <span className="text-gray-300 font-bold block mt-0.5">{selectedData.size}</span>
                    </div>

                    <div className="border-t border-gray-800/50 pt-3">
                      <span className="text-gray-500 uppercase tracking-wider block mb-2 font-bold">Recommended Missions</span>
                      <div className="flex flex-col gap-1.5">
                        {selectedData.missions.map((missionName) => (
                          <div key={missionName} className="flex items-center gap-2 text-gray-300">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            <span>{missionName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Action Button */}
                <button
                  onClick={handleStartCalibration}
                  className={`w-full mt-6 py-3 rounded-xl text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isLight
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95"
                      : "bg-gradient-to-r from-orbit-blue to-orbit-purple text-white shadow-orbit-glow hover:opacity-90 active:scale-95 duration-200"
                  }`}
                >
                  <Wand2 size={13} />
                  Configure ORBIT Core
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Calibration Logs Loading screen (Apple-style) */
        <div className="relative w-full max-w-lg bg-gray-900/85 backdrop-blur-md border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-orbit-glow flex flex-col space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <Loader2 size={16} className="text-orbit-blue animate-spin" />
              <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Calibrating Business Node</span>
            </div>
            <span className="font-mono text-xs text-orbit-blue font-bold tabular-nums">{logProgress}%</span>
          </div>

          <div className="font-mono text-[10px] space-y-2.5 h-52 overflow-y-auto text-green-400 pr-2 scrollbar-thin">
            {calibLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2 animate-fade-in-up">
                <span className="text-blue-500 font-bold">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>

          <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orbit-blue to-orbit-purple rounded-full transition-all duration-300"
              style={{ width: `${logProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-gray-500 font-mono text-[9px] uppercase border-t border-gray-800 pt-4">
            <span>Core: adapt.ts</span>
            <span className="animate-pulse">Locking segment clusters...</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default BusinessProfileSetup;
