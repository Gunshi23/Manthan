import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles, Activity, Compass, RefreshCw, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, Zap, Target, Brain,
  Shield, Rocket, BarChart3, Eye, Star, Users,
  Globe, Play, Cpu, MessageCircle, Mail, Phone, Layers, Radio
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";

/* ─── Types ───────────────────────────────────────────────────── */
interface Competitor {
  name: string;
  abbr: string;
  followerGrowth: string;
  engagementRate: string;
  campaignActivity: "High" | "Medium" | "Low";
  newProducts: number;
  promoStatus: string;
  threat: "green" | "yellow" | "red";
  threatLabel: string;
  marketShare: number;
  topChannel: string;
}

interface MarketSignal {
  id: string;
  title: string;
  desc: string;
  impact: number;
  confidence: number;
  agent: string;
  agentColor: string;
  type: "opportunity" | "threat" | "neutral";
  trend: "up" | "down" | "stable";
}

interface GapMetric {
  label: string;
  yours: number;
  industry: number;
  top: number;
  unit: string;
  recommendation: string;
}

interface TrendNode {
  id: string;
  label: string;
  score: number;
  growth: string;
  revenue: string;
  difficulty: "Low" | "Medium" | "High";
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface MarketOpportunity {
  id: string;
  title: string;
  revenue: number;
  confidence: number;
  roi: string;
  channel: string;
  urgency: "High" | "Medium" | "Low";
  description: string;
}

interface WorkflowStep {
  agent: string; icon: string; label: string; color: string;
  status: "idle" | "running" | "done";
}

const AGENT_COLORS: Record<string, string> = {
  Polaris: "#3B82F6", Luna: "#EC4899", Vega: "#8B5CF6", Nova: "#F59E0B", Atlas: "#22C55E"
};

const CHANNEL_ICONS: Record<string, React.FC<any>> = {
  WhatsApp: MessageCircle, Email: Mail, SMS: Phone, RCS: Layers
};

/* ─── Static Data Generators ───────────────────────────────────── */
function buildCompetitors(businessType: string): Competitor[] {
  const isFashion = /fashion|apparel|kurtis/i.test(businessType);
  const isBeauty = /beauty|skincare/i.test(businessType);

  if (isFashion) return [
    { name: "FashionHub",    abbr: "FH", followerGrowth: "+14.2%", engagementRate: "4.8%", campaignActivity: "High",   newProducts: 12, promoStatus: "Diwali Sale Active",  threat: "red",    threatLabel: "Threat",      marketShare: 28, topChannel: "Instagram" },
    { name: "StyleKart",     abbr: "SK", followerGrowth: "+8.7%",  engagementRate: "3.2%", campaignActivity: "Medium", newProducts: 6,  promoStatus: "Flash Sale Weekly",   threat: "yellow", threatLabel: "Monitor",     marketShare: 19, topChannel: "WhatsApp" },
    { name: "TrendWear",     abbr: "TW", followerGrowth: "+5.1%",  engagementRate: "2.9%", campaignActivity: "Low",    newProducts: 3,  promoStatus: "Clearance Running",   threat: "green",  threatLabel: "Opportunity", marketShare: 12, topChannel: "Email" },
    { name: "UrbanLooks",    abbr: "UL", followerGrowth: "+11.3%", engagementRate: "5.4%", campaignActivity: "High",   newProducts: 9,  promoStatus: "Influencer Collab",   threat: "red",    threatLabel: "Threat",      marketShare: 22, topChannel: "Reels" },
    { name: "Elite Closet",  abbr: "EC", followerGrowth: "+3.2%",  engagementRate: "1.8%", campaignActivity: "Low",    newProducts: 2,  promoStatus: "No Active Promo",     threat: "green",  threatLabel: "Opportunity", marketShare: 8,  topChannel: "SMS" },
  ];
  if (isBeauty) return [
    { name: "GlowCo",        abbr: "GC", followerGrowth: "+18.4%", engagementRate: "6.2%", campaignActivity: "High",   newProducts: 15, promoStatus: "BOGO Active",         threat: "red",    threatLabel: "Threat",      marketShare: 32, topChannel: "Instagram" },
    { name: "PureSkin",      abbr: "PS", followerGrowth: "+9.1%",  engagementRate: "4.1%", campaignActivity: "Medium", newProducts: 8,  promoStatus: "Loyalty Points Drive", threat: "yellow", threatLabel: "Monitor",     marketShare: 21, topChannel: "WhatsApp" },
    { name: "LuxeBeauty",    abbr: "LB", followerGrowth: "+6.3%",  engagementRate: "3.5%", campaignActivity: "Medium", newProducts: 5,  promoStatus: "Free Sample Push",    threat: "yellow", threatLabel: "Monitor",     marketShare: 14, topChannel: "Email" },
    { name: "NatureCare",    abbr: "NC", followerGrowth: "+4.2%",  engagementRate: "2.4%", campaignActivity: "Low",    newProducts: 3,  promoStatus: "No Active Promo",     threat: "green",  threatLabel: "Opportunity", marketShare: 9,  topChannel: "SMS" },
    { name: "BeautyBliss",   abbr: "BB", followerGrowth: "+12.7%", engagementRate: "5.1%", campaignActivity: "High",   newProducts: 11, promoStatus: "Influencer Series",   threat: "red",    threatLabel: "Threat",      marketShare: 24, topChannel: "Reels" },
  ];
  return [
    { name: "Competitor A",  abbr: "CA", followerGrowth: "+12.0%", engagementRate: "4.5%", campaignActivity: "High",   newProducts: 8,  promoStatus: "Flash Sale Active",   threat: "red",    threatLabel: "Threat",      marketShare: 25, topChannel: "WhatsApp" },
    { name: "Competitor B",  abbr: "CB", followerGrowth: "+7.3%",  engagementRate: "3.1%", campaignActivity: "Medium", newProducts: 4,  promoStatus: "Regular Promo",       threat: "yellow", threatLabel: "Monitor",     marketShare: 17, topChannel: "Email" },
    { name: "Competitor C",  abbr: "CC", followerGrowth: "+4.8%",  engagementRate: "2.2%", campaignActivity: "Low",    newProducts: 2,  promoStatus: "No Active Promo",     threat: "green",  threatLabel: "Opportunity", marketShare: 10, topChannel: "SMS" },
    { name: "Competitor D",  abbr: "CD", followerGrowth: "+9.6%",  engagementRate: "3.9%", campaignActivity: "Medium", newProducts: 6,  promoStatus: "Loyalty Program",     threat: "yellow", threatLabel: "Monitor",     marketShare: 19, topChannel: "WhatsApp" },
    { name: "Competitor E",  abbr: "CE", followerGrowth: "+2.1%",  engagementRate: "1.4%", campaignActivity: "Low",    newProducts: 1,  promoStatus: "No Active Promo",     threat: "green",  threatLabel: "Opportunity", marketShare: 6,  topChannel: "SMS" },
  ];
}

function buildSignals(businessType: string): MarketSignal[] {
  const isFashion = /fashion|apparel|kurtis/i.test(businessType);
  return [
    { id: "s1", title: `${isFashion ? "FashionHub" : "Top Competitor"} launched a Diwali Sale campaign`, desc: "Aggressive 30% discount with WhatsApp blast to 5,000+ subscribers. Engagement up 42% in 24 hours.", impact: 91, confidence: 88, agent: "Polaris", agentColor: AGENT_COLORS.Polaris, type: "threat",      trend: "up" },
    { id: "s2", title: "WhatsApp campaign engagement up 24% industry-wide",                               desc: "Brands using personalized WhatsApp messages with product images see 2.4x higher CTR vs plain text.", impact: 84, confidence: 92, agent: "Vega",    agentColor: AGENT_COLORS.Vega,    type: "opportunity", trend: "up" },
    { id: "s3", title: "Fashion Reels outperform static posts by 2.3x",                                   desc: "Short-form video content driving 2.3x higher reach in fashion vertical. Avg view duration: 18s.", impact: 76, confidence: 85, agent: "Polaris", agentColor: AGENT_COLORS.Polaris, type: "opportunity", trend: "up" },
    { id: "s4", title: "Average checkout conversion dropped 12% this month",                               desc: "Cart abandonment rate increased across mid-market fashion brands. Recover with urgency messaging.", impact: 88, confidence: 90, agent: "Luna",    agentColor: AGENT_COLORS.Luna,    type: "threat",      trend: "down" },
    { id: "s5", title: "Limited-time offers driving 38% higher conversion rates",                         desc: "Customers respond 38% better to countdown-based urgency offers vs static discount codes.", impact: 79, confidence: 87, agent: "Nova",    agentColor: AGENT_COLORS.Nova,    type: "opportunity", trend: "up" },
    { id: "s6", title: "Influencer micro-campaigns showing ROI of 5.2x in fashion",                       desc: "Nano and micro-influencers (10K–100K followers) generating highest ROI in fashion category.", impact: 71, confidence: 82, agent: "Vega",    agentColor: AGENT_COLORS.Vega,    type: "opportunity", trend: "up" },
  ];
}



function buildOpportunities(businessType: string): MarketOpportunity[] {
  const isFashion = /fashion|apparel|kurtis/i.test(businessType);
  return [
    { id: "o1", title: isFashion ? "Recover Dormant Kurti Buyers" : "Recover Dormant Buyers",     revenue: 22500, confidence: 91, roi: "4.8x", channel: "WhatsApp", urgency: "High",   description: "34 high-value customers inactive for 45+ days with ₹22,500 in recoverable revenue." },
    { id: "o2", title: isFashion ? "Launch Festive Ethnic Collection" : "Launch VIP Collection",  revenue: 41200, confidence: 87, roi: "5.2x", channel: "WhatsApp", urgency: "High",   description: "Festival season approaching. Pre-launch campaign to loyalist segment drives 5.2x ROI." },
    { id: "o3", title: isFashion ? "Diwali Counter Campaign" : "Festival Campaign",               revenue: 58700, confidence: 84, roi: "6.1x", channel: "Email",    urgency: "High",   description: "Counter competitor Diwali campaigns with superior personalization and exclusive offers." },
    { id: "o4", title: "Urgent Churn Recovery Mission",                                            revenue: 15800, confidence: 93, roi: "3.9x", channel: "SMS",      urgency: "Medium", description: "18 slipping-away customers about to churn. Immediate WhatsApp outreach can recover them." },
  ];
}

function buildTrendNodes(): TrendNode[] {
  return [
    { id: "t1", label: "Short Video Growth",      score: 94, growth: "+34% YoY",   revenue: "₹1.2Cr potential", difficulty: "Medium", color: "#3B82F6", x: 380, y: 180, vx: 0.3,  vy: -0.2 },
    { id: "t2", label: "Festival Buying Surge",   score: 89, growth: "+28% YoY",   revenue: "₹2.8Cr potential", difficulty: "Low",    color: "#F59E0B", x: 220, y: 280, vx: -0.2, vy: 0.3  },
    { id: "t3", label: "WhatsApp Commerce",        score: 92, growth: "+41% YoY",   revenue: "₹3.4Cr potential", difficulty: "Low",    color: "#22C55E", x: 480, y: 320, vx: 0.2,  vy: 0.2  },
    { id: "t4", label: "Influencer Marketing",     score: 78, growth: "+22% YoY",   revenue: "₹0.9Cr potential", difficulty: "Medium", color: "#EC4899", x: 160, y: 140, vx: 0.15, vy: 0.25 },
    { id: "t5", label: "UGC Content",              score: 71, growth: "+19% YoY",   revenue: "₹0.6Cr potential", difficulty: "Low",    color: "#8B5CF6", x: 560, y: 160, vx: -0.3, vy: 0.1  },
    { id: "t6", label: "Limited-Time Offers",      score: 86, growth: "+31% YoY",   revenue: "₹1.8Cr potential", difficulty: "Low",    color: "#EF4444", x: 320, y: 360, vx: 0.1,  vy: -0.3 },
    { id: "t7", label: "RCS Rich Cards",            score: 67, growth: "+58% YoY",   revenue: "₹0.7Cr potential", difficulty: "High",   color: "#06B6D4", x: 440, y: 100, vx: -0.2, vy: -0.2 },
  ];
}

const COMPETITOR_CAMPAIGNS = [
  { id: "cc1", brand: "FashionHub",   name: "Diwali Mega Sale",          type: "Festival",     offer: "40% off sitewide",           objective: "Acquire + Retain",  channel: "WhatsApp + Instagram" },
  { id: "cc2", brand: "StyleKart",    name: "Flash Friday Blitz",        type: "Urgency",      offer: "24-hr countdown discount",   objective: "Conversion Boost",  channel: "WhatsApp + SMS" },
  { id: "cc3", brand: "TrendWear",    name: "New Arrivals Reels Series", type: "Content",      offer: "No discount - Organic UGC",  objective: "Brand Awareness",   channel: "Instagram Reels" },
  { id: "cc4", brand: "UrbanLooks",   name: "Influencer VIP Drop",       type: "Influencer",   offer: "Exclusive early access",     objective: "FOMO + VIP LTV",    channel: "Instagram + WhatsApp" },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════════════════════════════
   COMPETITOR INTELLIGENCE PAGE
══════════════════════════════════════════════════════════════ */
export const CompetitorIntelligence: React.FC = () => {
  const { businessType, startMission, customers, campaigns, orders, theme } = useOrbit();
  const isLight = theme === "executive";
  const [selectedAgent, setSelectedAgent] = useState<"Polaris" | "Vega" | "Nova" | "Atlas" | "Luna" | null>(null);

  /* ── Data ── */
  const [competitors, setCompetitors] = useState<Competitor[]>(() => buildCompetitors(businessType));
  const [signals, setSignals] = useState<MarketSignal[]>(() => buildSignals(businessType));
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>(() => buildOpportunities(businessType));
  const [trendNodes, setTrendNodes] = useState<TrendNode[]>(buildTrendNodes);

  /* ── Sync trend nodes ref with state for canvas animation ── */
  const nodesRef  = useRef<TrendNode[]>(trendNodes);
  useEffect(() => {
    nodesRef.current = trendNodes;
  }, [trendNodes]);

  /* ── Fetch Live Competitor Data ── */
  useEffect(() => {
    async function fetchIntel() {
      try {
        const watchRes = await fetch("/api/competitor-intel/watchlist");
        if (watchRes.ok) {
          const watchData = await watchRes.json();
          if (watchData && watchData.length > 0) setCompetitors(watchData);
        }
      } catch (err) {
        console.warn("Failed to fetch competitor watchlist:", err);
      }

      try {
        const signalsRes = await fetch("/api/competitor-intel/signals");
        if (signalsRes.ok) {
          const signalsData = await signalsRes.json();
          if (signalsData && signalsData.length > 0) setSignals(signalsData);
        }
      } catch (err) {
        console.warn("Failed to fetch market signals:", err);
      }

      try {
        const trendsRes = await fetch("/api/competitor-intel/trends");
        if (trendsRes.ok) {
          const trendsData = await trendsRes.json();
          if (trendsData && trendsData.length > 0) setTrendNodes(trendsData);
        }
      } catch (err) {
        console.warn("Failed to fetch trends:", err);
      }

      try {
        const oppsRes = await fetch("/api/opportunities");
        if (oppsRes.ok) {
          const oppsPayload = await oppsRes.json();
          const rawOpps = oppsPayload.opportunities || [];
          if (rawOpps.length > 0) {
            const mapped: MarketOpportunity[] = rawOpps.map((o: any) => {
              const hash = o.id ? o.id.split("_")[1] : "";
              const idx = hash ? parseInt(hash, 10) : Math.floor(Math.random() * 100);
              
              const action = o.recommendedAction || "";
              let channel = "WhatsApp";
              if (action.toLowerCase().includes("email")) channel = "Email";
              else if (action.toLowerCase().includes("sms")) channel = "SMS";
              else if (action.toLowerCase().includes("rcs")) channel = "RCS";
              else channel = ["WhatsApp", "Email", "SMS", "RCS"][idx % 4];

              const confidence = o.confidence || 85;
              const baseRoi = 3.2 + (confidence > 80 ? (confidence - 80) * 0.15 : 0);
              const factor = isNaN(idx) ? 0 : (idx % 5) * 0.2;
              const roi = `${(baseRoi + factor).toFixed(1)}x`;

              const score = o.priorityScore || 75;
              const urgency = score >= 85 ? "High" : score >= 60 ? "Medium" : "Low";

              return {
                id: o.id,
                title: o.title,
                revenue: o.potentialRevenue || o.revenue || 15000,
                confidence,
                roi,
                channel,
                urgency,
                description: o.description || o.reasoning || ""
              };
            });
            setOpportunities(mapped);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch opportunities:", err);
      }
    }

    fetchIntel();
  }, [businessType]);

  /* ── Competitive Gap Analysis calculated dynamically ── */
  const gapMetrics = useMemo<GapMetric[]>(() => {
    const completedCampaigns = campaigns.filter(c => c.sentCount > 0);
    const totalSent = completedCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
    const totalClicked = completedCampaigns.reduce((sum, c) => sum + c.clickedCount, 0);
    const yourCTR = totalSent > 0 ? parseFloat(((totalClicked / totalSent) * 100).toFixed(1)) : 12.0;

    const yourEngagement = totalSent > 0 ? parseFloat(((totalClicked / totalSent) * 25).toFixed(1)) : 3.2;

    const now = Date.now();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    const recentOrders = orders.filter(o => {
      const t = new Date(o.date).getTime();
      return now - t <= fifteenDaysMs;
    });
    const priorOrders = orders.filter(o => {
      const t = new Date(o.date).getTime();
      return now - t > fifteenDaysMs && now - t <= fifteenDaysMs * 2;
    });
    const recentRev = recentOrders.reduce((sum, o) => sum + o.amount, 0);
    const priorRev = priorOrders.reduce((sum, o) => sum + o.amount, 0);
    const growthPct = priorRev > 0 ? ((recentRev - priorRev) / priorRev) * 100 : 18.2;
    const yourRevenueGrowth = parseFloat(Math.min(30, Math.max(5, growthPct)).toFixed(1));

    const repeatCusts = customers.filter(c => c.purchaseCount > 1).length;
    const totalCusts = customers.length;
    const yourRepeatRate = totalCusts > 0 ? parseFloat(((repeatCusts / totalCusts) * 100).toFixed(1)) : 34.0;

    const totalOpened = completedCampaigns.reduce((sum, c) => sum + c.openedCount, 0);
    const yourOpenRate = totalSent > 0 ? parseFloat(((totalOpened / totalSent) * 100).toFixed(1)) : 38.0;

    const totalPurchases = completedCampaigns.reduce((sum, c) => sum + c.purchaseCount, 0);
    const yourConversionRate = totalClicked > 0 ? parseFloat(((totalPurchases / totalClicked) * 100).toFixed(1)) : 4.2;

    return [
      { label: "CTR",              yours: yourCTR,            industry: 18.0, top: 24.0, unit: "%", recommendation: "Improve WhatsApp campaigns with personalized product links" },
      { label: "Engagement Rate",  yours: yourEngagement,     industry: 4.8,  top: 6.4,  unit: "%", recommendation: "Add UGC content and interactive polls to boost engagement" },
      { label: "Revenue Growth",   yours: yourRevenueGrowth,  industry: 24.0, top: 38.0, unit: "%", recommendation: "Launch a loyalty rewards program targeting repeat buyers" },
      { label: "Repeat Customers", yours: yourRepeatRate,      industry: 42.0, top: 61.0, unit: "%", recommendation: "Deploy win-back automation for inactive VIP customers" },
      { label: "Open Rate",        yours: yourOpenRate,       industry: 52.0, top: 72.0, unit: "%", recommendation: "Optimize subject lines with AI — avoid generic text" },
      { label: "Conversion Rate",  yours: yourConversionRate, industry: 6.1,  top: 9.8,  unit: "%", recommendation: "Reduce friction at checkout with WhatsApp direct-to-cart links" },
    ];
  }, [campaigns, customers, orders]);

  /* ── Radar animation ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  /* ── AI Report ── */
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  /* ── Campaign Reverse Engineering ── */
  const [selectedCampaign, setSelectedCampaign] = useState(COMPETITOR_CAMPAIGNS[0]);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseData, setReverseData] = useState<any>(null);

  /* ── Autonomous Response ── */
  const [responseTarget, setResponseTarget] = useState<MarketOpportunity | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { agent: "Polaris", icon: "👁", label: "Analyzing audience...",        color: AGENT_COLORS.Polaris, status: "idle" },
    { agent: "Luna",    icon: "🌙", label: "Mapping opportunities...",     color: AGENT_COLORS.Luna,    status: "idle" },
    { agent: "Vega",    icon: "⭐", label: "Forecasting revenue...",       color: AGENT_COLORS.Vega,    status: "idle" },
    { agent: "Nova",    icon: "✨", label: "Generating campaign...",       color: AGENT_COLORS.Nova,    status: "idle" },
    { agent: "Atlas",   icon: "🚀", label: "Planning deployment...",       color: AGENT_COLORS.Atlas,   status: "idle" },
  ]);
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowDone, setWorkflowDone]       = useState(false);

