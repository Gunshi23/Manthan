import React, { useState } from "react";
import { Sparkles, Terminal, ArrowRight, Play, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { GuidedDemoModal } from "../components/GuidedDemoModal";

interface LandingPageProps {
  onEnterOS: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterOS }) => {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-Manthan-bg overflow-hidden space-grid flex flex-col justify-between">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-Manthan-glow-blue pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-Manthan-glow-purple pointer-events-none" />

      {/* Decorative scanline overlay */}
      <div className="scanlines" />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-Manthan-blue to-Manthan-purple flex items-center justify-center shadow-Manthan-glow animate-Manthan-pulse">
            <span className="font-space font-bold text-white text-lg">O</span>
          </div>
          <span className="font-space font-bold text-xl tracking-wider uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">Manthan.ai</span>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-gray-500 hidden sm:inline-block">SYSTEM STATUS: OPTIMAL</span>
          <button
            onClick={onEnterOS}
            className="px-4 py-2 rounded-lg border border-Manthan-blue/30 bg-Manthan-blue/10 text-xs text-Manthan-blue font-mono hover:bg-Manthan-blue/20 hover:border-Manthan-blue/50 transition-all flex items-center gap-1.5 shadow-Manthan-glow-inset"
          >
            <Terminal size={14} />
            Boot OS
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/40 backdrop-blur-md mb-8"
        >
          <Sparkles size={13} className="text-Manthan-blue animate-pulse" />
          <span className="text-xs font-mono text-gray-400 tracking-wider">AUTONOMOUS MARKETING OS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold font-space text-white leading-tight tracking-tight mb-6"
        >
          Increase Customer Revenue <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-Manthan-blue via-Manthan-purple to-pink-500">
            On Autopilot.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 font-inter leading-relaxed"
        >
          Keep Every Customer In Your Manthan. Manthan.ai orchestrates autonomous AI agents to segment users, model conversion ROI, generate copy, and launch campaigns.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <button
            onClick={onEnterOS}
            className="group px-8 py-4 rounded-xl bg-gradient-to-r from-Manthan-blue to-Manthan-purple text-sm font-semibold text-white shadow-Manthan-glow hover:shadow-Manthan-glow-purple transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            Initialize Command Center
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => setIsDemoOpen(true)}
            className="group px-8 py-4 rounded-xl border border-Manthan-blue/30 bg-[#0F172A]/85 hover:bg-[#1E293B] text-sm font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-Manthan-glow-inset hover:border-Manthan-blue/60 cursor-pointer"
          >
            <Play size={14} className="fill-current text-Manthan-blue group-hover:scale-110 transition-transform" />
            Watch Manthan.ai In Action
          </button>
        </motion.div>

        {/* Guided Demo Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="w-full bg-[#0F172A]/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md mb-20 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-Manthan-glow-blue opacity-[0.06] filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-Manthan-glow-purple opacity-[0.06] filter blur-3xl pointer-events-none" />

          {/* Left panel text */}
          <div className="text-left max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-Manthan-blue/30 bg-Manthan-blue/5 text-[10px] font-mono text-Manthan-blue uppercase tracking-wider">
              <Activity size={10} className="animate-pulse" />
              Autonomous Preview
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold font-space text-white leading-tight">
              A Complete Agent Organization. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-Manthan-blue to-Manthan-purple">
                Running in Unison.
              </span>
            </h2>
            
            <p className="text-xs text-gray-400 font-mono leading-relaxed">
              Witness how Manthan.ai links audience mapping, copywriting, ROI simulations, and final campaign dispatching. See our agents align live in the boardroom in under 60 seconds.
            </p>

            <button
              onClick={() => setIsDemoOpen(true)}
              className="mt-2 group px-5 py-2.5 rounded-lg bg-Manthan-blue/15 border border-Manthan-blue/40 text-xs font-mono text-Manthan-blue hover:bg-Manthan-blue hover:text-white transition-all flex items-center gap-2 shadow-Manthan-glow-inset cursor-pointer"
            >
              <Play size={12} className="fill-current text-Manthan-blue" />
              Watch Manthan.ai In Action
            </button>
          </div>

          {/* Right panel: Futuristic Glass Interface Preview */}
          <div className="relative flex-1 w-full max-w-sm rounded-xl border border-white/10 bg-[#050816]/70 p-5 shadow-lg space-y-4 select-none overflow-hidden h-52 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[9px] font-mono text-gray-550 uppercase tracking-widest">Autonomous simulation node</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* Simulated mini HUD view */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400 font-bold">Target Cohort</span>
                <span className="text-white font-bold">150 Repeat Buyers</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-gray-400 font-bold">Yield Strategy</span>
                <span className="text-green-400 font-bold">Recommended Timeline</span>
              </div>
              
              {/* Agent mini avatars grid */}
              <div className="flex gap-2.5 pt-2 border-t border-white/5">
                {["P", "L", "V", "N", "A"].map((agentLetter, i) => {
                  const colors = ["#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#22C55E"];
                  return (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded-md border flex items-center justify-center text-[9px] font-space font-bold bg-[#0F172A]"
                      style={{ borderColor: colors[i], color: colors[i], boxShadow: `0 0 8px ${colors[i]}15` }}
                    >
                      {agentLetter}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Glowing CTA overlay inside mockup */}
            <div className="absolute inset-0 bg-[#050816]/65 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={() => setIsDemoOpen(true)}
                className="px-4 py-2 rounded-lg bg-white text-black font-space font-bold text-xs uppercase tracking-wide shadow-md hover:scale-105 transition-transform cursor-pointer"
              >
                Launch Guided Tour
              </button>
            </div>
          </div>
        </motion.div>

        {/* Agent Cards Section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {[
            {
              name: "Drishti",
              desc: "Audience Intelligence",
              task: "Natural language segmentation, customer cohort clustering, and behavioral graphing.",
              color: "text-Manthan-blue border-Manthan-blue/20",
              glow: "hover:shadow-Manthan-glow"
            },
            {
              name: "Khoj",
              desc: "Predictive Analytics",
              task: "Conversion forecasting, churn risk calculations, and real-time revenue ROI modeling.",
              color: "text-Manthan-purple border-Manthan-purple/20",
              glow: "hover:shadow-Manthan-glow-purple"
            },
            {
              name: "Rachna",
              desc: "Campaign Creator",
              task: "Generative message copywriter tailoring layouts for Email, WhatsApp, SMS, and RCS.",
              color: "text-pink-500 border-pink-500/20",
              glow: "hover:shadow-0"
            },
            {
              name: "Saarthi",
              desc: "Operations Dispatch",
              task: "Execution router, automated delivery validation, and real-time conversion loop monitors.",
              color: "text-Manthan-success border-Manthan-success/20",
              glow: "hover:shadow-Manthan-glow-green"
            }
          ].map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
              className={`p-6 rounded-xl bg-gray-900/50 border backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-gray-900/80 ${agent.color} ${agent.glow}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs tracking-wider uppercase opacity-80">{agent.desc}</span>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              </div>
              <h3 className="text-xl font-bold font-space text-white mb-2">{agent.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">{agent.task}</p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 border-t border-gray-800/40 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-mono text-gray-500">© 2026 Manthan.ai · All Rights Reserved</span>
        <div className="flex gap-6 text-xs font-mono text-gray-500">
          <a href="#" className="hover:text-white transition-colors">Drishti NODE</a>
          <a href="#" className="hover:text-white transition-colors">Khoj ENGINE</a>
          <a href="#" className="hover:text-white transition-colors">SECURE LINK</a>
        </div>
      </footer>

      <GuidedDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onEnterOS={onEnterOS}
      />
    </div>
  );
};
