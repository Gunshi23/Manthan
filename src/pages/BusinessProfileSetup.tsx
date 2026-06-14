import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  ShoppingBag, Utensils, Dumbbell, Layers, Upload, Loader2, Check,
  FileText, Database, Play, Server, AlertCircle,
  Cpu, Users, Target, ChevronRight, CheckCircle2, ArrowRight, Activity
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";

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
  const { 
    switchWorkspace, 
    uploadDatasetAndReconfigure, 
    isAnalyzingDataset, 
    theme,
    workspaceDna,
    personalizeForBusiness,
    config
  } = useOrbit();

  const isLight = theme === "executive";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Onboarding Stage states
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Custom artificial stepper states to show detailed analysis phases
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [stepperRunning, setStepperRunning] = useState(false);
  const [fileUploadedName, setFileUploadedName] = useState<string>("");

  // Mode state: "selection" (landing options) | "questionnaire" (wizard steps 1-5)
  const [mode, setMode] = useState<"selection" | "questionnaire">("selection");
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
  const [apiReportData, setApiReportData] = useState<any>(null);

  const steps = [
    { label: "File Upload", desc: "Ingesting raw business dataset" },
    { label: "Dataset Analysis", desc: "Parsing columns, transactions, and currency metrics" },
    { label: "Industry Detection", desc: "Classifying business vertical using DNA classifier" },
    { label: "Business DNA Generation", desc: "Synthesizing custom KPI sets, channels, and metrics" },
    { label: "Persona Generation", desc: "Clustering customer archetypes from CRM signals" },
    { label: "Opportunity Radar Calibrator", desc: "Scanning revenue leaks & dormant accounts" },
    { label: "Workspace Creation", desc: "Finalizing and initializing dashboard instances" }
  ];

  // Stepper animator when file is analyzing
  useEffect(() => {
    if (isAnalyzingDataset) {
      setStepperRunning(true);
      setAnalysisStep(0);
    } else {
      if (!isAnalyzingDataset && stepperRunning) {
        // Fast forward to end
        setAnalysisStep(steps.length);
        const timer = setTimeout(() => {
          setStepperRunning(false);
          
          // Pre-populate fields based on workspaceDna from analysis if available
          if (workspaceDna) {
            if (fileUploadedName) {
              setBrandName(fileUploadedName);
            } else {
              setBrandName(workspaceDna.topCategory || "My Business");
            }
            
            // Match industry type
            const matchedType = workspaceDna.industryType;
            if (matchedType) {
              if (["Fashion & Apparel", "Beauty & Skincare", "Food & Bakery", "Jewellery & Accessories", "D2C Brand", "Enterprise", "Custom"].includes(matchedType)) {
                setBusinessType(matchedType as BusinessType);
              } else if (matchedType.toLowerCase().includes("fashion") || matchedType.toLowerCase().includes("clothing")) {
                setBusinessType("Fashion & Apparel");
              } else if (matchedType.toLowerCase().includes("skincare") || matchedType.toLowerCase().includes("beauty") || matchedType.toLowerCase().includes("cosmetic")) {
                setBusinessType("Beauty & Skincare");
              } else if (matchedType.toLowerCase().includes("food") || matchedType.toLowerCase().includes("restaurant") || matchedType.toLowerCase().includes("bakery")) {
                setBusinessType("Food & Bakery");
              } else if (matchedType.toLowerCase().includes("jewel")) {
                setBusinessType("Jewellery & Accessories");
              } else if (matchedType.toLowerCase().includes("saas") || matchedType.toLowerCase().includes("enterprise")) {
                setBusinessType("Enterprise");
              } else {
                setBusinessType("D2C Brand");
              }
            }

            // Match primary channel
            const matchedChannel = workspaceDna.primaryChannel;
            if (matchedChannel) {
              if (["Instagram", "WhatsApp", "Website", "Offline Store", "Marketplace", "Multi-channel"].includes(matchedChannel)) {
                setSalesChannel(matchedChannel as SalesChannel);
              } else if (matchedChannel.toLowerCase().includes("instagram")) {
                setSalesChannel("Instagram");
              } else if (matchedChannel.toLowerCase().includes("whatsapp")) {
                setSalesChannel("WhatsApp");
              } else if (matchedChannel.toLowerCase().includes("web")) {
                setSalesChannel("Website");
              } else {
                setSalesChannel("Multi-channel");
              }
            }

            // Match customer universe
            const count = workspaceDna.totalCustomers || 150;
            if (count <= 100) setCustomerUniverse("0–100");
            else if (count <= 500) setCustomerUniverse("100–500");
            else if (count <= 1000) setCustomerUniverse("500–1000");
            else if (count <= 5000) setCustomerUniverse("1000–5000");
            else setCustomerUniverse("5000+");
          }

          setMode("questionnaire");
          setStep(1);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isAnalyzingDataset, stepperRunning, workspaceDna, fileUploadedName]);

  useEffect(() => {
    if (stepperRunning && isAnalyzingDataset) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => {
          if (prev < steps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 700); // 700ms per step
      return () => clearInterval(interval);
    }
  }, [stepperRunning, isAnalyzingDataset]);

  // File selection / drop
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json", "xlsx", "xls"].includes(ext || "")) {
      setUploadError("Unsupported format. Please upload CSV, XLSX, or JSON.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be under 10 MB.");
      return;
    }

    setFileUploadedName(file.name.replace(/\.[^/.]+$/, ""));
    try {
      await uploadDatasetAndReconfigure(file);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process dataset.");
    }
  }, [uploadDatasetAndReconfigure]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const selectDemo = async (demoKey: string) => {
    await switchWorkspace(demoKey);
    onSetupComplete();
  };

  // procedural generation of stars coordinates for the customer galaxy
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
      const angle = Math.random() * Math.PI * 2;
      const arm = Math.floor(Math.random() * 2) * Math.PI;
      const t = Math.random();
      const distance = 12 + t * 115;
      
      const finalAngle = angle * 0.2 + arm + t * Math.PI * 1.5;
      const x = centerX + Math.cos(finalAngle) * distance;
      const y = centerY + Math.sin(finalAngle) * distance;
      const r = Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.7 + 0.3;
      const speedOffset = Math.random() * 10 + 5;

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
    } else if (step === 1) {
      setMode("selection");
    }
  };

  // Run Onboarding analysis sequence
  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCalibLogs([]);
    setShowReport(false);
    setApiReportData(null);

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

    let currentStep = 0;
    const logTimer = setInterval(() => {
      if (currentStep < steps.length) {
        setCalibLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
        setAnalysisProgress(Math.round((currentStep / steps.length) * 100));
      } else {
        clearInterval(logTimer);
      }
    }, 450);

    let geminiReport: any = null;
    if (config.geminiKey) {
      try {
        const systemPrompt = `You are the orbit.ai AI Organization Decoded Node. Analyze the user's business onboarding profile and generate a custom Brand DNA report.
Format your response as a valid JSON object matching this schema exactly:
{
  "potRevenue": "₹X,XX,XXX" (Estimated recoverable revenue from leakages, e.g. "₹34,500"),
  "expectedMissionRevenue": "₹X,XX,XXX" (Expected yield of the recommended mission, e.g. "₹12,000"),
  "inactiveCount": number (number of inactive VIP customer profiles found, e.g. 12),
  "leadsCount": number (number of abandoned checkout leads found, e.g. 17),
  "vipCount": number (number of loyal VIP customers, e.g. 8),
  "bestAudience": "string" (Recommended best audience cohort, e.g. "Repeat Buyers"),
  "bestCampaign": "string" (Optimal campaign strategy variant, e.g. "New Collection Drop"),
  "recommendedChannel": "string" (Recommended primary communication channel, e.g. "RCS Cards"),
  "healthScore": number (overall database/brand health rating from 1 to 100, e.g. 88),
  "opportunityScore": number (opportunity score from 1 to 100, e.g. 91),
  "recommendedMissionName": "string" (Recommended next campaign mission goal, e.g. "Recover Lost Revenue"),
  "recommendedMissionDescription": "string" (Brief summary explaining the mission goal and channel, e.g. "Luna has detected high-affinity checkout leaks...")
}
Return ONLY the raw JSON. Do not write markdown tags or extra explanations.`;

        const userPrompt = `Brand Name: "${brandName}"
Category: "${businessType}"
Channel: "${salesChannel}"
Universe Scale: "${customerUniverse}"
Goal: "${growthObjective}"
Style: "${growthPersonality}"`;

        const resText = await callGeminiAPI(userPrompt, systemPrompt, config.geminiKey);
        geminiReport = parseGeminiJson(resText, null);
      } catch (err) {
        console.warn("Gemini Onboarding Decoding failed:", err);
      }
    }

    await new Promise(res => setTimeout(res, steps.length * 450 + 100));

    if (geminiReport) {
      setApiReportData(geminiReport);
    }
    
    personalizeForBusiness(businessType);
    setIsAnalyzing(false);
    setShowReport(true);
  };

  // Calculated Report Values based on Category and Scale (Local fallback)
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

  // Merge report values from API if available, otherwise local static memo
  const activeReport = useMemo(() => {
    if (apiReportData) {
      return {
        potRevenue: apiReportData.potRevenue || "₹24,500",
        expectedMissionRevenue: apiReportData.expectedMissionRevenue || "₹15,000",
        inactiveCount: apiReportData.inactiveCount ?? 12,
        leadsCount: apiReportData.leadsCount ?? 17,
        vipCount: apiReportData.vipCount ?? 8,
        bestAudience: apiReportData.bestAudience || "New Signups",
        bestCampaign: apiReportData.bestCampaign || "Autonomous win-back",
        recommendedChannel: apiReportData.recommendedChannel || "WhatsApp",
        healthScore: apiReportData.healthScore || 85,
        opportunityScore: apiReportData.opportunityScore || 88,
        recommendedMissionName: apiReportData.recommendedMissionName || "Recover Lost Revenue",
        recommendedMissionDescription: apiReportData.recommendedMissionDescription || `Luna has detected high-affinity checkout leaks. Launching this mission dispatches automated templates to recover up to ${apiReportData.potRevenue || "₹24,500"} in dormant cart assets.`
      };
    }
    return {
      ...reportData,
      recommendedMissionName: "Recover Lost Revenue",
      recommendedMissionDescription: `Luna has detected high-affinity checkout leaks. Launching this mission dispatches automated ${businessType === "Fashion & Apparel" ? "RCS Cards" : "WhatsApp"} templates to recover up to ${reportData.potRevenue} in dormant cart assets.`
    };
  }, [apiReportData, reportData, businessType]);

  // Complete onboarding
  const handleLaunch = (withMissionGoal?: string) => {
    if (withMissionGoal) {
      onSetupComplete(withMissionGoal);
    } else {
      onSetupComplete();
    }
  };

  const Background = () => (
    <>
      <div className={`pointer-events-none fixed inset-0 space-grid transition-opacity duration-300 ${isLight ? "opacity-20" : "opacity-40"}`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none transition-opacity duration-300 ${isLight ? "opacity-5" : "opacity-15"}`}
        style={{ background: `radial-gradient(circle, ${isLight ? "#3B82F6" : "#8B5CF6"} 0%, transparent 75%)` }}
      />
    </>
  );

  if (isAnalyzingDataset || stepperRunning) {
    const progressPct = Math.round((analysisStep / steps.length) * 100);
    return (
      <div className={`relative min-h-screen space-grid flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto transition-colors duration-300 ${isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"}`}>
        <Background />
        
        <div className="relative z-10 w-full max-w-xl orbit-panel p-6 sm:p-8 space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-gray-950/60 pb-4">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-orbit-purple animate-spin" />
              <span className="font-space text-xs font-bold uppercase tracking-wider text-white">orbit.ai Analyzer Pipeline</span>
            </div>
            <span className="font-mono text-xs text-orbit-purple font-bold">{progressPct}% Complete</span>
          </div>

          {/* Stepper items */}
          <div className="space-y-4 font-mono text-xs">
            {steps.map((step, idx) => {
              const isCompleted = analysisStep > idx;
              const isActive = analysisStep === idx;
              return (
                <div key={idx} className={`flex items-start gap-3.5 transition-all duration-300 ${isCompleted ? "opacity-50" : isActive ? "opacity-100 scale-[1.01]" : "opacity-25"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border text-[9px] shrink-0 ${
                    isCompleted 
                      ? "bg-orbit-success/15 border-orbit-success/40 text-orbit-success" 
                      : isActive 
                      ? "bg-orbit-purple/20 border-orbit-purple/60 text-orbit-purple font-bold animate-pulse" 
                      : "bg-gray-900 border-gray-800 text-transparent"
                  }`}>
                    {isCompleted ? <Check size={11} strokeWidth={3} /> : idx + 1}
                  </div>
                  <div>
                    <span className={`block font-bold ${isActive ? "text-orbit-purple" : "text-white"}`}>{step.label}</span>
                    <span className="text-[10px] text-gray-550 leading-tight block mt-0.5">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-950 rounded-full h-1.5 border border-gray-900 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orbit-blue to-orbit-purple transition-all duration-300 ease-out" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className={`relative min-h-screen space-grid flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto transition-colors duration-300 ${isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"}`}>
        <Background />
        
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8 py-8">
          
          {/* Title and Header */}
          <div className="text-center space-y-3">
            <span className={`font-mono text-[9px] tracking-[0.25em] uppercase border px-3.5 py-1 rounded-full ${isLight ? "border-blue-500/30 bg-blue-500/5 text-blue-600 font-bold" : "border-orbit-blue/30 bg-orbit-blue/5 text-orbit-blue"}`}>
              Smart Onboarding System
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-space tracking-tight">
              Welcome to orbit.ai
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed font-mono">
              Choose how you would like to start your AI Business Operating System.
            </p>
          </div>

          {/* Two main onboarding options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
            
            {/* Option 1: Explore Demo Workspace */}
            <div className="orbit-panel p-6 flex flex-col hover:border-orbit-blue/40 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orbit-blue/15 border border-orbit-blue/30 flex items-center justify-center shrink-0">
                  <Play size={18} className="text-orbit-blue" />
                </div>
                <div>
                  <span className="font-space text-sm font-bold text-white block">Explore Demo Workspace</span>
                  <span className="font-mono text-[9px] text-gray-550 uppercase tracking-wider">Demo Mode</span>
                </div>
              </div>
              <p className="font-mono text-[10.5px] text-gray-400 leading-relaxed mb-6">
                Experience ORBIT using realistic business datasets. Instantly calibrate dashboards, personas, boardroom debates, and growth engines.
              </p>

              {/* Quick Demo Workspace Selection Grid */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                {[
                  { id: "demo-fashion", name: "Fashion Brand Demo", icon: ShoppingBag, color: "#8B5CF6", desc: "Clothing & streetwear" },
                  { id: "demo-restaurant", name: "Restaurant Demo", icon: Utensils, color: "#F59E0B", desc: "Food delivery & dine-in" },
                  { id: "demo-gym", name: "Gym Demo", icon: Dumbbell, color: "#10B981", desc: "Fitness & memberships" },
                  { id: "demo-saas", name: "SaaS Demo", icon: Layers, color: "#6366F1", desc: "Software & subscriptions" }
                ].map(demo => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.id}
                      onClick={() => selectDemo(demo.id)}
                      className="group p-3 rounded-xl border border-gray-900 bg-gray-950/20 hover:bg-gray-900/40 hover:border-gray-750 transition-all text-left flex items-start gap-2.5 cursor-pointer"
                    >
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ background: `${demo.color}15`, border: `1px solid ${demo.color}25` }}
                      >
                        <Icon size={12} style={{ color: demo.color }} />
                      </div>
                      <div>
                        <span className="font-space text-[10px] font-bold text-white block leading-snug">{demo.name}</span>
                        <span className="font-mono text-[8px] text-gray-550 block mt-0.5 leading-none">{demo.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Option 2: Upload Business Data */}
            <div className="orbit-panel p-6 flex flex-col hover:border-orbit-purple/40 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orbit-purple/15 border border-orbit-purple/30 flex items-center justify-center shrink-0">
                  <Upload size={18} className="text-orbit-purple" />
                </div>
                <div>
                  <span className="font-space text-sm font-bold text-white block">Upload Business Data</span>
                  <span className="font-mono text-[9px] text-gray-550 uppercase tracking-wider">Live Workspace</span>
                </div>
              </div>
              <p className="font-mono text-[10.5px] text-gray-400 leading-relaxed mb-6">
                Upload your own CSV, XLSX or JSON files. ORBIT will dynamically parse your database, detect your industry, and spin up an active operating instance.
              </p>

              {/* File Dropzone */}
              <div
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center transition-all cursor-pointer flex-1 min-h-[140px] relative ${
                  dragOver 
                    ? "border-orbit-purple bg-orbit-purple/10 shadow-orbit-glow-purple" 
                    : "border-gray-900 bg-gray-950/10 hover:border-gray-800 hover:bg-gray-900/10"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                <Upload size={18} className="text-orbit-purple animate-pulse" />
                <div>
                  <span className="font-mono text-[10px] text-white block font-bold">Drop files here or click to browse</span>
                  <span className="font-mono text-[8px] text-gray-550 block mt-1">Supports CSV, XLSX, JSON · Max 10 MB</span>
                </div>

                <div className="flex items-center gap-2 mt-1 shrink-0">
                  <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-800 px-2 py-1 rounded">
                    <FileText size={9} className="text-green-400" />
                    <span className="font-mono text-[8px] text-gray-400">CSV/XLSX</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-800 px-2 py-1 rounded">
                    <Database size={9} className="text-blue-400" />
                    <span className="font-mono text-[8px] text-gray-400">JSON</span>
                  </div>
                </div>

                {uploadError && (
                  <div className="absolute inset-0 bg-red-950/95 border border-red-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-2 animate-fade-in">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="font-mono text-[9px] text-red-400 text-center font-bold px-2">{uploadError}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setUploadError(null); }}
                      className="mt-1 px-2.5 py-1 bg-red-900/40 border border-red-500/40 rounded-lg text-white font-mono text-[8px] hover:bg-red-950 cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footnote */}
          <div className="text-center">
            <span className="font-mono text-[8.5px] text-gray-550 uppercase tracking-widest flex items-center gap-1.5 justify-center">
              <Server size={10} />
              Data is parsed locally and synced in-memory on securely encrypted operator nodes.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // mode === "questionnaire"
  return (
    <div className={`relative min-h-screen space-grid flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto transition-colors duration-300 ${
      isLight ? "bg-gray-50 text-gray-900" : "bg-[#050816] text-white"
    }`}>
      <Background />
      
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
                isLight ? "text-gray-550" : "text-gray-400"
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
                  
                  <label className="font-mono text-[9px] text-gray-550 uppercase block">How many active customers do you currently have?</label>
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
                  
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-orbit-blue/5 animate-orbit-spin-slow" />
                    <div className="absolute inset-6 rounded-full border border-dashed border-orbit-purple/10 animate-orbit-spin-reverse" />
                    
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

                <label className="font-mono text-[9px] text-gray-550 uppercase block mb-1">What is your primary marketing goal?</label>
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
                  <label className="font-mono text-[9px] text-gray-550 uppercase tracking-widest block mb-2">Configure operative strategy card</label>
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
                            : "opacity-65 hover:opacity-95 hover:border-gray-855"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-space text-xs font-bold text-white">{card.name}</span>
                          {isSelected && <CheckCircle2 size={10} className="text-orbit-purple" />}
                        </div>
                        <p className="font-mono text-[8.5px] leading-relaxed text-gray-550 mt-2">{card.desc}</p>
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
                className="px-4 py-2.5 rounded-lg border border-gray-900 text-gray-500 font-mono text-[10px] uppercase cursor-pointer hover:border-gray-850 hover:text-gray-300"
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

                <div className="flex justify-between items-center text-gray-650 font-mono text-[9px] uppercase border-t border-gray-855 pt-4">
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
                          <span className="text-xs font-bold text-orbit-success">{activeReport.healthScore}/100</span>
                        </div>
                        <div className="w-16 h-1 bg-gray-950 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-orbit-success" style={{ width: `${activeReport.healthScore}%` }} />
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
                        <span className="text-white font-bold uppercase">{activeReport.bestAudience}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Highest Opportunity:</span>
                        <span className="text-white font-bold uppercase">Abandoned Enquiries</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Optimal Campaign:</span>
                        <span className="text-white font-bold uppercase truncate max-w-[120px]">{activeReport.bestCampaign}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-900/40 pb-1.5">
                        <span>Recommended Channel:</span>
                        <span className="text-orbit-purple font-bold uppercase">{activeReport.recommendedChannel}</span>
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
                        <span className="text-white font-bold">{activeReport.potRevenue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Inactive Customers:</span>
                        <span className="text-white font-bold">{activeReport.inactiveCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">Abandoned Leads:</span>
                        <span className="text-white font-bold">{activeReport.leadsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-550">VIP Customers:</span>
                        <span className="text-white font-bold">{activeReport.vipCount}</span>
                      </div>
                      
                      <div className="border-t border-gray-900/60 pt-3 flex items-center justify-between">
                        <span className="text-gray-550 uppercase text-[8px] font-bold">Opportunity score</span>
                        <span className="font-space text-sm font-bold text-pink-400">{activeReport.opportunityScore}/100</span>
                      </div>
                    </div>
                    <span className="font-mono text-[7px] text-gray-655 uppercase tracking-widest text-center mt-2 block">Powered by Luna Agent</span>
                  </div>

                </div>

                {/* BOTTOM: AI Recommended Launch Mission */}
                <div className="orbit-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center border border-orbit-purple/20 bg-orbit-purple/5">
                  <div className="md:col-span-2 space-y-2">
                    <span className="font-mono text-[8px] text-orbit-purple border border-orbit-purple/30 bg-orbit-purple/5 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      Recommended Next Mission
                    </span>
                    <h3 className="font-space text-lg font-bold text-white uppercase tracking-tight">{activeReport.recommendedMissionName}</h3>
                    <p className="font-mono text-[9.5px] leading-relaxed text-gray-400">
                      {activeReport.recommendedMissionDescription}
                    </p>
                  </div>
                  
                  <div className="space-y-4 text-right">
                    <div className="font-mono text-[10px] space-y-1">
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-gray-555">Expected Yield:</span>
                        <span className="text-orbit-success font-bold">{activeReport.expectedMissionRevenue}</span>
                      </div>
                      <div className="flex justify-between md:justify-end gap-4">
                        <span className="text-gray-555">Confidence Score:</span>
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
                        onClick={() => handleLaunch(activeReport.recommendedMissionName)}
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
