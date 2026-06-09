import React, { useState } from "react";
import { 
  TrendingUp, Mail, MousePointer, ShoppingCart, Users, BarChart2, 
  Sparkles, ArrowUpRight, CheckCircle2, AlertTriangle
} from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

export const OrbitAnalytics: React.FC = () => {
  const { campaigns, orders, customers, businessType } = useOrbit();
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "diagnostics">("overview");

  /* Calculable parameters */
  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const completedCampaigns = campaigns.filter(c => c.status === "Completed");

  const avgOpenRate = completedCampaigns.length > 0
    ? Math.round(completedCampaigns.reduce((s, c) => s + (c.sentCount > 0 ? (c.openedCount / c.sentCount) * 100 : 0), 0) / completedCampaigns.length) : 71;
  
  const avgCTR = completedCampaigns.length > 0
    ? Math.round(completedCampaigns.reduce((s, c) => s + (c.openedCount > 0 ? (c.clickedCount / c.openedCount) * 100 : 0), 0) / completedCampaigns.length) : 42;
  
  const avgConvRate = completedCampaigns.length > 0
    ? (completedCampaigns.reduce((s, c) => s + (c.clickedCount > 0 ? (c.purchaseCount / c.clickedCount) * 100 : 0), 0) / completedCampaigns.length).toFixed(1) : "18.3";
  
  const totalCustomers = customers.length;
  const loyalists = customers.filter(c => c.segment === "Loyalists").length;

  const topMetrics = [
    { label: "Total Revenue", value: `₹${(totalRevenue / 1000).toFixed(1)}K`, delta: "+12.4%", icon: TrendingUp, color: "text-orbit-success", border: "border-orbit-success/20 bg-orbit-success/5" },
    { label: "Avg Open Rate", value: `${avgOpenRate}%`, delta: "+8.1%", icon: Mail, color: "text-orbit-blue", border: "border-orbit-blue/20 bg-orbit-blue/5" },
    { label: "Avg CTR", value: `${avgCTR}%`, delta: "+5.6%", icon: MousePointer, color: "text-orbit-purple", border: "border-orbit-purple/20 bg-orbit-purple/5" },
    { label: "Avg Conversion", value: `${avgConvRate}%`, delta: "+3.2%", icon: ShoppingCart, color: "text-pink-400", border: "border-pink-400/20 bg-pink-400/5" },
    { label: "Total Customers", value: totalCustomers.toString(), delta: "+4 new", icon: Users, color: "text-yellow-400", border: "border-yellow-400/20 bg-yellow-400/5" },
    { label: "Loyalist Base", value: loyalists.toString(), delta: `${Math.round((loyalists / totalCustomers) * 100)}%`, icon: BarChart2, color: "text-orbit-success", border: "border-orbit-success/20 bg-orbit-success/5" },
  ];

  /* AI Success & Attrition diagnostics */
  const getDiagnosticsAndRecs = () => {
    switch (businessType) {
      case "Fashion & Apparel":
        return {
          successDrivers: [
            { title: "Instagram DM Automation", desc: "Automating Instagram direct message follow-ups for clothing inquiries drove a 35% higher response rate." },
            { title: "Early-Access Collection Launch", desc: "Providing early access to loyalists via RCS Rich Cards boosted collection sales velocity by 50%." },
            { title: "Streetwear DNA Personalization", desc: "Tailoring catalog copy to Streetwear and Cargo preferences increased repeat purchases by 3x." }
          ],
          failureDiagnostics: [
            { title: "Social Enquiries Drop-Offs", desc: "Unanswered social DMs resulted in 22% lead leakage. Setting up automatic Instagram DM sync reduced this loss by 75%." },
            { title: "Email Catalog Bounces", desc: "High file-size email catalogs suffered 12% inbox spam ratings. Moving to RCS card highlights resolved core CTR drop-offs." }
          ],
          aiRecommendations: [
            { title: "Recover Social Leads", roi: "4.8x ROI", channel: "WhatsApp", revenue: "₹34,500 potential", desc: "17 checkout enquiries abandoned in Instagram messages. Deploy automated recovery messages." },
            { title: "Autumn Collection Cross-Sell", roi: "3.4x ROI", channel: "RCS Cards", revenue: "₹82,000 potential", desc: "Launch new collection wear to 45 loyalist customers who purchased premium hoodies previously." }
          ]
        };
      case "Beauty & Skincare":
        return {
          successDrivers: [
            { title: "Serum Subscription Autopilot", desc: "Triggering automatic replenishments at 30-day intervals drove a 48% subscription retention rate." },
            { title: "Routine Guide Follow-ups", desc: "Sending personalized beauty routine tips via WhatsApp increased product affinity and reviews by 60%." }
          ],
          failureDiagnostics: [
            { title: "Serum Detail Drops", desc: "Product detail page bounces reached 28%. Adding routine video links inside WhatsApp campaigns reduced bounces by 15%." },
            { title: "Dormant Beauty Bounces", desc: "Stale email promotions suffered high unsubscribe rates. WhatsApp text alerts restored 35% clickthrough rate." }
          ],
          aiRecommendations: [
            { title: "Serum Replenish Prompts", roi: "5.2x ROI", channel: "WhatsApp", revenue: "₹28,900 potential", desc: "25 customers due for skin routine replenish reminders. Deploy auto-replenishment notifications." },
            { title: "Reactivate Beauty VIPs", roi: "3.8x ROI", channel: "Email", revenue: "₹45,000 potential", desc: "Target 14 dormant high-ltv beauty collectors with a personalized routine audit invitation." }
          ]
        };
      case "Food & Bakery":
        return {
          successDrivers: [
            { title: "Weekend Brunch Push", desc: "Friday morning notifications for artisanal sourdough brunch packages saw 55% clickthrough rate." },
            { title: "Morning Delivery Alerts", desc: "Sending fresh breakfast alerts via SMS drove 3.2x higher order velocity before 10 AM." }
          ],
          failureDiagnostics: [
            { title: "Brunch Order Bottlenecks", desc: "Cart drop-offs spiked at 18% during peak hours. Bypassing app forms for direct WhatsApp replies solved conversions." },
            { title: "Loyalty Decay", desc: "One-time food buyers rarely returned. Implementing automated day-7 feedback coupon reduced churn by 25%." }
          ],
          aiRecommendations: [
            { title: "Launch Weekend Brunch Alert", roi: "3.9x ROI", channel: "WhatsApp", revenue: "₹18,500 potential", desc: "Re-engage 32 slipping foodie accounts with a fresh brunch cronut promo before Friday." },
            { title: "Artisanal Bread Cross-Sell", roi: "4.1x ROI", channel: "SMS", revenue: "₹12,000 potential", desc: "Target 28 previous croissant buyers with new sourdough loaf nodes." }
          ]
        };
      case "Jewellery & Accessories":
        return {
          successDrivers: [
            { title: "RCS Rich Card Catalogs", desc: "Displaying high-definition quartz watch and pendant carousels drove a 64% engagement rate." },
            { title: "High-Ticket VIP Access", desc: "Inviting top customers to pre-sales via private links reduced consideration cycles by 40%." }
          ],
          failureDiagnostics: [
            { title: "High Consideration Bounces", desc: "Cart abandonment peaked at 35% on rings. Adding personal agent consultation callbacks salvaged 45% of deals." },
            { title: "Dormant Luxury Accounts", desc: "Email sequences felt generic. Upgrading to personalized RCS grid views restored premium brand feel." }
          ],
          aiRecommendations: [
            { title: "Recover VIP Cart Drop-offs", roi: "6.5x ROI", channel: "WhatsApp", revenue: "₹45,000 potential", desc: "9 high-ticket aura pendant checkouts abandoned. Deploy premium concierge call option." },
            { title: "Silver Link Pre-Sale Invite", roi: "5.8x ROI", channel: "RCS Cards", revenue: "₹1.2L potential", desc: "Offer pre-sale access for silver link grids to 6 high-value inactive VIP nodes." }
          ]
        };
      case "D2C Brand":
        return {
          successDrivers: [
            { title: "Accessory Cross-Selling", desc: "Triggering travel organizer recommendations post-tote purchases drove 32% order values." },
            { title: "WhatsApp Checkout Flows", desc: "Enabling direct payment buttons inside chat increased conversions by 45%." }
          ],
          failureDiagnostics: [
            { title: "High Customer Acq Cost", desc: "Paid social ads suffered 30% CTR declines. Shift to autonomous re-engagement loops cut acquisition cost by 40%." },
            { title: "Cart Basket Drop-offs", desc: "Checkout forms took too long on mobile. Standardized RCS forms boosted completions by 28%." }
          ],
          aiRecommendations: [
            { title: "D2C Accessory Cross-Sell", roi: "4.2x ROI", channel: "WhatsApp", revenue: "₹18,500 potential", desc: "Target 21 smart cap buyers with eco-fiber tote combinations. Estimated conversion: 16%." },
            { title: "Abandoned Basket Recovery", roi: "4.5x ROI", channel: "RCS Cards", revenue: "₹32,000 potential", desc: "16 shopping carts left dormant. Send interactive coupon code with free grid pack v2." }
          ]
        };
      case "Enterprise":
        return {
          successDrivers: [
            { title: "License Seat Expansion Logs", desc: "Auto-audits showing developer usage limits prompted 30% of accounts to upgrade contracts." },
            { title: "Secure Email Gateway Push", desc: "Using dedicated server logs validation emails reduced SLA negotiation times by 50%." }
          ],
          failureDiagnostics: [
            { title: "Stale Contract Approvals", desc: "Renewal forms went unread in standard email. Twilio/RCS failovers triggered urgent dashboard alerts." },
            { title: "Dormant API Integrations", desc: "25% of registered developer tenants stopped active API calls. Auto SLA health notifications restored 60% activity." }
          ],
          aiRecommendations: [
            { title: "License Extension Audits", roi: "8.5x ROI", channel: "Email", revenue: "₹3,80,000 potential", desc: "3 contract accounts approaching server limit limits. Dispatch dedicated SLA expansion proposal." },
            { title: "SLA Health Alerts", roi: "5.4x ROI", channel: "RCS Cards", revenue: "₹1.5L potential", desc: "4 premium enterprise tenants exhibiting low session usage. Dispatch proactive account review." }
          ]
        };
      default:
        return {
          successDrivers: [
            { title: "Custom Segment Calibration", desc: "Mapping unique buyer DNA markers boosted niche conversion yield by 35%." },
            { title: "Multi-Channel Dispatch", desc: "Synchronizing campaign delivery across RCS, WhatsApp, and email drove 2.8x higher CTR." }
          ],
          failureDiagnostics: [
            { title: "Irregular Engagement Signals", desc: "Niche segments showed erratic buying behavior. Implementing predictive ROI model stabilized yields." },
            { title: "Generic Campaign Copy", desc: "One-size-fits-all text failed to convert. Custom DNA tokens solved engagement drop-offs." }
          ],
          aiRecommendations: [
            { title: "Niche Campaign Calibration", roi: "4.0x ROI", channel: "WhatsApp", revenue: "₹25,000 potential", desc: "Re-engage 12 dormant high-value customers with custom-crafted brand incentives." },
            { title: "Loyalty Loop Expansion", roi: "3.5x ROI", channel: "RCS Cards", revenue: "₹40,000 potential", desc: "Calibrate custom collection offerings to early adopters. Deploy rich media nodes." }
          ]
        };
    }
  };

  const { successDrivers, failureDiagnostics, aiRecommendations } = getDiagnosticsAndRecs();

  // Bar chart campaign data
  const chartData = campaigns.slice(0, 5).map(c => ({
    name: c.name.slice(0, 18) + (c.name.length > 18 ? "..." : ""),
    revenue: c.revenueGenerated,
    sent: c.sentCount,
    purchases: c.purchaseCount,
  }));
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  // Conversion Funnel math
  const funnelStages = completedCampaigns.length > 0 
    ? [
        { label: "Cohort Mapped", count: completedCampaigns.reduce((s, c) => s + c.sentCount, 0), pct: 100 },
        { label: "Delivered", count: completedCampaigns.reduce((s, c) => s + (c.deliveredCount ?? Math.round(c.sentCount * 0.96)), 0), pct: 96 },
        { label: "Opened / Read", count: completedCampaigns.reduce((s, c) => s + c.openedCount, 0), pct: 72 },
        { label: "Link Clicks", count: completedCampaigns.reduce((s, c) => s + c.clickedCount, 0), pct: 38 },
        { label: "Converted Purchases", count: completedCampaigns.reduce((s, c) => s + c.purchaseCount, 0), pct: 18 }
      ]
    : [
        { label: "Cohort Mapped", count: 584, pct: 100 },
        { label: "Delivered", count: 561, pct: 96 },
        { label: "Opened / Read", count: 420, pct: 72 },
        { label: "Link Clicks", count: 220, pct: 38 },
        { label: "Converted Purchases", count: 107, pct: 18 }
      ];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#050816] relative">
      {/* Background Matrix overlays */}
      <div className="pointer-events-none absolute inset-0 space-grid opacity-35 z-0" />
      <div className="pointer-events-none absolute inset-0 bg-orbit-glow-blue opacity-15 z-0" />

      {/* Main Workspace Scrollable */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-6 space-y-6">
        
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-gray-900 pb-4">
          <div>
            <h1 className="font-space text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart2 className="text-blue-400" size={22} />
              Orbit Analytics
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-1">AI-GENERATED PERFORMANCE & DIRECTIVE REPORTS</p>
          </div>
          
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-900 font-mono text-[9px] font-bold">
            {["overview", "funnel", "diagnostics"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all uppercase tracking-wider ${
                  activeTab === tab 
                    ? "bg-gray-850 text-white border border-gray-800 shadow" 
                    : "text-gray-550 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className={`orbit-panel p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform ${m.border}`}>
                <div className="flex items-center justify-between">
                  <Icon size={14} className={m.color} />
                  <span className="font-mono text-[9px] text-orbit-success flex items-center gap-0.5">
                    <ArrowUpRight size={10} />{m.delta}
                  </span>
                </div>
                <span className={`font-space text-2xl font-bold ${m.color}`}>{m.value}</span>
                <span className="font-mono text-[8px] text-gray-550 uppercase tracking-widest">{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* Tab 1: Overview Dashboard */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue bar chart */}
            <div className="lg:col-span-2 orbit-panel p-5 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-5">
                <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Campaign Revenue Output</span>
                <BarChart2 size={13} className="text-orbit-blue" />
              </div>
              {chartData.length > 0 ? (
                <div className="flex items-end gap-5 h-44 mt-auto">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <span className="font-mono text-[9px] text-orbit-success font-bold">₹{(d.revenue / 1000).toFixed(1)}K</span>
                      <div className="w-full relative flex items-end justify-center" style={{ height: 110 }}>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-orbit-blue to-orbit-purple transition-all duration-700 hover:opacity-80"
                          style={{ height: `${Math.max(6, (d.revenue / maxRevenue) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[8px] text-gray-500 text-center leading-tight max-w-[75px] truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-gray-600 font-mono text-xs">
                  No campaign dispatches recorded.
                </div>
              )}
            </div>

            {/* Channels breakdown */}
            <div className="orbit-panel p-5 flex flex-col justify-between">
              <div className="border-b border-gray-900 pb-3 mb-4">
                <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Best Channel Nodes</span>
              </div>
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {(["Email", "WhatsApp", "SMS", "RCS"] as const).map(ch => {
                  const chCamps = campaigns.filter(c => c.channel === ch);
                  const chRevenue = chCamps.reduce((s, c) => s + c.revenueGenerated, 0);
                  const chOpen = chCamps.length > 0 && chCamps[0].sentCount > 0
                    ? Math.round((chCamps.reduce((s, c) => s + c.openedCount, 0) / chCamps.reduce((s, c) => s + c.sentCount, 0)) * 100) : 74;
                  const colors = { Email: "text-orbit-blue", WhatsApp: "text-orbit-success", SMS: "text-yellow-400", RCS: "text-orbit-purple" };
                  return (
                    <div key={ch} className="p-2.5 bg-gray-950/40 border border-gray-900 rounded-xl flex items-center justify-between font-mono text-[9px]">
                      <div>
                        <span className={`font-bold uppercase block ${colors[ch]}`}>{ch}</span>
                        <span className="text-gray-500">{chCamps.length} launches</span>
                      </div>
                      <div className="text-right">
                        <span className="font-space font-bold text-white text-xs block">₹{(chRevenue / 1000).toFixed(1)}K</span>
                        <span className="text-gray-600">{chOpen}% opens</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Funnel Visualizer */}
        {activeTab === "funnel" && (
          <div className="orbit-panel p-5 space-y-6">
            <div className="border-b border-gray-900 pb-3">
              <span className="font-space text-xs font-bold uppercase tracking-wider text-white">Consensus Conversion Funnel</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {funnelStages.map((stage, idx) => {
                return (
                  <div key={idx} className="bg-gray-900/10 border border-gray-850 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <span className="font-mono text-[8px] text-gray-500 uppercase tracking-wider block mb-1">{stage.label}</span>
                    <span className="font-space text-lg font-bold text-white block">{stage.count}</span>
                    <span className="font-mono text-[10px] text-blue-400 font-bold block mt-1">{stage.pct}%</span>
                    
                    {/* Background glow fill based on percentage */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500/5 transition-all" 
                      style={{ height: `${stage.pct}%` }} 
                    />
                  </div>
                );
              })}
            </div>
            
            <p className="font-mono text-[8px] text-gray-600 text-center uppercase tracking-wide">
              Funnel represents average conversion performance across active dispatches
            </p>
          </div>
        )}

        {/* Tab 3: Attrition & Diagnostics */}
        {activeTab === "diagnostics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Why Succeeded */}
            <div className="orbit-panel p-5 border border-green-500/20 bg-green-500/5">
              <h3 className="font-space text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-green-900/30 pb-3 mb-4">
                <CheckCircle2 size={14} className="text-green-400" />
                Why Campaign Succeeded
              </h3>
              <div className="flex flex-col gap-3">
                {successDrivers.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-green-950 p-3.5 rounded-xl space-y-1">
                    <p className="font-mono text-xs font-bold text-white">{item.title}</p>
                    <p className="font-mono text-[9px] text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Failed */}
            <div className="orbit-panel p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="font-space text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-red-900/30 pb-3 mb-4">
                <AlertTriangle size={14} className="text-red-400" />
                Friction Points & Failure Logs
              </h3>
              <div className="flex flex-col gap-3">
                {failureDiagnostics.map((item, idx) => (
                  <div key={idx} className="bg-black/40 border border-red-950 p-3.5 rounded-xl space-y-1">
                    <p className="font-mono text-xs font-bold text-white">{item.title}</p>
                    <p className="font-mono text-[9px] text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h2 className="font-space text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Sparkles size={15} className="text-orbit-purple" />
            AI Recommendations & Opportunities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiRecommendations.map((rec, i) => (
              <div key={i} className="orbit-panel p-4 flex items-start justify-between gap-4 border border-gray-850 hover:border-blue-500/35 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-space text-xs font-bold text-white">{rec.title}</span>
                    <span className="font-mono text-[8px] text-orbit-purple border border-orbit-purple/30 bg-orbit-purple/5 px-1.5 py-0.5 rounded-full uppercase">{rec.roi}</span>
                  </div>
                  <p className="font-mono text-[9px] text-gray-500 leading-relaxed">{rec.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-[9px] text-orbit-success font-bold block">{rec.revenue}</span>
                  <span className="font-mono text-[8px] text-gray-600 block mt-0.5">via {rec.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
export default OrbitAnalytics;
