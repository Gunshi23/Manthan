import React, { useState, useMemo } from "react";
import { 
  Cpu, Users, Target, ChevronRight, Loader2, Activity, CheckCircle2, ArrowRight
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface BusinessProfileSetupProps {
  onSetupComplete: (goal?: string) => void;
}

// Types of options
type BusinessType = "Fashion & Apparel" | "Beauty & Skincare" | "Food & Bakery" | "Jewellery & Accessories" | "D2C Brand" | "Enterprise" | "Custom";
type SalesChannel = "Instagram" | "WhatsApp" | "Website" | "Offline Store" | "Marketplace" | "Multi-channel";
type CustomerUniverse = "0–100" | "100–500" | "500–1000" | "1000–5000" | "5000+";
type GrowthObjective = "Increase Revenue" | "Reduce Churn" | "Increase Repeat Purchases" | "Acquire New Customers" | "Launch New Products" | "Improve Engagement";
type GrowthPersonality = "Conservative" | "Balanced" | "Aggressive" | "Customer First" | "Autopilot";

export const BusinessProfileSetup: React.FC<BusinessProfileSetupProps> = ({ onSetupComplete }) => {
  const { personalizeForBusiness, theme } = useOrbit();
  const isLight = theme === "executive";

  // Wizard Steps: 1 = Identity, 2 = Customer Universe, 3 = Objective, 4 = Personality, 5 = Analyzing / Report
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Brand state values
  const [brandName, setBrandName] = useState("Moonlight Kurtis");
  const [businessType, setBusinessType] = useState<BusinessType>("Fashion & Apparel");
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("Instagram");
  const [customerUniverse, setCustomerUniverse] = useState<CustomerUniverse>("100–500");
  const [growthObjective, setGrowthObjective] = useState<GrowthObjective>("Increase Repeat Purchases");
  const [growthPersonality, setGrowthPersonality] = useState<GrowthPersonality>("Customer First");

  // AI Analysis sequence loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [calibLogs, setCalibLogs] = useState<string[]>([]);
  const [showReport, setShowReport] = useState(false);

  // procedural generation of stars coordinates for the customer galaxy
  // memorized so it doesn't flicker on hover state changes, only changes when selection changes
  const galaxyStars = useMemo(() => {
    const starCounts = {
      "0–100": 25,
      "100–500": 60,
      "500–1000": 110,
      "1000–5000": 200,
      "5000+": 350
    };

    const count = starCounts[customerUniverse];
    const stars: { x: number; y: number; r: number; opacity: number; speedOffset: number }[] = [];
    const centerX = 150;
    const centerY = 150;

    for (let i = 0; i < count; i++) {
      // Spiral distribution
      const angle = Math.random() * Math.PI * 2;
      
      // Arm factor for spiral arms (2 arms)
      const arm = Math.floor(Math.random() * 2) * Math.PI;
      const t = Math.random();
      const distance = 12 + t * 115; // radial dispersion
      
      // Introduce spiral warp math
      const finalAngle = angle * 0.2 + arm + t * Math.PI * 1.5;
      const x = centerX + Math.cos(finalAngle) * distance;
      const y = centerY + Math.sin(finalAngle) * distance;
      const r = Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.7 + 0.3;
      const speedOffset = Math.random() * 10 + 5; // Rotation offset

      stars.push({ x, y, r, opacity, speedOffset });
    }
    return stars;
  }, [customerUniverse]);

  // Handle Step Advancement
  const nextStep = () => {
    if (step < 4) {
      setStep((step + 1) as any);
    } else if (step === 4) {
      setStep(5);
      startAIAnalysis();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  // Run Onboarding analysis sequence
  const startAIAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCalibLogs([]);
    setShowReport(false);

    const steps = [
      "Analyzing Brand DNA parameters...",
      "Polaris studying customer cohort signals...",
      "Luna scanning database growth opportunities...",
      "Vega forecasting retention & conversion potential...",
      "Nova identifying personalization engagement patterns...",
      "Atlas building custom execution & campaign profiles...",
      "Calibrating system boardroom models to business node...",
      "Brand DNA successfully decoded. Report generated."
    ];

    steps.forEach((log, index) => {
      setTimeout(() => {
        setCalibLogs(prev => [...prev, log]);
        const progress = Math.round(((index + 1) / steps.length) * 100);
        setAnalysisProgress(progress);
        
        if (index === steps.length - 1) {
          setTimeout(() => {
            // Apply contexts personalization based on category
            personalizeForBusiness(businessType);
            setIsAnalyzing(false);
            setShowReport(true);
          }, 800);
        }
      }, (index + 1) * 900);
    });
  };

  // Calculated Report Values based on Category and Scale
  const reportData = useMemo(() => {
    const isEnterprise = businessType === "Enterprise";
    const isJewellery = businessType === "Jewellery & Accessories";
    const isFashion = businessType === "Fashion & Apparel";
    const isBeauty = businessType === "Beauty & Skincare";
    const isFood = businessType === "Food & Bakery";

    // Dynamic metrics
    const potRevenue = isEnterprise ? "₹3,80,000" 
                     : isJewellery ? "₹45,000" 
                     : isFashion ? "₹34,500" 
                     : isBeauty ? "₹28,900" 
                     : isFood ? "₹18,500"
                     : "₹24,500";

    const expectedMissionRevenue = isEnterprise ? "₹2,50,000" 
                                 : isJewellery ? "₹32,000" 
                                 : isFashion ? "₹12,000" 
                                 : isBeauty ? "₹18,500" 
                                 : isFood ? "₹8,900"
                                 : "₹15,000";

    const inactiveCount = isFood ? 28 : isBeauty ? 14 : isEnterprise ? 3 : isJewellery ? 6 : 12;
    const leadsCount = isFood ? 32 : isBeauty ? 25 : isEnterprise ? 4 : isJewellery ? 9 : 17;
    const vipCount = isEnterprise ? 2 : isJewellery ? 5 : isFashion ? 12 : 8;

    const bestAudience = isFashion ? "Repeat Buyers" 
                       : isBeauty ? "Slipping VIPs" 
                       : isJewellery ? "Cart Abandoners" 
                       : isEnterprise ? "High LTV Inactive" 
                       : "New Signups";

    const bestCampaign = isFashion ? "New Collection Drop" 
                       : isBeauty ? "Serum Replenishment Alert" 
                       : isFood ? "Weekend Brunch Boost" 
                       : isJewellery ? "Private VIP Pre-sales" 
                       : isEnterprise ? "License Seat Add-ons"
                       : "Autonomous win-back";

    const recommendedChannel = isFashion ? "RCS Cards" 
                             : isBeauty || isFood ? "WhatsApp" 
                             : isEnterprise ? "Email Gateway" 
                             : "Multi-channel";

    return {
      potRevenue,
      expectedMissionRevenue,
      inactiveCount,
      leadsCount,
      vipCount,
      bestAudience,
      bestCampaign,
      recommendedChannel,
      healthScore: 82 + Math.floor(Math.random() * 12),
      opportunityScore: 85 + Math.floor(Math.random() * 11)
    };
  }, [businessType]);

  // Complete onboarding
  const handleLaunch = (withMissionGoal?: string) => {
    if (withMissionGoal) {
      onSetupComplete(withMissionGoal);
    } else {
      onSetupComplete();
    }
  };

  return (
    <div className={`relative min-h-screen space-grid flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto transition-colors duration-300 ${
      isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"
    }`}>
      {/* Visual background overlays */}
      <div className={`pointer-events-none fixed inset-0 space-grid transition-opacity duration-300 ${isLight ? "opacity-20" : "opacity-40"}`} />
      
      {/* Swirling space glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full pointer-events-none transition-opacity duration-300 ${
        isLight ? "opacity-5" : "opacity-15"
      }`} 
        style={{
          background: `radial-gradient(circle, ${isLight ? "#3B82F6" : "#8B5CF6"} 0%, transparent 70%)`
        }} 
      />

      {/* Main Container Wizard */}
      <div className="relative w-full max-w-5xl flex flex-col items-center py-6 z-10">
        
        {step < 5 && (
          /* ════════════════════════════════════════
              ONBOARDING WIZARD STEPS
          ════════════════════════════════════════ */
          <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
            {/* Header branding */}
            <div className="text-center space-y-2">
              <span className={`font-mono text-[9px] tracking-[0.25em] uppercase border px-3.5 py-1 rounded-full ${
                isLight 
                  ? "border-blue-500/30 bg-blue-500/5 text-blue-600 font-bold" 
                  : "border-orbit-blue/30 bg-orbit-blue/5 text-orbit-blue"
              }`}>
                Brand DNA Initializer
              </span>
              <h1 className="text-2xl md:text-4xl font-bold font-space tracking-tight">
                Let's Decode Your Brand DNA
              </h1>
              <p className={`text-[11px] md:text-xs max-w-xl mx-auto leading-relaxed uppercase font-mono tracking-wider ${
                isLight ? "text-gray-500" : "text-gray-400"
              }`}>
                Understand Your Brand. Unlock Your Growth Potential.
              </p>
            </div>

            {/* Step Progress indicators */}
            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-gray-550">
              <span className={step === 1 ? "text-white font-bold" : ""}>01. Identity</span>
              <ChevronRight size={10} className="opacity-40" />
              <span className={step === 2 ? "text-white font-bold" : ""}>02. Universe</span>
              <ChevronRight size={10} className="opacity-40" />
              <span className={step === 3 ? "text-white font-bold" : ""}>03. Mission</span>
              <ChevronRight size={10} className="opacity-40" />
              <span className={step === 4 ? "text-white font-bold" : ""}>04. Personality</span>
            </div>

            {/* Step 1: Business Identity */}
            {step === 1 && (
              <div className="w-full orbit-panel p-5 md:p-6 space-y-6 animate-fade-in-up">
                <div className="border-b border-gray-900 pb-3 flex items-center gap-2">
                  <Cpu size={14} className="text-orbit-purple" />
                  <h3 className="font-space text-sm font-bold uppercase tracking-wider">Business profile credentials</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[9px] text-gray-500 uppercase block mb-1">What is your brand name?</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      placeholder="e.g. Moonlight Kurtis"
                      className="w-full bg-gray-950 border border-gray-900 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-orbit-blue/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Business Type */}
                    <div className="space-y-2">
                      <label className="font-mono text-[9px] text-gray-500 uppercase block">Business category</label>
                      <select
                        value={businessType}
                        onChange={e => setBusinessType(e.target.value as BusinessType)}
                        className="w-full bg-gray-950 border border-gray-900 rounded-xl p-3 font-mono text-[10px] text-white focus:outline-none focus:border-orbit-blue/40"
                      >
                        <option value="Fashion & Apparel">Fashion & Apparel</option>
                        <option value="Beauty & Skincare">Beauty & Skincare</option>
                        <option value="Food & Bakery">Food & Bakery</option>
                        <option value="Jewellery & Accessories">Jewellery & Accessories</option>
                        <option value="D2C Brand">D2C Brand</option>
                        <option value="Enterprise">Enterprise</option>
                        <option value="Custom">Custom...</option>
                      </select>
                    </div>

                    {/* Sales Channel */}
                    <div className="space-y-2">
                      <label className="font-mono text-[9px] text-gray-500 uppercase block">Primary sales channel</label>
                      <select
                        value={salesChannel}
                        onChange={e => setSalesChannel(e.target.value as SalesChannel)}
                        className="w-full bg-gray-950 border border-gray-900 rounded-xl p-3 font-mono text-[10px] text-white focus:outline-none focus:border-orbit-purple/40"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Website">Website</option>
                        <option value="Offline Store">Offline Store</option>
                        <option value="Marketplace">Marketplace</option>
                        <option value="Multi-channel">Multi-channel</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Customer Universe */}
            {step === 2 && (
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in-up items-center">
                {/* Left controls selectors */}
                <div className="md:col-span-6 orbit-panel p-5 md:p-6 space-y-4">
                  <div className="border-b border-gray-900 pb-3 flex items-center gap-2">
                    <Users size={14} className="text-orbit-blue" />
                    <h3 className="font-space text-sm font-bold uppercase tracking-wider">Customer Universe Scale</h3>
                  </div>
                  
                  <label className="font-mono text-[9px] text-gray-500 uppercase block">How many active customers do you currently have?</label>
                  <div className="flex flex-col gap-2">
                    {(["0–100", "100–500", "500–1000", "1000–5000", "5000+"] as CustomerUniverse[]).map((univ) => {
                      const isSelected = customerUniverse === univ;
                      return (
                        <button
                          key={univ}
                          onClick={() => setCustomerUniverse(univ)}
                          className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? "border-orbit-blue bg-orbit-blue/10 text-white font-bold" 
                              : "border-gray-900 bg-transparent text-gray-400 hover:border-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span>{univ} customers</span>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orbit-blue shadow-orbit-glow" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right concentric galaxy visualization */}
                <div className="md:col-span-6 flex flex-col items-center justify-center py-6 orbit-panel relative overflow-hidden min-h-[300px]">
                  <div className="absolute inset-0 bg-orbit-glow-blue opacity-5 pointer-events-none" />
                  
                  {/* Rotating Concentric SVG Galaxy */}
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Concentric spin shells */}
                    <div className="absolute inset-0 rounded-full border border-orbit-blue/5 animate-orbit-spin-slow" />
                    <div className="absolute inset-6 rounded-full border border-dashed border-orbit-purple/10 animate-orbit-spin-reverse" />
                    
                    {/* SVG Canvas drawing Procedural star fields */}
                    <svg 
                      className="absolute inset-0 w-full h-full pointer-events-none" 
                      viewBox="0 0 300 300"
                    >
                      <g className="animate-spin-slow origin-center">
                        {galaxyStars.map((s, idx) => (
                          <circle 
                            key={idx} 
                            cx={s.x} 
                            cy={s.y} 
                            r={s.r} 
                            fill={idx % 3 === 0 ? "#8B5CF6" : idx % 2 === 0 ? "#3B82F6" : "#22C55E"} 
                            opacity={s.opacity} 
                            className="animate-pulse"
                          />
                        ))}
                      </g>
                    </svg>

                    <div className="absolute inset-20 rounded-full bg-[#070b20]/45 border border-orbit-blue/35 flex flex-col items-center justify-center shadow-orbit-glow font-mono">
                      <span className="text-[7px] text-gray-500 uppercase tracking-widest block">Universe size</span>
                      <span className="text-sm font-bold text-white block mt-0.5">{customerUniverse}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Growth Objective */}
            {step === 3 && (
              <div className="w-full orbit-panel p-5 md:p-6 space-y-4 animate-fade-in-up">
                <div className="border-b border-gray-900 pb-3 flex items-center gap-2">
                  <Target size={14} className="text-orbit-success" />
                  <h3 className="font-space text-sm font-bold uppercase tracking-wider">Primary growth target</h3>
                </div>

                <label className="font-mono text-[9px] text-gray-500 uppercase block mb-1">What is your primary marketing goal?</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    "Increase Revenue", 
                    "Reduce Churn", 
                    "Increase Repeat Purchases", 
                    "Acquire New Customers", 
                    "Launch New Products", 
                    "Improve Engagement"
                  ] as GrowthObjective[]).map((obj) => {
                    const isSelected = growthObjective === obj;
                    return (
                      <button
                        key={obj}
                        onClick={() => setGrowthObjective(obj)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? "border-orbit-success bg-orbit-success/10 text-white font-bold" 
                            : "border-gray-900 bg-transparent text-gray-400 hover:border-gray-800"
                        }`}
                      >
                        <span className="font-space text-xs font-bold block">{obj}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Growth Personality */}
            {step === 4 && (
              <div className="w-full space-y-4 animate-fade-in-up">
                <div className="text-center">
                  <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-2">Configure operative strategy card</label>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {([
                    { name: "Conservative", desc: "Focuses on budget management, maximum confidence thresholds, zero fatigue risk.", color: "border-blue-500/30" },
                    { name: "Balanced", desc: "Maintains optimal dispatch frequency, mid-tier ROI yields, structured campaigns.", color: "border-cyan-500/30" },
                    { name: "Aggressive", desc: "High frequency push notifications, massive conversions focus, higher churn risks.", color: "border-red-500/30" },
                    { name: "Customer First", desc: "Maintains high personalization values, filters opt-outs, shields loyal buyers.", color: "border-orbit-purple/40 shadow-orbit-glow-purple" },
                    { name: "Autopilot", desc: "Fully autonomous dispatch triggers. Agents execute win-backs and promotions automatically.", color: "border-orbit-success/30" }
                  ] as { name: GrowthPersonality; desc: string; color: string }[]).map((card) => {
                    const isSelected = growthPersonality === card.name;
                    return (
                      <button
                        key={card.name}
                        onClick={() => setGrowthPersonality(card.name)}
                        className={`p-3 rounded-xl border text-left cursor-pointer flex flex-col justify-between min-h-[160px] transition-all bg-gray-950/20 backdrop-blur-sm ${
                          isSelected 
                            ? `border-opacity-100 ${card.color} bg-gray-900/60` 
                            : "opacity-65 hover:opacity-95 hover:border-gray-850"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-space text-xs font-bold text-white">{card.name}</span>
                          {isSelected && <CheckCircle2 size={10} className="text-orbit-purple" />}
                        </div>
                        <p className="font-mono text-[8.5px] leading-relaxed text-gray-500 mt-2">{card.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer Button Strip */}
            <div className="w-full flex items-center justify-between pt-4 border-t border-gray-900">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="px-4 py-2.5 rounded-lg border border-gray-900 text-gray-500 font-mono text-[10px] uppercase cursor-pointer hover:border-gray-850 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Back
              </button>
              
              <button
                onClick={nextStep}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orbit-blue to-orbit-purple text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:opacity-95 active:scale-95 duration-200 cursor-pointer shadow-orbit-glow"
              >
                <span>Continue</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: loader or Report presentation */}
        {step === 5 && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            
            {isAnalyzing ? (
              /* ════════════════════════════════════════
                  AI ANALYSIS TELEMETRY LOADER
              ════════════════════════════════════════ */
              <div className="relative w-full max-w-lg bg-gray-900/85 backdrop-blur-md border border-gray-850 rounded-2xl p-6 sm:p-8 shadow-orbit-glow flex flex-col space-y-6 animate-pulse-slow">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="text-orbit-purple animate-spin" />
                    <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Decoding Brand DNA Sockets</span>
                  </div>
                  <span className="font-mono text-xs text-orbit-purple font-bold tabular-nums">{analysisProgress}%</span>
                </div>

                <div className="font-mono text-[10px] space-y-2.5 h-52 overflow-y-auto text-green-400 pr-2 scrollbar-thin">
                  {calibLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 animate-fade-in-up">
                      <span className="text-orbit-purple font-bold">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orbit-blue to-orbit-purple rounded-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-gray-650 font-mono text-[9px] uppercase border-t border-gray-850 pt-4">
                  <span>Model: adapt_dna.ts</span>
                  <span className="animate-pulse">Studying marketing vectors...</span>
                </div>
              </div>
            ) : showReport ? (
              /* ════════════════════════════════════════
                  BRAND DNA REPORT BRIEFING BOARD
              ════════════════════════════════════════ */
              <div className="w-full space-y-6 animate-fade-in-up">
                
                {/* Header status bar */}
                <div className="text-center space-y-2 mb-2">
                  <span className="font-mono text-[9px] text-orbit-success border border-orbit-success/30 px-3.5 py-1 rounded-full bg-orbit-success/5 uppercase font-bold tracking-widest">
                    Your Brand DNA Has Been Decoded
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold font-space tracking-tight">
                    Intelligence Briefing Profile
                  </h1>
                  <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                    ORBIT is now calibrated and personalized to your business. Let's inspect your growth assets.
                  </p>
                </div>

                {/* Dashboard layout split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* COLUMN 1: Brand DNA Report */}
                  <div className="orbit-panel p-5 flex flex-col justify-between min-h-[300px]">
                    <div className="border-b border-gray-900 pb-3">
                      <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Brand DNA Details</span>
                    </div>

                    <div className="flex-1 space-y-4 font-mono text-[10px] mt-4">
                      <div>
                        <span className="text-gray-550 block uppercase text-[8px]">Brand</span>
                        <span className="text-white font-bold text-xs">{brandName}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-550 block uppercase text-[8px]">Category</span>
                          <span className="text-white font-bold">{businessType}</span>
                        </div>
                        <div>
                          <span className="text-gray-550 block uppercase text-[8px]">Growth Style</span>
                          <span className="text-white font-bold">{growthPersonality}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-550 block uppercase text-[8px]">Primary Channel</span>
                          <span className="text-white font-bold">{salesChannel}</span>
                        </div>
                        <div>
                          <span className="text-gray-550 block uppercase text-[8px]">Universe size</span>
                          <span className="text-white font-bold">{customerUniverse} stars</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between">
                        <div>
                          <span className="text-gray-550 block uppercase text-[8px]">Orbit health rating</span>
                          <span className="text-xs font-bold text-orbit-success">{reportData.healthScore}/100</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-950 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-orbit-success" style={{ width: `${reportData.healthScore}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: AI Insights checklist */}
                  <div className="orbit-panel p-5 flex flex-col min-h-[300px]">
                    <div className="border-b border-gray-900 pb-3 mb-4">
                      <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Targeted AI Insights</span>
                    </div>

                    <div className="flex-1 space-y-3 font-mono text-[9px] text-gray-400">
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Best Audience Node:</span>
                        <span className="text-white font-bold uppercase">{reportData.bestAudience}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Highest Opportunity:</span>
                        <span className="text-white font-bold uppercase">Abandoned Enquiries</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Optimal Campaign:</span>
                        <span className="text-white font-bold uppercase truncate max-w-[120px]">{reportData.bestCampaign}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Recommended Channel:</span>
                        <span className="text-orbit-purple font-bold uppercase">{reportData.recommendedChannel}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Predicted Growth Potential:</span>
                        <span className="text-orbit-success font-bold uppercase">High</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Campaign Risk Level:</span>
                        <span className="text-blue-400 font-bold uppercase">Low</span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 3: Growth Opportunity Radar (Luna) */}
                  <div className="orbit-panel p-5 flex flex-col justify-between min-h-[300px]">
                    <div className="border-b border-gray-900 pb-3 flex items-center gap-1">
                      <Activity size={12} className="text-pink-400" />
                      <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Growth Opportunity Radar</span>
                    </div>

                    <div className="flex-1 space-y-3.5 font-mono text-[10px] mt-4">
                      <div className="flex justify-between">
                        <span className="text-gray-550">Recoverable Revenue:</span>
                        <span className="text-white font-bold">{reportData.potRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Inactive Customers:</span>
                        <span className="text-white font-bold">{reportData.inactiveCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Abandoned Leads:</span>
                        <span className="text-white font-bold">{reportData.leadsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">VIP Customers:</span>
                        <span className="text-white font-bold">{reportData.vipCount}</span>
                      </div>
                      
                      <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between">
                        <span className="text-gray-550 uppercase text-[8px] font-bold">Opportunity score</span>
                        <span className="font-space text-sm font-bold text-pink-400">{reportData.opportunityScore}/100</span>
                      </div>
                    </div>
                    <span className="font-mono text-[7px] text-gray-650 uppercase tracking-widest text-center mt-2 block">Powered by Luna Agent</span>
                  </div>

                </div>

                {/* BOTTOM: AI Recommended Launch Mission */}
                <div className="orbit-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center border border-orbit-purple/20 bg-orbit-purple/5">
                  <div className="md:col-span-2 space-y-2">
                    <span className="font-mono text-[8px] text-orbit-purple border border-orbit-purple/30 bg-orbit-purple/5 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      Recommended Next Mission
                    </span>
                    <h3 className="font-space text-lg font-bold text-white uppercase tracking-tight">Recover Lost Revenue</h3>
                    <p className="font-mono text-[9.5px] leading-relaxed text-gray-400">
                      Luna has detected high-affinity checkout leaks. Launching this mission dispatches automated WhatsApp templates to recover up to <span className="text-orbit-success font-bold">{reportData.potRevenue}</span> in dormant cart assets.
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-right">
                    <div className="font-mono text-[10px] space-y-1">
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-gray-550">Expected Yield:</span>
                        <span className="text-orbit-success font-bold">{reportData.potRevenue}</span>
                      </div>
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-gray-550">Confidence Score:</span>
                        <span className="text-white font-bold">91%</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 justify-end">
                      <button
                        onClick={() => handleLaunch()}
                        className="px-4 py-3 border border-gray-800 bg-gray-950/40 text-gray-300 font-mono text-[9px] uppercase tracking-wider font-bold rounded-xl cursor-pointer hover:border-gray-750 transition-colors"
                      >
                        [Enter Command Center]
                      </button>
                      <button
                        onClick={() => handleLaunch("Reduce Churn")}
                        className="px-5 py-3 bg-gradient-to-r from-orbit-blue to-orbit-purple text-white font-mono text-[9px] uppercase tracking-widest font-bold rounded-xl cursor-pointer shadow-orbit-glow hover:opacity-95 duration-150 transition-opacity"
                      >
                        Start Mission
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        )}

      </div>
    </div>
  );
};
export default BusinessProfileSetup;
