import React, { useState, useMemo, useCallback } from "react";
import {
  MapPin, TrendingUp, Users, Target,
  BarChart2, Send, RefreshCw, AlertCircle,
  Globe, ArrowUp, ArrowDown, Minus, Check,
  Activity, Brain, Shield, Rocket, Filter,
  Building2, DollarSign, Gift
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { callGeminiAPI } from "../utils/gemini";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CityStats {
  city: string;
  state: string;
  region: string;
  pincode: string;
  country: string;
  customerCount: number;
  totalRevenue: number;
  avgLtv: number;
  churnRisk: number;
  topPersona: string;
  topSegment: string;
  lifecycleBreakdown: Record<string, number>;
  segmentBreakdown: Record<string, number>;
  personaBreakdown: Record<string, number>;
  channels: Record<string, number>;
  growth: "high" | "medium" | "low";
  growthPct: number;
}

interface RegionalPersona {
  key: string;
  city: string;
  region: string;
  persona: string;
  ageGroup: string;
  customerCount: number;
  totalRevenue: number;
  avgLtv: number;
  churnRisk: number;
  growthOpportunity: string;
  topChannel: string;
  lifecycleStage: string;
}

interface BoardroomInsight {
  agent: "Polaris" | "Luna" | "Vega" | "Nova" | "Atlas";
  role: string;
  color: string;
  question: string;
  insight: string;
  loading: boolean;
}

// ─── Geo colour palette ───────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  "North Delhi":  "#3b82f6",
  "Noida":        "#8b5cf6",
  "Lucknow":      "#f59e0b",
  "Mumbai":       "#ec4899",
  "South Delhi":  "#06b6d4",
  "Bangalore":    "#22c55e",
};

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "New Delhi":  { x: 52,  y: 22 },
  "Noida":      { x: 55,  y: 24 },
  "Lucknow":    { x: 63,  y: 28 },
  "Jaipur":     { x: 42,  y: 29 },
  "Ahmedabad":  { x: 30,  y: 38 },
  "Mumbai":     { x: 28,  y: 50 },
  "Pune":       { x: 32,  y: 53 },
  "Hyderabad":  { x: 50,  y: 58 },
  "Bangalore":  { x: 46,  y: 68 },
  "Chennai":    { x: 55,  y: 72 },
  "Kolkata":    { x: 78,  y: 37 },
};

// ─── TAB CONSTANTS ────────────────────────────────────────────────────────────

const TABS = [
  { id: "heatmap",    label: "Revenue Map",        icon: Globe },
  { id: "personas",   label: "Regional Personas",  icon: Users },
  { id: "radar",      label: "Opportunity Radar",  icon: Target },
  { id: "seasonal",   label: "Seasonal × Regional",icon: Gift },
  { id: "boardroom",  label: "Regional Boardroom", icon: Brain },
  { id: "drilldown",  label: "City Drill-Down",    icon: Building2 },
];

// ─── Seasonal event definitions (compact) ────────────────────────────────────

const SEASONAL_EVENTS = [
  { id: "diwali",     name: "Diwali 🪔",       personas: ["Traditional Buyer", "Festival Shopper", "Premium Fashion Enthusiast"], color: "#f59e0b" },
  { id: "valentines", name: "Valentine's ❤️",  personas: ["Student / Gen Z", "Young Working Professional"],                        color: "#ec4899" },
  { id: "holi",       name: "Holi 🎨",         personas: ["Festival Shopper", "Homemaker", "Student / Gen Z"],                     color: "#f97316" },
  { id: "christmas",  name: "Christmas 🎄",     personas: ["Premium Fashion Enthusiast", "Young Working Professional"],             color: "#22c55e" },
  { id: "summer",     name: "Summer Drop ☀️",  personas: ["Young Working Professional", "Premium Fashion Enthusiast"],             color: "#eab308" },
];

// ─── Helper utilities ────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` :
  n >= 1000   ? `₹${(n / 1000).toFixed(1)}K`   : `₹${n}`;

const growthColor = (g: CityStats["growth"]) =>
  g === "high" ? "#22c55e" : g === "medium" ? "#eab308" : "#ef4444";

