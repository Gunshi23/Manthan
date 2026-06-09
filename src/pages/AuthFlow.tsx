import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, User, Cpu } from "lucide-react";

interface AuthFlowProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState("admin@orbit.io");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const initialLogs = [
    "LOG: SECURE CONNECTION SOCKET CREATED AT PROTOCOL IP:192.112.5.44",
    "LOG: RETRIEVING ORBIT ENCRYPTED KEYS...",
    "LOG: HANDSHAKE COMPLETED WITH VANGUARD SERVER CORES.",
    "LOG: DECRYPTING BIO-SIGNATURE MODULES...",
    "LOG: WAITING FOR OPERATOR IDENTIFICATION CREDENTIALS..."
  ];

  useEffect(() => {
    if (bootStep < initialLogs.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, initialLogs[bootStep]]);
        setBootStep(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Simulate encryption verification and boot loading
    setLogs(prev => [
      ...prev,
      `LOG: VERIFYING OPERATOR ACCESS FOR: ${username.toUpperCase()}`,
      "LOG: AUTHENTICATING DEEP LEARNING SCHEMAS...",
      "LOG: BIO-SIGNATURE MATCH CONFIRMED.",
      "LOG: ACCESS GRANTED. INITIALIZING CORE BOOT..."
    ]);

    setTimeout(() => {
      onLoginSuccess();
    }, 2000);
  };

  return (
    <div className="relative min-h-screen bg-orbit-bg space-grid flex flex-col items-center justify-center p-4">
      {/* Laser grids / scans */}
      <div className="absolute top-0 left-0 w-full h-1 bg-orbit-blue/30 animate-scan-line" />
      <div className="scanlines" />

      {/* Box containing authentication core */}
      <div className="relative w-full max-w-lg bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-orbit-glow flex flex-col p-6 sm:p-8">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-orbit-blue animate-spin-slow" />
            <span className="font-mono text-xs text-gray-400">ORBIT SECURE SHELL v4.81</span>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] font-mono text-gray-500 hover:text-white transition-colors uppercase"
          >
            [ Cancel Boot ]
          </button>
        </div>

        {/* Live Terminal logs */}
        <div className="w-full bg-black/70 rounded-lg p-4 font-mono text-[11px] text-green-500 border border-gray-800 h-36 overflow-y-auto mb-6 flex flex-col gap-1.5 scrollbar-thin">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-1.5 leading-relaxed">
              <span className="text-blue-400 select-none">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
          {bootStep < initialLogs.length && (
            <div className="flex gap-1.5 items-center">
              <span className="text-blue-400 select-none">&gt;</span>
              <span className="w-2 h-3 bg-green-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">OPERATOR KEY ID</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                disabled={isLoggingIn}
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-white focus:outline-none focus:border-orbit-blue transition-colors focus:shadow-orbit-glow-inset"
                placeholder="operator@orbit.io"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">SECURE ENTRY PASSCODE</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoggingIn}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-white focus:outline-none focus:border-orbit-blue transition-colors focus:shadow-orbit-glow-inset"
                placeholder="Enter passcode"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Verification check panel */}
          <div className="flex items-center gap-2 border border-gray-800 bg-gray-950/40 rounded-lg p-3 my-2">
            <Shield size={16} className="text-orbit-blue animate-pulse" />
            <span className="font-mono text-[9px] text-gray-500 uppercase leading-snug">
              Encrypted under military-grade SHA-512 nodes. Biometric mapping activated.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || bootStep < initialLogs.length}
            className={`w-full py-3 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all ${
              isLoggingIn || bootStep < initialLogs.length
                ? "bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-orbit-blue hover:bg-orbit-blue/90 shadow-orbit-glow active:scale-95 border border-orbit-blue/30"
            }`}
          >
            {isLoggingIn ? "Decrypting Portals..." : "Verify Access"}
          </button>
        </form>
      </div>
    </div>
  );
};
