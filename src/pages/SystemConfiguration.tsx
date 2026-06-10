import React, { useState } from "react";
import { 
  Settings, Cpu, Volume2, Radio, Database, Palette, Zap, Shield, 
  ToggleLeft, ToggleRight, Trash2, Lock, Server, CheckCircle2
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { AgentCardModal } from "../components/AgentCardModal";
import { PageHeaderHUD } from "../components/PageHeaderHUD";

interface ConfigSection {
  id: string;
  icon: React.FC<any>;
  label: string;
  desc: string;
}

const SECTIONS: ConfigSection[] = [
  { id: "core", icon: Zap, label: "Orbit Core", desc: "Autonomous parameters, dispatch speed" },
  { id: "agents", icon: Cpu, label: "AI Agents & Permissions", desc: "Model models, authorization weights" },
  { id: "voice", icon: Volume2, label: "Voice Systems", desc: "Synthesis voice overrides & Deepgram keys" },
  { id: "channels", icon: Radio, label: "Dispatch Channels", desc: "Resend, SMS gateways, RCS gateways" },
  { id: "database", icon: Database, label: "Firebase & Storage", desc: "Cloud database sync, master local wipe" },
  { id: "theme", icon: Palette, label: "Display Themes", desc: "Command Center dark vs Executive light" },
  { id: "security", icon: Shield, label: "Encryption Vault", desc: "Master key rotations, API vaults" }
];

export const SystemConfiguration: React.FC = () => {
  const { config, updateConfig, clearSimData, theme, setTheme } = useOrbit();
  const [activeSection, setActiveSection] = useState("core");
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* Simulated API Keys security vault rotation */
  const [vaultKey, setVaultKey] = useState("••••••••••••••••••••");
  const [vaultStatus, setVaultStatus] = useState("ENCRYPTED");

  /* Agent Permissions Matrix State */
  const [permissions, setPermissions] = useState<Record<string, { segment: boolean; copy: boolean; dispatch: boolean }>>({
    Polaris: { segment: true, copy: false, dispatch: false },
    Nova: { segment: false, copy: true, dispatch: false },
    Vega: { segment: true, copy: false, dispatch: false },
    Atlas: { segment: false, copy: false, dispatch: true },
    Luna: { segment: true, copy: true, dispatch: false }
  });

  const handleTogglePermission = (agent: string, field: "segment" | "copy" | "dispatch") => {
    setPermissions(prev => ({
      ...prev,
      [agent]: {
        ...prev[agent],
        [field]: !prev[agent][field]
      }
    }));
  };

  const Toggle: React.FC<{ on: boolean; onToggle: () => void; label: string; desc?: string }> = ({ on, onToggle, label, desc }) => (
    <div className="flex items-center justify-between p-4 bg-gray-950/40 border border-gray-900 rounded-xl hover:border-gray-800 transition-colors">
      <div>
        <span className="font-mono text-xs text-white font-bold">{label}</span>
        {desc && <p className="font-mono text-[9px] text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button onClick={onToggle} className="flex items-center gap-2 shrink-0 ml-4 cursor-pointer">
        {on
          ? <ToggleRight size={24} className="text-orbit-blue" />
          : <ToggleLeft size={24} className="text-gray-750" />
        }
      </button>
    </div>
  );

  const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean }> = ({ label, value, onChange, placeholder, secret }) => (
    <div className="flex flex-col gap-1.5 font-mono text-[9px]">
      <label className="text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type={secret ? "password" : "text"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || "Enter key token..."}
        className="w-full bg-gray-950/65 border border-gray-900 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-colors"
      />
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* Settings Navigation Sidebar (Apple-style) */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-gray-800/60 bg-gray-950/45 backdrop-blur-md p-4 space-y-4 overflow-y-auto relative z-10">
        <div>
          <h2 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-800/60 pb-2">
            <Settings size={13} className="text-blue-400 animate-spin-slow" />
            System Control
          </h2>
          <p className="font-mono text-[8px] text-gray-550 uppercase mt-0.5">Categorized control panel</p>
        </div>

        {/* Tree selectors */}
        <div className="flex flex-col gap-1">
          {SECTIONS.map(sec => {
            const Icon = sec.icon;
            const active = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                  active
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.05)]"
                    : "border-transparent text-gray-500 hover:border-gray-900 hover:text-gray-300"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold truncate">{sec.label.split(" & ")[0]}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* System Diagnostics HUD */}
        <div className="border-t border-gray-900 pt-4 space-y-3 mt-auto">
          <div>
            <h3 className="font-space text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Server size={11} className="text-orbit-success" />
              Diagnostics HUD
            </h3>
            <p className="font-mono text-[7px] text-gray-550 uppercase">Uptime & health logs</p>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[9px]">
            <div className="p-2 bg-gray-900/20 rounded border border-gray-900 flex justify-between items-center">
              <span className="text-gray-500 uppercase">System Health:</span>
              <span className="text-orbit-success font-bold flex items-center gap-1">
                <CheckCircle2 size={10} /> NOMINAL
              </span>
            </div>
            <div className="p-2 bg-gray-900/20 rounded border border-gray-900 flex justify-between items-center">
              <span className="text-gray-500 uppercase">Database:</span>
              <span className="text-blue-400 font-bold uppercase">Local storage</span>
            </div>
            <div className="p-2 bg-gray-900/20 rounded border border-gray-900 flex justify-between items-center">
              <span className="text-gray-500 uppercase">Core Thread:</span>
              <span className="text-white">v4.81-Vanguard</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Configuration Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-6 space-y-5">
        <PageHeaderHUD
          title="System Configuration"
          subtitle="ORBIT CONTROL CENTER · PREFERENCES & KEY VALUATIONS"
          onSelectAgent={setSelectedAgent}
        />
        
        {/* Workspace Title Header */}
        <div className="border-b border-gray-900 pb-4">
          <h2 className="font-space text-lg font-bold text-white tracking-tight">
            {SECTIONS.find(s => s.id === activeSection)?.label}
          </h2>
          <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase tracking-wider">
            {SECTIONS.find(s => s.id === activeSection)?.desc}
          </p>
        </div>

        {/* Category Render Section switches */}
        <div className="space-y-4">
          {activeSection === "core" && (
            <div className="flex flex-col gap-4">
              {/* Simulation speed buttons */}
              <div className="flex flex-col gap-2">
                <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">Simulated Dispatch Speed</label>
                <div className="flex gap-2">
                  {[1, 2, 5, 10].map(speed => (
                    <button
                      key={speed}
                      onClick={() => updateConfig({ simulationSpeed: speed })}
                      className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                        config.simulationSpeed === speed
                          ? "border-blue-500/40 bg-blue-500/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : "border-gray-900 bg-gray-900/20 text-gray-550 hover:border-gray-800"
                      }`}
                    >
                      {speed}x speed
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[9px] text-gray-500 leading-relaxed">
                  * Controls interval delays during simulated campaign loops (mapping, ROI calculating, copywriting, dispatching).
                </p>
              </div>

              {/* Toggles */}
              <Toggle
                on={config.autonomousMode}
                onToggle={() => updateConfig({ autonomousMode: !config.autonomousMode })}
                label="Autonomous Directives Mode"
                desc="Enables ORBIT to self-formulate Win-back or Cross-sell copy and launch them without operator confirmations."
              />
              <Toggle
                on={config.voiceSynthesis}
                onToggle={() => updateConfig({ voiceSynthesis: !config.voiceSynthesis })}
                label="Browser Voice Synthesis"
                desc="Allows AI agents Polaris, Nova, Vega, and Atlas to speak speech synthesis messages directly during voice prompts."
              />

              {/* Danger Zone local database clear */}
              <div className="p-4 bg-red-950/15 border border-red-900/30 rounded-xl flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Trash2 size={13} className="text-red-400 animate-pulse" />
                  <span className="font-mono text-xs text-red-400 font-bold uppercase tracking-wider">Danger Zone Controls</span>
                </div>
                <p className="font-mono text-[10px] text-gray-550 leading-relaxed">
                  Reset the local workspace database. Wipes all created mock campaigns, customer ledgers, and live agent communication histories.
                </p>
                <button
                  onClick={() => {
                    if (confirm("Reset local database logs? This action is irreversible.")) clearSimData();
                  }}
                  className="w-full py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs font-bold uppercase hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Reset Local Storage Database
                </button>
              </div>
            </div>
          )}

          {activeSection === "agents" && (
            <div className="flex flex-col gap-4">
              {/* Agent Permissions Matrix */}
              <div className="orbit-panel p-4 border border-gray-900 bg-gray-950/20 space-y-3">
                <div className="border-b border-gray-900 pb-2 mb-2">
                  <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} className="text-orbit-purple" />
                    Agent Permissions Matrix
                  </h3>
                  <p className="font-mono text-[8px] text-gray-550 uppercase">Define action parameters for each node</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] divide-y divide-gray-900">
                    <thead>
                      <tr className="text-gray-550">
                        <th className="pb-2">AGENT</th>
                        <th className="pb-2 text-center">SEGMENT</th>
                        <th className="pb-2 text-center">COPYWRITING</th>
                        <th className="pb-2 text-center">DISPATCH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900 text-gray-300">
                      {(["Polaris", "Nova", "Vega", "Atlas", "Luna"] as const).map(agent => (
                        <tr key={agent}>
                          <td 
                            className="py-2.5 font-bold font-space cursor-pointer hover:text-white transition-colors"
                            onClick={() => setSelectedAgent(agent)}
                            title={`Click to view ${agent} premium card`}
                          >
                            {agent}
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[agent].segment}
                              onChange={() => handleTogglePermission(agent, "segment")}
                              className="accent-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[agent].copy}
                              onChange={() => handleTogglePermission(agent, "copy")}
                              className="accent-pink-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[agent].dispatch}
                              onChange={() => handleTogglePermission(agent, "dispatch")}
                              className="accent-green-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gemini configuration */}
              <InputField
                label="Gemini API Key (Live Cognitive Node)"
                value={config.geminiKey}
                onChange={v => updateConfig({ geminiKey: v })}
                placeholder="AIzaSy..."
                secret
              />
              <p className="font-mono text-[9px] text-gray-600 uppercase tracking-wide">
                * Enters key to route campaign copy generation and boardroom deliberations through live Gemini models
              </p>
            </div>
          )}

          {activeSection === "voice" && (
            <div className="flex flex-col gap-4">
              <Toggle
                on={config.voiceSynthesis}
                onToggle={() => updateConfig({ voiceSynthesis: !config.voiceSynthesis })}
                label="Enable Text-to-Speech"
              />
              <InputField
                label="Deepgram API Key (Speech-to-Text)"
                value={config.deepgramKey}
                onChange={v => updateConfig({ deepgramKey: v })}
                placeholder="dg_..."
                secret
              />
              <InputField
                label="ElevenLabs API Key (Premium Voice Synthesis)"
                value={config.elevenLabsKey}
                onChange={v => updateConfig({ elevenLabsKey: v })}
                placeholder="xi_..."
                secret
              />
            </div>
          )}

          {activeSection === "channels" && (
            <div className="flex flex-col gap-4">
              <InputField
                label="Resend API Key (Email Node)"
                value={config.resendKey}
                onChange={v => updateConfig({ resendKey: v })}
                secret
              />
              {[
                { label: "Twilio SMS SID", val: "AC_..." },
                { label: "WhatsApp Business API token", val: "wa_..." },
                { label: "RCS Gateway authentication", val: "rcs_..." }
              ].map((cField, idx) => (
                <InputField key={idx} label={cField.label} value="" onChange={() => {}} placeholder={cField.val} secret />
              ))}
            </div>
          )}

          {activeSection === "database" && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <CheckCircle2 size={15} className="text-blue-400 shrink-0 mt-0.5" />
                <div className="font-mono text-[10px]">
                  <p className="font-bold text-white uppercase tracking-wider">Local Sandbox Mode Enabled</p>
                  <p className="text-gray-550 mt-1 leading-relaxed">
                    Local Storage stores campaign variables, transaction histories, and agent logs in current session boundaries. API Keys will trigger live sync.
                  </p>
                </div>
              </div>
              <InputField
                label="Firebase Key"
                value={config.firebaseKey || ""}
                onChange={v => updateConfig({ firebaseKey: v })}
                placeholder="AIzaSy..."
                secret
              />
              <InputField
                label="Firebase Project ID"
                value={config.firebaseProjectId || ""}
                onChange={v => updateConfig({ firebaseProjectId: v })}
                placeholder="orbit-os-..."
                secret
              />
            </div>
          )}

          {activeSection === "theme" && (
            <div className="flex flex-col gap-3">
              <label className="font-mono text-[9px] text-gray-400 uppercase tracking-wider">Theme Presets</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <button
                  onClick={() => setTheme("command-center")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === "command-center"
                      ? "border-blue-500/40 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "border-gray-900 bg-gray-900/10 hover:border-gray-800"
                  }`}
                >
                  <span className="font-mono text-[8px] text-blue-400 font-bold uppercase block mb-1">Dark Mode</span>
                  <span className="font-space text-sm font-bold text-white block">Command Center</span>
                  <p className="font-mono text-[9px] text-gray-550 leading-relaxed mt-1">Deep space cyber paneling theme with high-contrast neon glowing scopes</p>
                </button>

                <button
                  onClick={() => setTheme("executive")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    theme === "executive"
                      ? "border-purple-500/40 bg-purple-500/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "border-gray-900 bg-gray-900/10 hover:border-gray-800"
                  }`}
                >
                  <span className="font-mono text-[8px] text-purple-400 font-bold uppercase block mb-1">Light Mode</span>
                  <span className="font-space text-sm font-bold text-white block">Executive View</span>
                  <p className="font-mono text-[9px] text-gray-550 leading-relaxed mt-1">Boardroom-ready clean white interface featuring high contrast type scales</p>
                </button>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-orbit-success/5 border border-orbit-success/20 rounded-xl flex items-start gap-3 font-mono text-[10px]">
                <Lock size={15} className="text-orbit-success shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="font-bold text-white uppercase tracking-wider">Security Vault Armed</p>
                  <p className="text-gray-550 mt-1 leading-relaxed">
                    API keys are stored under local AES encryption wrappers. Tokens are deciphered in-memory during dispatch callbacks.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 font-mono text-[9px]">
                <label className="text-gray-400 uppercase tracking-wider">Master Encryption Key</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={vaultKey}
                    onChange={e => setVaultKey(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => {
                      setVaultStatus("ROTATED & ENCRYPTED");
                      setTimeout(() => setVaultStatus("ENCRYPTED"), 1500);
                    }}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold border border-gray-850 rounded-lg text-[10px] cursor-pointer"
                  >
                    ROTATE KEY
                  </button>
                </div>
                <div className="flex justify-between mt-1 text-[8px] text-gray-550">
                  <span>VAULT STATUS: <span className="text-orbit-success font-bold">{vaultStatus}</span></span>
                  <span>CIPHER: AES-GCM-256</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default SystemConfiguration;