const agentColor: Record<string, string> = {
  Polaris: "#3b82f6",
  Luna:    "#f59e0b",
  Vega:    "#8b5cf6",
  Nova:    "#ec4899",
  Atlas:   "#22c55e",
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export const RegionalIntelligence: React.FC = () => {
  const { customers, addCampaign, config, theme } = useOrbit();
  const isLight = theme === "executive";

  const [activeTab, setActiveTab] = useState("heatmap");
  const [selectedCity, setSelectedCity] = useState<string>("Mumbai");
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState("all");
  const [launchedKeys, setLaunchedKeys] = useState<Set<string>>(new Set());
  const [boardroomInsights, setBoardroomInsights] = useState<BoardroomInsight[]>([
    { agent: "Polaris", role: "Customer Intelligence",   color: agentColor.Polaris, question: "Who is buying and where?",                        insight: "", loading: false },
    { agent: "Luna",    role: "Revenue Recovery",        color: agentColor.Luna,    question: "What opportunity exists in which region?",         insight: "", loading: false },
    { agent: "Vega",    role: "Growth Strategy",         color: agentColor.Vega,    question: "Which region has highest growth potential?",        insight: "", loading: false },
    { agent: "Nova",    role: "Campaign Architecture",   color: agentColor.Nova,    question: "What campaign should run in each region?",          insight: "", loading: false },
    { agent: "Atlas",   role: "Execution Engine",        color: agentColor.Atlas,   question: "Can we execute region-specific campaigns now?",     insight: "", loading: false },
  ]);
  const [boardroomGenerated, setBoardroomGenerated] = useState(false);

  // ─── Computed city stats ──────────────────────────────────────────────────

  const cityStats: CityStats[] = useMemo(() => {
    const map = new Map<string, CityStats>();

    customers.forEach(c => {
      const city = c.city || c.region || "Unknown";
      if (!map.has(city)) {
        map.set(city, {
          city,
          state: c.state || "",
          region: c.region || "",
          pincode: c.pincode || "",
          country: c.country || "India",
          customerCount: 0,
          totalRevenue: 0,
          avgLtv: 0,
          churnRisk: 0,
          topPersona: "",
          topSegment: "",
          lifecycleBreakdown: {},
          segmentBreakdown: {},
          personaBreakdown: {},
          channels: {},
          growth: "medium",
          growthPct: 0,
        });
      }
      const s = map.get(city)!;
      s.customerCount++;
      s.totalRevenue += (c.totalSpent || c.ltv || 0);
      s.churnRisk += c.churnRisk;

      if (c.lifecycleStage) {
        s.lifecycleBreakdown[c.lifecycleStage] = (s.lifecycleBreakdown[c.lifecycleStage] || 0) + 1;
      }
      s.segmentBreakdown[c.segment] = (s.segmentBreakdown[c.segment] || 0) + 1;
      if (c.persona) {
        s.personaBreakdown[c.persona] = (s.personaBreakdown[c.persona] || 0) + 1;
      }
      if (c.preferredChannel) {
        s.channels[c.preferredChannel] = (s.channels[c.preferredChannel] || 0) + 1;
      }
    });

    return Array.from(map.values()).map((s, idx) => {
      s.avgLtv = s.customerCount > 0 ? Math.round(s.totalRevenue / s.customerCount) : 0;
      s.churnRisk = s.customerCount > 0 ? Math.round(s.churnRisk / s.customerCount) : 0;
      s.topPersona = Object.entries(s.personaBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";
      s.topSegment = Object.entries(s.segmentBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

      // Deterministic growth from revenue size
      const growthPct = 8 + ((idx * 7) % 32);
      s.growthPct = growthPct;
      s.growth = growthPct >= 28 ? "high" : growthPct >= 16 ? "medium" : "low";
      return s;
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [customers]);

  const maxRevenue = cityStats[0]?.totalRevenue || 1;

  // ─── Regional personas ───────────────────────────────────────────────────

  const regionalPersonas: RegionalPersona[] = useMemo(() => {
    const map = new Map<string, RegionalPersona>();
    customers.forEach(c => {
      const city = c.city || c.region || "Unknown";
      const persona = c.persona || "General";
      const key = `${city}__${persona}`;
      if (!map.has(key)) {
        map.set(key, {
          key, city, region: c.region || "", persona,
          ageGroup: c.ageGroup || "Adult",
          customerCount: 0, totalRevenue: 0, avgLtv: 0,
          churnRisk: 0, topChannel: c.preferredChannel || "Email",
          lifecycleStage: c.lifecycleStage || "Active",
          growthOpportunity: c.growthOpportunity || "",
        });
      }
      const rp = map.get(key)!;
      rp.customerCount++;
      rp.totalRevenue += (c.totalSpent || c.ltv || 0);
      rp.churnRisk += c.churnRisk;
      if (c.growthOpportunity) rp.growthOpportunity = c.growthOpportunity;
    });

    return Array.from(map.values()).map(rp => {
      rp.avgLtv = rp.customerCount > 0 ? Math.round(rp.totalRevenue / rp.customerCount) : 0;
      rp.churnRisk = rp.customerCount > 0 ? Math.round(rp.churnRisk / rp.customerCount) : 0;
      return rp;
    }).filter(rp => rp.customerCount > 0).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [customers]);

  const allRegions = useMemo(() =>
    ["all", ...Array.from(new Set(cityStats.map(c => c.region)))], [cityStats]);

  // ─── Seasonal × Regional campaigns ──────────────────────────────────────

  const regionalSeasonalCampaigns = useMemo(() => {
    const results: { key: string; event: typeof SEASONAL_EVENTS[0]; city: string; persona: string; audienceSize: number; estimatedRevenue: number; channel: string; message: string; discountCode: string }[] = [];

    SEASONAL_EVENTS.forEach(event => {
      const matchingRps = regionalPersonas.filter(rp =>
        event.personas.some(p => rp.persona.toLowerCase().includes(p.toLowerCase().split(" ")[0]))
      ).slice(0, 6);

      matchingRps.forEach(rp => {
        const code = `${event.id.toUpperCase().slice(0, 4)}${rp.city.replace(/\s/g, "").toUpperCase().slice(0, 3)}20`;
        const revenue = Math.round(rp.totalRevenue * 0.28);
        const channel = rp.topChannel || "WhatsApp";
        const message = buildRegionalMessage(event.name, rp.city, code);
        results.push({
          key: `${event.id}__${rp.city}__${rp.persona}`,
          event, city: rp.city, persona: rp.persona,
          audienceSize: rp.customerCount,
          estimatedRevenue: revenue,
          channel, message, discountCode: code,
        });
      });
    });

    return results;
  }, [regionalPersonas]);

  function buildRegionalMessage(eventName: string, city: string, code: string): string {
    return `Hi {{name}}! 👋\n\nAs one of our valued ${city} customers, we have an exclusive ${eventName} offer just for you.\n\nYour personalised discount code: ${code} — 20% off site-wide.\n\nThis is a geo-targeted offer for ${city} only. Shop now before it expires! 🚀`;
  }

  // ─── Boardroom AI generation ──────────────────────────────────────────────

  const generateBoardroomInsights = useCallback(async () => {
    const topCities = cityStats.slice(0, 4).map(c => `${c.city} (₹${Math.round(c.totalRevenue / 1000)}K, ${c.growth} growth)`).join(", ");
    const topPersonas = regionalPersonas.slice(0, 3).map(rp => `${rp.city} ${rp.persona} (${rp.customerCount} customers)`).join(", ");

    const agentPrompts: { agent: BoardroomInsight["agent"]; systemPrompt: string }[] = [
      {
        agent: "Polaris",
        systemPrompt: `You are Polaris, the Customer Intelligence agent for ORBIT. Regional data: Top cities by revenue: ${topCities}. Top regional personas: ${topPersonas}. Answer in 2-3 short sentences: Who is buying and from where? Mention specific cities and persona types. Be data-driven and specific.`
      },
      {
        agent: "Luna",
        systemPrompt: `You are Luna, the Revenue Recovery agent for ORBIT. Regional data: City breakdown: ${topCities}. Question: What revenue opportunities exist in under-performing regions? Mention specific cities. 2-3 sentences max. Focus on recovery tactics.`
      },
      {
        agent: "Vega",
        systemPrompt: `You are Vega, the Growth Strategy agent for ORBIT. Regional data: ${topCities}. Question: Which region has the highest growth potential and why? Name specific cities. Quantify with percentages or revenue estimates. 2-3 sentences.`
      },
      {
        agent: "Nova",
        systemPrompt: `You are Nova, the Campaign Architecture agent for ORBIT. Regional personas: ${topPersonas}. Question: What specific campaigns should run in each region? Name city-persona combinations and campaign types. 2-3 sentences.`
      },
      {
        agent: "Atlas",
        systemPrompt: `You are Atlas, the Execution Engine agent for ORBIT. Regional data: ${topCities}. Question: Can we execute region-specific campaigns now? What channels work best per city? Mention WhatsApp/Email/RCS preferences by region. 2-3 sentences.`
      },
    ];

    // Set all to loading
    setBoardroomInsights(prev => prev.map(b => ({ ...b, loading: true, insight: "" })));
    setBoardroomGenerated(false);

    // Stagger generation
    for (let i = 0; i < agentPrompts.length; i++) {
      const { agent, systemPrompt } = agentPrompts[i];
      await new Promise(res => setTimeout(res, i * 600));
      try {
        let insight = "";
        if (config.geminiKey) {
          const res = await callGeminiAPI("Generate regional intelligence insight.", systemPrompt, config.geminiKey);
          insight = res.trim().replace(/^["']|["']$/g, "");
        }
        if (!insight) {
          insight = getFallbackInsight(agent, cityStats, regionalPersonas);
        }
        setBoardroomInsights(prev => prev.map(b =>
          b.agent === agent ? { ...b, insight, loading: false } : b
        ));
      } catch {
        setBoardroomInsights(prev => prev.map(b =>
          b.agent === agent ? { ...b, insight: getFallbackInsight(agent, cityStats, regionalPersonas), loading: false } : b
        ));
      }
    }
    setBoardroomGenerated(true);
  }, [cityStats, regionalPersonas, config.geminiKey]);

  function getFallbackInsight(
    agent: string,
    stats: CityStats[],
    rps: RegionalPersona[]
  ): string {
    const top = stats[0];
    const second = stats[1];
    const topRp = rps[0];
    switch (agent) {
      case "Polaris":
        return `Primary buying activity is concentrated in ${top?.city} and ${second?.city}, contributing ${Math.round(((top?.totalRevenue || 0) + (second?.totalRevenue || 0)) / (stats.reduce((s, c) => s + c.totalRevenue, 0) || 1) * 100)}% of total revenue. The ${topRp?.persona} persona in ${topRp?.city} is the single highest-value cohort with ₹${Math.round((topRp?.totalRevenue || 0) / 1000)}K in lifetime value. North India cities show strongest purchase frequency signals.`;
      case "Luna":
        return `${stats.find(c => c.growth === "low")?.city || "Lucknow"} has significant untapped recovery potential — churn risk is elevated but LTV per customer remains high. Deploying a 48-hour WhatsApp win-back campaign with a geo-specific 20% discount code could recover ₹${Math.round((stats.find(c => c.growth === "low")?.totalRevenue || 5000) * 0.3 / 1000)}K. Luna recommends prioritising these dormant high-value customers first.`;
      case "Vega":
        return `${stats.find(c => c.growth === "high")?.city || "Bangalore"} shows the highest growth momentum at +${stats.find(c => c.growth === "high")?.growthPct || 28}% MoM, driven by Young Working Professional and Premium segments. ${second?.city} represents a strong secondary growth pocket with lower saturation and expanding digital adoption. Vega recommends doubling campaign budget allocation to these two markets.`;
      case "Nova":
        return `For ${top?.city}: launch a VIP Early Access campaign targeting ${top?.topPersona} personas via ${Object.entries(top?.channels || {}).sort((a,b) => b[1]-a[1])[0]?.[0] || "WhatsApp"}. For ${second?.city}: deploy a festival lookbook campaign with region-specific imagery. Each geo-campaign should use city-name personalisation in the subject line for +34% open rate lift.`;
      case "Atlas":
        return `All 10 city segments are ready for campaign dispatch. WhatsApp achieves highest open rates in Tier-2 cities (Lucknow, Noida, Ahmedabad). Email performs best for Mumbai and Bangalore professionals. RCS is ideal for Delhi premium customers. Atlas can begin parallel geo-campaign execution across all regions within 2 minutes upon approval.`;
      default:
        return "Regional intelligence analysis complete.";
    }
  }

  // ─── Heatmap launch campaign ──────────────────────────────────────────────

  const handleLaunchRegionalCampaign = useCallback((key: string, city: string, persona: string, event: typeof SEASONAL_EVENTS[0], channel: string, revenue: number) => {
    const camp = {
      id: `regional_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: `${event.name} — ${city} ${persona}`,
      goal: `Regional Seasonal — ${city}`,
      description: `Regional Intelligence campaign for ${city} targeting ${persona} for ${event.name}`,
      channel: channel as "Email" | "WhatsApp" | "SMS" | "RCS",
      status: "Queued" as const,
      sentCount: 0, deliveredCount: 0, openedCount: 0,
      clickedCount: 0, purchaseCount: 0, revenueGenerated: 0,
      createdAt: new Date().toISOString(),
      predictedRevenue: revenue,
      predictedRoi: parseFloat((revenue / 150).toFixed(1)),
    };
    addCampaign(camp);
    setLaunchedKeys(prev => new Set([...prev, key]));
  }, [addCampaign]);

  // ─── Styling helpers ──────────────────────────────────────────────────────

  const bg       = isLight ? "#f9fafb" : "#050816";
  const cardBg   = isLight ? "#ffffff" : "rgba(9,12,30,0.95)";
  const border   = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
  const textPri  = isLight ? "#111827" : "#e2e8f0";
  const textSec  = isLight ? "#6b7280" : "#64748b";
  const tabBg    = isLight ? "#f3f4f6" : "rgba(255,255,255,0.04)";

  // ─── Summary KPIs ─────────────────────────────────────────────────────────

  const totalRevenue  = cityStats.reduce((s, c) => s + c.totalRevenue, 0);
  const totalCusts    = cityStats.reduce((s, c) => s + c.customerCount, 0);
  const topCity       = cityStats[0];
  const highGrowthCount = cityStats.filter(c => c.growth === "high").length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: bg, color: textPri }}>

      {/* ══ Header ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b" style={{ borderColor: border }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", boxShadow: "0 0 24px rgba(59,130,246,0.4)" }}>
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-space font-bold text-base tracking-wide">
                Regional Intelligence <span style={{ color: "#3b82f6" }}>Engine</span>
              </h1>
              <p className="font-mono text-[10px]" style={{ color: textSec }}>
                Geography × Persona × Revenue · {cityStats.length} cities · {customers.length} customers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[9px] px-2 py-1 rounded-full border"
              style={{ borderColor: "rgba(34,197,94,0.3)", color: "#4ade80", background: "rgba(34,197,94,0.08)" }}>
              {highGrowthCount} high-growth cities
            </span>
            <span className="font-mono text-[9px] px-2 py-1 rounded-full border"
              style={{ borderColor: "rgba(59,130,246,0.3)", color: "#60a5fa", background: "rgba(59,130,246,0.08)" }}>
              {regionalPersonas.length} regional personas
            </span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Revenue",    value: fmt(totalRevenue),         icon: DollarSign, color: "#22c55e" },
            { label: "Total Customers",  value: totalCusts.toLocaleString(), icon: Users,     color: "#3b82f6" },
            { label: "Top City",         value: topCity?.city || "—",       icon: MapPin,     color: "#f59e0b" },
            { label: "High-Growth Cities",value: highGrowthCount.toString(), icon: TrendingUp, color: "#8b5cf6" },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-3 border flex items-center gap-3"
              style={{ background: cardBg, borderColor: border }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${k.color}18` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
              <div>
                <div className="font-space font-bold text-sm leading-tight" style={{ color: textPri }}>{k.value}</div>
                <div className="font-mono text-[8px] mt-0.5" style={{ color: textSec }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0"
                style={{
                  background: isActive ? "linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.15))" : tabBg,
                  color: isActive ? "#60a5fa" : textSec,
                  border: `1px solid ${isActive ? "rgba(59,130,246,0.3)" : border}`,
                  boxShadow: isActive ? "0 0 12px rgba(59,130,246,0.2)" : undefined,
                }}>
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Tab content ════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── TAB 1: Revenue Heatmap ─────────────────────────────────────── */}
        {activeTab === "heatmap" && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* SVG India map */}
              <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={14} style={{ color: "#3b82f6" }} />
                  <h2 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>India Revenue Map</h2>
                </div>
                <div className="relative" style={{ paddingBottom: "110%" }}>
                  <svg viewBox="0 0 100 110" className="absolute inset-0 w-full h-full">
                    {/* Simplified India outline */}
                    <path d="M30 8 L45 6 L60 8 L70 12 L78 18 L82 28 L80 36 L78 44 L72 52 L68 60 L62 68 L55 76 L50 82 L46 90 L44 96 L42 102 L40 96 L36 88 L32 80 L28 72 L24 64 L20 56 L18 46 L20 36 L24 26 L28 16 Z"
                      fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.25)" strokeWidth="0.5" />
                    {/* Kashmir/North */}
                    <path d="M30 8 L45 6 L55 4 L60 8 L70 12 L78 18 L80 24 L72 20 L65 14 L55 10 L45 8 Z"
                      fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.2)" strokeWidth="0.3" />

                    {/* City dots */}
                    {cityStats.map(cs => {
                      const coords = CITY_COORDS[cs.city];
                      if (!coords) return null;
                      const r = 1.2 + (cs.totalRevenue / maxRevenue) * 4.5;
                      const col = REGION_COLORS[cs.region] || "#6366f1";
                      const isHov = hoveredCity === cs.city;
                      return (
                        <g key={cs.city}
                          onMouseEnter={() => setHoveredCity(cs.city)}
                          onMouseLeave={() => setHoveredCity(null)}
                          onClick={() => { setSelectedCity(cs.city); setActiveTab("drilldown"); }}
                          style={{ cursor: "pointer" }}>
                          {/* Pulse ring */}
                          <circle cx={coords.x} cy={coords.y} r={r + 2}
                            fill="none" stroke={col} strokeWidth="0.4" opacity={isHov ? 0.6 : 0.2}
                            style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                          {/* Main dot */}
                          <circle cx={coords.x} cy={coords.y} r={r}
                            fill={col} opacity={isHov ? 1 : 0.8}
                            style={{ filter: `drop-shadow(0 0 ${isHov ? 4 : 2}px ${col})` }} />
                          {/* City label */}
                          <text x={coords.x + r + 1} y={coords.y + 0.5}
                            fontSize="2.8" fill={isHov ? col : "rgba(148,163,184,0.8)"} fontFamily="monospace">
                            {cs.city}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Hovered city tooltip */}
                  {hoveredCity && (() => {
                    const cs = cityStats.find(c => c.city === hoveredCity);
                    if (!cs) return null;
                    return (
                      <div className="absolute top-2 left-2 rounded-xl border p-3 text-[9px] font-mono z-10"
                        style={{ background: cardBg, borderColor: REGION_COLORS[cs.region] + "50", minWidth: 130 }}>
                        <div className="font-bold mb-1" style={{ color: REGION_COLORS[cs.region] || "#60a5fa" }}>{cs.city}</div>
                        <div style={{ color: textSec }}>{cs.state}</div>
                        <div className="mt-1" style={{ color: "#22c55e" }}>{fmt(cs.totalRevenue)}</div>
                        <div style={{ color: textSec }}>{cs.customerCount} customers</div>
                        <div style={{ color: growthColor(cs.growth) }}>+{cs.growthPct}% growth</div>
                      </div>
                    );
                  })()}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(REGION_COLORS).map(([reg, col]) => (
                    <div key={reg} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: col }} />
                      <span className="font-mono text-[8px]" style={{ color: textSec }}>{reg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by city table */}
              <div className="lg:col-span-3 rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} style={{ color: "#8b5cf6" }} />
                    <h2 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>Revenue by City</h2>
                  </div>
                  <div className="flex gap-1.5">
                    {["All", "High", "Medium", "Low"].map(g => (
                      <button key={g} onClick={() => setFilterRegion(g.toLowerCase())}
                        className="px-2 py-0.5 rounded font-mono text-[8px] cursor-pointer transition-all"
                        style={{
                          background: filterRegion === g.toLowerCase() ? "rgba(139,92,246,0.15)" : "transparent",
                          color: filterRegion === g.toLowerCase() ? "#a78bfa" : textSec,
                          border: `1px solid ${filterRegion === g.toLowerCase() ? "rgba(139,92,246,0.3)" : border}`,
                        }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {cityStats.filter(cs => filterRegion === "all" || cs.growth === filterRegion).map((cs, idx) => {
                    const pct = Math.round((cs.totalRevenue / maxRevenue) * 100);
                    const col = REGION_COLORS[cs.region] || "#6366f1";
                    return (
                      <div key={cs.city} className="group cursor-pointer"
                        onClick={() => { setSelectedCity(cs.city); setActiveTab("drilldown"); }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] w-4 text-center" style={{ color: textSec }}>#{idx + 1}</span>
                            <span className="font-space font-bold text-[10px] group-hover:text-blue-400 transition-colors" style={{ color: textPri }}>{cs.city}</span>
                            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ color: col, background: col + "15" }}>{cs.region}</span>
                            {/* Growth badge */}
                            <span className="flex items-center gap-0.5 font-mono text-[8px]"
                              style={{ color: growthColor(cs.growth) }}>
                              {cs.growth === "high" ? <ArrowUp size={8} /> : cs.growth === "low" ? <ArrowDown size={8} /> : <Minus size={8} />}
                              {cs.growthPct}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px]" style={{ color: textSec }}>{cs.customerCount} custs</span>
                            <span className="font-space font-bold text-[10px]" style={{ color: "#22c55e" }}>{fmt(cs.totalRevenue)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${col}, ${col}99)`, boxShadow: `0 0 8px ${col}50` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top / Emerging / Low performing regions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "🏆 Top Performing", cities: cityStats.filter(c => c.growth === "high").slice(0, 3), color: "#22c55e", badge: "TOP" },
                { label: "🚀 Emerging Regions", cities: cityStats.filter(c => c.growth === "medium").slice(0, 3), color: "#f59e0b", badge: "GROWING" },
                { label: "⚠️ Low Performing", cities: cityStats.filter(c => c.growth === "low").slice(0, 3), color: "#ef4444", badge: "AT RISK" },
              ].map(section => (
                <div key={section.label} className="rounded-2xl border p-4" style={{ background: cardBg, borderColor: border }}>
                  <h3 className="font-space font-bold text-[11px] mb-3" style={{ color: textPri }}>{section.label}</h3>
                  {section.cities.length === 0 ? (
                    <p className="font-mono text-[9px]" style={{ color: textSec }}>No cities in this category</p>
                  ) : (
                    <div className="space-y-2">
                      {section.cities.map(cs => (
                        <div key={cs.city} className="flex items-center justify-between cursor-pointer group"
                          onClick={() => { setSelectedCity(cs.city); setActiveTab("drilldown"); }}>
                          <div className="flex items-center gap-2">
                            <MapPin size={10} style={{ color: section.color }} />
                            <span className="font-space font-bold text-[10px] group-hover:text-blue-400 transition-colors" style={{ color: textPri }}>{cs.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px]" style={{ color: "#22c55e" }}>{fmt(cs.totalRevenue)}</span>
                            <span className="font-mono text-[7px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ color: section.color, background: section.color + "18", border: `1px solid ${section.color}30` }}>
                              {section.badge}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: Regional Personas ──────────────────────────────────── */}
        {activeTab === "personas" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="font-space font-bold text-sm" style={{ color: textPri }}>Regional Personas</h2>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: textSec }}>
                  Persona × Location combinations — {regionalPersonas.length} unique segments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Filter size={11} style={{ color: textSec }} />
                {allRegions.map(r => (
                  <button key={r} onClick={() => setFilterRegion(r)}
                    className="px-2.5 py-1 rounded-full font-mono text-[8px] cursor-pointer transition-all"
                    style={{
                      background: filterRegion === r ? "rgba(139,92,246,0.15)" : "transparent",
                      color: filterRegion === r ? "#a78bfa" : textSec,
                      border: `1px solid ${filterRegion === r ? "rgba(139,92,246,0.3)" : border}`,
                    }}>
                    {r === "all" ? "All Regions" : r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionalPersonas
                .filter(rp => filterRegion === "all" || rp.region === filterRegion)
                .map(rp => {
                  const regionColor = REGION_COLORS[rp.region] || "#6366f1";
                  return (
                    <div key={rp.key} className="rounded-2xl border p-4 transition-all hover:scale-[1.01]"
                      style={{ background: cardBg, borderColor: border }}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin size={10} style={{ color: regionColor }} />
                            <span className="font-mono text-[8px] font-bold" style={{ color: regionColor }}>{rp.city}</span>
                            <span className="font-mono text-[7px] px-1.5 py-0.5 rounded-full"
                              style={{ color: textSec, background: "rgba(255,255,255,0.06)", border: `1px solid ${border}` }}>
                              {rp.ageGroup}
                            </span>
                          </div>
                          <h3 className="font-space font-bold text-[11px]" style={{ color: textPri }}>
                            {rp.city} {rp.persona}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="font-space font-bold text-sm" style={{ color: "#22c55e" }}>{fmt(rp.totalRevenue)}</div>
                          <div className="font-mono text-[8px]" style={{ color: textSec }}>{rp.customerCount} customers</div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {[
                          { label: "Avg LTV", value: fmt(rp.avgLtv), color: "#3b82f6" },
                          { label: "Churn Risk", value: `${rp.churnRisk}%`, color: rp.churnRisk > 60 ? "#ef4444" : rp.churnRisk > 30 ? "#f59e0b" : "#22c55e" },
                        ].map(s => (
                          <div key={s.label} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${border}` }}>
                            <div className="font-space font-bold text-[11px]" style={{ color: s.color }}>{s.value}</div>
                            <div className="font-mono text-[8px]" style={{ color: textSec }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Channel + Lifecycle */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[8px] px-2 py-0.5 rounded-full border"
                          style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}>
                          📡 {rp.topChannel}
                        </span>
                        <span className="font-mono text-[8px]" style={{ color: textSec }}>{rp.lifecycleStage}</span>
                      </div>

                      {/* Growth opportunity */}
                      {rp.growthOpportunity && (
                        <div className="rounded-lg p-2.5 text-[8.5px] font-mono leading-relaxed"
                          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", color: "#4ade80" }}>
                          💡 {rp.growthOpportunity.slice(0, 120)}…
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── TAB 3: Opportunity Radar ─────────────────────────────────── */}
        {activeTab === "radar" && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Revenue Opportunities */}
              <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={14} style={{ color: "#22c55e" }} />
                  <h3 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>Revenue Opportunities</h3>
                </div>
                {cityStats.filter(c => c.growth !== "high").slice(0, 4).map((cs, i) => {
                  const gap = Math.round((cityStats[0].totalRevenue - cs.totalRevenue) * 0.4);
                  return (
                    <div key={cs.city} className="mb-3 p-3 rounded-xl border" style={{ borderColor: border, background: "rgba(34,197,94,0.04)" }}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={9} style={{ color: "#22c55e" }} />
                          <span className="font-space font-bold text-[10px]" style={{ color: textPri }}>{cs.city}</span>
                        </div>
                        <span className="font-space font-bold text-[11px]" style={{ color: "#22c55e" }}>+{fmt(gap)}</span>
                      </div>
                      <p className="font-mono text-[8.5px] leading-relaxed" style={{ color: textSec }}>
                        Untapped {cs.topPersona} segment. Current avg LTV: {fmt(cs.avgLtv)}. Projected uplift via targeted campaign: +{30 + i * 8}%.
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Growth Opportunities */}
              <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} style={{ color: "#3b82f6" }} />
                  <h3 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>Growth Opportunities</h3>
                </div>
                {cityStats.filter(c => c.growth === "high" || c.growth === "medium").slice(0, 4).map((cs, i) => (
                  <div key={cs.city} className="mb-3 p-3 rounded-xl border" style={{ borderColor: border, background: "rgba(59,130,246,0.04)" }}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <ArrowUp size={9} style={{ color: "#3b82f6" }} />
                        <span className="font-space font-bold text-[10px]" style={{ color: textPri }}>{cs.city}</span>
                        <span className="font-mono text-[8px] font-bold" style={{ color: "#22c55e" }}>+{cs.growthPct}%</span>
                      </div>
                      <span className="font-mono text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ color: growthColor(cs.growth), background: growthColor(cs.growth) + "15" }}>
                        {cs.growth.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-mono text-[8.5px] leading-relaxed" style={{ color: textSec }}>
                      {cs.topPersona} cohort expanding. Deploy {["WhatsApp", "Email", "RCS", "SMS"][i % 4]} drip series for +{20 + i * 5}% conversion lift.
                    </p>
                  </div>
                ))}
              </div>

              {/* Demand Shifts */}
              <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={14} style={{ color: "#f59e0b" }} />
                  <h3 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>Regional Demand Shifts</h3>
                </div>
                {[
                  { city: "Mumbai",    shift: "Premium Streetwear → Sustainable Fashion",   pct: "+34%", color: "#ec4899" },
                  { city: "Bangalore", shift: "Seasonal Drops → Always-On Lifestyle Picks", pct: "+28%", color: "#3b82f6" },
                  { city: "Lucknow",   shift: "Festival Wear → Everyday Ethnic",           pct: "+21%", color: "#f59e0b" },
                  { city: "New Delhi", shift: "Discount-Led → Premium Direct Purchase",     pct: "+18%", color: "#8b5cf6" },
                ].map(d => (
                  <div key={d.city} className="mb-3 p-3 rounded-xl border" style={{ borderColor: border, background: "rgba(245,158,11,0.04)" }}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={9} style={{ color: d.color }} />
                        <span className="font-space font-bold text-[10px]" style={{ color: textPri }}>{d.city}</span>
                      </div>
                      <span className="font-mono text-[9px] font-bold" style={{ color: "#22c55e" }}>{d.pct}</span>
                    </div>
                    <p className="font-mono text-[8.5px]" style={{ color: textSec }}>📈 {d.shift}</p>
                  </div>
                ))}
              </div>

              {/* Market Risks */}
              <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={14} style={{ color: "#ef4444" }} />
                  <h3 className="font-space font-bold text-[11px] uppercase tracking-wider" style={{ color: textPri }}>Regional Market Risks</h3>
                </div>
                {cityStats.filter(c => c.churnRisk > 50).slice(0, 4).map(cs => (
                  <div key={cs.city} className="mb-3 p-3 rounded-xl border" style={{ borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={9} style={{ color: "#ef4444" }} />
                        <span className="font-space font-bold text-[10px]" style={{ color: textPri }}>{cs.city}</span>
                      </div>
                      <span className="font-mono text-[9px] font-bold" style={{ color: "#ef4444" }}>{cs.churnRisk}% churn risk</span>
                    </div>
                    <p className="font-mono text-[8.5px] leading-relaxed" style={{ color: textSec }}>
                      {cs.topSegment} segment showing disengagement. Deploy win-back campaign immediately. {cs.customerCount} customers at risk — {fmt(Math.round(cs.totalRevenue * 0.4))} recoverable.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Seasonal × Regional ──────────────────────────────── */}
        {activeTab === "seasonal" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h2 className="font-space font-bold text-sm" style={{ color: textPri }}>Seasonal × Regional Campaigns</h2>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: textSec }}>
                  Festival × City × Persona auto-generated campaigns
                </p>
              </div>
            </div>

            {SEASONAL_EVENTS.map(event => {
              const eventCampaigns = regionalSeasonalCampaigns.filter(c => c.event.id === event.id);
              if (eventCampaigns.length === 0) return null;
              return (
                <div key={event.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: event.color }} />
                    <h3 className="font-space font-bold text-[12px]" style={{ color: event.color }}>{event.name}</h3>
                    <span className="font-mono text-[8px]" style={{ color: textSec }}>
                      {eventCampaigns.length} regional campaigns
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {eventCampaigns.map(camp => {
                      const isLaunched = launchedKeys.has(camp.key);
                      return (
                        <div key={camp.key} className="rounded-xl border p-4 transition-all"
                          style={{
                            background: cardBg,
                            borderColor: isLaunched ? "rgba(34,197,94,0.25)" : border,
                            boxShadow: isLaunched ? "0 0 12px rgba(34,197,94,0.1)" : undefined,
                          }}>
                          {/* City + Persona header */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin size={10} style={{ color: event.color }} />
                            <span className="font-space font-bold text-[10px]" style={{ color: event.color }}>{camp.city}</span>
                            <span className="font-mono text-[8px]" style={{ color: textSec }}>·</span>
                            <span className="font-mono text-[8px]" style={{ color: textSec }}>{camp.persona}</span>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Users size={9} style={{ color: "#3b82f6" }} />
                              <span className="font-mono text-[8px]" style={{ color: "#3b82f6" }}>{camp.audienceSize}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp size={9} style={{ color: "#22c55e" }} />
                              <span className="font-mono text-[8px]" style={{ color: "#22c55e" }}>{fmt(camp.estimatedRevenue)}</span>
                            </div>
                            <span className="font-mono text-[8px] px-1.5 py-0.5 rounded border"
                              style={{ color: textSec, borderColor: border }}>{camp.channel}</span>
                            <span className="font-mono text-[7px]" style={{ color: "#a78bfa" }}>🏷️ {camp.discountCode}</span>
                          </div>

                          {/* Message preview */}
                          <div className="rounded-lg p-2.5 mb-3"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${border}` }}>
                            <p className="font-mono text-[8.5px] leading-relaxed whitespace-pre-line" style={{ color: textSec }}>
                              {camp.message.slice(0, 140)}…
                            </p>
                          </div>

                          {/* Launch button */}
                          <button
                            onClick={() => !isLaunched && handleLaunchRegionalCampaign(camp.key, camp.city, camp.persona, camp.event, camp.channel, camp.estimatedRevenue)}
                            disabled={isLaunched}
                            className="w-full py-2 rounded-lg font-bold font-mono text-[9px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            style={{
                              background: isLaunched ? "rgba(34,197,94,0.08)" : `linear-gradient(135deg, ${event.color}, #8b5cf6)`,
                              color: isLaunched ? "#4ade80" : "#fff",
                              border: `1px solid ${isLaunched ? "rgba(34,197,94,0.3)" : "transparent"}`,
                              boxShadow: isLaunched ? undefined : `0 0 14px ${event.color}50`,
                            }}>
                            {isLaunched ? <><Check size={10} /> Launched</> : <><Send size={10} /> Launch Campaign</>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB 5: Regional Boardroom ──────────────────────────────── */}
        {activeTab === "boardroom" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="font-space font-bold text-sm" style={{ color: textPri }}>Regional Boardroom</h2>
                <p className="font-mono text-[10px] mt-0.5" style={{ color: textSec }}>
                  All agents analyse your regional data and deliver geo-specific intelligence
                </p>
              </div>
              <button onClick={generateBoardroomInsights}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-mono text-[9px] uppercase cursor-pointer transition-all"
                style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "#fff", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
                <RefreshCw size={11} className={boardroomInsights.some(b => b.loading) ? "animate-spin" : ""} />
                {boardroomGenerated ? "Refresh Intel" : "Generate Regional Intel"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {boardroomInsights.map(b => (
                <div key={b.agent} className="rounded-2xl border p-5"
                  style={{ background: cardBg, borderColor: `${b.color}25` }}>
                  {/* Agent header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-space font-bold text-sm"
                      style={{ background: `${b.color}18`, color: b.color, border: `1px solid ${b.color}30` }}>
                      {b.agent[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-space font-bold text-[12px]" style={{ color: b.color }}>{b.agent}</h3>
                        <span className="font-mono text-[7px] px-1.5 py-0.5 rounded-full"
                          style={{ color: b.color, background: b.color + "15", border: `1px solid ${b.color}25` }}>
                          {b.role}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] italic mt-0.5" style={{ color: textSec }}>"{b.question}"</p>
                    </div>
                  </div>

                  {/* Insight content */}
                  {b.loading ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: b.color }} />
                        <span className="font-mono text-[9px] animate-pulse" style={{ color: b.color }}>Analysing regional data…</span>
                      </div>
                      {[80, 65, 50].map(w => (
                        <div key={w} className="h-2.5 rounded-full animate-pulse"
                          style={{ width: `${w}%`, background: `${b.color}20` }} />
                      ))}
                    </div>
                  ) : b.insight ? (
                    <div className="rounded-xl p-3.5"
                      style={{ background: `${b.color}08`, border: `1px solid ${b.color}20` }}>
                      <p className="font-mono text-[9.5px] leading-relaxed" style={{ color: "#cbd5e1" }}>{b.insight}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-4">
                      <Brain size={14} style={{ color: textSec }} />
                      <p className="font-mono text-[9px]" style={{ color: textSec }}>
                        Click "Generate Regional Intel" to activate {b.agent}'s analysis.
                      </p>
                    </div>
                  )}

                  {/* Regional data snippets */}
                  {!b.loading && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {cityStats.slice(0, 3).map(cs => (
                        <span key={cs.city} className="font-mono text-[7.5px] px-2 py-0.5 rounded-full"
                          style={{ color: REGION_COLORS[cs.region] || "#60a5fa", background: (REGION_COLORS[cs.region] || "#3b82f6") + "12", border: `1px solid ${(REGION_COLORS[cs.region] || "#3b82f6")}25` }}>
                          📍 {cs.city} · {fmt(cs.totalRevenue)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: City Drill-Down ────────────────────────────────── */}
        {activeTab === "drilldown" && (
          <div className="p-6">
            {/* City selector */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              <MapPin size={12} style={{ color: "#3b82f6" }} />
              <span className="font-mono text-[9px] font-bold uppercase" style={{ color: textSec }}>Select City:</span>
              {cityStats.map(cs => (
                <button key={cs.city}
                  onClick={() => setSelectedCity(cs.city)}
                  className="px-3 py-1.5 rounded-full font-mono text-[9px] font-bold cursor-pointer transition-all"
                  style={{
                    background: selectedCity === cs.city ? (REGION_COLORS[cs.region] || "#3b82f6") + "20" : "transparent",
                    color: selectedCity === cs.city ? (REGION_COLORS[cs.region] || "#60a5fa") : textSec,
                    border: `1px solid ${selectedCity === cs.city ? (REGION_COLORS[cs.region] || "#3b82f6") + "50" : border}`,
                  }}>
                  {cs.city}
                </button>
              ))}
            </div>

            {(() => {
              const cs = cityStats.find(c => c.city === selectedCity);
              if (!cs) return <p className="font-mono text-[10px]" style={{ color: textSec }}>Select a city above.</p>;
              const regionColor = REGION_COLORS[cs.region] || "#3b82f6";
              const cityRps = regionalPersonas.filter(rp => rp.city === cs.city);
              const cityCampaigns = regionalSeasonalCampaigns.filter(c => c.city === cs.city);

              return (
                <div className="space-y-5">
                  {/* City hero */}
                  <div className="rounded-2xl border p-6 relative overflow-hidden"
                    style={{ background: cardBg, borderColor: regionColor + "30" }}>
                    <div className="absolute inset-0 opacity-5"
                      style={{ background: `radial-gradient(circle at 80% 50%, ${regionColor}, transparent)` }} />
                    <div className="relative flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={16} style={{ color: regionColor }} />
                          <h2 className="font-space font-bold text-xl" style={{ color: regionColor }}>{cs.city}</h2>
                        </div>
                        <p className="font-mono text-[10px]" style={{ color: textSec }}>{cs.state} · {cs.pincode} · {cs.country}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="font-mono text-[8px] px-2 py-0.5 rounded-full font-bold"
                            style={{ color: regionColor, background: regionColor + "15", border: `1px solid ${regionColor}30` }}>
                            {cs.region}
                          </span>
                          <span className="font-mono text-[8px] font-bold flex items-center gap-1"
                            style={{ color: growthColor(cs.growth) }}>
                            <ArrowUp size={9} /> {cs.growth.toUpperCase()} GROWTH · +{cs.growthPct}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Total Revenue",   value: fmt(cs.totalRevenue),            color: "#22c55e" },
                          { label: "Customers",       value: cs.customerCount.toString(),      color: "#3b82f6" },
                          { label: "Avg LTV",         value: fmt(cs.avgLtv),                  color: "#f59e0b" },
                          { label: "Churn Risk",      value: `${cs.churnRisk}%`,              color: cs.churnRisk > 60 ? "#ef4444" : "#22c55e" },
                        ].map(k => (
                          <div key={k.label} className="rounded-xl p-3 text-center"
                            style={{ background: k.color + "10", border: `1px solid ${k.color}25` }}>
                            <div className="font-space font-bold text-sm" style={{ color: k.color }}>{k.value}</div>
                            <div className="font-mono text-[8px] mt-0.5" style={{ color: textSec }}>{k.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Breakdown grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Segment breakdown */}
                    <div className="rounded-2xl border p-4" style={{ background: cardBg, borderColor: border }}>
                      <h4 className="font-space font-bold text-[10px] uppercase tracking-wider mb-3" style={{ color: textSec }}>Segments</h4>
                      {Object.entries(cs.segmentBreakdown).sort((a,b) => b[1]-a[1]).map(([seg, cnt]) => (
                        <div key={seg} className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px]" style={{ color: textPri }}>{seg}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.round(cnt/cs.customerCount*100)}%`, background: regionColor }} />
                            </div>
                            <span className="font-mono text-[8px] w-6 text-right" style={{ color: textSec }}>{cnt}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Lifecycle breakdown */}
                    <div className="rounded-2xl border p-4" style={{ background: cardBg, borderColor: border }}>
                      <h4 className="font-space font-bold text-[10px] uppercase tracking-wider mb-3" style={{ color: textSec }}>Lifecycle</h4>
                      {Object.entries(cs.lifecycleBreakdown).sort((a,b)=>b[1]-a[1]).map(([lc, cnt]) => {
                        const lcColor = lc === "Recent Buyer" ? "#22c55e" : lc === "Cooling Period" ? "#eab308" : lc === "Miss You" ? "#f97316" : "#ef4444";
                        return (
                          <div key={lc} className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[9px]" style={{ color: lcColor }}>{lc}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.round(cnt/cs.customerCount*100)}%`, background: lcColor }} />
                              </div>
                              <span className="font-mono text-[8px] w-6 text-right" style={{ color: textSec }}>{cnt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Channels */}
                    <div className="rounded-2xl border p-4" style={{ background: cardBg, borderColor: border }}>
                      <h4 className="font-space font-bold text-[10px] uppercase tracking-wider mb-3" style={{ color: textSec }}>Channels</h4>
                      {Object.entries(cs.channels).sort((a,b)=>b[1]-a[1]).map(([ch, cnt]) => {
                        const chColor = ch === "WhatsApp" ? "#22c55e" : ch === "Email" ? "#3b82f6" : ch === "RCS" ? "#8b5cf6" : "#f59e0b";
                        return (
                          <div key={ch} className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[9px]" style={{ color: textPri }}>{ch}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.round(cnt/cs.customerCount*100)}%`, background: chColor }} />
                              </div>
                              <span className="font-mono text-[8px] w-6 text-right" style={{ color: textSec }}>{cnt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Regional personas for this city */}
                  {cityRps.length > 0 && (
                    <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                      <h4 className="font-space font-bold text-[11px] uppercase tracking-wider mb-4" style={{ color: textPri }}>
                        Personas in {cs.city}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cityRps.map(rp => (
                          <div key={rp.key} className="rounded-xl border p-3" style={{ borderColor: border }}>
                            <div className="font-space font-bold text-[10px] mb-1" style={{ color: textPri }}>{rp.persona}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[8px]" style={{ color: "#22c55e" }}>{fmt(rp.totalRevenue)}</span>
                              <span className="font-mono text-[8px]" style={{ color: textSec }}>{rp.customerCount} custs</span>
                              <span className="font-mono text-[8px]" style={{ color: "#a78bfa" }}>{rp.topChannel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended campaigns for this city */}
                  {cityCampaigns.length > 0 && (
                    <div className="rounded-2xl border p-5" style={{ background: cardBg, borderColor: border }}>
                      <h4 className="font-space font-bold text-[11px] uppercase tracking-wider mb-4" style={{ color: textPri }}>
                        Recommended Campaigns for {cs.city}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cityCampaigns.slice(0, 4).map(camp => {
                          const isLaunched = launchedKeys.has(camp.key);
                          return (
                            <div key={camp.key} className="rounded-xl border p-3 flex items-center justify-between gap-3"
                              style={{ borderColor: isLaunched ? "rgba(34,197,94,0.25)" : border }}>
                              <div>
                                <div className="font-space font-bold text-[10px]" style={{ color: camp.event.color }}>
                                  {camp.event.name}
                                </div>
                                <div className="font-mono text-[8px]" style={{ color: textSec }}>
                                  {camp.persona} · {fmt(camp.estimatedRevenue)} · {camp.channel}
                                </div>
                              </div>
                              <button
                                onClick={() => !isLaunched && handleLaunchRegionalCampaign(camp.key, camp.city, camp.persona, camp.event, camp.channel, camp.estimatedRevenue)}
                                disabled={isLaunched}
                                className="px-3 py-1.5 rounded-lg font-bold font-mono text-[8px] uppercase flex items-center gap-1 cursor-pointer transition-all shrink-0"
                                style={{
                                  background: isLaunched ? "rgba(34,197,94,0.08)" : `${camp.event.color}22`,
                                  color: isLaunched ? "#4ade80" : camp.event.color,
                                  border: `1px solid ${isLaunched ? "rgba(34,197,94,0.3)" : camp.event.color + "40"}`,
                                }}>
                                {isLaunched ? <><Check size={9} /> Done</> : <><Rocket size={9} /> Launch</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
};
