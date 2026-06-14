import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, User, Cpu, UserPlus } from "lucide-react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthFlowProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onLoginSuccess, onBack }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const initialLogs = [
    "LOG: SECURE CONNECTION SOCKET CREATED AT PROTOCOL IP:192.112.5.44",
    "LOG: RETRIEVING Manthan.ai ENCRYPTED KEYS...",
    "LOG: HANDSHAKE COMPLETED WITH VANGUARD SERVER CORES.",
    "LOG: DECRYPTING BIO-SIGNATURE MODULES...",
    "LOG: WAITING FOR OPERATOR IDENTIFICATION CREDENTIALS..."
  ];

  useEffect(() => {
    if (bootStep < initialLogs.length) {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, initialLogs[bootStep]]);
        setBootStep(prev => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    if (mode === "signup" && password !== confirmPassword) {
      setLogs(prev => [...prev, "ERR: CRYPTO MISMATCH - PASSCODES DO NOT COMPARE."]);
      return;
    }

    setIsLoggingIn(true);
    const opEmail = username.trim();

    if (mode === "login") {
      setLogs(prev => [
        ...prev,
        `LOG: VERIFYING OPERATOR ACCESS FOR: ${opEmail.toUpperCase()}`,
        "LOG: AUTHENTICATING DEEP LEARNING SCHEMAS..."
      ]);

      try {
        await signInWithEmailAndPassword(auth, opEmail, password);
        setLogs(prev => [
          ...prev,
          "LOG: BIO-SIGNATURE MATCH CONFIRMED.",
          "LOG: ACCESS GRANTED. INITIALIZING CORE BOOT..."
        ]);
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      } catch (err: any) {
        let cleanErr = err.message || "Unknown error";
        if (err.code === "auth/invalid-credential") {
          cleanErr = "Invalid Operator Credentials.";
        } else if (err.code === "auth/invalid-email") {
          cleanErr = "Invalid Email Schema Format.";
        }
        setLogs(prev => [
          ...prev,
          `ERR: ACCESS PROTOCOL VIOLATED - ${cleanErr.toUpperCase()}`
        ]);
        setIsLoggingIn(false);
      }
    } else {
      setLogs(prev => [
        ...prev,
        `LOG: GENERATING NEW OPERATOR NODE FOR: ${opEmail.toUpperCase()}`,
        "LOG: SEEDING CRYPTO KEYS TO VAULT..."
      ]);

      try {
        await createUserWithEmailAndPassword(auth, opEmail, password);
        setLogs(prev => [
          ...prev,
          "LOG: OPERATOR REGISTRATION REGISTERED.",
          "LOG: NEW OPERATOR KEY GENERATED. LOADING OS PORTAL..."
        ]);
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      } catch (err: any) {
        let cleanErr = err.message || "Unknown error";
        if (err.code === "auth/email-already-in-use") {
          cleanErr = "Operator Key ID already registered.";
        } else if (err.code === "auth/weak-password") {
          cleanErr = "Passcode security index too low (min 6 characters).";
        } else if (err.code === "auth/invalid-email") {
          cleanErr = "Invalid Email Schema Format.";
        }
        setLogs(prev => [
          ...prev,
          `ERR: OPERATOR REGISTRATION FAILURE - ${cleanErr.toUpperCase()}`
        ]);
        setIsLoggingIn(false);
      }
    }
  };

  const handleToggleMode = () => {
    if (isLoggingIn) return;
    setMode(prev => (prev === "login" ? "signup" : "login"));
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLocalBypass = () => {
    localStorage.setItem("orbit_use_mock_auth", "true");
    setIsLoggingIn(true);
    setLogs(prev => [
      ...prev,
      "LOG: BIO-SIGNATURE BYPASS REQUESTED.",
      "LOG: INITIALIZING SECURE LOCAL SANDBOX ENVIRONMENT..."
    ]);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="relative min-h-screen bg-Manthan-bg space-grid flex flex-col items-center justify-center p-4">
      {/* Laser grids / scans */}
      <div className="absolute top-0 left-0 w-full h-1 bg-Manthan-blue/30 animate-scan-line" />
      <div className="scanlines" />

      {/* Box containing authentication core */}
      <div className="relative w-full max-w-lg bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-Manthan-glow flex flex-col p-6 sm:p-8">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-Manthan-blue animate-spin-slow" />
            <span className="font-mono text-xs text-gray-400">
              Manthan SECURE SHELL {mode === "login" ? "v4.81-LOGIN" : "v4.81-REGISTER"}
            </span>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] font-mono text-gray-550 hover:text-white transition-colors uppercase cursor-pointer"
          >
            [ Cancel Boot ]
          </button>
        </div>

        {/* Live Terminal logs */}
        <div className="w-full bg-black/70 rounded-lg p-4 font-mono text-[11px] text-green-500 border border-gray-805 h-36 overflow-y-auto mb-6 flex flex-col gap-1.5 scrollbar-thin">
          {logs.map((log, index) => {
            const isError = log.startsWith("ERR:");
            return (
              <div key={index} className={`flex gap-1.5 leading-relaxed ${isError ? "text-red-400 font-bold" : ""}`}>
                <span className={`${isError ? "text-red-500" : "text-blue-400"} select-none`}>&gt;</span>
                <span>{log}</span>
              </div>
            );
          })}
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-950 border border-gray-850 text-xs font-mono text-white focus:outline-none focus:border-Manthan-blue transition-colors focus:shadow-Manthan-glow-inset"
                placeholder="operator@manthan.ai"
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
                className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-gray-950 border border-gray-855 text-xs font-mono text-white focus:outline-none focus:border-Manthan-blue transition-colors focus:shadow-Manthan-glow-inset"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">CONFIRM SECURE PASSCODE</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoggingIn}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 rounded-lg bg-gray-950 border border-gray-855 text-xs font-mono text-white focus:outline-none focus:border-Manthan-blue transition-colors focus:shadow-Manthan-glow-inset"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Verification check panel */}
          <div className="flex items-center gap-2 border border-gray-805 bg-gray-950/40 rounded-lg p-3 my-2">
            <Shield size={16} className="text-Manthan-blue animate-pulse" />
            <span className="font-mono text-[9px] text-gray-550 uppercase leading-snug">
              Encrypted under military-grade SHA-512 nodes. Biometric mapping activated.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || bootStep < initialLogs.length}
            className={`w-full py-3 rounded-lg text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all cursor-pointer ${
              isLoggingIn || bootStep < initialLogs.length
                ? "bg-gray-800 border border-gray-750 text-gray-500 cursor-not-allowed"
                : "bg-Manthan-blue hover:bg-Manthan-blue/90 shadow-Manthan-glow active:scale-95 border border-Manthan-blue/30"
            }`}
          >
            {isLoggingIn 
              ? (mode === "login" ? "Decrypting Portals..." : "Creating Node...") 
              : (mode === "login" ? "Verify Access" : "Initialize Account")}
          </button>

          <div className="text-center mt-2 border-t border-gray-850 pt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleToggleMode}
              className="font-mono text-[10px] text-gray-400 hover:text-Manthan-blue transition-colors cursor-pointer uppercase flex items-center justify-center gap-1.5 mx-auto"
            >
              {mode === "login" ? (
                <>
                  <UserPlus size={11} />
                  Need an operator account? [ Initialize Node ]
                </>
              ) : (
                <>
                  <User size={11} />
                  Already have a node? [ Sign In Operator ]
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLocalBypass}
              className="font-mono text-[9px] text-pink-500 hover:text-pink-400 transition-colors cursor-pointer uppercase flex items-center justify-center gap-1.5 mx-auto animate-pulse mt-1"
            >
              [ Run in Local Sandbox Mode (Offline Bypass) ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
