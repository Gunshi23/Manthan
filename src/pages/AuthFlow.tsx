import React, { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, User, Cpu, UserPlus } from "lucide-react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface AuthFlowProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
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

    try {
      if (mode === "login") {
        setLogs(prev => [...prev, `LOG: INITIATING ACCESS VERIFICATION FOR ACCOUNT: ${opEmail.toUpperCase()}`]);
        await signInWithEmailAndPassword(auth, opEmail, password);
        setLogs(prev => [...prev, "LOG: AUTHENTICATION GRANTED. SYNCING SYSTEM STATE..."]);
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      } else {
        setLogs(prev => [...prev, `LOG: REGISTERING NEW SYSTEM CORE OPERATOR: ${opEmail.toUpperCase()}`]);
        await createUserWithEmailAndPassword(auth, opEmail, password);
        setLogs(prev => [...prev, "LOG: REGISTRATION SUCCESSFUL. INITIALIZING USER INTERFACE..."]);
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      let errorMsg = "VERIFICATION FAILURE: UNKNOWN ERROR ENCOUNTERED.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMsg = "VERIFICATION FAILURE: INVALID SYSTEM CREDENTIALS.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMsg = "REGISTRATION FAILURE: EMAIL ADDRESS REGISTERED ELSEWHERE.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "REGISTRATION FAILURE: CREDENTIAL COMPLEXITY UNDER STANDARD.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "VERIFICATION FAILURE: IMPROPER EMAIL FORMAT.";
      }
      setLogs(prev => [...prev, `ERR: ${errorMsg.toUpperCase()}`]);
      setIsLoggingIn(false);
    }
  };

  const handleToggleMode = () => {
    if (isLoggingIn) return;
    setMode(prev => (prev === "login" ? "signup" : "login"));
    setUsername("");
    setPassword("");
    setConfirmPassword("");
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
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                type="button"
                className="text-[10px] font-mono text-gray-400 hover:text-white transition-colors uppercase cursor-pointer"
              >
                [ Cancel Boot ]
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-Manthan-success animate-pulse" />
              <span className="text-[10px] font-mono text-gray-500 uppercase">[ Secure Connection ]</span>
            </div>
          </div>
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

          <div className="text-center mt-2 border-t border-gray-850 pt-4">
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
          </div>
        </form>
      </div>
    </div>
  );
};
