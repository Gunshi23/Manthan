import React, { useState, useMemo, useCallback } from "react";
import {
  Calendar, Users, TrendingUp, Send, Star, Gift,
  Filter, Heart,
  Sun, Snowflake, Flower2, Award, Check,
  AlertCircle, Flame, Globe
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SeasonalEvent {
  id: string;
  name: string;
  emoji: string;
  date: string;          // "MM-DD"
  daysUntil: number;
  urgency: "hot" | "warm" | "upcoming" | "planning";
  color: string;         // tailwind-style accent color (hex/rgb for inline)
  bgGradient: string;
  description: string;
  targetPersonas: string[];
  targetAgeGroups: string[];
  icon: React.FC<any>;
}

interface SeasonalCampaign {
  eventId: string;
  personaLabel: string;
  ageGroup: string;
  campaignName: string;
  message: string;
  audienceSize: number;
  estimatedRevenue: number;
  roi: number;
  channel: "Email" | "WhatsApp" | "SMS" | "RCS";
  discountCode?: string;
  confidence: number;
  launched: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date("2026-06-14");

const getDaysUntil = (mmdd: string): number => {
  const [m, d] = mmdd.split("-").map(Number);
  const thisYear = new Date(TODAY.getFullYear(), m - 1, d);
  if (thisYear < TODAY) thisYear.setFullYear(TODAY.getFullYear() + 1);
  return Math.ceil((thisYear.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
};

const getUrgency = (days: number): SeasonalEvent["urgency"] => {
  if (days <= 7) return "hot";
  if (days <= 21) return "warm";
  if (days <= 60) return "upcoming";
  return "planning";
};

const urgencyColors: Record<SeasonalEvent["urgency"], string> = {
  hot: "#ef4444",
  warm: "#f97316",
  upcoming: "#eab308",
  planning: "#6366f1",
};

const urgencyLabels: Record<SeasonalEvent["urgency"], string> = {
  hot: "🔥 HOT — Act Now",
  warm: "⚡ WARM — Plan Soon",
  upcoming: "📅 UPCOMING",
  planning: "🗓️ PLANNING",
};

// ─── Seasonal Event Calendar ──────────────────────────────────────────────────

const SEASONAL_EVENTS: Omit<SeasonalEvent, "daysUntil" | "urgency">[] = [
  {
    id: "valentines",
    name: "Valentine's Day",
    emoji: "❤️",
    date: "02-14",
    color: "#ec4899",
    bgGradient: "linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.08) 100%)",
    description: "Romance-themed seasonal push targeting couples and gifting shoppers.",
    targetPersonas: ["Student / Gen Z", "Young Working Professional"],
    targetAgeGroups: ["Teen", "Young Adult"],
    icon: Heart,
  },
  {
    id: "holi",
    name: "Holi",
    emoji: "🎨",
    date: "03-14",
    color: "#f97316",
    bgGradient: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,179,8,0.08) 100%)",
    description: "Festival of colors — vibrant collections and expressive seasonal drops.",
    targetPersonas: ["Festival Shopper", "Homemaker", "Student / Gen Z"],
    targetAgeGroups: ["Teen", "Young Adult", "Adult"],
    icon: Flower2,
  },
  {
    id: "summer",
    name: "Summer Drop",
    emoji: "☀️",
    date: "05-01",
    color: "#eab308",
    bgGradient: "linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(249,115,22,0.08) 100%)",
    description: "Summer wardrobe refresh campaign targeting lifestyle buyers.",
    targetPersonas: ["Young Working Professional", "Premium Fashion Enthusiast"],
    targetAgeGroups: ["Young Adult", "Adult"],
    icon: Sun,
  },
  {
    id: "independence_day",
    name: "Independence Day",
    emoji: "🇮🇳",
    date: "08-15",
    color: "#22c55e",
    bgGradient: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(6,182,212,0.08) 100%)",
    description: "Patriotic collection drops + freedom sale cashback campaigns.",
    targetPersonas: ["Festival Shopper", "Traditional Buyer", "Homemaker"],
    targetAgeGroups: ["Adult", "Senior"],
    icon: Globe,
  },
  {
    id: "onam",
    name: "Onam",
    emoji: "🌸",
    date: "09-05",
    color: "#06b6d4",
    bgGradient: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.08) 100%)",
    description: "South Indian festive campaign — traditional and premium ethnic collections.",
    targetPersonas: ["Traditional Buyer", "Homemaker"],
    targetAgeGroups: ["Adult", "Senior"],
    icon: Flower2,
  },
  {
    id: "diwali",
    name: "Diwali",
    emoji: "🪔",
    date: "10-20",
    color: "#f59e0b",
    bgGradient: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(239,68,68,0.08) 100%)",
    description: "Festival of lights — our highest revenue event. Gift sets, luxury drops, VIP pre-orders.",
    targetPersonas: ["Premium Fashion Enthusiast", "Festival Shopper", "Traditional Buyer", "Homemaker"],
    targetAgeGroups: ["Young Adult", "Adult", "Senior"],
    icon: Flame,
  },
  {
    id: "christmas",
    name: "Christmas & New Year",
    emoji: "🎄",
    date: "12-25",
    color: "#22c55e",
    bgGradient: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(99,102,241,0.08) 100%)",
    description: "End-of-year gifting, holiday lookbooks, and New Year clearance.",
    targetPersonas: ["Premium Fashion Enthusiast", "Young Working Professional", "Festival Shopper"],
    targetAgeGroups: ["Young Adult", "Adult"],
    icon: Snowflake,
  },
  {
    id: "birthday_campaign",
    name: "Birthday Campaign",
    emoji: "🎂",
    date: "00-00", // special — computed per-customer
    color: "#8b5cf6",
    bgGradient: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.08) 100%)",
    description: "Auto-triggered birthday campaigns sent 7 days before each customer's birthday.",
    targetPersonas: ["Student / Gen Z", "Young Working Professional", "Homemaker", "Festival Shopper", "Traditional Buyer", "Premium Fashion Enthusiast"],
    targetAgeGroups: ["Teen", "Young Adult", "Adult", "Senior"],
    icon: Gift,
  },
];