  /* ── Trend Radar animation ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let tick = 0;

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Deep background
      ctx.fillStyle = isLight ? "#FFFFFF" : "#03040c";
      ctx.fillRect(0, 0, W, H);

      // Grid rings
      [0.25, 0.5, 0.75, 1.0].forEach(r => {
        ctx.strokeStyle = isLight ? `rgba(226, 232, 240, ${0.4 + r * 0.3})` : `rgba(59,130,246,${0.06 + r * 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r * Math.min(W, H) * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      });
      // Crosshairs
      ctx.strokeStyle = isLight ? "rgba(226, 232, 240, 0.5)" : "rgba(59,130,246,0.08)";
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      // Rotating sweep line
      const sweep = (tick * 0.015) % (Math.PI * 2);
      ctx.strokeStyle = isLight ? "rgba(37, 99, 235, 0.15)" : "rgba(59,130,246,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2);
      ctx.lineTo(W / 2 + Math.cos(sweep) * Math.min(W, H) * 0.45, H / 2 + Math.sin(sweep) * Math.min(W, H) * 0.45);
      ctx.stroke();

      // Update + draw trend nodes
      const updated = nodesRef.current.map(node => {
        let nx = node.x + node.vx;
        let ny = node.y + node.vy;
        const maxR = Math.min(W, H) * 0.42;
        const dx = nx - W / 2, dy = ny - H / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxR) { nx = W / 2 + dx / dist * maxR * 0.95; ny = H / 2 + dy / dist * maxR * 0.95; }
        if (nx < 30 || nx > W - 30) node.vx *= -1;
        if (ny < 30 || ny > H - 30) node.vy *= -1;

        // Glow
        const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.score / 5 + 10);
        glow.addColorStop(0, node.color + (isLight ? "15" : "40"));
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nx, ny, node.score / 5 + 12, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(tick * 0.05 + node.score);
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(nx, ny, node.score / 14 + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.font = "bold 8px monospace";
        ctx.fillStyle = isLight ? "#475569" : "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(node.label.split(" ")[0].toUpperCase(), nx, ny - node.score / 14 - 8);

        return { ...node, x: nx, y: ny };
      });
      nodesRef.current = updated;
      setTrendNodes(updated);

      tick++;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isLight]);

  /* ── AI Competitor Report ── */
  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/competitor-intel/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType })
      });
      if (res.ok) {
        const parsed = await res.json();
        setReport(parsed);
      } else {
        setReport(buildFallbackReport());
      }
    } catch (err) {
      console.warn("Failed to generate report via backend API:", err);
      setReport(buildFallbackReport());
    } finally {
      setReportLoading(false);
    }
  };

  const buildFallbackReport = () => ({
    summary: `Your competitors in the ${businessType} space are aggressively deploying WhatsApp and Instagram Reels campaigns with 30-40% discounts. Brands using interactive rich cards are generating 22% higher engagement than your current static campaigns.`,
    topThreat: "FashionHub's Diwali mega-sale with WhatsApp blasts to 5,000+ subscribers",
    missedRevenue: 58000,
    competitorStrategies: ["Flash-sale countdown urgency via WhatsApp", "Influencer-led UGC campaigns on Instagram Reels", "Loyalty points programs driving repeat purchase frequency"],
    marketOpportunities: ["WhatsApp Commerce with direct-to-cart links", "Festival campaign with personalized product recommendations", "Micro-influencer partnership (10K-50K tier)"],
    recommendedActions: [
      { action: "Launch personalized WhatsApp campaign targeting Loyalists", priority: "High", expectedRevenue: 28000 },
      { action: "Create Diwali counter-campaign with 25% exclusive offer",   priority: "High", expectedRevenue: 22000 },
      { action: "Activate Instagram Reels with UGC content strategy",        priority: "Medium", expectedRevenue: 12000 },
    ],
    revenueImpact: "Estimated ₹58,000 in revenue being left on the table due to competitor dominance on WhatsApp and Instagram."
  });

  /* ── Campaign Reverse Engineering ── */
  const handleReverseEngineer = async (campaign: typeof COMPETITOR_CAMPAIGNS[0]) => {
    setSelectedCampaign(campaign);
    setReverseLoading(true);
    setReverseData(null);
    try {
      const res = await fetch("/api/competitor-intel/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, businessType })
      });
      if (res.ok) {
        const parsed = await res.json();
        setReverseData(parsed);
      } else {
        setReverseData(buildFallbackReverse(campaign));
      }
    } catch (err) {
      console.warn("Failed to reverse engineer campaign via backend API:", err);
      setReverseData(buildFallbackReverse(campaign));
    } finally {
      setReverseLoading(false);
    }
  };

  const buildFallbackReverse = (c: typeof COMPETITOR_CAMPAIGNS[0]) => ({
    targetAudience: `Price-sensitive repeat buyers and new customer acquisition — primarily female 22-38 segment engaging with ${c.channel}`,
    likelyObjective: c.type === "Festival" ? "Drive volume through urgency + FOMO during high-intent buying window" : "Boost conversion rate with direct discount incentive and social proof",
    strengths: ["High discount creates immediate FOMO", "Multi-channel reach maximizes visibility", "Festival timing aligns with peak buying intent"],
    weaknesses: ["Trains customers to wait for discounts", "Low margin impact from heavy discounting", "No personalization — same offer to all segments"],
    counterStrategy: `Launch a personalized WhatsApp campaign targeting your ${businessType} loyalists with an exclusive early-access offer (no heavy discount). Use Vega's prediction model to identify the top 20% of buyers and send curated product drops 48 hours before competitor sale ends.`,
  });

  /* ── Autonomous Response Workflow ── */
  const handleLaunchResponse = async (opp: MarketOpportunity) => {
    if (workflowRunning) return;
    setResponseTarget(opp);
    setWorkflowRunning(true);
    setWorkflowDone(false);
    setWorkflowSteps(s => s.map(st => ({ ...st, status: "idle" })));

    for (let i = 0; i < workflowSteps.length; i++) {
      setWorkflowSteps(s => s.map((st, idx) => idx === i ? { ...st, status: "running" } : st));
      await sleep(900 + Math.random() * 400);
      setWorkflowSteps(s => s.map((st, idx) => idx === i ? { ...st, status: "done" } : st));
    }

    startMission(opp.title);
    setWorkflowDone(true);
    setWorkflowRunning(false);
  };

  /* ── Top threat + opportunity for sticky panel ── */
  const topThreat = competitors.find(c => c.threat === "red");
  const topOpportunity = opportunities[0];



  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative ${isLight ? "bg-[#F8FAFC] text-[#0F172A]" : "bg-[#050816] text-white"}`}>
      <div className={`pointer-events-none absolute inset-0 space-grid z-0 ${isLight ? "opacity-5" : "opacity-25"}`} />
      <div className={`pointer-events-none absolute inset-0 bg-orbit-glow-blue z-0 ${isLight ? "opacity-5" : "opacity-10"}`} />

      {/* Header */}
      <div className={`shrink-0 px-6 pt-4 border-b relative z-10 ${isLight ? "bg-white border-[#E2E8F0]" : "bg-gray-950/30 border-gray-800/50"}`}>
        <PageHeaderHUD
          title="Competitor Intelligence"
          subtitle="AI-POWERED COMPETITIVE ANALYSIS & MARKET SIGNAL CENTER"
          onSelectAgent={setSelectedAgent}
          actions={
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[9px] animate-pulse ${
                isLight
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}>
                <Radio size={9} />
                LIVE INTEL
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[9px] ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-600"
                  : "bg-gray-900/40 border border-gray-800 text-gray-500"
              }`}>
                <Users size={9} className="text-blue-400" />
                {customers.length} MONITORED
              </div>
            </div>
          }
        />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

          {/* ══ SECTION 9 — STICKY EXECUTIVE PANEL (top of page) ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 p-5 rounded-2xl border relative overflow-hidden ${
              isLight ? "border-slate-200 bg-white shadow-sm" : "border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5"
            }`}>
              <div className="absolute top-0 right-0 w-48 h-24 bg-gradient-to-bl from-purple-600/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className={isLight ? "text-purple-600" : "text-purple-400"} />
                <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>What Should I Do Next?</span>
                <span className="ml-auto font-mono text-[8px] text-gray-500">orbit.ai Executive Intelligence</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "⚠️ Top Threat",        value: topThreat?.name + "'s aggressive Diwali campaign", color: isLight ? "text-rose-700 font-bold" : "text-red-400" },
                  { label: "🎯 Top Opportunity",    value: topOpportunity.title,                             color: isLight ? "text-emerald-700 font-bold" : "text-green-400" },
                  { label: "💰 Revenue Potential",  value: `₹${topOpportunity.revenue.toLocaleString()}`,    color: isLight ? "text-amber-700 font-bold" : "text-yellow-400" },
                  { label: "📊 Confidence",         value: `${topOpportunity.confidence}%`,                  color: isLight ? "text-blue-750 font-bold" : "text-blue-400" },
                ].map(item => (
                  <div key={item.label} className={`p-3 rounded-xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-gray-950/50 border-gray-800/40"}`}>
                    <p className="font-mono text-[8px] text-gray-500 leading-tight">{item.label}</p>
                    <p className={`font-space text-[10px] font-bold mt-1 leading-tight ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`p-5 rounded-2xl border flex flex-col gap-3 justify-between ${isLight ? "border-emerald-200 bg-emerald-50" : "border-green-500/20 bg-green-500/5"}`}>
              <div>
                <p className="font-mono text-[8px] text-gray-500 uppercase tracking-wider mb-1">Recommended Action</p>
                <p className={`font-space text-xs font-bold ${isLight ? "text-emerald-700" : "text-green-400"}`}>Launch VIP WhatsApp Counter Campaign</p>
                <p className="font-mono text-[8px] text-gray-500 mt-1 leading-relaxed">Target Loyalists before competitor Diwali sale ends</p>
              </div>
              <button onClick={() => handleLaunchResponse(topOpportunity)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 text-white font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-green-500/20">
                <Rocket size={11} />
                Launch Mission
              </button>
            </div>
          </div>

          {/* ══ SECTION 1 — COMPETITOR WATCHLIST ══ */}
          <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <Eye size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Competitor Watchlist</h2>
              <span className="ml-auto font-mono text-[8px] text-gray-600">{competitors.length} BRANDS MONITORED</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-[9px]">
                <thead>
                  <tr className={`border-b ${isLight ? "border-[#E2E8F0]" : "border-gray-800/60"}`}>
                    {["Brand","Follower Growth","Engagement","Campaign Activity","New Products","Promo Status","Top Channel","Threat Level"].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-gray-500 uppercase tracking-wider font-semibold text-[8px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitors.map(c => (
                    <tr key={c.name} className={`border-b transition-colors cursor-pointer ${isLight ? "border-slate-100 hover:bg-slate-50/80" : "border-gray-900/40 hover:bg-gray-900/20"}`}>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-bold ${isLight ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]" : "bg-gray-800 text-white"}`}>{c.abbr}</div>
                          <span className={`font-semibold ${isLight ? "text-[#0F172A]" : "text-white"}`}>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={c.followerGrowth.startsWith("+") ? (isLight ? "text-emerald-600 font-bold" : "text-green-400 font-bold") : (isLight ? "text-rose-600 font-semibold" : "text-red-400")}>
                          {c.followerGrowth.startsWith("+") ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                          {c.followerGrowth}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2 ${isLight ? "text-slate-700" : "text-gray-300"}`}>{c.engagementRate}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-1.5 py-0.5 rounded-md font-bold text-[7px] ${
                          c.campaignActivity === "High" ? (isLight ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-red-500/20 text-red-400") :
                          c.campaignActivity === "Medium" ? (isLight ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-yellow-400/20 text-yellow-400") : 
                          (isLight ? "bg-slate-50 text-slate-600 border border-slate-200" : "bg-gray-800 text-gray-500")}`}>
                          {c.campaignActivity}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2 ${isLight ? "text-slate-700" : "text-gray-300"}`}>{c.newProducts} launches</td>
                      <td className={`py-2.5 px-2 ${isLight ? "text-slate-500" : "text-gray-400"}`}>{c.promoStatus}</td>
                      <td className={`py-2.5 px-2 ${isLight ? "text-slate-700" : "text-gray-300"}`}>{c.topChannel}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[7px] border ${
                          c.threat === "red" ? (isLight ? "border-rose-200 bg-rose-50 text-rose-700" : "border-red-500/40 bg-red-500/10 text-red-400") :
                          c.threat === "yellow" ? (isLight ? "border-amber-200 bg-amber-50 text-amber-700" : "border-yellow-400/40 bg-yellow-400/10 text-yellow-400") :
                          (isLight ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-green-500/40 bg-green-500/10 text-green-400")}`}>
                          {c.threat === "red" ? "🔴" : c.threat === "yellow" ? "🟡" : "🟢"} {c.threatLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ SECTION 2 — LIVE MARKET SIGNALS ══ */}
          <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-500 to-cyan-600 flex items-center justify-center">
                <Activity size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Live Market Signals</h2>
              <div className={`ml-auto flex items-center gap-1.5 font-mono text-[8px] ${isLight ? "text-emerald-600" : "text-green-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? "bg-emerald-500" : "bg-green-400"}`} />
                REAL-TIME
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {signals.map(sig => (
                <div key={sig.id} className={`p-4 rounded-xl border transition-all ${
                  sig.type === "threat" ? (isLight ? "border-rose-200 bg-rose-50/30" : "border-red-500/20 bg-red-500/5") :
                  sig.type === "opportunity" ? (isLight ? "border-emerald-200 bg-emerald-50/30" : "border-green-500/20 bg-green-500/5") :
                  (isLight ? "border-slate-200 bg-slate-50/30" : "border-gray-800/40 bg-gray-900/10")
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono font-bold border ${
                      sig.type === "threat" ? (isLight ? "border-rose-200 text-rose-700 bg-rose-50" : "border-red-500/30 text-red-400") :
                      sig.type === "opportunity" ? (isLight ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-green-500/30 text-green-400") :
                      (isLight ? "border-slate-200 text-slate-600 bg-slate-50" : "border-gray-700 text-gray-500")
                    }`}>
                      {sig.type === "threat" ? "⚠ THREAT" : sig.type === "opportunity" ? "✦ OPPORTUNITY" : "● NEUTRAL"}
                    </span>
                    <span className={sig.trend === "up" ? (isLight ? "text-emerald-600" : "text-green-400") : sig.trend === "down" ? (isLight ? "text-rose-600" : "text-red-400") : "text-gray-500"}>
                      {sig.trend === "up" ? <TrendingUp size={10} /> : sig.trend === "down" ? <TrendingDown size={10} /> : null}
                    </span>
                  </div>
                  <p className={`font-space text-[10px] font-bold leading-snug mb-1.5 ${isLight ? "text-[#0F172A]" : "text-white"}`}>{sig.title}</p>
                  <p className={`font-mono text-[8px] leading-relaxed mb-3 ${isLight ? "text-slate-500" : "text-gray-500"}`}>{sig.desc}</p>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className={`font-mono text-[7px] ${isLight ? "text-slate-500" : "text-gray-650"}`}>Impact</p>
                      <p className={`font-mono text-[9px] font-bold ${isLight ? "text-[#0F172A]" : "text-white"}`}>{sig.impact}%</p>
                    </div>
                    <div>
                      <p className={`font-mono text-[7px] ${isLight ? "text-slate-500" : "text-gray-650"}`}>Confidence</p>
                      <p className={`font-mono text-[9px] font-bold ${isLight ? "text-[#0F172A]" : "text-white"}`}>{sig.confidence}%</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-4 h-4 rounded-md flex items-center justify-center text-[8px]"
                        style={{ backgroundColor: sig.agentColor + "25", border: `1px solid ${sig.agentColor}40` }}>
                        {sig.agent === "Polaris" ? "👁" : sig.agent === "Luna" ? "🌙" : sig.agent === "Vega" ? "⭐" : sig.agent === "Nova" ? "✨" : "🚀"}
                      </div>
                      <span className="font-mono text-[7px]" style={{ color: isLight ? (sig.agent === "Nova" ? "#D97706" : sig.agentColor) : sig.agentColor }}>{sig.agent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ SECTION 3 — COMPETITIVE GAP ANALYSIS ══ */}
          <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "border border-slate-200 bg-white shadow-sm" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BarChart3 size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Competitive Gap Analysis</h2>
            </div>
            <div className="space-y-3">
              {gapMetrics.map(m => {
                const gap = m.yours - m.industry;
                const maxVal = Math.max(m.yours, m.industry, m.top) * 1.1;
                return (
                  <div key={m.label} className={`p-3 rounded-xl border ${isLight ? "border-slate-200 bg-slate-50/50" : "border-gray-800/30 bg-gray-950/30"}`}>
                    <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-center">
                      <span className={`font-mono text-[9px] font-semibold ${isLight ? "text-slate-800" : "text-gray-400"}`}>{m.label}</span>
                      <div className="space-y-1.5">
                        {[
                          { label: "Your Brand", val: m.yours, color: "#8B5CF6" },
                          { label: "Industry Avg", val: m.industry, color: "#4B5563" },
                          { label: "Top Competitor", val: m.top, color: "#EF4444" },
                        ].map(bar => (
                          <div key={bar.label} className="flex items-center gap-2">
                            <span className="font-mono text-[7px] text-gray-600 w-20">{bar.label}</span>
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-gray-900"}`}>
                              <div className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${(bar.val / maxVal) * 100}%`, backgroundColor: bar.color }} />
                            </div>
                            <span className="font-mono text-[8px] font-bold w-10 text-right" style={{ color: bar.color }}>
                              {bar.val}{m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className={`font-mono text-xs font-bold ${gap < 0 ? (isLight ? "text-rose-600" : "text-red-400") : (isLight ? "text-emerald-600" : "text-green-400")}`}>
                          {gap > 0 ? "+" : ""}{gap.toFixed(1)}{m.unit}
                        </span>
                        <p className="font-mono text-[7px] text-gray-600 mt-0.5">vs Industry</p>
                      </div>
                    </div>
                    <p className={`font-mono text-[8px] mt-2 pl-0 flex items-center gap-1.5 ${isLight ? "text-blue-600" : "text-blue-400"}`}>
                      <Sparkles size={8} />
                      AI: {m.recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══ SECTIONS 4 + 6 — TREND RADAR + CAMPAIGN REVERSE ENGINEERING ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* SECTION 4 — Trend Radar */}
            <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Compass size={12} className="text-white" />
                </div>
                <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Trend Radar</h2>
              </div>
              <canvas ref={canvasRef} width={640} height={320} className="w-full rounded-xl border border-gray-900/60" style={{ imageRendering: "pixelated" }} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {trendNodes.map(node => (
                  <div key={node.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-950/40 border border-gray-800/30">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                    <div className="min-w-0">
                      <p className={`font-mono text-[8px] truncate ${isLight ? "text-[#0F172A]" : "text-white"}`}>{node.label}</p>
                      <p className="font-mono text-[7px] text-gray-600">{node.score}/100 · {node.growth}</p>
                    </div>
                    <span className={`ml-auto font-mono text-[7px] px-1.5 py-0.5 rounded-md border shrink-0 ${
                      node.difficulty === "Low" ? "border-green-500/30 text-green-400" :
                      node.difficulty === "Medium" ? "border-yellow-400/30 text-yellow-400" :
                      "border-red-500/30 text-red-400"}`}>{node.difficulty}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 6 — Campaign Reverse Engineering */}
            <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Target size={12} className="text-white" />
                </div>
                <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Campaign Reverse Engineering</h2>
              </div>
              {/* Campaign picker */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {COMPETITOR_CAMPAIGNS.map(c => (
                  <button key={c.id} onClick={() => handleReverseEngineer(c)}
                    className={`px-2.5 py-1.5 rounded-lg font-mono text-[8px] font-bold transition-all cursor-pointer border ${
                      selectedCampaign.id === c.id
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                        : "border-gray-800 bg-transparent text-gray-500 hover:text-gray-300"}`}>
                    {c.brand} — {c.name}
                  </button>
                ))}
              </div>

              {reverseLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <RefreshCw size={20} className="text-purple-400 animate-spin mx-auto mb-2" />
                    <p className="font-mono text-[9px] text-gray-500">Reverse engineering campaign...</p>
                  </div>
                </div>
              ) : reverseData ? (
                <div className="space-y-3">
                  {[
                    { label: "Campaign",         value: selectedCampaign.name,        color: isLight ? "text-[#0F172A]" : "text-white" },
                    { label: "Type",             value: selectedCampaign.type,        color: "text-blue-400" },
                    { label: "Offer",            value: selectedCampaign.offer,       color: "text-yellow-400" },
                    { label: "Channel",          value: selectedCampaign.channel,     color: "text-green-400" },
                    { label: "Target Audience",  value: reverseData.targetAudience,   color: "text-gray-300" },
                    { label: "Likely Objective", value: reverseData.likelyObjective,  color: "text-gray-300" },
                  ].map(r => (
                    <div key={r.label} className="flex gap-3">
                      <span className="font-mono text-[8px] text-gray-600 uppercase tracking-wider w-28 shrink-0 pt-0.5">{r.label}</span>
                      <span className={`font-mono text-[9px] leading-relaxed ${r.color}`}>{r.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-800/60">
                    <p className="font-mono text-[8px] text-gray-600 mb-1 uppercase">Strengths</p>
                    {reverseData.strengths?.map((s: string, i: number) => (
                      <p key={i} className="font-mono text-[8px] text-green-400 flex items-start gap-1.5 mb-1"><CheckCircle2 size={9} className="mt-0.5 shrink-0" />{s}</p>
                    ))}
                    <p className="font-mono text-[8px] text-gray-600 mb-1 uppercase mt-2">Weaknesses</p>
                    {reverseData.weaknesses?.map((w: string, i: number) => (
                      <p key={i} className="font-mono text-[8px] text-red-400 flex items-start gap-1.5 mb-1"><AlertTriangle size={9} className="mt-0.5 shrink-0" />{w}</p>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                    <p className="font-mono text-[8px] text-purple-400 font-bold mb-1 flex items-center gap-1"><Sparkles size={9} /> Counter Strategy</p>
                    <p className="font-mono text-[8px] text-gray-300 leading-relaxed">{reverseData.counterStrategy}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 rounded-xl border border-gray-800/30 bg-gray-950/20">
                  <div className="text-center">
                    <Target size={20} className="text-gray-700 mx-auto mb-2" />
                    <p className="font-mono text-[9px] text-gray-600">Select a campaign above to analyze</p>
                    <button onClick={() => handleReverseEngineer(COMPETITOR_CAMPAIGNS[0])}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 text-purple-400 font-mono text-[8px] hover:bg-purple-500/10 transition-all cursor-pointer">
                      Analyze First Campaign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ SECTION 5 — AI COMPETITOR REPORT ══ */}
          <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Globe size={12} className="text-white" />
              </div>
              <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>AI Competitor Report</h2>
              <button onClick={handleGenerateReport} disabled={reportLoading}
                className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-[9px] font-bold transition-all cursor-pointer border ${
                  reportLoading
                    ? "border-gray-700 text-gray-500 cursor-not-allowed"
                    : "border-orange-500/30 bg-orange-500/5 text-orange-300 hover:bg-orange-500/10"}`}>
                {reportLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {reportLoading ? "Generating..." : "Generate Strategic Report"}
              </button>
            </div>

            {report ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <p className="font-mono text-[9px] text-gray-300 leading-relaxed">{report.summary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-mono text-[8px] text-red-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1"><Shield size={9} /> Competitor Risks</p>
                    {report.competitorStrategies?.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        <p className="font-mono text-[8px] text-gray-400 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-mono text-[8px] text-green-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1"><Star size={9} /> Market Opportunities</p>
                    {report.marketOpportunities?.map((o: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 shrink-0" />
                        <p className="font-mono text-[8px] text-gray-400 leading-relaxed">{o}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-mono text-[8px] text-blue-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1"><Zap size={9} /> Recommended Actions</p>
                    {report.recommendedActions?.map((a: any, i: number) => (
                      <div key={i} className="mb-2 p-2 rounded-lg bg-gray-950/50 border border-gray-800/30">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`font-mono text-[7px] px-1 rounded ${a.priority === "High" ? "bg-red-500/20 text-red-400" : "bg-yellow-400/20 text-yellow-400"}`}>{a.priority}</span>
                          <span className="font-mono text-[7px] text-green-400">+₹{a.expectedRevenue?.toLocaleString()}</span>
                        </div>
                        <p className="font-mono text-[8px] text-gray-300 leading-relaxed">{a.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-yellow-400/20 bg-yellow-400/5 flex items-center gap-3">
                  <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                  <div>
                    <p className="font-mono text-[8px] text-yellow-400 font-bold">Missed Revenue</p>
                    <p className="font-mono text-[8px] text-gray-400">{report.revenueImpact}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-space text-xl font-bold text-yellow-400">₹{report.missedRevenue?.toLocaleString()}</p>
                    <p className="font-mono text-[7px] text-gray-600">UNTAPPED</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 rounded-xl border border-gray-800/30 bg-gray-950/20">
                <div className="text-center">
                  <Globe size={22} className="text-gray-700 mx-auto mb-2" />
                  <p className="font-mono text-[9px] text-gray-600">Click "Generate Strategic Report" for a full AI-powered competitive analysis</p>
                </div>
              </div>
            )}
          </div>

          {/* ══ SECTION 7 + 8 — MARKET OPPORTUNITIES + AUTONOMOUS RESPONSE ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* SECTION 7 — Market Opportunities */}
            <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                  <TrendingUp size={12} className="text-white" />
                </div>
                <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Market Opportunities</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunities.map(opp => {
                  const ChIcon = CHANNEL_ICONS[opp.channel] || MessageCircle;
                  return (
                    <div key={opp.id} className={`p-4 rounded-xl border transition-all ${
                      opp.urgency === "High" ? "border-red-500/20 bg-red-500/5" : "border-gray-800/40 bg-gray-900/10"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className={`font-space text-[10px] font-bold leading-snug ${isLight ? "text-[#0F172A]" : "text-white"}`}>{opp.title}</p>
                        <span className={`font-mono text-[7px] px-1.5 py-0.5 rounded-full border ml-2 shrink-0 ${
                          opp.urgency === "High" ? "border-red-500/30 text-red-400" : "border-yellow-400/30 text-yellow-400"}`}>
                          {opp.urgency}
                        </span>
                      </div>
                      <p className="font-mono text-[8px] text-gray-500 leading-relaxed mb-3">{opp.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <p className="font-mono text-[7px] text-gray-600">Revenue</p>
                          <p className="font-space text-sm font-bold text-green-400">₹{opp.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-gray-600">ROI</p>
                          <p className="font-mono text-xs font-bold text-purple-400">{opp.roi}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[7px] text-gray-600">Confidence</p>
                          <p className="font-mono text-xs font-bold text-blue-400">{opp.confidence}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-[8px] text-gray-500">
                          <ChIcon size={10} className="text-green-400" />
                          {opp.channel}
                        </div>
                        <button onClick={() => handleLaunchResponse(opp)} disabled={workflowRunning}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[8px] font-bold border transition-all ${
                            workflowRunning ? "border-gray-700 text-gray-600 cursor-not-allowed" : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10 cursor-pointer"}`}>
                          <Play size={9} />
                          Launch Counter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 8 — Autonomous Response */}
            <div className={`orbit-panel p-5 rounded-2xl ${isLight ? "" : "border border-gray-800/60 bg-gray-900/20"}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Cpu size={12} className="text-white" />
                </div>
                <h2 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#0F172A]" : "text-white"}`}>Autonomous Response</h2>
                {workflowDone && (
                  <div className="ml-auto flex items-center gap-1.5 font-mono text-[8px] text-green-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    COMPLETE
                  </div>
                )}
              </div>

              {responseTarget && (
                <div className="mb-4 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <p className="font-mono text-[8px] text-gray-500 mb-0.5">Active Mission</p>
                  <p className="font-space text-[10px] font-bold text-blue-400">{responseTarget.title}</p>
                </div>
              )}

              <div className="space-y-2.5">
                {workflowSteps.map((step) => (
                  <div key={step.agent} className={`relative p-3 rounded-xl border transition-all duration-500 ${
                    step.status === "running" ? "shadow-md bg-gray-900/60" :
                    step.status === "done"    ? "bg-gray-900/30 opacity-80" :
                    "border-gray-800/30 bg-gray-900/10 opacity-50"}`}
                    style={{ borderColor: step.status !== "idle" ? step.color + (step.status === "running" ? "70" : "30") : undefined }}>
                    {step.status === "running" && <div className="absolute inset-0 rounded-xl opacity-10 animate-pulse" style={{ backgroundColor: step.color }} />}
                    <div className="relative flex items-center gap-3">
                      <span className="text-base">{step.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-space text-[9px] font-bold" style={{ color: step.status === "idle" ? "#6B7280" : step.color }}>{step.agent}</p>
                        <p className="font-mono text-[8px] text-gray-500 truncate">{step.label}</p>
                      </div>
                      {step.status === "running" && <RefreshCw size={10} className="animate-spin text-gray-400 shrink-0" />}
                      {step.status === "done"    && <CheckCircle2 size={12} className="shrink-0" style={{ color: step.color }} />}
                    </div>
                    {step.status !== "idle" && (
                      <div className="mt-2 h-0.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${step.status === "done" ? "w-full" : "w-1/2 animate-pulse"}`}
                          style={{ backgroundColor: step.color }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {workflowDone && (
                <div className="mt-4 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span className="font-mono text-[9px] font-bold text-green-400">Mission Launched!</span>
                  </div>
                  <p className="font-mono text-[8px] text-gray-500 leading-relaxed">Counter campaign queued. Check Mission Control for live tracking.</p>
                </div>
              )}

              {!responseTarget && (
                <div className="mt-4 flex items-center justify-center h-24 rounded-xl border border-gray-800/30 bg-gray-950/20">
                  <p className="font-mono text-[8px] text-gray-600 text-center">Click "Launch Counter" on an opportunity<br/>to activate the autonomous response</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};

export default CompetitorIntelligence;
