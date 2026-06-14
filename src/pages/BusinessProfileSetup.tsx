import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShoppingBag, Utensils, Dumbbell, Layers, Upload, Loader2, Check,
  FileText, Database, Play, Server, AlertCircle
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface BusinessProfileSetupProps {
  onSetupComplete: (goal?: string) => void;
}

export const BusinessProfileSetup: React.FC<BusinessProfileSetupProps> = ({ onSetupComplete }) => {
  const { 
    switchWorkspace, 
    uploadDatasetAndReconfigure, 
    isAnalyzingDataset, 
    theme 
  } = useOrbit();

  const isLight = theme === "executive";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Onboarding Stage states
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Custom artificial stepper states to show detailed analysis phases
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [stepperRunning, setStepperRunning] = useState(false);

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
          onSetupComplete();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isAnalyzingDataset, stepperRunning, onSetupComplete]);

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
              <span className="font-space text-xs font-bold uppercase tracking-wider text-white">ORBIT Analyzer Pipeline</span>
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
            Welcome to ORBIT
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
};