// ─── Campaign Message Templates ───────────────────────────────────────────────

const getTemplate = (
  eventId: string,
  personaLabel: string,
  customerName: string,
  discountCode: string
): string => {
  const templates: Record<string, Record<string, string>> = {
    valentines: {
      "Student / Gen Z": `Hi ${customerName} 💕\nValentine's Trend Drop is HERE! Swipe into our new love-themed collection — bold, expressive & made for you.\nUse code ${discountCode} for 20% off. Only 48 hrs! 🛍️`,
      "Young Working Professional": `Hey ${customerName} ❤️\nPlan the perfect date night in style. Our Date Night Collection is live — curated just for you.\nExclusive offer: ${discountCode} → 25% off luxury picks this Valentine's. Shop Now →`,
      default: `Hi ${customerName}! ❤️ Valentine's Drop is live. Treat yourself or someone special. Use ${discountCode} for 20% off. Limited time!`,
    },
    holi: {
      "Festival Shopper": `Holi hai, ${customerName}! 🎨🌈 Our Festival Drop is bursting with color — limited edition, limited stock. Grab yours with code ${discountCode}. Happy Holi!`,
      "Homemaker": `Wishing you a colorful Holi, ${customerName}! 🌸 Our festive home & style collection is up with exclusive gifts. Use ${discountCode} for 15% off today!`,
      default: `${customerName}, celebrate colors with our Holi collection! Use ${discountCode} for 20% off. Limited stock!`,
    },
    diwali: {
      "Premium Fashion Enthusiast": `Dear ${customerName} 🪔\nYou're invited to our VIP Diwali Pre-Order — exclusive designer capsule, zero public access.\nCode ${discountCode} unlocks your private showcase. Shop before it sells out.`,
      "Festival Shopper": `Happy Diwali, ${customerName}! ✨ Our festive collection is LIVE with curated gift sets, ethnic drops, and premium accessories. Use ${discountCode} for 20% off. Light up your look!`,
      "Traditional Buyer": `Shubh Deepawali, ${customerName}! 🙏 Explore our ethnic Diwali collection — traditional meets contemporary. Code ${discountCode} gives you ₹500 off orders above ₹2000.`,
      default: `${customerName}, Diwali Sale is LIVE 🪔 Use ${discountCode} for 20% off. Hurry — limited stock!`,
    },
    christmas: {
      "Young Working Professional": `Hey ${customerName} 🎄\nDress up your December with our Holiday Edit! Premium workwear meets festive style. ${discountCode} → 25% off sitewide. Merry shopping!`,
      "Premium Fashion Enthusiast": `Seasons Greetings, ${customerName} ✨\nOur limited-edition Holiday Collection is now live — curated winter essentials. VIP code: ${discountCode}. Happy New Year!`,
      default: `${customerName}, 'tis the season! 🎄 Our Christmas Sale is LIVE — use ${discountCode} for 20% off. Happy Holidays!`,
    },
    birthday_campaign: {
      default: `Happy Birthday (almost!), ${customerName}! 🎂🎉\nWishing you an incredible day ahead. As our way of celebrating YOU, here's a special birthday gift:\n\n🎁 Use code ${discountCode} for 30% off your next order — valid for 7 days!\n\nMake your birthday extra special. Shop now 🛍️`,
    },
    summer: {
      "Young Working Professional": `Hey ${customerName} ☀️\nSummer wardrobe refresh time! Our fresh Summer Drop just landed — bold colors, lightweight fits, office-ready.\nCode ${discountCode} → 20% off. Time to glow up!`,
      "Premium Fashion Enthusiast": `${customerName}, Summer Edit is HERE 🌟\nCurated linen sets, premium swimwear & designer accessories. Exclusive ${discountCode} for 25% off VIP picks.`,
      default: `${customerName}, it's Summer time! ☀️ Refresh your wardrobe — use ${discountCode} for 20% off our summer collection!`,
    },
    default: {
      default: `Hi ${customerName}! 🎉 Special seasonal offer just for you. Use ${discountCode} for 20% off. Shop now!`,
    },
  };

  const eventTemplates = templates[eventId] || templates["default"];
  return eventTemplates[personaLabel] || eventTemplates["default"];
};

