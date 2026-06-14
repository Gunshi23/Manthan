import React, { useState, useEffect } from "react";
import { X, Activity, Sparkles, BarChart2, Radio, Users, Terminal } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface AgentCardModalProps {
  agent: "Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya" | null;
  onClose: () => void;
}

export const AgentCardModal: React.FC<AgentCardModalProps> = ({ agent, onClose }) => {
  const { lunaMetrics, theme } = useOrbit();
  const isLight = theme === "executive";
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "outputs">("overview");
  const [currentStatusIdx, setCurrentStatusIdx] = useState(0);

  useEffect(() => {
    if (!agent) return;
    setActiveTab("overview");
    setCurrentStatusIdx(0);
  }, [agent]);

  // Rotate status examples for that premium feel
  useEffect(() => {
    if (!agent) return;
    const interval = setInterval(() => {
      setCurrentStatusIdx((prev) => (prev + 1) % (AGENT_PROFILES[agent]?.statuses.length || 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [agent]);

  if (!agent) return null;

  const AGENT_PROFILES = {
    Pragya: {
      title: "Growth Recovery Agent",
      themeColor: "from-amber-500 to-purple-600",
      accentText: "text-amber-400",
      accentBg: "bg-amber-500/10",
      glowColor: "rgba(245, 158, 11, 0.25)",
      icon: Activity,
      purpose: "Pragya specializes in identifying and recovering lost revenue opportunities by auditing abandoned checkouts, inactive customer behaviors, and slipping churn risks.",
      personality: ["Observant", "Persistent", "Proactive", "Revenue-focused", "Helpful"],
      statuses: [
        "Scanning customer universe...",
        "Analyzing engagement signals...",
        "Detecting revenue leaks...",
        "Building recovery audiences...",
        "Campaign recovery ready..."
      ],
      metrics: [
        { label: "Recoverable Revenue", value: `₹${lunaMetrics.recoverableRevenue.toLocaleString()}`, score: 85 },
        { label: "Opportunity Score", value: `${lunaMetrics.opportunityScore}/100`, score: lunaMetrics.opportunityScore },
        { label: "Inactive Customers", value: `${lunaMetrics.inactiveCustomers} VIPs`, score: 65 },
        { label: "Abandoned Leads", value: `${lunaMetrics.abandonedLeads} profiles`, score: 78 },
        { label: "Recovery Confidence", value: `${lunaMetrics.recoveryConfidence}%`, score: lunaMetrics.recoveryConfidence }
      ],
      outputs: [
        {
          title: "Abandoned Instagram Enquiries Recovery",
          content: "Detected 17 abandoned Instagram enquiries.\nPotential revenue: ₹12,000\nConfidence: 91%\nRecommendation: Launch follow-up campaign."
        },
        {
          title: "Inactive VIP Reactivation Workflow",
          content: "Detected 12 inactive customers.\nPredicted reactivation rate: 14%\nEstimated revenue: ₹8,500\nRecommendation: WhatsApp re-engagement sequence."
        }
      ],
      responsibilities: [
        "Identify inactive customers with slipping login flags.",
        "Detect abandoned leads and cart checkout tokens.",
        "Audit customers who engaged on social feeds but never completed purchases.",
        "Pinpoint high-LTV customer nodes likely to churn.",
        "Recommend recovery campaigns and channel selections.",
        "Formulate recovered revenue estimates.",
        "Inject re-engagement triggers into follow-up queues."
      ],
      specs: {
        algorithm: "XGBoost Retention Classifier + Checkout Regression",
        authWeight: "0.85 (Calibrated)",
        model: "Gemini 3.5 Flash (Medium)",
        thread: "Recovery Pipeline Node 7"
      }
    },
    Drishti: {
      title: "Audience Discovery Agent",
      themeColor: "from-blue-500 to-cyan-500",
      accentText: "text-blue-400",
      accentBg: "bg-blue-500/10",
      glowColor: "rgba(59, 130, 246, 0.25)",
      icon: Users,
      purpose: "Drishti maps customer cohorts, filters demographic DNA properties, and discovers high-affinity buyers to fuel campaigns.",
      personality: ["Analytical", "Systematic", "Logical", "Meticulous", "Precise"],
      statuses: [
        "Clustering customer database...",
        "Mapping behavioral DNA...",
        "Filtering demographic tags...",
        "Identifying VIP churn risks...",
        "Audience segment locked..."
      ],
      metrics: [
        { label: "Active Segments Scanned", value: "4 primary", score: 90 },
        { label: "VIP Churn Alerts", value: "18 flagged", score: 82 },
        { label: "Segment Affinity", value: "94%", score: 94 },
        { label: "Scanned Profiles", value: "80 customers", score: 99 },
        { label: "Database Sync Integrity", value: "99.8%", score: 98 }
      ],
      outputs: [
        {
          title: "Loyalist Cohort Discovery Profile",
          content: "Identified 24 loyal customer profiles showing high affinity for organic and neural items. Preferred channel: WhatsApp."
        },
        {
          title: "Slipping Away Churn Warning",
          content: "Flagged 18 Slipping Away VIPs with 30-day session decline metrics. Churn risk rating: 78% average."
        }
      ],
      responsibilities: [
        "Group customer profiles based on login and order events.",
        "Detect buying trends across demographic clusters.",
        "Maintain customer DNA tag pools for copywriting.",
        "Flag early slipping metrics in active databases."
      ],
      specs: {
        algorithm: "K-Means Clustering + Graph Neural Nets",
        authWeight: "0.90 (Calibrated)",
        model: "Gemini 1.5 Pro (High Context)",
        thread: "Audience discovery Node 1"
      }
    },
    Khoj: {
      title: "Predictive ROI Forecaster",
      themeColor: "from-violet-500 to-pink-500",
      accentText: "text-violet-400",
      accentBg: "bg-violet-500/10",
      glowColor: "rgba(139, 92, 246, 0.25)",
      icon: BarChart2,
      purpose: "Khoj computes projected conversion yields, forecasts campaign revenue outputs, and evaluates promotional ROI scales.",
      personality: ["Mathematical", "Quantitative", "Foresighted", "Pragmatic", "Risk-averse"],
      statuses: [
        "Running ROI regression models...",
        "Simulating response probability curves...",
        "Calculating revenue deltas...",
        "Computing optimal send windows...",
        "ROI forecast compiled..."
      ],
      metrics: [
        { label: "Projected ROI Average", value: "4.2x", score: 84 },
        { label: "Conversion Yield Forecast", value: "35% - 42%", score: 76 },
        { label: "Model Confidence Score", value: "87%", score: 87 },
        { label: "Active Revenue Forecasts", value: "3 running", score: 60 },
        { label: "Daily Logs Evaluated", value: "12.4K points", score: 95 }
      ],
      outputs: [
        {
          title: "Q2 Campaign ROI Projections",
          content: "Conversion yield: 42% on tech loyalists. Expected campaign yield: ₹2.4L. Channel: RCS Cards. ROI: 3.8x."
        },
        {
          title: "Mitigation Saving Projection",
          content: "Averted churn value calculated at ₹85,000. Expected re-engagement conversion: 64% via WhatsApp sequence."
        }
      ],
      responsibilities: [
        "Predict purchase probability thresholds.",
        "Formulate conversion matrices for target segments.",
        "Evaluate ROI coefficients for multi-channel sends.",
        "Identify revenue yield trends over 30-60-90 day boundaries."
      ],
      specs: {
        algorithm: "Random Forest Regressor + Monte Carlo Simulator",
        authWeight: "0.88 (Calibrated)",
        model: "Gemini 1.5 Flash (Fast)",
        thread: "Predictive Analytics Node 3"
      }
    },
    Rachna: {
      title: "Campaign Creator & Copywriter",
      themeColor: "from-pink-500 to-rose-500",
      accentText: "text-pink-400",
      accentBg: "bg-pink-500/10",
      glowColor: "rgba(236, 72, 153, 0.25)",
      icon: Sparkles,
      purpose: "Rachna writes hyper-personalized content copies, formats rich messaging templates, and builds A/B creative variants.",
      personality: ["Creative", "Engaging", "Empathetic", "Adaptive", "Witty"],
      statuses: [
        "Engaging creative generation...",
        "Injecting customer DNA variables...",
        "A/B testing copywriting variations...",
        "Formatting rich media layouts...",
        "Marketing copywriting locked..."
      ],
      metrics: [
        { label: "Creative Templates Generated", value: "8 active", score: 80 },
        { label: "DNA Token Inject Accuracy", value: "99.1%", score: 99 },
        { label: "Avg CTR Increase", value: "+23.4%", score: 92 },
        { label: "Vocabulary Tone Score", value: "Optimal", score: 95 },
        { label: "Copy Generation Latency", value: "2.4ms RTT", score: 97 }
      ],
      outputs: [
        {
          title: "WhatsApp Personalization Template A",
          content: "⚡ *Manthan* ⚡\nHey {{name}}, ready to upgrade your setup? Get priority pre-sale access to the Quantum Deck. Link expires tonight: https://manthan.ai/up"
        },
        {
          title: "Urgent Email Copy Template B",
          content: "Subject: Urgent: Priority booking slots closing\n\nHello {{name}},\nOnly a few slots remain in your cohort's upgrade launch. Secure yours before allocations close."
        }
      ],
      responsibilities: [
        "Draft tailored marketing copy templates.",
        "Compose multi-channel variations (Email, SMS, WhatsApp, RCS).",
        "Implement A/B test parameters for copy experiments.",
        "Inject personalized dynamic attributes via DNA tag nodes."
      ],
      specs: {
        algorithm: "Generative Copy Transformer + Sentiment Scorer",
        authWeight: "0.75 (Calibrated)",
        model: "Gemini 1.5 Flash (Fast)",
        thread: "Content Generation Node 4"
      }
    },
    Saarthi: {
      title: "Operations Dispatch Node",
      themeColor: "from-green-500 to-emerald-500",
      accentText: "text-green-400",
      accentBg: "bg-green-500/10",
      glowColor: "rgba(34, 197, 94, 0.25)",
      icon: Radio,
      purpose: "Saarthi controls dispatcher nodes, throttles gateway message queues, checks API latencies, and tracks event logs.",
      personality: ["Rapid", "Vigilant", "Methodical", "Logical", "Robust"],
      statuses: [
        "Connecting dispatcher server sockets...",
        "Throttling gateway throughput rates...",
        "Monitoring webhook callback endpoints...",
        "Resolving delivery confirmations...",
        "All dispatch gateways active..."
      ],
      metrics: [
        { label: "Message Dispatch Speed", value: "50 msg/sec", score: 90 },
        { label: "Average Routing Latency", value: "3.9ms", score: 99 },
        { label: "Webhook Sync Accuracy", value: "99.9%", score: 99 },
        { label: "Active Server Sockets", value: "8 sockets", score: 80 },
        { label: "Node Uptime Status", value: "Nominal", score: 98 }
      ],
      outputs: [
        {
          title: "Gateway Execution Status",
          content: "Handshake verified with Resend SMTP. WhatsApp gateway channels armed. Socket bandwidth cleared."
        },
        {
          title: "Webhook Tracking Callback log",
          content: "Delivered: 151 messages | Opened: 142 messages | Clicks: 68 links. Latency delta: 0ms."
        }
      ],
      responsibilities: [
        "Execute outbound campaign deliveries.",
        "Track real-time click and open rate webhooks.",
        "Enforce rate limit throttling policies.",
        "Provide server connectivity diagnostics."
      ],
      specs: {
        algorithm: "Token Bucket Queue Throttler + Webhook Event Loop",
        authWeight: "0.95 (Calibrated)",
        model: "Local Operations Controller",
        thread: "Gateway Master Node 5"
      }
    }
  };

  const profile = AGENT_PROFILES[agent];
  if (!profile) return null;
  const Icon = profile.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col ${
          isLight 
            ? "bg-white border-gray-200 text-gray-900 shadow-2xl" 
            : "bg-[#080d24] border-gray-800 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        }`}
        style={{
          boxShadow: isLight ? undefined : `0 0 40px ${profile.glowColor}`,
          animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }}
      >
        {/* Dynamic Scan Line (Cyberpunk Aesthetic) */}
        {!isLight && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan-beam pointer-events-none" />
        )}

        {/* Card Header with Agent Colors */}
        <div className={`p-6 border-b shrink-0 flex items-start justify-between relative overflow-hidden bg-gradient-to-r ${profile.themeColor} bg-opacity-20`}>
          {/* Overlay to dim gradient bg slightly */}
          <div className={`absolute inset-0 opacity-80 ${isLight ? "bg-white/80" : "bg-[#080d24]/85"}`} />

          <div className="relative flex items-center gap-4 z-10">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center relative overflow-hidden bg-black/40 ${isLight ? "border-gray-200" : "border-white/10"}`}>
              <Icon size={24} className={profile.accentText} />
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-space text-xl font-bold tracking-tight">{agent}</h2>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded border border-white/20 bg-white/5 uppercase tracking-wider font-semibold">Active Node</span>
              </div>
              <p className="font-mono text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{profile.title}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors relative z-10 cursor-pointer ${
              isLight 
                ? "border-gray-200 hover:bg-gray-100 text-gray-500" 
                : "border-gray-850 bg-black/20 text-gray-450 hover:text-white hover:border-gray-750"
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Live Rolling Status Bar */}
        <div className={`px-6 py-2 border-b font-mono text-[8px] flex items-center gap-2 shrink-0 ${
          isLight ? "bg-gray-50 border-gray-150 text-gray-550" : "bg-black/40 border-gray-850 text-gray-500"
        }`}>
          <Terminal size={10} className={profile.accentText} />
          <span className="uppercase tracking-widest font-bold">NODE STATUS LOG:</span>
          <span className="text-white bg-black/30 px-1 py-0.5 rounded animate-pulse">{profile.statuses[currentStatusIdx]}</span>
        </div>

        {/* Content Tabs Selector */}
        <div className={`px-6 pt-3 border-b flex gap-4 shrink-0 font-mono text-[9px] font-bold ${isLight ? "border-gray-150" : "border-gray-850"}`}>
          {[
            { id: "overview", label: "OVERVIEW" },
            { id: "metrics", label: "METRICS LEDGER" },
            { id: "outputs", label: "COGNITIVE OUTPUTS" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 border-b-2 tracking-wider transition-all cursor-pointer ${
                activeTab === tab.id
                  ? `${profile.accentText} border-current`
                  : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className={`p-6 flex-1 overflow-y-auto ${isLight ? "bg-gray-50/35" : "bg-black/10"}`}>
          {activeTab === "overview" && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Purpose */}
              <div className="space-y-1">
                <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block">Agent Purpose</span>
                <p className="text-xs leading-relaxed font-inter text-gray-300">{profile.purpose}</p>
              </div>

              {/* Personality */}
              <div className="space-y-1.5">
                <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block">System Personality</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.personality.map(p => (
                    <span 
                      key={p} 
                      className={`font-mono text-[9px] px-2.5 py-1 rounded-md border font-semibold ${
                        isLight 
                          ? "border-gray-200 bg-white text-gray-700" 
                          : "border-gray-850 bg-black/30 text-gray-400"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2 pt-1.5 border-t border-dashed border-gray-800/60">
                <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block">Core Responsibilities</span>
                <ul className="space-y-1.5 font-mono text-[9px] text-gray-400">
                  {profile.responsibilities.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-0.5 font-bold ${profile.accentText}`}>✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-4 animate-fade-in-up">
              <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest block">Real-time Performance Telemetry</span>
              
              <div className="space-y-3 font-mono text-[10px]">
                {profile.metrics.map((m, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-gray-400 font-semibold">{m.label}</span>
                      <span className={`font-bold font-space text-[11px] ${profile.accentText}`}>{m.value}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLight ? "bg-gray-250" : "bg-gray-900"}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${profile.themeColor}`} 
                        style={{ width: `${m.score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "outputs" && (
            <div className="space-y-4.5 animate-fade-in-up font-mono">
              <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest block">Logged Outputs & Predictions</span>
              
              <div className="space-y-3.5">
                {profile.outputs.map((out, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3.5 rounded-xl border text-[9px] leading-relaxed relative overflow-hidden ${
                      isLight 
                        ? "bg-white border-gray-200 text-gray-700" 
                        : "bg-black/45 border-gray-850 text-gray-300"
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-current" style={{ color: idx === 0 ? "#F59E0B" : "#8B5CF6" }} />
                    <div className="flex items-center justify-between border-b border-gray-900/40 pb-1.5 mb-2">
                      <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Terminal size={10} className={profile.accentText} />
                        {out.title}
                      </span>
                      <span className="text-[7px] text-gray-500 uppercase">REPORT #{2039 + idx}</span>
                    </div>
                    <p className="whitespace-pre-line italic leading-relaxed text-gray-400">💭 {out.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Specifications */}
        <div className={`p-4 border-t font-mono text-[8px] text-gray-500 shrink-0 flex flex-wrap justify-between items-center gap-2 ${
          isLight ? "bg-gray-50 border-gray-150" : "bg-black/35 border-gray-850"
        }`}>
          <div>
            <span className="font-bold block uppercase text-[7px] text-gray-550">Algorithm Model</span>
            <span className="text-gray-300 font-semibold">{profile.specs.algorithm}</span>
          </div>
          <div className="text-right">
            <span className="font-bold block uppercase text-[7px] text-gray-550">Model Engine</span>
            <span className="text-gray-300 font-semibold">{profile.specs.model}</span>
          </div>
          <div>
            <span className="font-bold block uppercase text-[7px] text-gray-555">Operational Thread</span>
            <span className="text-gray-350 font-semibold">{profile.specs.thread}</span>
          </div>
          <div className="text-right">
            <span className="font-bold block uppercase text-[7px] text-gray-550">Auth Weight</span>
            <span className="text-emerald-400 font-bold">{profile.specs.authWeight}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
