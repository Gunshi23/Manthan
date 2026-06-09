import React from "react";
import { Sparkles, Terminal, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface LandingPageProps {
  onEnterOS: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterOS }) => {
  return (
    <div className="relative min-h-screen bg-orbit-bg overflow-hidden space-grid flex flex-col justify-between">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orbit-glow-blue pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orbit-glow-purple pointer-events-none" />

      {/* Decorative scanline overlay */}
      <div className="scanlines" />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-gray-800/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orbit-blue to-orbit-purple flex items-center justify-center shadow-orbit-glow animate-orbit-pulse">
            <span className="font-space font-bold text-white text-lg">O</span>
          </div>
          <span className="font-space font-bold text-xl tracking-wider uppercase text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Orbit
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-gray-500 hidden sm:inline-block">SYSTEM STATUS: OPTIMAL</span>
          <button
            onClick={onEnterOS}
            className="px-4 py-2 rounded-lg border border-orbit-blue/30 bg-orbit-blue/10 text-xs text-orbit-blue font-mono hover:bg-orbit-blue/20 hover:border-orbit-blue/50 transition-all flex items-center gap-1.5 shadow-orbit-glow-inset"
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
          <Sparkles size={13} className="text-orbit-blue animate-pulse" />
          <span className="text-xs font-mono text-gray-400 tracking-wider">AUTONOMOUS MARKETING OS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold font-space text-white leading-tight tracking-tight mb-6"
        >
          Increase Customer Revenue <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orbit-blue via-orbit-purple to-pink-500">
            On Autopilot.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 font-inter leading-relaxed"
        >
          Keep Every Customer In Your Orbit. ORBIT orchestrates autonomous AI agents to segment users, model conversion ROI, generate copy, and launch campaigns.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-20"
        >
          <button
            onClick={onEnterOS}
            className="group px-8 py-4 rounded-xl bg-gradient-to-r from-orbit-blue to-orbit-purple text-sm font-semibold text-white shadow-orbit-glow hover:shadow-orbit-glow-purple transition-all duration-300 flex items-center justify-center gap-2"
          >
            Initialize Command Center
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Agent Cards Section */}
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {[
            {
              name: "Polaris",
              desc: "Audience Intelligence",
              task: "Natural language segmentation, customer cohort clustering, and behavioral graphing.",
              color: "text-orbit-blue border-orbit-blue/20",
              glow: "hover:shadow-orbit-glow"
            },
            {
              name: "Vega",
              desc: "Predictive Analytics",
              task: "Conversion forecasting, churn risk calculations, and real-time revenue ROI modeling.",
              color: "text-orbit-purple border-orbit-purple/20",
              glow: "hover:shadow-orbit-glow-purple"
            },
            {
              name: "Nova",
              desc: "Campaign Creator",
              task: "Generative message copywriter tailoring layouts for Email, WhatsApp, SMS, and RCS.",
              color: "text-pink-500 border-pink-500/20",
              glow: "hover:shadow-0"
            },
            {
              name: "Atlas",
              desc: "Operations Dispatch",
              task: "Execution router, automated delivery validation, and real-time conversion loop monitors.",
              color: "text-orbit-success border-orbit-success/20",
              glow: "hover:shadow-orbit-glow-green"
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
        <span className="text-xs font-mono text-gray-500">© 2026 ORBIT ORBITAL SYSTEMS INC. LICENSE: VANGUARD-A9</span>
        <div className="flex gap-6 text-xs font-mono text-gray-500">
          <a href="#" className="hover:text-white transition-colors">POLARIS NODE</a>
          <a href="#" className="hover:text-white transition-colors">VEGA ENGINE</a>
          <a href="#" className="hover:text-white transition-colors">SECURE LINK</a>
        </div>
      </footer>
    </div>
  );
};