// ─── Component ────────────────────────────────────────────────────────────────

export const SeasonalIntelligence: React.FC = () => {
  const { customers, addCampaign, theme } = useOrbit();
  const isLight = theme === "executive";

  const [selectedEventId, setSelectedEventId] = useState<string>("diwali");
  const [launchedCampaigns, setLaunchedCampaigns] = useState<Set<string>>(new Set());
  const [filterLifecycle, setFilterLifecycle] = useState<string>("all");

  // ─── Build enriched event list ─────────────────────────────────────────────

  const events: SeasonalEvent[] = useMemo(() =>
    SEASONAL_EVENTS.map(e => {
      const days = e.id === "birthday_campaign" ? 0 : getDaysUntil(e.date);
      return { ...e, daysUntil: days, urgency: getUrgency(days) };
    }).sort((a, b) => {
      if (a.id === "birthday_campaign") return -1;
      if (b.id === "birthday_campaign") return 1;
      return a.daysUntil - b.daysUntil;
    }),
    []
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);

  // ─── Compute upcoming birthdays ─────────────────────────────────────────────

  const birthdayCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.birthday) return false;
      const [bm, bd] = c.birthday.split("-").map(Number);
      const bd7 = new Date(TODAY.getFullYear(), bm - 1, bd);
      const diff = Math.ceil((bd7.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    });
  }, [customers]);

  // ─── Generate campaigns for the selected event ──────────────────────────────

  const campaigns: SeasonalCampaign[] = useMemo(() => {
    if (!selectedEvent) return [];
    if (selectedEvent.id === "birthday_campaign") {
      return birthdayCustomers.map(c => {
        const code = `BDAY${c.id.slice(-4).toUpperCase()}`;
        const revenue = Math.round((c.totalSpent || 1000) * 0.35);
        return {
          eventId: "birthday_campaign",
          personaLabel: c.persona || "Festival Shopper",
          ageGroup: c.ageGroup || "Adult",
          campaignName: `Birthday Gift — ${c.name}`,
          message: getTemplate("birthday_campaign", c.persona || "default", c.name, code),
          audienceSize: 1,
          estimatedRevenue: revenue,
          roi: parseFloat((revenue / 120).toFixed(1)),
          channel: c.preferredChannel || "WhatsApp",
          discountCode: code,
          confidence: 88,
          launched: launchedCampaigns.has(`birthday_${c.id}`),
        } as SeasonalCampaign;
      });
    }

    // Group customers by persona × ageGroup matching event targets
    const matchingCustomers = customers.filter(c => {
      if (filterLifecycle !== "all" && c.lifecycleStage !== filterLifecycle) return false;
      const personaMatch = selectedEvent.targetPersonas.some(p =>
        (c.persona || "").toLowerCase().includes(p.toLowerCase().split(" ")[0])
      );
      const ageMatch = !c.ageGroup || selectedEvent.targetAgeGroups.includes(c.ageGroup);
      return personaMatch || ageMatch;
    });

    // Create one campaign row per (persona × ageGroup) combo
    type GroupKey = string;
    const groups: Map<GroupKey, typeof customers[0][]> = new Map();
    matchingCustomers.forEach(c => {
      const key = `${c.persona || "General"}__${c.ageGroup || "Adult"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    });

    const result: SeasonalCampaign[] = [];
    groups.forEach((custs, key) => {
      const [personaLabel, ageGroup] = key.split("__");
      const totalRevenue = custs.reduce((s, c) => s + (c.totalSpent || 800) * 0.25, 0);
      const code = `${selectedEvent.id.toUpperCase().slice(0, 4)}${ageGroup.replace(/\s/g, "").toUpperCase().slice(0, 3)}25`;
      const sampleCustomer = custs[0];
      const channel: SeasonalCampaign["channel"] = (sampleCustomer?.preferredChannel || "WhatsApp") as SeasonalCampaign["channel"];

      result.push({
        eventId: selectedEvent.id,
        personaLabel,
        ageGroup,
        campaignName: `${selectedEvent.name} — ${personaLabel} (${ageGroup})`,
        message: getTemplate(selectedEvent.id, personaLabel, "{{name}}", code),
        audienceSize: custs.length,
        estimatedRevenue: Math.round(totalRevenue),
        roi: parseFloat(((totalRevenue) / (custs.length * 120)).toFixed(1)),
        channel,
        discountCode: code,
        confidence: 75 + Math.round(Math.random() * 20),
        launched: launchedCampaigns.has(`${selectedEvent.id}__${key}`),
      });
    });

    return result.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
  }, [selectedEvent, customers, birthdayCustomers, launchedCampaigns, filterLifecycle]);

  // ─── Launch handler ────────────────────────────────────────────────────────

  const handleLaunch = useCallback((campaign: SeasonalCampaign, cKey: string) => {
    const newCamp = {
      id: `seasonal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: campaign.campaignName,
      goal: `Seasonal — ${campaign.eventId}`,
      description: `Auto-generated by Seasonal Intelligence for ${campaign.personaLabel} (${campaign.ageGroup})`,
      channel: campaign.channel,
      status: "Queued" as const,
      sentCount: 0,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      purchaseCount: 0,
      revenueGenerated: 0,
      createdAt: new Date().toISOString(),
      predictedRevenue: campaign.estimatedRevenue,
      predictedRoi: campaign.roi,
    };
    addCampaign(newCamp);
    setLaunchedCampaigns(prev => new Set([...prev, cKey]));
  }, [addCampaign]);

  // ─── Summary stats ─────────────────────────────────────────────────────────

  const totalAudience = campaigns.reduce((s, c) => s + c.audienceSize, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.estimatedRevenue, 0);
  const avgRoi = campaigns.length > 0
    ? (campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length).toFixed(1)
    : "0.0";

  const bg = isLight ? "#f9fafb" : "#050816";
  const cardBg = isLight ? "#ffffff" : "rgba(9,12,30,0.9)";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
  const text = isLight ? "#111827" : "#e2e8f0";
  const subText = isLight ? "#6b7280" : "#64748b";

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: bg, color: text }}>
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b shrink-0" style={{ borderColor: border }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#ec4899)", boxShadow: "0 0 24px rgba(139,92,246,0.4)" }}>
              <Calendar size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-space font-bold text-base tracking-wide" style={{ color: text }}>
                Seasonal Intelligence <span className="text-purple-400">2.0</span>
              </h1>
              <p className="font-mono text-[10px]" style={{ color: subText }}>
                AI-powered seasonal campaigns · Persona × Age × Lifecycle targeting
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] px-2 py-1 rounded-full border"
              style={{ borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa", background: "rgba(139,92,246,0.08)" }}>
              {birthdayCustomers.length} birthdays this month
            </span>
            <span className="font-mono text-[9px] px-2 py-1 rounded-full border"
              style={{ borderColor: "rgba(34,197,94,0.3)", color: "#4ade80", background: "rgba(34,197,94,0.08)" }}>
              {events.filter(e => e.urgency === "hot" || e.urgency === "warm").length} events imminent
            </span>
          </div>
        </div>

        {/* Summary HUD */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Total Audience", value: totalAudience.toLocaleString(), icon: Users, color: "#3b82f6" },
            { label: "Est. Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: TrendingUp, color: "#22c55e" },
            { label: "Avg. ROI", value: `${avgRoi}x`, icon: Star, color: "#eab308" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 border flex items-center gap-3"
              style={{ background: cardBg, borderColor: border }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}18` }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="font-space font-bold text-base" style={{ color: text }}>{stat.value}</div>
                <div className="font-mono text-[9px]" style={{ color: subText }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body: 2-col layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Event selector ── */}
        <div className="w-64 shrink-0 flex flex-col border-r overflow-y-auto py-3 px-2"
          style={{ borderColor: border }}>
          <p className="font-mono text-[8px] uppercase tracking-widest px-2 mb-2" style={{ color: subText }}>
            Seasonal Calendar
          </p>
          {events.map(ev => {
            const isActive = ev.id === selectedEventId;
            return (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className="w-full text-left rounded-xl p-3 mb-1.5 border transition-all cursor-pointer"
                style={{
                  background: isActive ? ev.bgGradient : "transparent",
                  borderColor: isActive ? ev.color + "40" : border,
                  boxShadow: isActive ? `0 0 12px ${ev.color}20` : undefined,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{ev.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-space font-bold text-[11px] truncate" style={{ color: isActive ? ev.color : text }}>
                      {ev.name}
                    </div>
                    <div className="font-mono text-[8px]" style={{ color: subText }}>
                      {ev.id === "birthday_campaign"
                        ? `${birthdayCustomers.length} customers`
                        : ev.daysUntil === 0 ? "Today!" : `${ev.daysUntil}d away`}
                    </div>
                  </div>
                  <span className="shrink-0 text-[7px] font-bold font-mono px-1.5 py-0.5 rounded-full"
                    style={{
                      color: urgencyColors[ev.urgency],
                      background: `${urgencyColors[ev.urgency]}18`,
                      border: `1px solid ${urgencyColors[ev.urgency]}30`
                    }}>
                    {ev.id === "birthday_campaign" ? "AUTO" : ev.urgency === "hot" ? "HOT" : ev.urgency.toUpperCase()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Right: Campaign builder ── */}
        <div className="flex-1 overflow-y-auto p-5">
          {selectedEvent && (
            <>
              {/* Event header */}
              <div className="rounded-2xl p-5 mb-5 border relative overflow-hidden"
                style={{ background: selectedEvent.bgGradient, borderColor: selectedEvent.color + "30" }}>
                <div className="absolute inset-0 opacity-5"
                  style={{ background: `radial-gradient(circle at 70% 50%, ${selectedEvent.color}, transparent)` }} />
                <div className="relative flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">{selectedEvent.emoji}</span>
                      <div>
                        <h2 className="font-space font-bold text-lg" style={{ color: selectedEvent.color }}>
                          {selectedEvent.name}
                        </h2>
                        <span className="font-mono text-[9px]"
                          style={{ color: urgencyColors[selectedEvent.urgency] }}>
                          {selectedEvent.id === "birthday_campaign"
                            ? "🎂 AUTO-TRIGGERED — runs every day for upcoming birthdays"
                            : urgencyLabels[selectedEvent.urgency] + ` · ${selectedEvent.daysUntil} days away`}
                        </span>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] mt-2 max-w-md" style={{ color: "#94a3b8" }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-[8px] uppercase tracking-widest" style={{ color: "#64748b" }}>Target Personas</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvent.targetPersonas.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded-full font-mono text-[8px] border"
                          style={{ color: selectedEvent.color, borderColor: selectedEvent.color + "40", background: selectedEvent.color + "12" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-[8px] uppercase tracking-widest mt-1" style={{ color: "#64748b" }}>Age Groups</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEvent.targetAgeGroups.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-full font-mono text-[8px] border"
                          style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)" }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle filter */}
              {selectedEvent.id !== "birthday_campaign" && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Filter size={12} style={{ color: subText }} />
                  <span className="font-mono text-[9px]" style={{ color: subText }}>Filter by lifecycle:</span>
                  {["all", "Recent Buyer", "Cooling Period", "Miss You", "Inactive", "Dormant"].map(lc => (
                    <button
                      key={lc}
                      onClick={() => setFilterLifecycle(lc)}
                      className="px-2.5 py-1 rounded-full font-mono text-[8px] border cursor-pointer transition-all"
                      style={{
                        background: filterLifecycle === lc ? "rgba(139,92,246,0.15)" : "transparent",
                        borderColor: filterLifecycle === lc ? "rgba(139,92,246,0.4)" : border,
                        color: filterLifecycle === lc ? "#a78bfa" : subText,
                      }}>
                      {lc === "all" ? "All" : lc}
                    </button>
                  ))}
                </div>
              )}

              {/* Campaign cards */}
              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <AlertCircle size={32} style={{ color: subText }} />
                  <p className="font-mono text-[11px]" style={{ color: subText }}>
                    {selectedEvent.id === "birthday_campaign"
                      ? "No birthdays in the next 30 days"
                      : "No customers match the selected filters for this event."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((camp, idx) => {
                    const cKey = selectedEvent.id === "birthday_campaign"
                      ? `birthday_${camp.campaignName.split("—")[1]?.trim() || idx}`
                      : `${camp.eventId}__${camp.personaLabel}__${camp.ageGroup}`;
                    const isLaunched = launchedCampaigns.has(cKey);

                    return (
                      <div key={idx}
                        className="rounded-2xl border p-4 transition-all"
                        style={{
                          background: cardBg,
                          borderColor: isLaunched ? "rgba(34,197,94,0.25)" : border,
                          boxShadow: isLaunched ? "0 0 16px rgba(34,197,94,0.1)" : undefined,
                        }}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          {/* Left: Campaign info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isLaunched && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[7px] font-bold uppercase"
                                  style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>
                                  <Check size={8} /> Launched
                                </span>
                              )}
                              <h3 className="font-space font-bold text-[11px]" style={{ color: text }}>
                                {camp.campaignName}
                              </h3>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-4 flex-wrap mb-3">
                              <div className="flex items-center gap-1">
                                <Users size={10} style={{ color: "#3b82f6" }} />
                                <span className="font-mono text-[9px]" style={{ color: "#3b82f6" }}>
                                  {camp.audienceSize.toLocaleString()} customers
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp size={10} style={{ color: "#22c55e" }} />
                                <span className="font-mono text-[9px]" style={{ color: "#22c55e" }}>
                                  ₹{camp.estimatedRevenue.toLocaleString()} est.
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star size={10} style={{ color: "#eab308" }} />
                                <span className="font-mono text-[9px]" style={{ color: "#eab308" }}>
                                  {camp.roi}x ROI
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Award size={10} style={{ color: "#a78bfa" }} />
                                <span className="font-mono text-[9px]" style={{ color: "#a78bfa" }}>
                                  {camp.confidence}% conf.
                                </span>
                              </div>
                              <span className="font-mono text-[8px] px-1.5 py-0.5 rounded border"
                                style={{ color: "#94a3b8", borderColor: border }}>
                                {camp.channel}
                              </span>
                              {camp.discountCode && (
                                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded"
                                  style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>
                                  🏷️ {camp.discountCode}
                                </span>
                              )}
                            </div>

                            {/* Message preview */}
                            <div className="rounded-xl p-3 border"
                              style={{ background: "rgba(255,255,255,0.03)", borderColor: border }}>
                              <p className="font-mono text-[10px] leading-relaxed whitespace-pre-line" style={{ color: "#94a3b8" }}>
                                {camp.message.slice(0, 200)}{camp.message.length > 200 ? "…" : ""}
                              </p>
                            </div>
                          </div>

                          {/* Right: Action */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: selectedEvent.color }} />
                              <span className="font-mono text-[8px]" style={{ color: subText }}>
                                {selectedEvent.name}
                              </span>
                            </div>
                            <button
                              onClick={() => !isLaunched && handleLaunch(camp, cKey)}
                              disabled={isLaunched}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-mono text-[9px] uppercase transition-all cursor-pointer"
                              style={{
                                background: isLaunched
                                  ? "rgba(34,197,94,0.1)"
                                  : `linear-gradient(135deg, ${selectedEvent.color}, #8b5cf6)`,
                                color: isLaunched ? "#4ade80" : "#ffffff",
                                border: `1px solid ${isLaunched ? "rgba(34,197,94,0.3)" : "transparent"}`,
                                boxShadow: isLaunched ? undefined : `0 0 16px ${selectedEvent.color}50`,
                                opacity: isLaunched ? 1 : 1,
                              }}>
                              {isLaunched ? (
                                <><Check size={10} /> Launched</>
                              ) : (
                                <><Send size={10} /> Launch Campaign</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* All campaigns launched CTA */}
              {campaigns.length > 0 && campaigns.every(c => {
                const cKey = selectedEvent.id === "birthday_campaign"
                  ? `birthday_${c.campaignName.split("—")[1]?.trim()}`
                  : `${c.eventId}__${c.personaLabel}__${c.ageGroup}`;
                return launchedCampaigns.has(cKey);
              }) && (
                <div className="mt-6 rounded-2xl p-5 border text-center"
                  style={{ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.2)" }}>
                  <div className="text-2xl mb-2">🚀</div>
                  <h3 className="font-space font-bold text-sm text-green-400 mb-1">
                    All {selectedEvent.name} Campaigns Launched!
                  </h3>
                  <p className="font-mono text-[9px] text-green-600">
                    Head to Mission Control to track real-time performance.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
