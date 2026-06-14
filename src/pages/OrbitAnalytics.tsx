import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, Mail, MousePointer, ShoppingCart, Users, BarChart2, 
  ArrowUpRight, CheckCircle2, Download, 
  FileText, Brain, RefreshCw, 
  ShieldAlert, Zap, RefreshCw as LoopIcon, Play,
  MessageSquare, Smile, Meh, Frown, UserCheck, Activity, Calendar, DollarSign, AlertTriangle, Cpu, Send, SlidersHorizontal, X, ShoppingBag, Search
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { PageHeaderHUD } from "../components/PageHeaderHUD";
import { AgentCardModal } from "../components/AgentCardModal";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";

export const OrbitAnalytics: React.FC = () => {
  const { 
    campaigns: contextCampaigns, 
    orders: contextOrders, 
    customers, 
    theme,
    businessType, 
    config, 
    addAgentLog,
    lunaMetrics,
    personas,
    selectedCustomerId,
    setSelectedCustomerId,
    updateCustomer
  } = useOrbit();

  const isLight = theme === "executive";

  // Local state for live reactivity when launching missions
  const [localCampaigns, setLocalCampaigns] = useState<any[]>([]);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "diagnostics" | "forecast" | "personas" | "voice">("overview");
  const [selectedLifecycleCohort, setSelectedLifecycleCohort] = useState<string | null>(null);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<"Drishti" | "Khoj" | "Rachna" | "Saarthi" | "Pragya" | null>(null);

  // Revenue Panel breakdown control
  const [activeRevenueBreakdown, setActiveRevenueBreakdown] = useState<"campaign" | "channel" | "segment" | "month" | "forecast">("campaign");
  const [channelFilter, setChannelFilter] = useState<"All" | "Email" | "WhatsApp" | "SMS" | "RCS" | "Instagram">("All");

  // Forecast control
  const [forecastPeriod, setForecastPeriod] = useState<"7" | "30" | "90">("30");

  // Gemini API states
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState<boolean>(false);
  const [aiSummaryError, setAiSummaryError] = useState<boolean>(false);

  const [aiDiagnostics, setAiDiagnostics] = useState<any>(null);
  const [aiDiagnosticsLoading, setAiDiagnosticsLoading] = useState<boolean>(false);
  const [aiDiagnosticsError, setAiDiagnosticsError] = useState<boolean>(false);

  // Modal Reports states
  const [reportModalType, setReportModalType] = useState<"executive" | "investor" | "client" | null>(null);
  const [reportModalContent, setReportModalContent] = useState<string>("");
  const [reportModalLoading, setReportModalLoading] = useState<boolean>(false);

  // Launched Mission Feedback state
  const [launchingMission, setLaunchingMission] = useState<string | null>(null);
  const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string | null>(null);

  // Sync from Context initially
  useEffect(() => {
    if (contextCampaigns) setLocalCampaigns(contextCampaigns);
  }, [contextCampaigns]);

  useEffect(() => {
    if (contextOrders) setLocalOrders(contextOrders);
  }, [contextOrders]);

  // Derived timeline dates
  const todayDate = useMemo(() => {
    const dates = localOrders.map(o => new Date(o.date).getTime());
    return dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
  }, [localOrders]);

  const todayStr = useMemo(() => todayDate.toISOString().split("T")[0], [todayDate]);

  // Core metrics calculations
  const totalRevenue = useMemo(() => localOrders.reduce((sum, o) => sum + o.amount, 0), [localOrders]);
  const completedCampaigns = useMemo(() => localCampaigns.filter(c => c.status === "Completed" || c.status === "Delivered"), [localCampaigns]);
  const totalCampaignRevenue = useMemo(() => completedCampaigns.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0), [completedCampaigns]);
  
  const aov = useMemo(() => localOrders.length > 0 ? totalRevenue / localOrders.length : 0, [totalRevenue, localOrders]);
  const ltv = useMemo(() => customers.length > 0 ? customers.reduce((sum, c) => sum + (c.ltv || 0), 0) / customers.length : 0, [customers]);

  const totalSent = useMemo(() => completedCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0), [completedCampaigns]);
  const totalOpened = useMemo(() => completedCampaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0), [completedCampaigns]);
  const totalClicked = useMemo(() => completedCampaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0), [completedCampaigns]);
  const totalPurchases = useMemo(() => completedCampaigns.reduce((sum, c) => sum + (c.purchaseCount || 0), 0), [completedCampaigns]);

  const avgOpenRate = useMemo(() => totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 71, [totalOpened, totalSent]);
  const avgCTR = useMemo(() => totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 42, [totalClicked, totalOpened]);
  const avgConvRate = useMemo(() => totalClicked > 0 ? ((totalPurchases / totalClicked) * 100).toFixed(1) : "18.3", [totalPurchases, totalClicked]);

  const repeatPurchaseRate = useMemo(() => {
    const repeatBuyers = customers.filter(c => c.purchaseCount > 1).length;
    return customers.length > 0 ? Math.round((repeatBuyers / customers.length) * 100) : 0;
  }, [customers]);

  const segmentColors: Record<string, string> = {
    "Loyalists": "#10B981", // Emerald
    "Slipping Away": "#EF4444", // Red
    "High-Value Inactive": "#8B5CF6", // Purple
    "New Signups": "#3B82F6", // Blue
  };

  // Daily, Weekly, Monthly Live stats
  const revenueToday = useMemo(() => {
    return localOrders.filter(o => o.date === todayStr).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayStr]);

  const revenueYesterday = useMemo(() => {
    const prevDate = new Date(todayDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split("T")[0];
    return localOrders.filter(o => o.date === prevDateStr).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayDate]);

  const revenueThisWeek = useMemo(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    return localOrders.filter(o => {
      const diff = todayDate.getTime() - new Date(o.date).getTime();
      return diff >= 0 && diff < 7 * oneDay;
    }).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayDate]);

  const revenueLastWeek = useMemo(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    return localOrders.filter(o => {
      const diff = todayDate.getTime() - new Date(o.date).getTime();
      return diff >= 7 * oneDay && diff < 14 * oneDay;
    }).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayDate]);

  const revenueThisMonth = useMemo(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    return localOrders.filter(o => {
      const diff = todayDate.getTime() - new Date(o.date).getTime();
      return diff >= 0 && diff < 30 * oneDay;
    }).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayDate]);

  const revenueLastMonth = useMemo(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    return localOrders.filter(o => {
      const diff = todayDate.getTime() - new Date(o.date).getTime();
      return diff >= 30 * oneDay && diff < 60 * oneDay;
    }).reduce((sum, o) => sum + o.amount, 0);
  }, [localOrders, todayDate]);

  const vipCustomers = useMemo(() => customers.filter(c => c.ltv >= 40000 || (c.segment === "Loyalists" && c.ltv >= 30000)), [customers]);
  const repeatBuyers = useMemo(() => customers.filter(c => c.purchaseCount > 1), [customers]);
  const atRiskCustomers = useMemo(() => customers.filter(c => c.churnRisk >= 70 || c.segment === "Slipping Away"), [customers]);
  const activeCustomers = useMemo(() => customers.filter(c => c.segment === "Loyalists" || c.segment === "New Signups"), [customers]);
  const activeCustomersCount = useMemo(() => activeCustomers.length, [activeCustomers]);
  const vipCustomersCount = useMemo(() => vipCustomers.length, [vipCustomers]);
  const repeatBuyersCount = useMemo(() => repeatBuyers.length, [repeatBuyers]);
  const churnRiskCount = useMemo(() => atRiskCustomers.length, [atRiskCustomers]);

  const campaignSuccessRate = useMemo(() => {
    const completed = localCampaigns.filter(c => c.status === "Completed" || c.status === "Delivered");
    if (completed.length === 0) return 85;
    const successful = completed.filter(c => c.purchaseCount > 0);
    return Math.round((successful.length / completed.length) * 100);
  }, [localCampaigns]);

  // Deltas for KPI Cards
  const todayPctChange = useMemo(() => revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : 12.4, [revenueToday, revenueYesterday]);
  const weekPctChange = useMemo(() => revenueLastWeek > 0 ? ((revenueThisWeek - revenueLastWeek) / revenueLastWeek) * 100 : 8.1, [revenueThisWeek, revenueLastWeek]);
  const monthPctChange = useMemo(() => revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 15.6, [revenueThisMonth, revenueLastMonth]);

  // Channel metrics
  const channelMetrics = useMemo(() => {
    return ["WhatsApp", "Email", "SMS", "RCS", "Instagram"].map(channel => {
      const filteredCamps = localCampaigns.filter(c => c.channel?.toLowerCase() === channel.toLowerCase());
      const sent = filteredCamps.reduce((sum, c) => sum + (c.sentCount || 0), 0);
      const opened = filteredCamps.reduce((sum, c) => sum + (c.openedCount || 0), 0);
      const clicked = filteredCamps.reduce((sum, c) => sum + (c.clickedCount || 0), 0);
      const converted = filteredCamps.reduce((sum, c) => sum + (c.purchaseCount || 0), 0);
      const revenue = filteredCamps.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);

      // Default mock if no campaigns exist yet
      if (sent === 0) {
        if (channel === "WhatsApp") {
          return { channel, sent: 1200, opens: "91%", clicks: "48%", conv: "18%", revenue: 34500, roi: "4.2x" };
        } else if (channel === "Email") {
          return { channel, sent: 3400, opens: "28%", clicks: "12%", conv: "3%", revenue: 14500, roi: "2.8x" };
        } else if (channel === "SMS") {
          return { channel, sent: 800, opens: "N/A", clicks: "8%", conv: "2%", revenue: 5400, roi: "1.9x" };
        } else if (channel === "RCS") {
          return { channel, sent: 450, opens: "68%", clicks: "32%", conv: "14%", revenue: 12000, roi: "3.5x" };
        } else {
          return { channel, sent: 0, opens: "0%", clicks: "0%", conv: "0%", revenue: 0, roi: "0.0x" };
        }
      }

      const openPct = sent > 0 ? Math.round((opened / sent) * 100) : 0;
      const clickPct = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
      const convPct = clicked > 0 ? Math.round((converted / clicked) * 100) : 0;
      
      const costRate = channel === "WhatsApp" ? 1.0 : channel === "Email" ? 0.05 : channel === "SMS" ? 0.20 : 0.80;
      const cost = Math.max(100, sent * costRate);
      const roi = (revenue / cost).toFixed(1) + "x";

      return {
        channel,
        sent,
        opens: channel === "SMS" || channel === "Instagram" ? "N/A" : `${openPct}%`,
        clicks: `${clickPct}%`,
        conv: `${convPct}%`,
        revenue,
        roi
      };
    });
  }, [localCampaigns]);

  // Customer segments breakdown
  const customerSegments = useMemo(() => {
    const segments = [
      { name: "VIP Customers", match: (c: any) => c.ltv >= 40000 || (c.segment === "Loyalists" && c.ltv >= 30000), trend: "+4.2%", type: "Loyalists" },
      { name: "Repeat Buyers", match: (c: any) => c.purchaseCount > 1, trend: "+8.6%", type: "Loyalists" },
      { name: "New Customers", match: (c: any) => c.segment === "New Signups", trend: "+14.8%", type: "New Signups" },
      { name: "Inactive Customers", match: (c: any) => c.segment === "High-Value Inactive", trend: "-2.1%", type: "High-Value Inactive" },
      { name: "At-Risk Customers", match: (c: any) => c.segment === "Slipping Away" || c.churnRisk >= 70, trend: "+5.3%", type: "Slipping Away" }
    ];

    return segments.map(seg => {
      const list = customers.filter(seg.match);
      const count = list.length;
      const totalSpend = list.reduce((sum, c) => sum + (c.ltv || 0), 0);
      const avgSpend = count > 0 ? totalSpend / count : 0;
      const contribution = totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0;

      return {
        name: seg.name,
        count,
        contribution: contribution.toFixed(1) + "%",
        avgSpend: Math.round(avgSpend),
        ltv: Math.round(totalSpend / (count || 1)),
        predictedValue: Math.round(avgSpend * 1.35),
        trend: seg.trend
      };
    });
  }, [customers, totalRevenue]);

  // Fallback Rule-Based summary
  const getRuleBasedBriefing = () => {
    const activeCamps = localCampaigns.filter(c => c.status === "Completed" || c.status === "Delivered");
    const activeCampsRev = activeCamps.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
    const activeCampsPct = totalRevenue > 0 ? Math.round((activeCampsRev / totalRevenue) * 100) : 78;

    return `• Revenue is up ₹${revenueToday.toLocaleString()} (${todayPctChange.toFixed(1)}%) today compared to yesterday's baseline.
• Outbound marketing programs driven by WhatsApp nodes generated ₹${activeCampsRev.toLocaleString()} (${activeCampsPct}% of all revenue).
• Segment progression triggers: ${vipCustomers.length} profiles consolidated inside the VIP segment, holding a combined LTV of ₹${vipCustomers.reduce((sum, c) => sum + c.ltv, 0).toLocaleString()}.
• Retention Warning: ${atRiskCustomers.length} active customer nodes currently exceed a 70% churn risk index threshold.
• Recommended action: Launch a high-priority Win-back campaign targeting slipping VIP buyers via the WhatsApp dispatch node immediately.`;
  };

  // Fetch AI summary with 12s timeout
  const generateAISummary = async (forceMock = false) => {
    setAiSummaryLoading(true);
    setAiSummaryError(false);

    if (forceMock || !config.geminiKey || config.geminiKey.trim() === "" || config.geminiKey.startsWith("placeholder")) {
      setTimeout(() => {
        setAiSummary(getRuleBasedBriefing());
        setAiSummaryLoading(false);
      }, 800);
      return;
    }

    const systemPrompt = "You are Manthan.ai Executive Briefing AI. Deliver 5 high-impact bullet points summarizing current business intelligence. Rely on actual metrics. Use concise, professional, cyber-command style phrasing. Do not return markdown headers or JSON block formatting.";
    const userPrompt = `Analyze these live business parameters:
      Business: "${businessType}" (Aura Threads / Fashion and Apparel)
      Total Revenue: ₹${totalRevenue}
      Revenue Today: ₹${revenueToday}
      Total Customers: ${customers.length}
      VIP Customers Count: ${vipCustomers.length}
      Repeat Buyers Count: ${repeatBuyers.length}
      At Churn Risk Count: ${atRiskCustomers.length}
      Campaign Revenue Generated: ₹${totalCampaignRevenue}
      Conversion Rate: ${avgConvRate}%
      Open Rate: ${avgOpenRate}%
      CTR: ${avgCTR}%
      Best Channels: ${JSON.stringify(channelMetrics.slice(0, 3))}
      Provide a bulleted summary. Ensure the first line states revenue trends today. Recommendations should target the highest risk cohort.`;

    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 12000)
    );

    try {
      const aiResult = await Promise.race([
        callGeminiAPI(userPrompt, systemPrompt, config.geminiKey),
        timeout
      ]);
      setAiSummary(aiResult);
      setAiSummaryLoading(false);
    } catch (err) {
      console.warn("AI Briefing failed or timed out. Falling back to rule-based briefing:", err);
      setAiSummary(getRuleBasedBriefing());
      setAiSummaryError(true);
      setAiSummaryLoading(false);
    }
  };

  // Fallback rule-based Diagnostics
  const getRuleBasedDiagnostics = () => {
    return {
      working: "Outbound campaign open rates are strong at 71%, with WhatsApp showing a peak conversion rate of 18.3%.",
      failing: "Repeat purchase conversion velocity is declining by 4.2% week-over-week among the Slipping Away customer cohort.",
      leak: `₹${Math.round(totalRevenue * 0.12).toLocaleString()} revenue leakage detected in checkout drop-offs from abandoned cart sessions.`,
      opportunity: "Cross-selling coordinate pants sets to high-LTV cotton kurti buyers projects an incremental yield of ₹64,000.",
      recommendations: [
        "Deploy a dedicated WhatsApp Cart Abandonment concierge flow with a ₹150 off trigger code.",
        "Launch an invite-only trunk pre-sale campaign for high-value repeat buyers on RCS Cards."
      ]
    };
  };

  // Fetch AI diagnostics report with 12s timeout
  const generateAIDiagnostics = async (forceMock = false) => {
    setAiDiagnosticsLoading(true);
    setAiDiagnosticsError(false);

    if (forceMock || !config.geminiKey || config.geminiKey.trim() === "" || config.geminiKey.startsWith("placeholder")) {
      setTimeout(() => {
        setAiDiagnostics(getRuleBasedDiagnostics());
        setAiDiagnosticsLoading(false);
      }, 1000);
      return;
    }

    const systemPrompt = `You are the Manthan.ai System Diagnostics AI. Analyze business metrics and output a JSON diagnostics report.
    Format your response as a single valid JSON object matching this schema exactly:
    {
      "working": "brief statement of what's working",
      "failing": "brief statement of what's failing",
      "leak": "brief description of the biggest revenue leak",
      "opportunity": "brief description of the highest opportunity",
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
    Only return the raw JSON object. Do not include markdown code block styling.`;

    const userPrompt = `Live metrics state:
      Business type: ${businessType}
      Total Revenue: ₹${totalRevenue}
      Campaign Revenue: ₹${totalCampaignRevenue}
      Total Customers: ${customers.length}
      Average Order Value: ₹${Math.round(aov)}
      LTV Average: ₹${Math.round(ltv)}
      Active customers: ${customers.filter(c => c.segment === 'Loyalists' || c.segment === 'New Signups').length}
      At Churn Risk: ${atRiskCustomers.length}
      Conversion Rate: ${avgConvRate}%
      Open Rate: ${avgOpenRate}%
      CTR: ${avgCTR}%
      Calculate diagnostics.`;

    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 12000)
    );

    try {
      const aiResult = await Promise.race([
        callGeminiAPI(userPrompt, systemPrompt, config.geminiKey),
        timeout
      ]);
      const parsed = parseGeminiJson<any>(aiResult, null);
      if (parsed && parsed.working && parsed.failing) {
        setAiDiagnostics(parsed);
      } else {
        throw new Error("Invalid output format");
      }
      setAiDiagnosticsLoading(false);
    } catch (err) {
      console.warn("AI Diagnostics failed or timed out. Falling back to rule-based diagnostics:", err);
      setAiDiagnostics(getRuleBasedDiagnostics());
      setAiDiagnosticsError(true);
      setAiDiagnosticsLoading(false);
    }
  };

  // Launching Mission Simulator from Recommendations
  const handleLaunchMission = async (rec: any) => {
    setLaunchingMission(rec.title);
    setLaunchSuccessMsg(null);

    // Call Context agent log
    addAgentLog("Saarthi", `Initiating autonomous launch directive for: "${rec.title}"`, "action");

    // Fetch cohort matching recommendation segments
    const matchingCohort = customers.filter(c => {
      if (rec.title.toLowerCase().includes("cart") || rec.title.toLowerCase().includes("abandon")) {
        return c.segment === "Slipping Away";
      }
      if (rec.title.toLowerCase().includes("vip")) {
        return c.segment === "Loyalists" || c.ltv >= 40000;
      }
      if (rec.title.toLowerCase().includes("upsell") || rec.title.toLowerCase().includes("repeat")) {
        return c.purchaseCount > 1;
      }
      return c.segment === "New Signups";
    });

    const audienceSize = matchingCohort.length > 0 ? matchingCohort.length : 35;
    const campaignId = `camp_launch_${Date.now()}`;

    // Simulate Saarthi dispatch process
    setTimeout(async () => {
      const delivered = audienceSize;
      const opened = Math.round(delivered * (rec.channel === "SMS" ? 0 : 0.76));
      const clicked = Math.round((opened || delivered) * 0.42);
      const purchases = Math.max(1, Math.round(clicked * 0.24));
      const revenue = purchases * (600 + Math.floor(Math.random() * 800));

      const newCampaignObj = {
        id: campaignId,
        name: rec.title,
        goal: rec.title,
        description: `Autonomous recommended campaign: ${rec.title}`,
        channel: rec.channel,
        status: "Completed",
        sentCount: delivered,
        deliveredCount: delivered,
        openedCount: opened,
        clickedCount: clicked,
        purchaseCount: purchases,
        revenueGenerated: revenue,
        createdAt: new Date().toISOString()
      };

      // Create new orders to simulate purchasers
      const newOrdersList: any[] = [];
      const cohortPurchasers = matchingCohort.slice(0, purchases);
      cohortPurchasers.forEach((cust, index) => {
        newOrdersList.push({
          id: `ord_sim_${Date.now()}_${index}`,
          customerId: cust.id,
          customerName: cust.name,
          amount: Math.round(revenue / purchases),
          date: todayStr,
          product: cust.predictedCategory || "Premium Fashion Outfit",
          channel: rec.channel
        });
      });

      // Save to server
      try {
        await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rec.title,
            goal: rec.title,
            channel: rec.channel,
            targetSegment: rec.title.toLowerCase().includes("vip") ? "Loyalists" : "Slipping Away",
            audienceSize: delivered,
            predictedRevenue: rec.revenueVal,
            predictedRoi: parseFloat(rec.roi.replace("x", "")),
            copy: `Autonomous Campaign copy launched via ${rec.channel}.`,
            subject: `Exclusive offer: ${rec.title}`,
            status: "Completed"
          })
        });

        // Add simulated orders to orders route
        for (const ord of newOrdersList) {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ord)
          });
        }
      } catch (err) {
        console.warn("Failed to sync simulated campaign/orders with backend:", err);
      }

      // Update local state instantly so numbers refresh
      setLocalCampaigns(prev => [newCampaignObj, ...prev]);
      setLocalOrders(prev => [...newOrdersList, ...prev]);

      addAgentLog("Saarthi", `Twilio/Resend dispatch completed. Sent: ${delivered}. Webhook recorded: ${purchases} conversions.`, "chat");
      addAgentLog("Khoj", `Khoj logged direct conversion revenue flow: +₹${revenue.toLocaleString()}`, "result");

      setLaunchingMission(null);
      setLaunchSuccessMsg(`Successfully launched: "${rec.title}"! Generated ₹${revenue.toLocaleString()} revenue from ${purchases} converters.`);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setLaunchSuccessMsg(null), 5000);
    }, 2500);
  };

  // AI Modal Report Generator (Export Center)
  const handleGenerateAIReport = async (type: "executive" | "investor" | "client") => {
    setReportModalType(type);
    setReportModalLoading(true);
    setReportModalContent("");

    if (!config.geminiKey || config.geminiKey.trim() === "" || config.geminiKey.startsWith("placeholder")) {
      // Immediate mock fallback
      setTimeout(() => {
        setReportModalContent(getMockReportContent(type));
        setReportModalLoading(false);
      }, 1200);
      return;
    }

    const typeLabels = {
      executive: "AI Executive Briefing Report",
      investor: "AI Quarterly Investor Performance Pitch",
      client: "AI Client Campaign Deliverables Ledger"
    };

    const systemPrompt = `You are the Manthan.ai Lead AI Business Consultant. Generate a detailed, highly professional business report in markdown format. 
    Use titles, stats grids, and bullet lists. Address key trends, leak recovery, and forecasted growth metrics. Do not exceed 400 words.`;

    const userPrompt = `Generate a "${typeLabels[type]}" for the business "${businessType}".
    Core stats:
    - Total Revenue: ₹${totalRevenue.toLocaleString()}
    - Total Customers: ${customers.length}
    - Total Outbound Campaigns: ${localCampaigns.length}
    - Overall Conversion Rate: ${avgConvRate}%
    - WhatsApp Campaigns Revenue: ₹${channelMetrics.find(c => c.channel === "WhatsApp")?.revenue.toLocaleString()}
    - VIP Customers Base: ${vipCustomers.length} profiles
    - Slipping Churn Risk: ${atRiskCustomers.length} profiles
    Deliver actionable summaries and investor/operator forecasts.`;

    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 12000)
    );

    try {
      const aiResult = await Promise.race([
        callGeminiAPI(userPrompt, systemPrompt, config.geminiKey),
        timeout
      ]);
      setReportModalContent(aiResult);
      setReportModalLoading(false);
    } catch (err) {
      console.warn("AI Report failed or timed out. Falling back to customized template:", err);
      setReportModalContent(getMockReportContent(type));
      setReportModalLoading(false);
    }
  };

  const getMockReportContent = (type: "executive" | "investor" | "client") => {
    const formatCurrency = (val: number) => `₹${Math.round(val).toLocaleString()}`;
    const dateStr = todayDate.toLocaleDateString();

    if (type === "executive") {
      return `# Manthan.ai Executive Briefing Report
**Date Generated:** ${dateStr} | **Operational Status:** NOMINAL

## 1. Executive Performance Summary
Our growth marketing vectors are nominal, with total cumulative revenue standing at **${formatCurrency(totalRevenue)}** across **${localOrders.length}** conversions. Outbound AI campaigns have accounted for **${formatCurrency(totalCampaignRevenue)}** (representing a healthy share of business metrics).

* **Average Order Value (AOV):** ${formatCurrency(aov)}
* **Customer Lifetime Value (LTV):** ${formatCurrency(ltv)}
* **Conversion Rate (Average):** ${avgConvRate}%

## 2. Channel Diagnostics & ROI Ledger
Our analysis confirms **WhatsApp** remains the primary yield driver, outperforming email and SMS with a **${channelMetrics.find(c => c.channel === "WhatsApp")?.roi}** ROI coefficient.

* **WhatsApp Revenue:** ${formatCurrency(channelMetrics.find(c => c.channel === "WhatsApp")?.revenue || 0)}
* **RCS Cards Revenue:** ${formatCurrency(channelMetrics.find(c => c.channel === "RCS")?.revenue || 0)}
* **Email / Newsletters Revenue:** ${formatCurrency(channelMetrics.find(c => c.channel === "Email")?.revenue || 0)}

## 3. High-Priority Directives
1. **Reactivate Churn Nodes:** Immediately launch the *Dormant VIP Win-back Loop* targeting ${atRiskCustomers.length} at-risk buyers.
2. **Optimize Checkout Gateway:** Deploy automated checkout links inside WhatsApp to capture ₹12,500 in cart leaks.`;
    } else if (type === "investor") {
      return `# Manthan.ai Performance Pitch (Investor Report)
**Quarterly Assessment:** Q2 | **Valuation Node:** Vanguard-v4.8

## 1. Financial Highlights
Manthan.ai Core has unlocked positive trajectory indicators across fashion customer databases. Cumulative cohort yield totals **${formatCurrency(totalRevenue)}**, showing an active **+18.5%** quarter-over-quarter expansion trend.

* **Gross Campaign Billings:** ${formatCurrency(totalCampaignRevenue)}
* **Average LTV per Cohort:** ${formatCurrency(ltv)}
* **VIP Cluster Assets Value:** ${formatCurrency(vipCustomers.length * ltv)}

## 2. Customer Acquisition & Unit Economics
The CAC-to-LTV ratio remains healthy, supported by high organic repeat purchase rates (**${repeatPurchaseRate}%**). 

* **Repeat Buyer Base:** ${repeatBuyers.length} profiles
* **Active Signups (unconverted):** ${customers.filter(c => c.segment === 'New Signups').length} accounts
* **Average CAC:** ₹240 (driven by low-cost automated WhatsApp dispatch hooks)

## 3. Projections & Forecast
Khoj Agent forecasts Q3 baseline revenues extending to **${formatCurrency(totalRevenue * 1.35)}**, representing a **+35%** growth scenario driven by automated RCS festive drops.`;
    } else {
      return `# Manthan.ai Client Campaign Deliverables Ledger
**Client Profile:** Aura Threads (Fashion and Apparel) | **Active Agent Registry:** Drishti, Rachna, Khoj, Saarthi, Pragya

## 1. Outbound Campaign Performance Table
The following details campaigns dispatched automatically by Manthan AI:

* **Summer Cotton Drop:** Sent to 800 WhatsApp numbers. Delivered: 98%. Generated **₹1,22,106** with **4.8x ROI**.
* **Diwali VIP Spark:** Sent to 120 Email addresses. Delivered: 100%. Generated **₹61,572** with **3.4x ROI**.
* **DM Enquiry Recovery:** Sent to 245 WhatsApp checkout drop-offs. Generated **₹62,352** with **3.9x ROI**.

## 2. Conversion Audit
Overall campaign open rates hit **${avgOpenRate}%** with a click-through rate of **${avgCTR}%**, indicating strong copywriting relevance generated by Rachna copywriter nodes.`;
    }
  };

  // Export CSV Function
  const handleExportCSV = () => {
    // Generate campaigns CSV string
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Campaign Name,Goal,Channel,Status,Audience Size,Revenue Generated,ROI\n";
    
    localCampaigns.forEach(c => {
      const roi = c.revenueGenerated > 0 ? (c.revenueGenerated / (c.sentCount * 0.5 || 1)).toFixed(1) + "x" : "0.0x";
      csvContent += `"${c.name}","${c.goal}","${c.channel}","${c.status}",${c.sentCount},${c.revenueGenerated},"${roi}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbit_ai_Campaigns_Ledger_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAgentLog("System", "CSV report exported to client local files.", "thought");
  };

  // Recommendations static context (real functionality on buttons)
  const recommendationsList = [
    { title: "Recover Abandoned Carts", channel: "WhatsApp", confidence: "94%", roi: "4.8x", revenue: "₹12,500 potential", revenueVal: 12500, desc: "Re-engage 17 shoppers who left Swadeshi Cotton Kurtis in their checkouts today." },
    { title: "Launch VIP Campaign", channel: "RCS Cards", confidence: "92%", roi: "5.8x", revenue: "₹24,000 potential", revenueVal: 24000, desc: "Invite our top 15 loyalists with a private early access pre-sale link." },
    { title: "Upsell Repeat Buyers", channel: "Email", confidence: "87%", roi: "3.4x", revenue: "₹18,200 potential", revenueVal: 18200, desc: "Target 28 previous kurti purchasers with coordinating palazzo sets bundles." },
    { title: "Diwali Festival Campaign", channel: "WhatsApp", confidence: "89%", roi: "4.2x", revenue: "₹31,000 potential", revenueVal: 31000, desc: "Dispatch premium silk templates to Slipping Away VIP segments." }
  ];

  // Fetch initial summary & diagnostics on mount or businessType change
  useEffect(() => {
    generateAISummary();
    generateAIDiagnostics();
  }, [businessType]);

  // Automated workflow scrolling logs simulator
  const [workflowLogs, setWorkflowLogs] = useState<string[]>([]);
  useEffect(() => {
    const baseLogs = [
      "Drishti clustered customer database: isolated 4 segments.",
      "Pragya audited billing logs: detected ₹12,500 cart leakage.",
      "Khoj calculated conversion timeline ROI variables.",
      "Rachna compiled creative templates for WhatsApp / Email drops.",
      "Saarthi initialized dispatcher webhooks for dispatch queues."
    ];
    setWorkflowLogs(baseLogs);

    // Keep adding live updates
    const interval = setInterval(() => {
      const logPool = [
        "Drishti: Customer coordinate charts successfully mapped.",
        "Pragya: Inactive VIP segment re-audited.",
        "Khoj: Simulation Timelines recalculated (89.2% accuracy).",
        "Rachna: Created high-CTR catalog drafts.",
        "Saarthi: Twilio REST sockets verified (99.4% net health)."
      ];
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      setWorkflowLogs(prev => [randomLog, ...prev.slice(0, 4)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Visual chart datasets
  const revenueChartData = useMemo(() => {
    // Group campaigns by name/revenue
    return localCampaigns.slice(0, 5).map(c => ({
      label: c.name.slice(0, 15) + (c.name.length > 15 ? "..." : ""),
      value: c.revenueGenerated || 0
    }));
  }, [localCampaigns]);

  const channelChartData = useMemo(() => {
    return channelMetrics.map(c => ({
      label: c.channel,
      value: c.revenue
    }));
  }, [channelMetrics]);

  const segmentChartData = useMemo(() => {
    return customerSegments.map(c => ({
      label: c.name.slice(0, 10),
      value: c.count * c.ltv * 0.05 // simulated revenue share
    }));
  }, [customerSegments]);

  const monthChartData = useMemo(() => {
    return [
      { label: "Feb", value: totalRevenue * 0.12 },
      { label: "Mar", value: totalRevenue * 0.18 },
      { label: "Apr", value: totalRevenue * 0.22 },
      { label: "May", value: totalRevenue * 0.32 },
      { label: "Jun (Today)", value: totalRevenue * 0.16 }
    ];
  }, [totalRevenue]);

  // SVG Chart calculation helper
  const renderSVGChart = (data: { label: string; value: number }[]) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const width = 500;
    const height = 180;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingBottom = 25;
    const paddingTop = 15;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 text-white">
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const valLabel = Math.round(maxValue * ratio);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} strokeDasharray="3 3" />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" fill="#64748B" className="font-mono text-[8px]">
                ₹{valLabel >= 1000 ? (valLabel / 1000).toFixed(0) + "K" : valLabel}
              </text>
            </g>
          );
        })}

        {/* X Axis Line */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)"} />

        {/* Bars */}
        {data.map((item, idx) => {
          const barWidth = Math.min(30, chartWidth / (data.length || 1) * 0.5);
          const gap = (chartWidth - barWidth * data.length) / (data.length + 1);
          const x = paddingLeft + gap + idx * (barWidth + gap);
          const barHeight = (item.value / maxValue) * chartHeight;
          const y = height - paddingBottom - barHeight;

          return (
            <g key={idx} className="group cursor-pointer">
              {/* Glowing gradient bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#neonGradient)"
                className="transition-all duration-300 hover:opacity-80"
                rx="3"
              />
              <text x={x + barWidth / 2} y={height - paddingBottom + 14} textAnchor="middle" fill="#94A3B8" className="font-mono text-[7.5px] font-semibold">
                {item.label}
              </text>
              {/* Tooltip value */}
              <text x={x + barWidth / 2} y={Math.max(12, y - 5)} textAnchor="middle" fill="#3B82F6" className="font-mono text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                ₹{Math.round(item.value).toLocaleString()}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className={`flex-1 flex overflow-hidden relative ${isLight ? "bg-[#F8FAFC] text-[#0F172A]" : "bg-[#050816] text-white"}`}>
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-Manthan-glow-blue opacity-15 z-0" />

      {/* Main Workspace Scrollable */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-6 space-y-6">
        
        {/* Title Header */}
        <PageHeaderHUD
          title="Manthan.ai Analytics"
          subtitle="AI-OPERATIONAL COGNITIVE COMMAND CENTER"
          onSelectAgent={setSelectedAgent}
          actions={
            <div className={`flex items-center gap-1 p-1 rounded-xl font-mono text-[9px] font-bold overflow-x-auto whitespace-nowrap scrollbar-none max-w-full border ${isLight ? "bg-slate-100 border-[#E2E8F0]" : "bg-gray-950 border-gray-900"}`}>
              {["overview", "funnel", "diagnostics", "forecast", "personas", "voice"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider ${activeTab === tab ? (isLight ? "bg-white text-blue-600 border-[#BFDBFE] shadow-sm font-bold" : "bg-gray-850 text-white border border-gray-800 shadow") : (isLight ? "text-gray-500 hover:text-gray-900" : "text-gray-550 hover:text-gray-300")}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          }
        />

        {/* Global Feedback Banner */}
        {launchSuccessMsg && (
          <div className="bg-Manthan-success/15 border border-Manthan-success/30 rounded-xl p-3.5 flex items-center justify-between animate-fade-in-up font-mono text-xs text-Manthan-success">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="animate-bounce" />
              <span>{launchSuccessMsg}</span>
            </div>
            <button onClick={() => setLaunchSuccessMsg(null)} className={`cursor-pointer ${isLight ? "text-gray-400 hover:text-slate-900" : "text-gray-400 hover:text-white"}`}>×</button>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[
            { label: "Total Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}K`, raw: totalRevenue, delta: "+18.5%", icon: TrendingUp, color: "text-Manthan-success", border: "border-Manthan-success/15 bg-Manthan-success/5" },
            { label: "Campaign Revenue", value: `₹${(totalCampaignRevenue / 1000).toFixed(1)}K`, raw: totalCampaignRevenue, delta: "+24.2%", icon: Zap, color: "text-Manthan-blue", border: "border-Manthan-blue/15 bg-Manthan-blue/5" },
            { label: "Avg Order Value", value: `₹${Math.round(aov)}`, raw: aov, delta: "+4.1%", icon: ShoppingCart, color: "text-yellow-400", border: "border-yellow-400/15 bg-yellow-400/5" },
            { label: "Customer LTV", value: `₹${Math.round(ltv)}`, raw: ltv, delta: "+12.6%", icon: Users, color: "text-Manthan-purple", border: "border-Manthan-purple/15 bg-Manthan-purple/5" },
            { label: "Conversion Rate", value: `${avgConvRate}%`, raw: parseFloat(avgConvRate), delta: "+3.2%", icon: CheckCircle2, color: "text-Manthan-pink", border: "border-Manthan-pink/15 bg-Manthan-pink/5" },
            { label: "Avg Open Rate", value: `${avgOpenRate}%`, raw: avgOpenRate, delta: "+8.1%", icon: Mail, color: "text-Manthan-blue", border: "border-Manthan-blue/15 bg-Manthan-blue/5" },
            { label: "Avg CTR", value: `${avgCTR}%`, raw: avgCTR, delta: "+5.6%", icon: MousePointer, color: "text-Manthan-purple", border: "border-Manthan-purple/15 bg-Manthan-purple/5" },
            { label: "Repeat Purchase Rate", value: `${repeatPurchaseRate}%`, raw: repeatPurchaseRate, delta: "+6.8%", icon: BarChart2, color: "text-Manthan-success", border: "border-Manthan-success/15 bg-Manthan-success/5" },
            { label: "Customer Growth", value: "+14.2%", raw: 14.2, delta: "+2.1%", icon: Users, color: "text-yellow-400", border: "border-yellow-400/15 bg-yellow-400/5" },
            { label: "Revenue Growth", value: "+18.5%", raw: 18.5, delta: "+3.4%", icon: TrendingUp, color: "text-Manthan-success", border: "border-Manthan-success/15 bg-Manthan-success/5" }
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className={`Manthan-panel p-3.5 flex flex-col gap-1 hover:scale-[1.03] transition-all duration-300 ${m.border}`}>
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500">
                  <span className="uppercase tracking-wider truncate max-w-[80px]">{m.label}</span>
                  <Icon size={12} className={m.color} />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`font-space text-lg font-bold ${isLight ? "text-[#0F172A]" : "text-white"}`}>{m.value}</span>
                  <span className="font-mono text-[8.5px] text-Manthan-success flex items-center gap-0.5">
                    <ArrowUpRight size={9} />{m.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Live KPI Cards strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {[
                  { label: "Revenue Today", val: `₹${revenueToday.toLocaleString()}`, pct: todayPctChange.toFixed(1) + "%", comp: "vs yesterday", isUp: todayPctChange >= 0 },
                  { label: "Revenue This Week", val: `₹${revenueThisWeek.toLocaleString()}`, pct: weekPctChange.toFixed(1) + "%", comp: "vs last week", isUp: weekPctChange >= 0 },
                  { label: "Revenue This Month", val: `₹${revenueThisMonth.toLocaleString()}`, pct: monthPctChange.toFixed(1) + "%", comp: "vs last month", isUp: monthPctChange >= 0 },
                  { label: "Active Customers", val: activeCustomersCount.toString(), pct: "+6.8%", comp: "vs last week", isUp: true },
                  { label: "VIP Customers", val: vipCustomersCount.toString(), pct: "+4.2%", comp: "vs last week", isUp: true },
                  { label: "Repeat Buyers", val: repeatBuyersCount.toString(), pct: "+8.6%", comp: "vs last month", isUp: true },
                  { label: "At-Risk Customers", val: churnRiskCount.toString(), pct: "+12.1%", comp: "vs last week", isUp: false },
                  { label: "Campaign Success", val: `${campaignSuccessRate}%`, pct: "+2.4%", comp: "vs last month", isUp: true }
                ].map((kpi, idx) => (
                  <div key={idx} className={`Manthan-panel p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[90px] ${isLight ? "bg-white border-slate-200" : "border-gray-900/60 bg-gray-950/20"}`}>
                    <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest block">{kpi.label}</span>
                    <span className={`font-space text-xl font-bold mt-1 block ${isLight ? "text-[#0F172A]" : "text-white"}`}>{kpi.val}</span>
                    
                    <div className="flex items-center justify-between mt-2 font-mono text-[8px]">
                      <span className={kpi.isUp ? "text-Manthan-success" : "text-red-400"}>
                        {kpi.isUp ? "▲" : "▼"} {kpi.pct}
                      </span>
                      <span className="text-gray-650 italic">{kpi.comp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue Intelligence Panel */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-Manthan-blue" />
                    <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Revenue Intelligence Panel</span>
                  </div>

                  {/* Channel selectors */}
                  <div className={`flex items-center gap-1 p-1 rounded-lg border font-mono text-[8px] overflow-x-auto whitespace-nowrap scrollbar-none max-w-full ${isLight ? "bg-slate-100 border-slate-200" : "bg-black/60 border-gray-900"}`}>
                    {(["All", "WhatsApp", "Email", "SMS", "RCS", "Instagram"] as const).map(ch => (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        className={`px-2 py-1 rounded transition-all cursor-pointer shrink-0 ${
                          channelFilter === ch ? (isLight ? "bg-[#EFF6FF] text-blue-600 border-[#BFDBFE] font-bold" : "bg-Manthan-blue/20 text-Manthan-blue border border-Manthan-blue/30 font-bold") : (isLight ? "text-gray-500 hover:text-gray-900" : "text-gray-550 hover:text-gray-300")
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-selector tabs */}
                <div className={`flex items-center gap-2 border-b pb-2.5 font-mono text-[8.5px] font-bold overflow-x-auto whitespace-nowrap scrollbar-none max-w-full ${isLight ? "border-slate-200" : "border-gray-950"}`}>

                  {[
                    { id: "campaign", label: "REVENUE BY CAMPAIGN" },
                    { id: "channel", label: "REVENUE BY CHANNEL" },
                    { id: "segment", label: "REVENUE BY SEGMENT" },
                    { id: "month", label: "REVENUE BY MONTH" },
                    { id: "forecast", label: "FORECAST PROJECTIONS" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveRevenueBreakdown(tab.id as any)}
                      className={`pb-1 border-b transition-all cursor-pointer shrink-0 ${
                        activeRevenueBreakdown === tab.id ? "text-Manthan-purple border-Manthan-purple font-extrabold" : "text-gray-500 border-transparent hover:text-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Live rendering of custom SVG charts */}
                <div className={`rounded-xl border p-4 min-h-[190px] flex items-center justify-center relative ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/35 border-gray-950"}`}>

                  
                  {activeRevenueBreakdown === "campaign" && (
                    <div className="w-full">
                      {revenueChartData.length > 0 ? renderSVGChart(revenueChartData) : (
                        <span className="font-mono text-xs text-gray-500">No campaigns found for current filters.</span>
                      )}
                    </div>
                  )}

                  {activeRevenueBreakdown === "channel" && (
                    <div className="w-full">{renderSVGChart(channelChartData)}</div>
                  )}

                  {activeRevenueBreakdown === "segment" && (
                    <div className="w-full">{renderSVGChart(segmentChartData)}</div>
                  )}

                  {activeRevenueBreakdown === "month" && (
                    <div className="w-full">{renderSVGChart(monthChartData)}</div>
                  )}

                  {activeRevenueBreakdown === "forecast" && (
                    <div className="w-full flex flex-col space-y-3">
                      {renderSVGChart([
                        { label: "Today", value: totalRevenue },
                        { label: "+7 Days", value: totalRevenue + 14500 },
                        { label: "+14 Days", value: totalRevenue + 28900 },
                        { label: "+30 Days", value: totalRevenue + 58000 },
                        { label: "+90 Days", value: totalRevenue + 192000 }
                      ])}
                      <span className="font-mono text-[8px] text-Manthan-purple text-center uppercase tracking-widest animate-pulse">
                        Khoj forecast sequence locked: 89.2% expected accuracy model
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Channel Performance Center */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Channel Performance Center</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left font-mono text-[9px] divide-y ${isLight ? "divide-slate-200" : "divide-gray-950"}`}>

                    <thead>
                      <tr className={isLight ? "text-slate-500" : "text-gray-550"}>
                        <th className="pb-2">CHANNEL</th>
                        <th className="pb-2">MESSAGES SENT</th>
                        <th className="pb-2">OPENS</th>
                        <th className="pb-2">CLICKS</th>
                        <th className="pb-2">CONVERSIONS</th>
                        <th className="pb-2 text-right">REVENUE GENERATED</th>
                        <th className="pb-2 text-right">ROI YIELD</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-gray-300 ${isLight ? "divide-slate-100 text-slate-700" : "divide-gray-950"}`}>

                      {channelMetrics.map((ch, idx) => (
                        <tr key={idx} className={isLight ? "hover:bg-slate-50" : "hover:bg-gray-900/10"}>
                          <td className={`py-2.5 font-bold font-space ${isLight ? "text-slate-900" : "text-white"}`}>{ch.channel}</td>
                          <td className="py-2.5">{ch.sent.toLocaleString()}</td>
                          <td className="py-2.5 text-Manthan-blue">{ch.opens}</td>
                          <td className="py-2.5 text-Manthan-purple">{ch.clicks}</td>
                          <td className="py-2.5 text-Manthan-pink">{ch.conv}</td>
                          <td className={`py-2.5 text-right font-bold ${isLight ? "text-slate-900" : "text-white"}`}>₹{ch.revenue.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-Manthan-success font-bold">{ch.roi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Intelligence */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Customer Segment Intelligence</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                  {customerSegments.map((seg, idx) => (
                    <div key={idx} className={`p-3.5 rounded-xl space-y-2 relative overflow-hidden flex flex-col justify-between border ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-gray-900/60"}`}>
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`font-space text-[10px] font-bold leading-none ${isLight ? "text-slate-900" : "text-white"}`}>{seg.name.split(" ")[0]}</span>
                          <span className={`font-mono text-[8px] px-1 py-0.5 rounded ${
                            seg.trend.startsWith("+") ? "text-Manthan-success bg-Manthan-success/5 border border-Manthan-success/15" : "text-red-400 bg-red-500/5 border border-red-500/15"
                          }`}>{seg.trend}</span>
                        </div>
                        <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mt-0.5 block">{seg.name}</span>
                      </div>

                      <div className="space-y-1 mt-2.5 font-mono text-[8.5px]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Count:</span>
                          <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{seg.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Contrib:</span>
                          <span className="text-Manthan-blue font-bold">{seg.contribution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Spend:</span>
                          <span className={isLight ? "text-slate-900" : "text-white"}>₹{seg.avgSpend}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">LTV:</span>
                          <span className={isLight ? "text-slate-900" : "text-white"}>₹{seg.ltv}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pred. LTV:</span>
                          <span className="text-Manthan-purple font-bold">₹{seg.predictedValue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission Performance */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Mission Performance Ledger</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className={`w-full text-left font-mono text-[9px] divide-y ${isLight ? "divide-slate-200" : "divide-gray-950"}`}>

                    <thead>
                      <tr className={isLight ? "text-slate-500" : "text-gray-550"}>
                        <th className="pb-2">MISSION NAME</th>
                        <th className="pb-2">STATUS</th>
                        <th className="pb-2">AUDIENCE SIZE</th>
                        <th className="pb-2">CHANNEL</th>
                        <th className="pb-2 text-right">REVENUE GENERATED</th>
                        <th className="pb-2 text-right">ROI YIELD</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-gray-300 ${isLight ? "divide-slate-100 text-slate-700" : "divide-gray-950"}`}>

                      {localCampaigns.map((camp, idx) => {
                        const roiVal = camp.revenueGenerated > 0 
                          ? (camp.revenueGenerated / (camp.sentCount * 0.5 || 100)).toFixed(1) + "x" 
                          : "0.0x";
                        return (
                          <tr key={idx} className={isLight ? "hover:bg-slate-50" : "hover:bg-gray-900/10"}>
                            <td className={`py-2.5 font-bold font-space ${isLight ? "text-slate-900" : "text-white"}`}>{camp.name}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] uppercase ${
                                camp.status === "Completed" || camp.status === "Delivered"
                                  ? "bg-Manthan-success/10 text-Manthan-success border border-Manthan-success/20"
                                  : camp.status === "Sending"
                                  ? "bg-Manthan-blue/10 text-Manthan-blue border border-Manthan-blue/20 animate-pulse"
                                  : "bg-gray-800 text-gray-500 border border-gray-700"
                              }`}>{camp.status}</span>
                            </td>
                            <td className="py-2.5">{camp.sentCount || camp.audienceSize}</td>
                            <td className="py-2.5 text-Manthan-blue">{camp.channel}</td>
                            <td className={`py-2.5 text-right font-bold ${isLight ? "text-slate-900" : "text-white"}`}>₹{(camp.revenueGenerated || 0).toLocaleString()}</td>
                            <td className="py-2.5 text-right text-Manthan-success font-bold">{roiVal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (1/3 Width) */}
            <div className="space-y-6">
              
              {/* AI Executive Summary */}
              <div className={`Manthan-panel p-5 space-y-4 relative overflow-hidden ${isLight ? "border-purple-300 bg-purple-50/50" : "border-Manthan-purple/20 bg-Manthan-purple/5 shadow-[0_0_25px_rgba(139,92,246,0.15)]"}`}>
                {/* Visual scanline */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-Manthan-purple opacity-40 animate-scan-beam" />
                
                <div className={`flex justify-between items-center border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-Manthan-purple animate-pulse" />
                    <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Today's Business Briefing</span>
                  </div>
                  <button 
                    onClick={() => generateAISummary()} 
                    disabled={aiSummaryLoading}
                    className={`p-1 rounded transition-colors cursor-pointer ${isLight ? "hover:bg-slate-100 text-gray-400 hover:text-slate-900" : "hover:bg-gray-900 text-gray-550 hover:text-white"}`}
                    title="Refresh AI summary"
                  >
                    <RefreshCw size={11} className={aiSummaryLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {aiSummaryLoading ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 font-mono text-[9px] text-gray-500">
                    <div className="flex gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <span className="uppercase tracking-widest mt-1.5">Generating AI Insights...</span>
                  </div>
                ) : (
                  <div className={`font-mono text-[9.5px] leading-relaxed space-y-3.5 whitespace-pre-line ${isLight ? "text-slate-700" : "text-gray-300"}`}>
                    {aiSummary}
                  </div>
                )}
                {aiSummaryError && (
                  <span className="font-mono text-[7px] text-yellow-500 uppercase tracking-wide block mt-2 text-right">
                    * Showing high-fidelity live fallback summary
                  </span>
                )}
              </div>

              {/* AI Recommendations Engine */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>AI Recommendations Engine</span>
                </div>

                <div className="space-y-3.5">
                  {recommendationsList.map((rec, i) => (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 relative overflow-hidden transition-all ${launchingMission === rec.title ? (isLight ? "bg-blue-50/50 border-blue-200" : "bg-Manthan-blue/5 border-Manthan-blue/20") : (isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-black/25 border-gray-950 hover:border-gray-900")}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-space text-[10px] font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{rec.title}</span>
                            <span className="font-mono text-[7px] text-Manthan-purple border border-Manthan-purple/30 bg-Manthan-purple/5 px-1.5 py-0.5 rounded uppercase font-bold">{rec.roi}</span>
                          </div>
                          <p className="font-mono text-[8.5px] text-gray-550 leading-normal">{rec.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-[9px] text-Manthan-success font-bold block">{rec.revenue}</span>
                          <span className="font-mono text-[7px] text-gray-600 block mt-0.5">via {rec.channel}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLaunchMission(rec)}
                        disabled={launchingMission !== null}
                        className={`w-full py-2 bg-gradient-to-tr from-Manthan-blue to-Manthan-purple text-white font-bold rounded-lg text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          launchingMission === rec.title ? "opacity-50" : "hover:shadow-Manthan-glow"
                        }`}
                      >
                        {launchingMission === rec.title ? (
                          <>
                            <RefreshCw size={9} className="animate-spin" />
                            <span>LAUNCHING DISPATCH...</span>
                          </>
                        ) : (
                          <>
                            <Play size={8} fill="#fff" />
                            <span>Launch Mission</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agent Contribution Report */}
              <div className="Manthan-panel p-5 space-y-4">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Agent Contribution Report</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { agent: "Drishti", act: `Mapped ${customers.length} target customers`, score: 98, role: "Audience cluster compiler" },
                    { agent: "Pragya", act: `Flagged ${atRiskCustomers.length} slipping profiles (₹${lunaMetrics?.recoverableRevenue?.toLocaleString()} at risk)`, score: 91, role: "Leak auditor" },
                    { agent: "Khoj", act: `Forecasted baseline conversions & scenario ROIs`, score: 87, role: "ROI Forecaster" },
                    { agent: "Rachna", act: `Drafted 10+ custom marketing copy variants`, score: 75, role: "Autonomous copywriter" },
                    { agent: "Saarthi", act: `Delivered ${totalSent.toLocaleString()} webhook templates successfully`, score: 95, role: "Outbound dispatcher" }
                  ].map((contrib, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedAgent(contrib.agent as any)}
                      className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-gray-950/45 border-gray-900/60 hover:border-gray-800"}`}
                      title={`Click to inspect ${contrib.agent} specs`}
                    >
                      <div>
                        <span className={`font-space text-[10px] font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{contrib.agent}</span>
                        <p className="font-mono text-[8px] text-gray-500 uppercase mt-0.5">{contrib.role}</p>
                        <p className={`font-mono text-[8.5px] mt-1 ${isLight ? "text-slate-655" : "text-gray-300"}`}>{contrib.act}</p>
                      </div>
                      <span className="font-mono text-[9px] text-Manthan-success bg-Manthan-success/5 border border-Manthan-success/15 px-2 py-0.5 rounded font-bold">{contrib.score}% sync</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Center */}
              <div className="Manthan-panel p-5 space-y-3.5">
                <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Report & Export Center</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => window.print()}
                    className={`py-2.5 border rounded-xl font-mono text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${isLight ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300" : "bg-gray-950 border-gray-900 hover:border-gray-800 text-gray-300"}`}
                  >
                    <FileText size={10} />
                    <span>Print PDF</span>
                  </button>
                  
                  <button 
                    onClick={handleExportCSV}
                    className={`py-2.5 border rounded-xl font-mono text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${isLight ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300" : "bg-gray-950 border-gray-900 hover:border-gray-800 text-gray-300"}`}
                  >
                    <Download size={10} />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  {[
                    { id: "executive", label: "Generate Executive Report" },
                    { id: "investor", label: "Generate Investor Deck" },
                    { id: "client", label: "Generate Client Ledger" }
                  ].map(report => (
                    <button
                      key={report.id}
                      onClick={() => handleGenerateAIReport(report.id as any)}
                      className={`w-full py-2 rounded-xl font-mono text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer border ${isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700" : "bg-gray-900/60 border-gray-800 hover:border-blue-500/30 text-gray-300 hover:text-white"}`}
                    >
                      <Brain size={10} className="text-Manthan-purple" />
                      <span>{report.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Autonomous Analytics Workflow */}
              <div className="Manthan-panel p-5 space-y-3 font-mono text-[8px]">
                <div className={`border-b pb-3 flex items-center justify-between ${isLight ? "border-slate-200" : "border-gray-900"}`}>
                  <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Autonomous Workflow</span>
                  <LoopIcon size={10} className="text-Manthan-success animate-spin-slow" />
                </div>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {workflowLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-gray-400">
                      <span className="text-Manthan-success">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Funnel Visualizer */}
        {activeTab === "funnel" && (
          <div className="Manthan-panel p-6 space-y-6">
            <div className={`border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>
              <span className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Full Funnel Conversion Performance</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              
              {/* SVG Funnel Visualizer */}
              <div className="lg:col-span-2 bg-black/20 p-5 rounded-2xl border border-gray-950 flex justify-center items-center">
                <svg viewBox="0 0 500 280" className="w-full max-w-lg text-white">
                  {/* Trapazoids representing layers */}
                  {/* Layer 1: Visitors */}
                  <polygon points="50,10 450,10 400,55 100,55" fill="rgba(59,130,246,0.3)" stroke="#3B82F6" strokeWidth="1.5" className="hover:opacity-85 transition-opacity cursor-pointer" />
                  {/* Layer 2: Leads */}
                  <polygon points="100,60 400,60 350,105 150,105" fill="rgba(139,92,246,0.3)" stroke="#8B5CF6" strokeWidth="1.5" className="hover:opacity-85 transition-opacity cursor-pointer" />
                  {/* Layer 3: Customers */}
                  <polygon points="150,110 350,110 300,155 200,155" fill="rgba(236,72,153,0.3)" stroke="#EC4899" strokeWidth="1.5" className="hover:opacity-85 transition-opacity cursor-pointer" />
                  {/* Layer 4: Repeat Buyers */}
                  <polygon points="200,160 300,160 260,205 240,205" fill="rgba(245,158,11,0.3)" stroke="#F59E0B" strokeWidth="1.5" className="hover:opacity-85 transition-opacity cursor-pointer" />
                  {/* Layer 5: VIP Customers */}
                  <polygon points="260,210 240,210 245,255 255,255" fill="rgba(34,197,94,0.3)" stroke="#22C55E" strokeWidth="1.5" className="hover:opacity-85 transition-opacity cursor-pointer" />

                  {/* Text labels on layers */}
                  <text x="250" y="33" textAnchor="middle" fill="#fff" className="font-space text-[10px] font-bold">1. VISITORS - {customers.length * 5}</text>
                  <text x="250" y="83" textAnchor="middle" fill="#fff" className="font-space text-[10px] font-bold">2. LEADS - {customers.filter(c => c.purchaseCount === 0).length + atRiskCustomers.length}</text>
                  <text x="250" y="133" textAnchor="middle" fill="#fff" className="font-space text-[10px] font-bold">3. CUSTOMERS - {customers.filter(c => c.purchaseCount >= 1).length}</text>
                  <text x="250" y="183" textAnchor="middle" fill="#fff" className="font-space text-[10px] font-bold">4. REPEAT BUYERS - {repeatBuyersCount}</text>
                  <text x="250" y="233" textAnchor="middle" fill="#fff" className="font-space text-[9px] font-bold">5. VIPs - {vipCustomersCount}</text>
                </svg>
              </div>

              {/* Conversion Statistics table */}
              <div className="space-y-4">
                <span className="font-space text-xs font-bold text-gray-400 uppercase tracking-widest block">Cohort Funnel Analytics</span>
                
                <div className="space-y-3 font-mono text-[9px]">
                  {[
                    { label: "Website Visitors", count: customers.length * 5, conversion: "100%", dropoff: "0%", contribution: "0%" },
                    { label: "Engaged Leads", count: customers.filter(c => c.purchaseCount === 0).length + atRiskCustomers.length, conversion: "76%", dropoff: "24%", contribution: "0%" },
                    { label: "Purchasing Customers", count: customers.filter(c => c.purchaseCount >= 1).length, conversion: "62%", dropoff: "14%", contribution: "68%" },
                    { label: "Repeat Buyers", count: repeatBuyersCount, conversion: `${repeatPurchaseRate}%`, dropoff: "42%", contribution: "84%" },
                    { label: "VIP Loyalists", count: vipCustomersCount, conversion: `${Math.round(vipCustomersCount / (customers.length || 1) * 100)}%`, dropoff: "58%", contribution: "42%" }
                  ].map((stage, idx) => (
                    <div key={idx} className="p-3 bg-gray-950/50 border border-gray-900 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold text-white">
                        <span>{stage.label}</span>
                        <span>{stage.count} profiles</span>
                      </div>
                      <div className="flex justify-between text-gray-550 pt-1 text-[8.5px]">
                        <span>Conversion: <span className="text-Manthan-success">{stage.conversion}</span></span>
                        <span>Drop-off: <span className="text-red-400">{stage.dropoff}</span></span>
                        <span>Rev share: <span className="text-Manthan-blue">{stage.contribution}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Diagnostics */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* System Health Indicators */}
            <div className="lg:col-span-1 space-y-4">
              <div className="Manthan-panel p-5 space-y-3.5">
                <div className="border-b border-gray-900 pb-3">
                  <span className="font-space text-xs font-bold uppercase tracking-wider text-white">AI System Health HUD</span>
                </div>

                <div className="space-y-3 font-mono text-[10px]">
                  {[
                    { label: "Campaign Health", rate: "94%", desc: "Autonomous matching accuracy metrics", color: "text-Manthan-success" },
                    { label: "Agent Synchronization", rate: "98%", desc: "Khoj, Drishti, and Pragya threads active", color: "text-Manthan-success" },
                    { label: "Database Socket Sync", rate: "99.9%", desc: "Firestore collections online", color: "text-Manthan-blue" },
                    { label: "Outbound Delivery", rate: "96.4%", desc: "Twilio message gateway throughput", color: "text-Manthan-success" },
                    { label: "Revenue Health", rate: "92.1%", desc: "Baseline ROI yield ratios stability", color: "text-Manthan-purple" },
                    { label: "Khoj Forecast Accuracy", rate: "89.2%", desc: "Deviation offset tolerance", color: "text-Manthan-pink" }
                  ].map((health, idx) => (
                    <div key={idx} className="p-3 bg-black/20 border border-gray-900 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white">{health.label}</span>
                        <p className="text-[8px] text-gray-550 mt-0.5 leading-none">{health.desc}</p>
                      </div>
                      <span className={`font-bold font-space text-xs ${health.color}`}>{health.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Diagnostics Report */}
            <div className={`lg:col-span-2 Manthan-panel p-5 space-y-4 border ${isLight ? "border-red-200 bg-red-50/50" : "border-red-500/15 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]"}`}>
              <div className="flex justify-between items-center border-b border-gray-950 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400 animate-pulse" />
                  <span className="font-space text-xs font-bold uppercase tracking-wider text-white">AI Diagnostics Report</span>
                </div>
                <button
                  onClick={() => generateAIDiagnostics()}
                  disabled={aiDiagnosticsLoading}
                  className={`p-1 rounded transition-colors cursor-pointer ${isLight ? "hover:bg-slate-100 text-gray-400 hover:text-slate-900" : "hover:bg-gray-900 text-gray-550 hover:text-white"}`}
                  title="Reload diagnostics"
                >
                  <RefreshCw size={11} className={aiDiagnosticsLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {aiDiagnosticsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 font-mono text-[9px] text-gray-500">
                  <div className="flex gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                  <span className="uppercase tracking-widest mt-1.5">Generating AI Diagnostic Audit...</span>
                </div>
              ) : aiDiagnostics ? (
                <div className="space-y-4 font-mono text-[9.5px]">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                      <span className="font-bold text-Manthan-success block uppercase tracking-wider text-[8px]">✔ What's Working</span>
                      <p className="text-gray-350 leading-relaxed">{aiDiagnostics.working}</p>
                    </div>
                    
                    <div className="p-3 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                      <span className="font-bold text-red-400 block uppercase tracking-wider text-[8px]">⚠ What's Failing</span>
                      <p className="text-gray-350 leading-relaxed">{aiDiagnostics.failing}</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                    <span className="font-bold text-yellow-500 block uppercase tracking-wider text-[8px]">⚡ Biggest Revenue Leak</span>
                    <p className="text-gray-350 leading-relaxed font-bold">{aiDiagnostics.leak}</p>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-gray-900 rounded-xl space-y-1">
                    <span className="font-bold text-Manthan-blue block uppercase tracking-wider text-[8px]">✦ Highest Opportunity</span>
                    <p className="text-gray-350 leading-relaxed font-bold">{aiDiagnostics.opportunity}</p>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-gray-900 rounded-xl space-y-2">
                    <span className="font-bold text-Manthan-purple block uppercase tracking-wider text-[8px]">⚙ Recommended Core Actions</span>
                    <ul className="space-y-1 text-gray-400">
                      {aiDiagnostics.recommendations?.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-Manthan-purple">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {aiDiagnosticsError && (
                    <span className="text-[7.5px] text-yellow-500 uppercase font-bold text-right block mt-2">
                      * Running on diagnostic local heuristics
                    </span>
                  )}
                </div>
              ) : null}
            </div>

          </div>
        )}

        {/* Tab 4: Forecast Center */}
        {activeTab === "forecast" && (
          <div className="Manthan-panel p-6 space-y-6">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

              <div className="flex items-center gap-2">
                <Brain size={14} className="text-Manthan-pink" />
                <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Khoj Forecast Center</span>
              </div>

              {/* Period selection */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-gray-900 font-mono text-[8px] font-bold">
                {[
                  { id: "7", label: "7 DAYS" },
                  { id: "30", label: "30 DAYS" },
                  { id: "90", label: "90 DAYS" }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setForecastPeriod(p.id as any)}
                    className={`px-2 py-1 rounded transition-all cursor-pointer ${
                      forecastPeriod === p.id ? "bg-Manthan-pink/20 text-Manthan-pink border border-Manthan-pink/30" : "text-gray-550 hover:text-gray-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              
              {/* Forecast SVG Line graph */}
              <div className="lg:col-span-2 bg-black/25 p-5 rounded-2xl border border-gray-950 flex flex-col justify-center relative">
                <span className="font-mono text-[8.5px] text-gray-550 uppercase tracking-widest block mb-4">Historical vs Khoj Predicted Revenue Trends</span>
                
                <svg viewBox="0 0 500 200" className="w-full h-44 text-white">
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 15 + 150 * (1 - ratio);
                    return (
                      <line key={idx} x1="40" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.03)" />
                    );
                  })}

                  {/* Historical Solid Line */}
                  <path
                    d={`M 50,150 L 120,130 L 190,140 L 260,95 L 330,80`}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    className="drop-shadow-[0_0_6px_#3B82F6]"
                  />

                  {/* Future Forecasted Dashed Line */}
                  <path
                    d={forecastPeriod === "7" 
                      ? `M 330,80 L 400,65 L 470,55` 
                      : forecastPeriod === "30" 
                      ? `M 330,80 L 400,55 L 470,30` 
                      : `M 330,80 L 400,45 L 470,15`
                    }
                    fill="none"
                    stroke="#EC4899"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="drop-shadow-[0_0_8px_#EC4899]"
                  />

                  {/* Historical Dots */}
                  <circle cx="50" cy="150" r="3.5" fill="#3B82F6" />
                  <circle cx="120" cy="130" r="3.5" fill="#3B82F6" />
                  <circle cx="190" cy="140" r="3.5" fill="#3B82F6" />
                  <circle cx="260" cy="95" r="3.5" fill="#3B82F6" />
                  <circle cx="330" cy="80" r="4" fill="#8B5CF6" />

                  {/* Predicted Dots */}
                  {forecastPeriod === "7" && (
                    <>
                      <circle cx="400" cy="65" r="3.5" fill="#EC4899" />
                      <circle cx="470" cy="55" r="3.5" fill="#EC4899" />
                    </>
                  )}
                  {forecastPeriod === "30" && (
                    <>
                      <circle cx="400" cy="55" r="3.5" fill="#EC4899" />
                      <circle cx="470" cy="30" r="3.5" fill="#EC4899" />
                    </>
                  )}
                  {forecastPeriod === "90" && (
                    <>
                      <circle cx="400" cy="45" r="3.5" fill="#EC4899" />
                      <circle cx="470" cy="15" r="3.5" fill="#EC4899" />
                    </>
                  )}

                  {/* Vertical separator */}
                  <line x1="330" y1="10" x2="330" y2="175" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" />
                  <text x="325" y="165" textAnchor="end" fill="#64748B" className="font-mono text-[7px]">TODAY</text>
                  <text x="335" y="165" textAnchor="start" fill="#EC4899" className="font-mono text-[7px] font-bold">PREDICTED</text>
                </svg>
              </div>

              {/* Forecasting stats */}
              <div className="space-y-4 font-mono text-[9px]">
                <span className="font-space text-xs font-bold text-gray-400 uppercase tracking-widest block">Forecast Summary Parameters</span>

                {[
                  { label: "Predicted Revenue", val: forecastPeriod === "7" ? `₹${Math.round(totalRevenue + 14500).toLocaleString()}` : forecastPeriod === "30" ? `₹${Math.round(totalRevenue + 58000).toLocaleString()}` : `₹${Math.round(totalRevenue + 192000).toLocaleString()}`, desc: `Incremental change projection over current total`, color: isLight ? "text-slate-900" : "text-white" },
                  { label: "Predicted Customer Nodes", val: forecastPeriod === "7" ? `+8 signups` : forecastPeriod === "30" ? `+24 signups` : `+92 signups`, desc: "Expected database size growth", color: "text-Manthan-blue" },
                  { label: "Forecasted Average ROI", val: forecastPeriod === "7" ? "4.1x" : forecastPeriod === "30" ? "4.3x" : "4.5x", desc: "Outbound campaign yield average multiplier", color: "text-Manthan-success" },
                  { label: "Model Confidence Score", val: forecastPeriod === "7" ? "92%" : forecastPeriod === "30" ? "88%" : "84%", desc: "Khoj algorithm confidence calculation", color: "text-Manthan-pink" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-950/50 border border-gray-900 rounded-xl flex items-center justify-between">
                    <div>
                      <span className={`font-bold block ${isLight ? "text-slate-900" : "text-white"}`}>{item.label}</span>
                      <span className="text-[7.5px] text-gray-550">{item.desc}</span>
                    </div>
                    <span className={`font-space font-bold text-xs ${item.color}`}>{item.val}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {activeTab === "personas" && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Top row overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {personas.map((p) => {
                return (
                  <div key={p.id} className={`p-4 rounded-xl border ${isLight ? "bg-white border-gray-200" : "bg-[#0c0f20]/60 border-gray-800"}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500 truncate max-w-[120px]">{p.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.id.includes("vip") ? "bg-purple-500" : p.id.includes("trend") ? "bg-pink-500" : p.id.includes("dormant") ? "bg-amber-500" : p.id.includes("value") ? "bg-orange-500" : "bg-emerald-500"}`} />
                    </div>
                    <span className="font-space text-base font-bold block text-white">₹{(p.predictedLtv * p.customerCount).toLocaleString()}</span>
                    <span className="font-mono text-[9px] text-gray-400">LTV Value ({p.revenueContributionPct}% share)</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Persona Revenue Contribution Chart */}
              <div className={`p-5 rounded-xl border ${isLight ? "bg-white border-gray-200" : "bg-[#0f172a]/60 border-gray-800/80"}`}>
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Persona Revenue Contribution Chart
                </h3>
                <div className="space-y-4">
                  {personas.map((p) => {
                    const contributionPct = p.revenueContributionPct;
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px]">
                          <span className="text-gray-300">{p.name}</span>
                          <span className="text-white font-bold">{contributionPct}%</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden border ${isLight ? "bg-slate-200 border-slate-350" : "bg-gray-950 border-gray-900"}`}>

                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-Manthan-blue to-Manthan-purple"
                            style={{ width: `${contributionPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[8px] text-gray-500 block">Contrib value: ₹{(p.predictedLtv * p.customerCount).toLocaleString()} LTV</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Persona Risk Heatmap */}
              <div className={`p-5 rounded-xl border ${isLight ? "bg-white border-gray-200" : "bg-[#0f172a]/60 border-gray-800/80"}`}>
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Persona Risk Heatmap
                </h3>
                <div className="space-y-3">
                  {[...personas].sort((a,b) => b.riskScore - a.riskScore).map((p) => {
                    const score = p.riskScore;
                    let badgeColor = "bg-green-500/10 text-green-400 border border-green-500/25";
                    if (score >= 70) badgeColor = "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                    else if (score >= 40) badgeColor = "bg-orange-500/15 text-orange-400 border border-orange-500/25";
                    else if (score >= 20) badgeColor = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";

                    return (
                      <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg font-mono text-[10px] border ${isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-gray-950/40 border-gray-900"}`}>
                        <div>
                          <span className="text-gray-300 block font-bold">{p.name}</span>
                          <span className="text-[8px] text-gray-500">Churn trend indicators: {p.riskScore >= 50 ? "Unstable / Inactive" : "Stable / Active"}</span>
                        </div>
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[9px] uppercase ${badgeColor}`}>
                          {p.riskLevel} ({score}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Persona Growth Potential Chart */}
              <div className={`p-5 rounded-xl border ${isLight ? "bg-white border-gray-200" : "bg-[#0f172a]/60 border-gray-800/80"}`}>
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Persona Growth Potential Chart
                </h3>
                <div className="space-y-4 font-mono text-[10px]">
                  {personas.map((p) => {
                    const current = p.predictedLtv;
                    const potential = p.revenuePotential;
                    const pct = Math.round((current / (potential || 1)) * 100);
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between text-gray-350">
                          <span>{p.name}</span>
                          <span className="text-white font-bold">₹{current.toLocaleString()} / ₹{potential.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className={`h-2 rounded-full overflow-hidden border relative ${isLight ? "bg-slate-200 border-slate-350" : "bg-gray-950 border-gray-900"}`}>

                          <div 
                            className="h-full rounded-full bg-Manthan-success"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] text-gray-500">
                          <span>Current value realized</span>
                          <span className="text-Manthan-blue">Growth Headroom: ₹{(potential - current).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Persona Channel Preference Breakdown */}
              <div className={`p-5 rounded-xl border ${isLight ? "bg-white border-gray-200" : "bg-[#0f172a]/60 border-gray-800/80"}`}>
                <h3 className="font-space text-xs font-bold text-white uppercase tracking-wider mb-4">
                  Persona Channel Preference Breakdown
                </h3>
                <div className="space-y-3.5">
                  {["WhatsApp", "Email", "SMS", "RCS"].map((channel) => {
                    const channelPersonas = personas.filter(p => p.preferredChannel === channel);
                    const totalChannelCustomers = channelPersonas.reduce((sum, p) => sum + p.customerCount, 0);
                    const pct = Math.round((totalChannelCustomers / (customers.length || 1)) * 100);
                    return (
                      <div key={channel} className="space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between items-baseline">
                          <span className="text-white font-bold uppercase">{channel}</span>
                          <span className="text-gray-400">{totalChannelCustomers} customers ({pct}%)</span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden border ${isLight ? "bg-slate-200 border-slate-300" : "bg-gray-950 border-gray-900"}`}>

                          <div 
                            className="h-full rounded-full bg-Manthan-blue"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1 text-[8px] text-gray-500">
                          {channelPersonas.map(p => (
                            <span key={p.id} className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-[7.5px] uppercase">{p.name}</span>
                          ))}
                          {channelPersonas.length === 0 && <span className="text-gray-600">No segment assigned</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "voice" && (() => {
          const totalCusts = customers.length || 1;
          const posCount = customers.filter(c => c.customerSentiment === "Positive").length;
          const negCount = customers.filter(c => c.customerSentiment === "Negative").length;
          const neuCount = customers.filter(c => c.customerSentiment === "Neutral" || !c.customerSentiment).length;

          const posPct = Math.round((posCount / totalCusts) * 100);
          const negPct = Math.round((negCount / totalCusts) * 100);
          const neuPct = Math.round((neuCount / totalCusts) * 100);

          const cohorts = [
            { id: "Recent Buyer", label: "Recent Buyers", desc: "Purchased within 30d", color: "#10B981", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { id: "Cooling Period", label: "Cooling Period", desc: "Purchased 31d-60d ago", color: "#3B82F6", bg: "bg-blue-500/10", border: "border-blue-500/20" },
            { id: "Miss You", label: "Miss You", desc: "Purchased 61d-90d ago", color: "#F59E0B", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { id: "Inactive", label: "Inactive", desc: "Purchased 91d-180d ago", color: "#EC4899", bg: "bg-pink-500/10", border: "border-pink-500/20" },
            { id: "Dormant", label: "Dormant", desc: "Purchased > 180d ago", color: "#EF4444", bg: "bg-red-500/10", border: "border-red-500/20" }
          ];

          const allReviews: { customerId: string; customerName: string; sentiment: string; text: string }[] = [];
          customers.forEach(c => {
            if (c.reviews && c.reviews.length > 0) {
              c.reviews.forEach(r => {
                allReviews.push({
                  customerId: c.id,
                  customerName: c.name,
                  sentiment: c.customerSentiment || "Neutral",
                  text: r
                });
              });
            }
          });

          const cohortFiltered = customers.filter(c => {
            const matchesCohort = selectedLifecycleCohort ? c.lifecycleStage === selectedLifecycleCohort : true;
            const matchesSearch = voiceSearchQuery.trim() === "" ||
              c.name.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
              c.id.toLowerCase().includes(voiceSearchQuery.toLowerCase()) ||
              (c.email && c.email.toLowerCase().includes(voiceSearchQuery.toLowerCase()));
            return matchesCohort && matchesSearch;
          });

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Sentiment Insights */}
                <div className={`lg:col-span-1 border rounded-2xl p-5 space-y-4 ${isLight ? "bg-white border-slate-200" : "bg-gray-950/40 border-gray-900"}`}>

                  <div className={`flex items-center gap-1.5 border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                    <MessageSquare size={16} className="text-Manthan-purple" />
                    <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Customer Sentiment Analysis</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between items-baseline">
                        <span className="text-green-400 font-bold flex items-center gap-1">
                          <Smile size={12} /> POSITIVE
                        </span>
                        <span className="text-gray-400">{posCount} ({posPct}%)</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden border ${isLight ? "bg-slate-200 border-slate-300" : "bg-gray-950 border-gray-900"}`}>

                        <div className="h-full rounded-full bg-green-500" style={{ width: `${posPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between items-baseline">
                        <span className="text-gray-300 font-bold flex items-center gap-1">
                          <Meh size={12} /> NEUTRAL
                        </span>
                        <span className="text-gray-400">{neuCount} ({neuPct}%)</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden border ${isLight ? "bg-slate-200 border-slate-300" : "bg-gray-950 border-gray-900"}`}>

                        <div className="h-full rounded-full bg-gray-450" style={{ width: `${neuPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between items-baseline">
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <Frown size={12} /> NEGATIVE
                        </span>
                        <span className="text-gray-400">{negCount} ({negPct}%)</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden border ${isLight ? "bg-slate-200 border-slate-300" : "bg-gray-950 border-gray-900"}`}>

                        <div className="h-full rounded-full bg-red-500" style={{ width: `${negPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lifecycle Cohorts */}
                <div className={`lg:col-span-2 border rounded-2xl p-5 space-y-4 ${isLight ? "bg-white border-slate-200" : "bg-gray-950/40 border-gray-900"}`}>

                  <div className={`flex justify-between items-center border-b pb-3 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                    <div className="flex items-center gap-1.5">
                      <Activity size={16} className="text-blue-400" />
                      <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Customer Lifecycle Cohorts</h3>
                    </div>
                    {selectedLifecycleCohort && (
                      <button 
                        onClick={() => setSelectedLifecycleCohort(null)}
                        className="text-[8.5px] font-mono text-gray-500 hover:text-white uppercase transition-colors"
                      >
                        Clear Filter [x]
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {cohorts.map(coh => {
                      const count = customers.filter(c => c.lifecycleStage === coh.id).length;
                      const active = selectedLifecycleCohort === coh.id;
                      
                      return (
                        <button
                          key={coh.id}
                          onClick={() => setSelectedLifecycleCohort(active ? null : coh.id)}
                          className={`flex flex-col p-3 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] duration-200 ${coh.bg} ${coh.border} ${
                            active ? "ring-2 ring-blue-500 border-transparent bg-opacity-30" : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span className="font-mono text-[9px] font-bold uppercase" style={{ color: coh.color }}>{coh.label}</span>
                          <span className={`font-space text-xl font-bold my-1 ${isLight ? "text-slate-900" : "text-white"}`}>{count}</span>
                          <span className="font-mono text-[7.5px] text-gray-450 mt-auto leading-tight">{coh.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Bottom Row: Reviews Feed and Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Reviews Feed */}
                <div className={`lg:col-span-4 border rounded-2xl p-5 flex flex-col max-h-[480px] ${isLight ? "bg-white border-slate-200" : "bg-gray-950/40 border-gray-900"}`}>

                  <div className={`flex items-center gap-1.5 border-b pb-3 mb-3 shrink-0 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                    <MessageSquare size={15} className="text-purple-400" />
                    <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Customer Voice Feed ({allReviews.length})</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {allReviews.length === 0 ? (
                      <div className="h-full flex items-center justify-center font-mono text-[9px] text-gray-650 uppercase py-10">No customer reviews recorded</div>
                    ) : (
                      allReviews.map((rev, idx) => {
                        const isSelected = selectedCustomerId === rev.customerId;
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedCustomerId(rev.customerId)}
                            className={`p-3 rounded-xl border font-mono text-[9.5px] text-gray-350 leading-relaxed cursor-pointer transition-all hover:border-gray-800 ${
                              isSelected ? (isLight ? "border-blue-500 bg-blue-50/50" : "border-blue-500 bg-blue-500/5") : (isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-gray-950/60 border-gray-900")
                            }`}
                          >
                            <div className="flex justify-between items-baseline mb-1.5">
                              <span className={`font-bold hover:underline ${isLight ? "text-slate-900" : "text-white"}`}>{rev.customerName}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded ${
                                rev.sentiment === "Positive" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                rev.sentiment === "Negative" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-gray-900 text-gray-455 border border-gray-800"
                              }`}>{rev.sentiment}</span>
                            </div>
                            <p className="italic">"{rev.text}"</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Directory */}
                <div className={`lg:col-span-8 border rounded-2xl p-5 flex flex-col max-h-[480px] ${isLight ? "bg-white border-slate-200" : "bg-gray-950/40 border-gray-900"}`}>

                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-3 shrink-0 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

                    <div className="flex items-center gap-1.5">
                      <Users size={15} className="text-blue-400" />
                      <h3 className={`font-space text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
                        {selectedLifecycleCohort ? `${selectedLifecycleCohort} Directory` : "All Customers Directory"} ({cohortFiltered.length})
                      </h3>
                    </div>

                    <div className="relative w-full sm:w-48">
                      <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="text"
                        placeholder="Search roster..."
                        value={voiceSearchQuery}
                        onChange={(e) => setVoiceSearchQuery(e.target.value)}
                        className={`w-full rounded-lg pl-8 pr-3 py-1 font-mono text-[9px] focus:outline-none border transition-colors ${isLight ? "bg-white border-slate-200 text-slate-800 focus:border-blue-500 placeholder-slate-400" : "bg-gray-950/80 border-gray-900 text-white placeholder-gray-650 focus:border-gray-800"}`}
                      />
                    </div>
                  </div>

                  <div className={`flex-1 overflow-y-auto border rounded-xl ${isLight ? "border-slate-200 bg-white" : "border-gray-900 bg-black/10"}`}>

                    <table className="w-full text-left border-collapse font-mono text-[9px]">
                      <thead>
                        <tr className={`border-b uppercase tracking-wider ${isLight ? "border-slate-200 bg-slate-50 text-slate-500" : "border-gray-900 bg-gray-950/40 text-gray-550"}`}>

                          <th className="px-3.5 py-2">ID</th>
                          <th className="px-3.5 py-2">Name</th>
                          <th className="px-3.5 py-2">Lifecycle Stage</th>
                          <th className="px-3.5 py-2 text-right">Yield (LTV)</th>
                          <th className="px-3.5 py-2 text-center">Sentiment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohortFiltered.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-600 uppercase font-mono">No matching records</td>
                          </tr>
                        ) : (
                          cohortFiltered.map(c => {
                            const isSelected = selectedCustomerId === c.id;
                            return (
                              <tr 
                                key={c.id}
                                onClick={() => setSelectedCustomerId(c.id)}
                                className={`hover:bg-gray-800/30 cursor-pointer border-b border-gray-900/50 transition-colors ${
                                  isSelected ? "bg-blue-900/15" : ""
                                }`}
                              >
                                <td className="px-3.5 py-2 font-bold text-gray-450">{c.id}</td>
                                <td className={`px-3.5 py-2 font-medium ${isLight ? "text-slate-900" : "text-white"}`}>{c.name}</td>
                                <td className="px-3.5 py-2">
                                  <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${
                                    c.lifecycleStage === "Recent Buyer" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                    c.lifecycleStage === "Cooling Period" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                    c.lifecycleStage === "Miss You" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                    c.lifecycleStage === "Inactive" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                  }`}>{c.lifecycleStage}</span>
                                </td>
                                <td className={`px-3.5 py-2 text-right font-bold ${isLight ? "text-slate-900" : "text-white"}`}>₹{c.ltv?.toLocaleString()}</td>
                                <td className="px-3.5 py-2 text-center">
                                  <span className={`font-bold ${
                                    c.customerSentiment === "Positive" ? "text-green-400" :
                                    c.customerSentiment === "Negative" ? "text-red-400" : "text-gray-400"
                                  }`}>{c.customerSentiment || "Neutral"}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </main>

      {/* ════════════════════════════════════════
          AI REPORT GENERATION MODAL
      ════════════════════════════════════════ */}
      {reportModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-mono">

          <div 
            className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#080d24] border-gray-800 text-white"}`}
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
          >
            <div className={`flex justify-between items-center border-b pb-3 mb-4 ${isLight ? "border-slate-200" : "border-gray-900"}`}>

              <div className="flex items-center gap-2">
                <Brain size={14} className="text-Manthan-purple animate-pulse" />
                <h3 className={`font-space text-sm font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>

                  {reportModalType === "executive" ? "Executive Summary Report" : reportModalType === "investor" ? "Investor Presentation" : "Client Performance Ledger"}
                </h3>
              </div>
              <button 
                onClick={() => setReportModalType(null)} 
                className={`cursor-pointer ${isLight ? "text-gray-400 hover:text-slate-900" : "text-gray-400 hover:text-white"}`}
              >
                ×
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto pr-1 text-[9.5px] leading-relaxed whitespace-pre-line border p-4 rounded-xl ${isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-black/20 border-gray-950 text-gray-300"}`}>
              {reportModalLoading ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <div className="flex gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-Manthan-purple animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                  <span className="uppercase tracking-widest mt-1">Generating custom report variables...</span>
                </div>
              ) : (
                reportModalContent
              )}
            </div>

            <div className="flex justify-end gap-3.5 mt-5">
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(reportModalContent);
                    addAgentLog("System", "AI Report copied to clipboard.", "thought");
                    alert("Report successfully copied to clipboard!");
                  } catch (e) {
                    console.error("Clipboard copy failed:", e);
                  }
                }}
                disabled={reportModalLoading}
                className={`px-4 py-2 border rounded-lg text-[8.5px] uppercase tracking-wider font-bold cursor-pointer transition-colors ${isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700" : "bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300"}`}
              >
                Copy to Clipboard
              </button>
              
              <button 
                onClick={() => setReportModalType(null)}
                className="px-4 py-2 bg-Manthan-purple hover:bg-purple-650 text-white rounded-lg text-[8.5px] uppercase tracking-wider font-bold cursor-pointer transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />

      {/* Synchronized Customer Profile Drawer */}
      {selectedCustomerId && (() => {
        const detail = customers.find(c => c.id === selectedCustomerId);
        if (!detail) return null;
        const color = segmentColors[detail.segment] || "#ffffff";
        
        // Generate timeline events
        const customerTimelineEvents: {
          date: string;
          type: "purchase" | "campaign" | "segment" | "activity";
          title: string;
          description: string;
          amount?: number;
        }[] = [
          {
            date: "2025-12-14",
            type: "activity",
            title: "Account Created",
            description: "Successfully onboarded into CRM node system."
          },
          {
            date: "2025-12-14",
            type: "segment",
            title: "Initial Segment: New Signups",
            description: "Added to exploration cohort."
          }
        ];

        // Let's compute stable dates for timeline based on detail.id to keep it simple and compile-safe
        const idNum = parseInt(detail.id.replace(/\D/g, "")) || 0;
        const baseTime = new Date("2026-06-14").getTime();
        
        const createdDate = new Date(baseTime - (180 + (idNum % 30)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        customerTimelineEvents[0].date = createdDate;
        customerTimelineEvents[1].date = createdDate;

        const customerOrders = contextOrders.filter(o => o.customerId === detail.id);
        customerOrders.forEach(o => {
          customerTimelineEvents.push({
            date: o.date,
            type: "purchase",
            title: `Order Placed: ${o.product}`,
            description: `Fulfilled via ${o.channel}. Transaction ID: tx_${o.id.replace(/\D/g, "")}`,
            amount: o.amount
          });
        });

        if (detail.segment !== "New Signups") {
          customerTimelineEvents.push({
            date: new Date(baseTime - (60 + (idNum % 20)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            type: "segment",
            title: `Segment Shifted: ${detail.segment}`,
            description: `Auto-promoted by core AI classification model.`
          });
        }

        customerTimelineEvents.push({
          date: new Date(baseTime - (10 + (idNum % 15)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: "campaign",
          title: `${detail.preferredChannel} Campaign Action`,
          description: detail.segment === "Slipping Away" 
            ? "Opened win-back discount offer." 
            : "Engaged with new arrivals catalog message."
        });

        customerTimelineEvents.push({
          date: new Date(baseTime - (1 + (idNum % 5)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: "activity",
          title: "Portal Node Session",
          description: `Active session logged. Device: Mobile. Location: ${detail.region}.`
        });

        customerTimelineEvents.sort((a, b) => b.date.localeCompare(a.date));

        return (
          <aside className={`w-[420px] shrink-0 flex flex-col border-l p-5 space-y-4 overflow-y-auto relative z-10 animate-fade-in font-mono ${isLight ? "bg-white border-slate-200" : "border-gray-800/60 bg-gray-950/85 backdrop-blur-xl"}`}>

            {/* Header */}
            <div className={`flex items-start justify-between border-b pb-3 shrink-0 ${isLight ? "border-slate-200" : "border-gray-800"}`}>

              <div>
                <div className="text-[9px] font-mono text-gray-550 uppercase tracking-widest mb-1">CRM Profile Node</div>
                <h2 className={`font-space text-lg font-bold tracking-tight leading-snug ${isLight ? "text-slate-900" : "text-white"}`}>{detail.name}</h2>
                <span className="font-mono text-[10px] text-gray-400 select-all">{detail.email}</span>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isLight ? "border-slate-200 hover:bg-slate-100 text-gray-500 hover:text-slate-900" : "border-gray-800 hover:border-gray-700 text-gray-500 hover:text-white"}`}
              >
                <X size={14} />
              </button>
            </div>

            {/* Status and Sentiment Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex-1 flex items-center gap-2 p-2 rounded-xl border"
                   style={{ backgroundColor: `${color}10`, borderColor: `${color}20` }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                <span className="font-mono text-[10px] font-bold uppercase" style={{ color }}>
                  {detail.segment}
                </span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-mono text-[10px] ${isLight ? "border-slate-200 bg-slate-50 text-slate-800" : "border-gray-855 bg-gray-900/30 text-white"}`}>
                <span className="text-gray-550">SENTIMENT:</span>
                <select
                  value={detail.customerSentiment || "Neutral"}
                  onChange={(e) => {
                    const val = e.target.value as "Positive" | "Neutral" | "Negative";
                    updateCustomer(detail.id, { sentiment: val, customerSentiment: val });
                  }}
                  className={`bg-transparent font-bold cursor-pointer outline-none border-none p-0 ${
                    detail.customerSentiment === "Positive" ? "text-green-400" :
                    detail.customerSentiment === "Negative" ? "text-red-400" : "text-gray-300"
                  }`}
                >
                  <option value="Positive" className="bg-gray-900 text-green-400 font-bold" style={{ backgroundColor: "#0F172A" }}>Positive</option>
                  <option value="Neutral" className="bg-gray-900 text-gray-300 font-bold" style={{ backgroundColor: "#0F172A" }}>Neutral</option>
                  <option value="Negative" className="bg-gray-900 text-red-400 font-bold" style={{ backgroundColor: "#0F172A" }}>Negative</option>
                </select>
              </div>
            </div>

            {/* Core Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 shrink-0">
              {[
                { label: "Customer ID", value: detail.id, icon: <SlidersHorizontal size={11} className="text-gray-400" /> },
                { label: "Phone Node", value: detail.phone, icon: <Smile size={11} className="text-gray-400" /> },
                { label: "LTV (Yield)", value: `₹${detail.ltv?.toLocaleString()}`, icon: <DollarSign size={11} className="text-amber-400" /> },
                { label: "Total Spent", value: `₹${(detail.totalSpent || 0).toLocaleString()}`, icon: <DollarSign size={11} className="text-green-400" /> },
                { label: "Risk Score", value: `${detail.churnRisk}%`, icon: <AlertTriangle size={11} className="text-red-400" /> },
                { label: "Preferred Channel", value: detail.preferredChannel, icon: <Send size={11} className="text-blue-400" /> },
                { label: "Persona Archetype", value: detail.persona || "Unclassified", icon: <Cpu size={11} className="text-purple-400" /> },
                { label: "Last Purchase", value: detail.lastPurchaseDate || "N/A", icon: <Calendar size={11} className="text-teal-400" /> }
              ].map((kpi, i) => (
                <div key={i} className={`rounded-xl p-3 shadow-sm transition-all border ${isLight ? "bg-slate-50 border-slate-200 hover:border-slate-300" : "bg-gray-900/20 border-gray-850 hover:border-gray-800"}`}>
                  <div className="flex items-center gap-1 mb-1">
                    {kpi.icon}
                    <span className="font-mono text-[8.5px] text-gray-550 uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <span className={`font-space text-xs font-bold mt-1 block truncate ${isLight ? "text-slate-900" : "text-white"}`} title={kpi.value}>

                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Growth Opportunity Card */}
            <div className={`p-3.5 rounded-xl space-y-1 shrink-0 border ${isLight ? "bg-purple-50 border-purple-200 text-purple-800" : "bg-purple-500/5 border-purple-500/20"}`}>
              <div className="flex items-center gap-1.5 font-mono text-[9px] text-purple-400 font-bold uppercase tracking-wider">
                <Cpu size={12} className="animate-pulse" />
                <span>AI Growth Opportunity Directive</span>
              </div>
              <p className={`font-mono text-[10px] leading-relaxed ${isLight ? "text-slate-700" : "text-gray-300"}`}>{detail.growthOpportunity || "N/A"}</p>
            </div>

            {/* Customer Voice Reviews */}
            <div className="space-y-3 pt-2 shrink-0">
              <div className="flex justify-between items-center">
                <h3 className={`font-space text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-slate-900" : "text-white"}`}>

                  <MessageSquare size={13} className="text-purple-400" />
                  Customer Voice Reviews
                </h3>
                <button
                  onClick={() => {
                    const newReview = prompt("Enter customer review feedback:");
                    if (newReview && newReview.trim()) {
                      const currentReviews = detail.reviews || [];
                      updateCustomer(detail.id, { reviews: [...currentReviews, newReview.trim()] });
                    }
                  }}
                  className="px-2 py-0.5 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 rounded text-[8px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                >
                  + Add Review
                </button>
              </div>

              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                {!detail.reviews || detail.reviews.length === 0 ? (
                  <p className="font-mono text-[9px] text-gray-650 text-center py-2">No reviews recorded</p>
                ) : (
                  detail.reviews.map((rev, idx) => (
                    <div key={idx} className={`p-2 border rounded-lg font-mono text-[9px] relative group leading-relaxed ${isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-gray-900/15 border-gray-900 text-gray-350"}`}>
                      <button
                        onClick={() => {
                          if (confirm("Delete this review?")) {
                            const updatedReviews = (detail.reviews || []).filter((_, i) => i !== idx);
                            updateCustomer(detail.id, { reviews: updatedReviews });
                          }
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 cursor-pointer p-0.5 rounded transition-all"
                        title="Delete review"
                      >
                        <X size={10} />
                      </button>
                      "{rev}"
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Customer Timeline Ledger */}
            <div className="space-y-3 pt-2">
              <h3 className={`font-space text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-slate-900" : "text-white"}`}>

                <Activity size={13} className="text-blue-400" />
                Customer Lifecycle Timeline
              </h3>
              
              <div className={`relative pl-4 space-y-4 border-l ml-2 pt-1 ${isLight ? "border-slate-200" : "border-gray-800/80"}`}>
                {customerTimelineEvents.map((ev, index) => {
                  let icon = <UserCheck size={11} className="text-purple-400" />;
                  let borderCol = isLight ? "border-purple-200 bg-purple-50" : "border-purple-500/40 bg-purple-950/20";
                  if (ev.type === "purchase") {
                    icon = <ShoppingBag size={11} className="text-green-400" />;
                    borderCol = isLight ? "border-green-200 bg-green-50" : "border-green-500/40 bg-green-950/20";
                  } else if (ev.type === "campaign") {
                    icon = <Send size={11} className="text-blue-400" />;
                    borderCol = isLight ? "border-blue-200 bg-blue-50" : "border-blue-500/40 bg-blue-950/20";
                  } else if (ev.type === "segment") {
                    icon = <SlidersHorizontal size={11} className="text-amber-400" />;
                    borderCol = isLight ? "border-amber-200 bg-amber-50" : "border-amber-500/40 bg-amber-950/20";
                  }
                  
                  return (
                    <div key={index} className="relative group">
                      <div className={`absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${borderCol}`}>
                        {icon}
                      </div>
                      
                      <span className="font-mono text-[8px] text-gray-550 block mb-0.5">{ev.date}</span>
                      <h4 className={`font-space text-[10px] font-bold leading-tight uppercase ${isLight ? "text-slate-900" : "text-white"}`}>{ev.title}</h4>
                      <p className={`font-mono text-[9px] mt-0.5 leading-snug ${isLight ? "text-slate-500" : "text-gray-450"}`}>{ev.description}</p>
                      {ev.amount !== undefined && (
                        <span className={`inline-block mt-1 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${isLight ? "text-green-600 bg-green-50 border-green-200" : "text-green-400 bg-green-950/15 border border-green-500/10"}`}>
                          ₹{ev.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        );
      })()}
      <AgentCardModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
};
export default OrbitAnalytics;
