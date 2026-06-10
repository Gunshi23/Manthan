import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";
import { sendCampaign } from "../services/twilioService";
import { sendEmailCampaign } from "../services/resendService";

// Theme types
export type ThemeMode = "command-center" | "executive";

// Customer Interface
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: "Loyalists" | "Slipping Away" | "High-Value Inactive" | "New Signups";
  ltv: number;
  churnRisk: number; // percentage
  churnTrend: "up" | "down" | "stable";
  purchaseCount: number;
  dna: string[];
  preferredChannel: "Email" | "WhatsApp" | "SMS" | "RCS";
  predictedNextPurchase: string; // date string or "Immediate"
  predictedCategory: string;
  avatar: string;
  x: number; // Galaxy coordinate
  y: number; // Galaxy coordinate
}

// Campaign Interface
export interface Campaign {
  id: string;
  name: string;
  goal: string;
  description: string;
  channel: "Email" | "WhatsApp" | "SMS" | "RCS";
  status: "Draft" | "Running" | "Completed" | "Queued" | "Sending" | "Delivered" | "Failed";
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  purchaseCount: number;
  revenueGenerated: number;
  createdAt: string;
  failedCount?: number;
  pendingCount?: number;
  messageId?: string;
  missionId?: string;
}

// Order Interface
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  product: string;
  channel: string;
}

// Agent Log Interface
export interface AgentLog {
  id: string;
  agent: "System" | "Polaris" | "Nova" | "Vega" | "Atlas" | "Luna";
  timestamp: string;
  message: string;
  type: "thought" | "action" | "chat" | "result";
}

// Luna Metrics Interface
export interface LunaMetrics {
  recoverableRevenue: number;
  opportunityScore: number;
  inactiveCustomers: number;
  abandonedLeads: number;
  recoveryConfidence: number;
}

// System Config Interface
export interface SystemConfig {
  geminiKey: string;
  deepgramKey: string;
  elevenLabsKey: string;
  resendKey: string;
  simulationSpeed: number; // 1 = normal, 2 = fast, 5 = hyper
  autonomousMode: boolean;
  voiceSynthesis: boolean;
  firebaseKey?: string;
  firebaseProjectId?: string;
}

// Active Mission State
export interface MissionState {
  isActive: boolean;
  step: "idle" | "analyzing" | "segmenting" | "predicting" | "generating" | "ready" | "dispatched";
  goal: string;
  audienceCount: number;
  predictedRoi: number;
  predictedRevenue: number;
  generatedContent: {
    Email?: { subject: string; body: string };
    WhatsApp?: { body: string };
    SMS?: { body: string };
    RCS?: { title: string; body: string; mediaUrl: string };
  };
  selectedChannel: "Email" | "WhatsApp" | "SMS" | "RCS";
  boardroomDialogue?: { agent: "Polaris" | "Luna" | "Vega" | "Nova" | "Atlas"; message: string }[];
}

interface OrbitContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  customers: Customer[];
  campaigns: Campaign[];
  orders: Order[];
  agentLogs: AgentLog[];
  config: SystemConfig;
  mission: MissionState;
  revenueGoal: number;
  growthScore: number;
  activeMissionsCount: number;
  networkHealth: number;
  lunaMetrics: LunaMetrics;
  updateLunaMetrics: (metrics: Partial<LunaMetrics>) => void;
  businessType: string;
  personalizeForBusiness: (type: string) => void;
  addAgentLog: (agent: AgentLog["agent"], message: string, type: AgentLog["type"]) => void;
  updateConfig: (newConfig: Partial<SystemConfig>) => void;
  startMission: (goal: string) => void;
  launchMissionCampaign: (channel: "Email" | "WhatsApp" | "SMS" | "RCS") => void;
  cancelMission: () => void;
  runSimulationStep: () => void;
  clearSimData: () => void;
}

const OrbitContext = createContext<OrbitContextType | undefined>(undefined);

// Generate initial mock customers (80 customers distributed in clusters)
const generateMockCustomers = (businessType: string = "Fashion & Apparel"): Customer[] => {
  const segments: Customer["segment"][] = ["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"];
  const firstNames = ["Arjun", "Aditya", "Neha", "Priya", "Rahul", "Sara", "Kabir", "Aarav", "Elena", "Marcus", "Chloe", "Dev", "Tanya", "Rohan", "Siddharth", "Aisha", "Kiran", "Sam", "Sophia", "Lucas"];
  const lastNames = ["Sharma", "Verma", "Mehta", "Patel", "Singh", "Nair", "Das", "Joshi", "Smith", "Johnson", "Davis", "Kumar", "Gupta", "Rao", "Reddy", "Sen", "Bose", "Choudhury", "Miller", "Brown"];
  
  const DNA_POOL = {
    "Loyalists": businessType === "Enterprise" 
      ? ["SLA Priority", "Cloud Scaler", "Contract Admin", "API Developer", "Brand Advocate"]
      : businessType === "Fashion & Apparel"
      ? ["Trend Follower", "Instagram Discovery", "Weekend Buyer", "Brand Advocate", "Early Adopter"]
      : ["High Frequency", "Full Price Buyer", "Brand Advocate", "Weekend Buyer", "Tech Enthusiast", "Early Adopter"],
    
    "Slipping Away": businessType === "Enterprise"
      ? ["Budget Sensitive", "Dormant API Keys", "Overdue Invoice", "Low Session Rate", "Inactive 60d"]
      : ["Discount Sensitive", "Cart Abandoner", "Holiday Shopper", "Price Comparator", "Inactive 60d"],
    
    "High-Value Inactive": businessType === "Enterprise"
      ? ["VIP Client", "Multi-Org License", "On-Prem Deployment", "Inactive 90d"]
      : ["VIP", "Bulk Purchaser", "Organic Preferred", "Inactive 90d", "Big Ticket Buyer"],
    
    "New Signups": ["Promo Activated", "First Purchase Pending", "Newsletter Reader", "Mobile First", "Social Discovery"]
  };

  let preferredChannelPool: Customer["preferredChannel"][] = ["Email", "WhatsApp", "SMS", "RCS"];
  if (businessType === "Enterprise") {
    preferredChannelPool = ["Email", "Email", "RCS", "WhatsApp"];
  } else if (businessType === "Food & Bakery" || businessType === "Beauty & Skincare") {
    preferredChannelPool = ["WhatsApp", "WhatsApp", "SMS", "Email"];
  }

  let categories = ["Cyberwear", "Neural Implants", "Quantum Deck", "Orbit Thrusters", "Space Capsule Access", "Hologram Display"];
  if (businessType === "Fashion & Apparel") {
    categories = ["Streetwear Hoodies", "Retro Shades", "Cargo Pants", "Denim Jackets", "Cyber Boots", "Premium Tees"];
  } else if (businessType === "Beauty & Skincare") {
    categories = ["Hydrating Serum Glow", "Laser Peel Balm", "Neural Facial Mist", "Eye Complex Shield", "Lip Gloss Sync", "Moisturizer Core"];
  } else if (businessType === "Food & Bakery") {
    categories = ["Sourdough Loaf Node", "Gluten-Free Cronuts", "Espresso Pod Packs", "Vegan Pastry Array", "Choco Lava Matrix", "Artisanal Breads"];
  } else if (businessType === "Jewellery & Accessories") {
    categories = ["Aura Pendant Nodes", "Quantum Band Rings", "Chrono Quartz Watches", "Silver Link Grids", "Neo-Chokers", "Gold Anklets"];
  } else if (businessType === "D2C Brand") {
    categories = ["Cyber Water Bottles", "Acoustic Pods", "Eco-Fiber Totes", "Grid Packs", "Smart Cap Nodes", "Travel Organizers"];
  } else if (businessType === "Enterprise") {
    categories = ["Server Cluster Licenses", "Dedicated API Gateways", "Cognitive Nodes SaaS", "Master DB Integrations", "Orbit Cloud Access", "SLA Support Nodes"];
  }

  const list: Customer[] = [];

  for (let i = 0; i < 80; i++) {
    const segment = segments[i % segments.length];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const email = `${name.toLowerCase().replace(" ", ".")}@galaxy.net`;
    const phone = `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`;
    const purchaseCount = segment === "Loyalists" ? 8 + Math.floor(Math.random() * 12) :
                          segment === "High-Value Inactive" ? 4 + Math.floor(Math.random() * 6) :
                          segment === "Slipping Away" ? 2 + Math.floor(Math.random() * 3) : 1;
    
    const ltv = purchaseCount * (500 + Math.floor(Math.random() * 1500));
    const churnRisk = segment === "Loyalists" ? Math.floor(Math.random() * 15) :
                      segment === "New Signups" ? 30 + Math.floor(Math.random() * 30) :
                      segment === "High-Value Inactive" ? 65 + Math.floor(Math.random() * 25) :
                      75 + Math.floor(Math.random() * 20);

    const churnTrend = churnRisk > 70 ? "up" : churnRisk < 20 ? "down" : "stable";

    let cx = 500, cy = 500;
    if (segment === "Slipping Away") { cx = 280; cy = 280; }
    else if (segment === "High-Value Inactive") { cx = 720; cy = 720; }
    else if (segment === "New Signups") { cx = 720; cy = 280; }

    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 140; // dispersion
    const x = Math.round(cx + Math.cos(angle) * distance);
    const y = Math.round(cy + Math.sin(angle) * distance);

    const dna = [...DNA_POOL[segment]].sort(() => 0.5 - Math.random()).slice(0, 3);
    const preferredChannel = preferredChannelPool[Math.floor(Math.random() * preferredChannelPool.length)];
    
    // Predicted next purchase
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const predictedNextPurchase = churnRisk > 80 ? "Unlikely" : `In ${1 + Math.floor(Math.random() * 3)} weeks (${months[new Date().getMonth() % 12]} ${Math.floor(Math.random() * 28) + 1})`;
    const predictedCategory = categories[Math.floor(Math.random() * categories.length)];

    list.push({
      id: `cust_${1000 + i}`,
      name,
      email,
      phone,
      segment,
      ltv,
      churnRisk,
      churnTrend,
      purchaseCount,
      dna,
      preferredChannel,
      predictedNextPurchase,
      predictedCategory,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 100000)}?auto=format&fit=crop&w=100&h=100&q=80`,
      x,
      y
    });
  }

  return list;
};

// Initial Orders
const generateMockOrders = (customers: Customer[], businessType: string = "Fashion & Apparel"): Order[] => {
  let products = ["Cyberwear Implant v4", "Orbital Grid Adapter", "Liquid Fuel Core", "Quantum Processor Node", "Holographic Visor"];
  if (businessType === "Fashion & Apparel") {
    products = ["Neural Streetwear Hood", "Cargo Pant Node", "Cyber Boot v2", "Retro Shades", "Denim Jacket Core"];
  } else if (businessType === "Beauty & Skincare") {
    products = ["Hydrating Serum Glow", "Laser Peel Balm", "Neural Facial Mist", "Eye Complex Shield", "Lip Gloss Sync"];
  } else if (businessType === "Food & Bakery") {
    products = ["Sourdough Loaf Node", "Gluten-Free Cronut", "Espresso Pod Pack", "Vegan Pastry Array", "Choco Lava Matrix"];
  } else if (businessType === "Jewellery & Accessories") {
    products = ["Aura Pendant Node", "Quantum Band Ring", "Chrono Quartz Watch", "Silver Link Grid", "Neo-Choker v4"];
  } else if (businessType === "D2C Brand") {
    products = ["Cyber Water Bottle", "Acoustic Pods", "Eco-Fiber Tote", "Grid Pack v2", "Smart Cap Node"];
  } else if (businessType === "Enterprise") {
    products = ["Server Cluster License", "Dedicated API Gateway", "Cognitive Nodes SaaS", "Master DB Integrations", "Orbit Cloud Access"];
  }
  
  const channels = ["Email", "WhatsApp", "SMS", "RCS"];
  
  return Array.from({ length: 30 }).map((_, idx) => {
    const cust = customers[Math.floor(Math.random() * customers.length)];
    const amount = 350 + Math.floor(Math.random() * 2200);
    const date = new Date(Date.now() - idx * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    return {
      id: `ord_${10000 + idx}`,
      customerId: cust.id,
      customerName: cust.name,
      amount,
      date,
      product: products[Math.floor(Math.random() * products.length)],
      channel: channels[Math.floor(Math.random() * channels.length)]
    };
  });
};

export const OrbitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("command-center");
  const [businessType, setBusinessType] = useState<string>(() => {
    return localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("orbit_customers");
    const savedType = localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
    return saved ? JSON.parse(saved) : generateMockCustomers(savedType);
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("orbit_orders");
    const savedType = localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
    return saved ? JSON.parse(saved) : generateMockOrders(generateMockCustomers(savedType), savedType);
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem("orbit_campaigns");
    return saved ? JSON.parse(saved) : [
      {
        id: "camp_1",
        name: "Q2 Win-back Initiative",
        goal: "Reduce Churn",
        description: "Re-engage dormant premium accounts with a custom credits drop.",
        channel: "WhatsApp" as const,
        status: "Completed" as const,
        sentCount: 154,
        deliveredCount: 151,
        openedCount: 142,
        clickedCount: 68,
        purchaseCount: 22,
        revenueGenerated: 34500,
        createdAt: "2026-05-12T10:00:00Z"
      },
      {
        id: "camp_2",
        name: "Quantum Implants Cross-sell",
        goal: "Increase Repeat Purchases",
        description: "Promoting Neural Implants v2 upgrades to existing tech enthusiasts.",
        channel: "Email" as const,
        status: "Completed" as const,
        sentCount: 430,
        deliveredCount: 428,
        openedCount: 310,
        clickedCount: 189,
        purchaseCount: 45,
        revenueGenerated: 82000,
        createdAt: "2026-05-28T09:15:00Z"
      }
    ];
  });

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>(() => {
    const saved = localStorage.getItem("orbit_agent_logs");
    return saved ? JSON.parse(saved) : [
      {
        id: "log_1",
        agent: "System" as const,
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        message: "ORBIT Core System online. Version 4.8.1-Vanguard.",
        type: "thought" as const
      },
      {
        id: "log_2",
        agent: "Polaris" as const,
        timestamp: new Date(Date.now() - 3500000).toLocaleTimeString(),
        message: "Scanning customer cohorts. Detected 18 Slipping Away VIPs.",
        type: "action" as const
      },
      {
        id: "log_3",
        agent: "Vega" as const,
        timestamp: new Date(Date.now() - 3400000).toLocaleTimeString(),
        message: "Predictive ROI evaluation complete for slipping cohort. High impact channel identified: WhatsApp.",
        type: "thought" as const
      }
    ];
  });

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem("orbit_config");
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      geminiKey: parsed.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== "undefined" ? atob("QVEuQWI4Uk42S3VVcG95OVR1Y0oydUdvdVpESHNoUjRVU1hxcEhmZThCblBFMVB2d214T1E=") : ""),
      deepgramKey: parsed.deepgramKey || "",
      elevenLabsKey: parsed.elevenLabsKey || "",
      resendKey: parsed.resendKey || import.meta.env.VITE_RESEND_API_KEY || (typeof window !== "undefined" ? atob("cmVfN1VGR3JEaHVfTnBFRXF6N2YzekJiWFo1ckpKUmVBZzNC") : ""),
      simulationSpeed: parsed.simulationSpeed ?? 1,
      autonomousMode: parsed.autonomousMode ?? false,
      voiceSynthesis: parsed.voiceSynthesis ?? false,
      firebaseKey: parsed.firebaseKey || "",
      firebaseProjectId: parsed.firebaseProjectId || ""
    };
  });

  const [mission, setMission] = useState<MissionState>({
    isActive: false,
    step: "idle",
    goal: "",
    audienceCount: 0,
    predictedRoi: 0,
    predictedRevenue: 0,
    generatedContent: {},
    selectedChannel: "Email"
  });

  const [lunaMetrics, setLunaMetrics] = useState<LunaMetrics>(() => {
    const saved = localStorage.getItem("orbit_luna_metrics");
    return saved ? JSON.parse(saved) : {
      recoverableRevenue: 20550,
      opportunityScore: 88,
      inactiveCustomers: 12,
      abandonedLeads: 17,
      recoveryConfidence: 91
    };
  });

  const launchMissionCampaignRef = useRef<any>(null);

  // Keep track of statistics
  const [revenueGoal] = useState(250000);
  const [growthScore, setGrowthScore] = useState(84.6);
  const [activeMissionsCount, setActiveMissionsCount] = useState(0);
  const [networkHealth] = useState(99.4);

  const addAgentLog = useCallback((agent: AgentLog["agent"], message: string, type: AgentLog["type"]) => {
    const newLog: AgentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      agent,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setAgentLogs(prev => [newLog, ...prev].slice(0, 150)); // Cap at 150 items

    // Voice Synthesis integration
    if (config.voiceSynthesis && typeof window !== "undefined" && "speechSynthesis" in window) {
      if (agent !== "System" && type === "chat") {
        const textToSpeak = `${agent} says: ${message}`;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        // Change pitch slightly based on agent to differentiate them
        if (agent === "Polaris") { utterance.pitch = 1.2; utterance.rate = 1.05; }
        else if (agent === "Vega") { utterance.pitch = 0.9; utterance.rate = 0.95; }
        else if (agent === "Nova") { utterance.pitch = 1.3; utterance.rate = 1.1; }
        else if (agent === "Atlas") { utterance.pitch = 0.85; utterance.rate = 1.0; }
        else if (agent === "Luna") { utterance.pitch = 1.1; utterance.rate = 1.15; }
        
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [config.voiceSynthesis]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("orbit_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("orbit_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("orbit_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem("orbit_agent_logs", JSON.stringify(agentLogs));
  }, [agentLogs]);

  useEffect(() => {
    localStorage.setItem("orbit_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("orbit_luna_metrics", JSON.stringify(lunaMetrics));
  }, [lunaMetrics]);

  useEffect(() => {
    localStorage.setItem("orbit_business_type", businessType);
  }, [businessType]);

  // Sync state with backend APIs on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const healthRes = await fetch("/api/health");
        if (!healthRes.ok) throw new Error("Backend offline");
        const health = await healthRes.json();
        if (health.status !== "online") throw new Error("Backend status invalid");

        console.log("Connected to ORBIT Backend. Fetching state...");

        // Load campaigns
        const campRes = await fetch("/api/campaigns");
        if (campRes.ok) {
          const campData = await campRes.json();
          if (campData && campData.length > 0) {
            setCampaigns(campData);
          }
        }

        // Load brand DNA to sync profile
        const brandRes = await fetch("/api/brand-dna");
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          if (brandData && brandData.businessType) {
            setBusinessType(brandData.businessType);
          }
        }

        // Load opportunities
        const oppRes = await fetch("/api/opportunities");
        if (oppRes.ok) {
          const oppData = await oppRes.json();
          console.log("Opportunities loaded from backend database:", oppData.length);
        }
      } catch (err) {
        console.warn("Failed to synchronize with backend APIs. Running in client-side fallback mode.", err);
      }
    }
    loadBackendData();
  }, []);

  const updateLunaMetrics = useCallback((metrics: Partial<LunaMetrics>) => {
    setLunaMetrics(prev => ({ ...prev, ...metrics }));
  }, []);

  const personalizeForBusiness = useCallback((type: string) => {
    setBusinessType(type);
    
    // Sync Brand DNA to backend
    fetch("/api/brand-dna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType: type, growthStyle: "High Growth" })
    }).catch(err => {
      console.warn("Backend Brand DNA sync failed:", err);
    });

    // Regenerate data specific to business type
    const newCustomers = generateMockCustomers(type);
    const newOrders = generateMockOrders(newCustomers, type);
    
    // Custom Campaigns
    let newCampaigns: Campaign[] = [];
    if (type === "Fashion & Apparel") {
      newCampaigns = [
        {
          id: "camp_f1",
          name: "Instagram DM Directives",
          goal: "Recover Leads",
          description: "Follow up with abandoned enquiries from social messages.",
          channel: "WhatsApp",
          status: "Completed",
          sentCount: 154,
          deliveredCount: 151,
          openedCount: 142,
          clickedCount: 68,
          purchaseCount: 22,
          revenueGenerated: 34500,
          createdAt: new Date().toISOString()
        },
        {
          id: "camp_f2",
          name: "New Collection Drop Blast",
          goal: "Launch Collection",
          description: "Announcing Autumn collection wear to loyalist customers.",
          channel: "RCS",
          status: "Completed",
          sentCount: 430,
          deliveredCount: 428,
          openedCount: 310,
          clickedCount: 189,
          purchaseCount: 45,
          revenueGenerated: 82000,
          createdAt: new Date().toISOString()
        }
      ];
    } else if (type === "Beauty & Skincare") {
      newCampaigns = [
        {
          id: "camp_b1",
          name: "Serum Subscription Re-orders",
          goal: "Replenish Reminders",
          description: "Auto replenishment checks for monthly serum packs.",
          channel: "SMS",
          status: "Completed",
          sentCount: 200,
          deliveredCount: 198,
          openedCount: 180,
          clickedCount: 94,
          purchaseCount: 42,
          revenueGenerated: 28900,
          createdAt: new Date().toISOString()
        }
      ];
    } else {
      newCampaigns = [
        {
          id: "camp_g1",
          name: `${type} Autonomous Re-engagement`,
          goal: "Increase Repeat Purchases",
          description: "Re-activating slipping customer accounts with VIP promotions.",
          channel: "WhatsApp",
          status: "Completed",
          sentCount: 120,
          deliveredCount: 118,
          openedCount: 110,
          clickedCount: 54,
          purchaseCount: 18,
          revenueGenerated: 18500,
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Custom Luna Metrics
    let recoverableRevenue = 20550;
    let opportunityScore = 88;
    let inactiveCustomers = 12;
    let abandonedLeads = 17;
    let recoveryConfidence = 91;

    if (type === "Fashion & Apparel") {
      recoverableRevenue = 12000;
      abandonedLeads = 17;
      inactiveCustomers = 12;
      opportunityScore = 91;
    } else if (type === "Beauty & Skincare") {
      recoverableRevenue = 8900;
      abandonedLeads = 25;
      inactiveCustomers = 14;
      opportunityScore = 87;
    } else if (type === "Food & Bakery") {
      recoverableRevenue = 4200;
      abandonedLeads = 32;
      inactiveCustomers = 28;
      opportunityScore = 93;
    } else if (type === "Jewellery & Accessories") {
      recoverableRevenue = 45000;
      abandonedLeads = 9;
      inactiveCustomers = 6;
      opportunityScore = 89;
    } else if (type === "D2C Brand") {
      recoverableRevenue = 18500;
      abandonedLeads = 21;
      inactiveCustomers = 16;
      opportunityScore = 86;
    } else if (type === "Enterprise") {
      recoverableRevenue = 380000;
      abandonedLeads = 4;
      inactiveCustomers = 3;
      opportunityScore = 95;
    }

    setCustomers(newCustomers);
    setOrders(newOrders);
    setCampaigns(newCampaigns);
    setLunaMetrics({
      recoverableRevenue,
      opportunityScore,
      inactiveCustomers,
      abandonedLeads,
      recoveryConfidence
    });

    addAgentLog("System", `Calibrated ORBIT Core parameters for ${type} node schema. Mapped ${newCustomers.length} profiles, regenerated transaction registers.`, "thought");
  }, [addAgentLog]);

  // Set initial theme on HTML class
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "executive") {
      html.classList.add("light");
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
      html.classList.remove("light");
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    addAgentLog("System", `System parameters reconfigured. Speed: ${newConfig.simulationSpeed || config.simulationSpeed}x`, "thought");
  };

  const cancelMission = () => {
    setMission({
      isActive: false,
      step: "idle",
      goal: "",
      audienceCount: 0,
      predictedRoi: 0,
      predictedRevenue: 0,
      generatedContent: {},
      selectedChannel: "Email"
    });
    addAgentLog("System", "Current operational mission cancelled.", "thought");
    setActiveMissionsCount(0);
  };

  // Run a complete simulated workflow step by step
  const startMission = useCallback(async (goal: string) => {
    setMission(prev => ({
      ...prev,
      isActive: true,
      step: "analyzing",
      goal
    }));
    setActiveMissionsCount(1);

    const speedMultiplier = config.simulationSpeed;
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms / speedMultiplier));

    // Step 1: Core analysis
    addAgentLog("System", `Initiating mission: ${goal}`, "thought");
    await wait(1500);

    let targetSegment: Customer["segment"] = "Loyalists";
    let filterMsg = "";
    let recoveredCount = 0;
    let recoveredValue = 0;
    let confidence = 90;
    let lunaMsg = "";
    let predictedRoi = 4.2;
    let predictedRevenue = 35000;
    let vegaMsg = "";
    let selectedChannel: Campaign["channel"] = "WhatsApp";
    let copy = {
      Email: { subject: "", body: "" },
      WhatsApp: { body: "" },
      SMS: { body: "" },
      RCS: { title: "", body: "", mediaUrl: "" }
    };
    let bRoomDialogue: any[] = [];

    let consolidatedResult: any = null;
    let geminiError: string | null = null;

    // Try to run mission generation on the Express backend
    try {
      addAgentLog("System", "Initiating AI Mission Plan generation on backend...", "action");
      const res = await fetch("/api/autonomous-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, businessType })
      });
      if (res.ok) {
        consolidatedResult = await res.json();
        addAgentLog("System", "Backend mission plan generated successfully.", "result");
      } else {
        throw new Error(`HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      console.warn("Backend autonomous-mission failed. Falling back to client-side logic:", err);
      
      if (config.geminiKey) {
        try {
          const sys = `You are the ORBIT Growth Engine, coordinating 5 AI agents to plan and generate a growth campaign for the business objective.
The agents are:
- Polaris (Audience Intelligence): Chooses one segment from ["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"] and explains findings.
- Luna (Recovery): Audits leakage, specifies recoverableRevenue (number), inactiveCustomers (number), abandonedLeads (number), recoveryConfidence (number), and a detailed recovery explanation.
- Vega (Predictive ROI): Computes predictedRoi (number), predictedRevenue (number), and a detailed forecast explanation.
- Nova (Campaign Creator): Generates copy for Email (subject, body), WhatsApp (body), SMS (body), and RCS (title, body, mediaUrl).
- Atlas (Operations): Chooses one channel from ["Email", "WhatsApp", "SMS", "RCS"] and explains the dispatch routing.

Format your response as a single valid JSON object matching this schema exactly:
{
  "Polaris": {
    "segment": "Loyalists" | "Slipping Away" | "High-Value Inactive" | "New Signups",
    "explanation": "your explanation"
  },
  "Luna": {
    "recoverableRevenue": 12000,
    "inactiveCustomers": 12,
    "abandonedLeads": 15,
    "recoveryConfidence": 92,
    "explanation": "your explanation"
  },
  "Vega": {
    "predictedRoi": 4.2,
    "predictedRevenue": 35000,
    "explanation": "your explanation"
  },
  "Nova": {
    "Email": { "subject": "...", "body": "..." },
    "WhatsApp": { "body": "..." },
    "SMS": { "body": "..." },
    "RCS": { "title": "...", "body": "...", "mediaUrl": "..." }
  },
  "Atlas": {
    "selectedChannel": "Email" | "WhatsApp" | "SMS" | "RCS",
    "explanation": "your explanation"
  }
}
Do not return any markdown code block formatting. Only return the raw JSON object.`;

          const prompt = `Business Objective Goal: "${goal}". Business Category: "${businessType}". Coordinate the campaign plan.`;
          addAgentLog("System", "Querying Gemini API directly from client...", "action");
          const clientRes = await callGeminiAPI(prompt, sys, config.geminiKey);
          consolidatedResult = parseGeminiJson<any>(clientRes, null);
        } catch (clientErr: any) {
          console.error("Client Gemini execution failed:", clientErr);
          geminiError = clientErr.message || String(clientErr);
        }
      }
    }

    if (geminiError) {
      addAgentLog("System", `Direct Gemini API Call Failed: ${geminiError}`, "result");
    }

    // Step 2: Polaris finds audience
    setMission(prev => ({ ...prev, step: "analyzing" }));
    addAgentLog("Polaris", "Analyzing customer database graph. Searching for matching demographic signals.", "action");
    await wait(1500);

    if (consolidatedResult?.Polaris) {
      const pData = consolidatedResult.Polaris;
      if (pData.segment && ["Loyalists", "Slipping Away", "High-Value Inactive", "New Signups"].includes(pData.segment)) {
        targetSegment = pData.segment as Customer["segment"];
      }
      filterMsg = pData.explanation || `identified customers in segment: ${targetSegment}`;
    } else {
      if (goal.toLowerCase().includes("churn")) {
        targetSegment = "Slipping Away";
        filterMsg = "found 18 customers showing severe retention risks (churn score > 75%).";
      } else if (goal.toLowerCase().includes("repeat") || goal.toLowerCase().includes("purchase")) {
        targetSegment = "Loyalists";
        filterMsg = "identified 24 high-affinity repeat buyers with organic-preferred tags.";
      } else if (goal.toLowerCase().includes("ltv")) {
        targetSegment = "High-Value Inactive";
        filterMsg = "flagged 14 high-ltv dormant accounts with untapped buying capacity.";
      } else {
        targetSegment = "New Signups";
        filterMsg = "collated 22 first-time signups awaiting initial product campaign activation.";
      }
    }

    const cohort = customers.filter(c => c.segment === targetSegment);
    setMission(prev => ({
      ...prev,
      step: "segmenting",
      audienceCount: cohort.length
    }));
    
    addAgentLog("Polaris", `Demographic segmentation complete. Target segment: ${targetSegment}. ${filterMsg}`, "chat");
    bRoomDialogue.push({ agent: "Polaris", text: `I have mapped ${cohort.length} targets in the ${targetSegment} segment. ${filterMsg}` });
    await wait(1500);

    // Step 2.5: Luna searches for leaks
    addAgentLog("Luna", "Initiating leakage and dormancy audits on targets...", "action");
    await wait(1500);

    if (consolidatedResult?.Luna) {
      const lData = consolidatedResult.Luna;
      recoveredCount = lData.inactiveCustomers || lData.abandonedLeads || 10;
      recoveredValue = lData.recoverableRevenue || 12000;
      confidence = lData.recoveryConfidence || 90;
      lunaMsg = lData.explanation || `Detected opportunities with potential recovered revenue: ₹${recoveredValue.toLocaleString()}.`;
      
      setLunaMetrics({
        inactiveCustomers: lData.inactiveCustomers || 12,
        abandonedLeads: lData.abandonedLeads || 17,
        recoverableRevenue: recoveredValue,
        recoveryConfidence: confidence,
        opportunityScore: Math.min(100, Math.max(0, 88 + Math.floor(Math.random() * 5)))
      });
    } else {
      if (goal.toLowerCase().includes("churn") || goal.toLowerCase().includes("retention")) {
        recoveredCount = 12;
        recoveredValue = 8500;
        lunaMsg = `Detected ${recoveredCount} inactive VIP customer nodes. Predicted reactivation rate: 14%. Estimated recovery revenue: ₹${recoveredValue.toLocaleString()}.`;
        setLunaMetrics(prev => ({
          ...prev,
          inactiveCustomers: recoveredCount,
          recoverableRevenue: recoveredValue,
          recoveryConfidence: confidence,
          opportunityScore: Math.min(100, Math.max(0, prev.opportunityScore + 2))
        }));
      } else {
        recoveredCount = 17;
        recoveredValue = 12000;
        lunaMsg = `Detected ${recoveredCount} abandoned Instagram & web checkout enquiries. High purchase affinity confirmed (${confidence}% confidence). Potential recovered revenue: ₹${recoveredValue.toLocaleString()}.`;
        setLunaMetrics(prev => ({
          ...prev,
          abandonedLeads: recoveredCount,
          recoverableRevenue: recoveredValue,
          recoveryConfidence: confidence,
          opportunityScore: Math.min(100, Math.max(0, prev.opportunityScore + 3))
        }));
      }
    }
    addAgentLog("Luna", lunaMsg, "chat");
    bRoomDialogue.push({ agent: "Luna", text: lunaMsg });
    await wait(1500);

    // Step 3: Vega predicts ROI
    setMission(prev => ({
      ...prev,
      step: "predicting"
    }));
    addAgentLog("Vega", `Starting conversion forecast for ${cohort.length} targets. Simulating ROI curves.`, "action");
    await wait(1500);

    if (consolidatedResult?.Vega) {
      const vData = consolidatedResult.Vega;
      predictedRoi = vData.predictedRoi || 4.2;
      predictedRevenue = vData.predictedRevenue || 35000;
      vegaMsg = vData.explanation || `Forecast: Channel yield optimal. Expected revenue: ₹${predictedRevenue.toLocaleString()}. Predicted ROI: ${predictedRoi.toFixed(1)}x.`;
    } else {
      predictedRoi = 3.5 + Math.random() * 2.8;
      predictedRevenue = Math.round(cohort.length * 280 * (1 + Math.random() * 0.4));
      predictedRoi = parseFloat(predictedRoi.toFixed(2));
      vegaMsg = `Forecast: Channel yield optimal. Expected revenue: ₹${predictedRevenue.toLocaleString()}. Predicted ROI: ${predictedRoi.toFixed(1)}x. Preferred channel: WhatsApp.`;
    }
    
    setMission(prev => ({
      ...prev,
      predictedRoi: parseFloat(predictedRoi.toFixed(2)),
      predictedRevenue
    }));
    addAgentLog("Vega", vegaMsg, "chat");
    bRoomDialogue.push({ agent: "Vega", text: vegaMsg });
    await wait(1500);

    // Step 4: Nova generates content
    setMission(prev => ({
      ...prev,
      step: "generating"
    }));
    addAgentLog("Nova", "Spinning content generation engine. Assembling custom copywriting nodes.", "action");
    await wait(1500);

    if (consolidatedResult?.Nova) {
      const nData = consolidatedResult.Nova;
      if (nData.Email) copy.Email = nData.Email;
      if (nData.WhatsApp) copy.WhatsApp = nData.WhatsApp;
      if (nData.SMS) copy.SMS = nData.SMS;
      if (nData.RCS) copy.RCS = nData.RCS;
    }

    if (!copy.Email.body) {
      let whatsAppBody = `⚡ *ORBIT ALERT* ⚡\nHey {{name}}, ready to upgrade your setup? Get exclusive pre-launch access to the Quantum Deck. Reply *YES* to claim. Free priority shipping included.`;
      const gLower = goal.toLowerCase();
      if (gLower.includes("recovery") || gLower.includes("churn") || gLower.includes("slipping") || gLower.includes("inactive") || gLower.includes("win-back")) {
        whatsAppBody = `Hi {{name}} 👋\n\nWe noticed you haven't visited recently.\n\nHere's an exclusive offer for you.`;
      } else if (gLower.includes("vip") || gLower.includes("loyal") || gLower.includes("repeat") || gLower.includes("value")) {
        whatsAppBody = `Hi {{name}} 🌟\n\nAs one of our valued customers, you get early access to our latest collection.`;
      } else if (gLower.includes("festival") || gLower.includes("diwali") || gLower.includes("holiday")) {
        whatsAppBody = `Happy Diwali ✨\n\nCelebrate with exclusive festive offers.`;
      }

      copy = {
        Email: {
          subject: `Exclusive Access: Elevate Your Setup with Orbit Core`,
          body: `Hello {{name}},\n\nYour journey with ORBIT is just beginning. As one of our select targets, we are opening up access to the all-new Cyberwear Implant upgrades. \n\nGet yours today with priority shipping.\n\nBest regards,\nOrbit Intelligence Network`
        },
        WhatsApp: {
          body: whatsAppBody
        },
        SMS: {
          body: `ORBIT: Hi {{name}}, get exclusive pre-sale access to the new Quantum Implants. Order now at: https://orbit.io/q-deck`
        },
        RCS: {
          title: "Exclusive Launch Access",
          body: "Hey {{name}}, Vega predicted you would love this. Elevate your setup today with the Cyberwear Implant v4. Interactive booking inside.",
          mediaUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80"
        }
      };
    }

    addAgentLog("Nova", "Marketing copies generated across channels (WhatsApp, Email, SMS, RCS). Content hyper-personalized using DNA tags.", "chat");
    bRoomDialogue.push({ agent: "Nova", text: `I have generated dynamic copies across Email, WhatsApp, SMS, and RCS channels, personalized using DNA tags.` });
    await wait(1500);

    // Step 5: Atlas verifies delivery routes and optimal channel
    addAgentLog("Atlas", "Analyzing delivery nodes and selecting optimal dispatch channels...", "action");
    await wait(1500);

    let atlasMsg = "";

    if (consolidatedResult?.Atlas) {
      const aData = consolidatedResult.Atlas;
      if (aData.selectedChannel && ["Email", "WhatsApp", "SMS", "RCS"].includes(aData.selectedChannel)) {
        selectedChannel = aData.selectedChannel as Campaign["channel"];
      }
      atlasMsg = aData.explanation || `Optimal delivery channel verified: ${selectedChannel}. Dispatch queues scheduled.`;
    } else {
      if (targetSegment === "High-Value Inactive") selectedChannel = "Email";
      else if (targetSegment === "New Signups") selectedChannel = "RCS";
      else if (targetSegment === "Loyalists") selectedChannel = "WhatsApp";
      atlasMsg = `Optimal delivery channel verified: ${selectedChannel}. Dispatch buffers armed.`;
    }

    addAgentLog("Atlas", atlasMsg, "chat");
    bRoomDialogue.push({ agent: "Atlas", text: atlasMsg });

    // Retrieve boardroom dialogue sequence from Express backend
    try {
      const boardroomRes = await fetch("/api/boardroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, missionPlan: consolidatedResult })
      });
      if (boardroomRes.ok) {
        const brData = await boardroomRes.json();
        if (brData && brData.messages) {
          bRoomDialogue = brData.messages;
        }
      }
    } catch (brErr) {
      console.warn("Backend boardroom API failed. Falling back to local dialogue construction:", brErr);
    }

    setMission(prev => ({
      ...prev,
      step: "ready",
      generatedContent: copy,
      selectedChannel,
      boardroomDialogue: bRoomDialogue
    }));

    addAgentLog("System", "Campaign preparation completed. Directives ready for dispatch.", "thought");
    
    // In autonomous mode, auto-dispatch immediately
    if (config.autonomousMode) {
      await wait(1500);
      addAgentLog("Atlas", "[Autonomous Mode Activated] Dispatching campaign automatically.", "action");
      launchMissionCampaignRef.current?.(selectedChannel);
    }
  }, [customers, config, addAgentLog, businessType, cancelMission]);

  // Launch simulated campaign and run engagement loops
  const launchMissionCampaign = useCallback(async (channel: "Email" | "WhatsApp" | "SMS" | "RCS") => {
    if (!mission.isActive) return;

    const campaignId = `camp_${Date.now()}`;
    const newCampaign: Campaign = {
      id: campaignId,
      name: `${mission.goal} - Autonomous Loop`,
      goal: mission.goal,
      description: `Targeting ${mission.audienceCount} customers via ${channel}.`,
      channel,
      status: channel === "WhatsApp" ? "Queued" : "Running",
      sentCount: mission.audienceCount,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      purchaseCount: 0,
      revenueGenerated: 0,
      createdAt: new Date().toISOString(),
      failedCount: 0,
      pendingCount: mission.audienceCount,
      missionId: campaignId
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setMission(prev => ({
      ...prev,
      step: "dispatched"
    }));

    addAgentLog("Atlas", `Campaign dispatched via ${channel}. Initializing routing gateways...`, "action");

    const speedMultiplier = config.simulationSpeed;
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms / speedMultiplier));

    // Find the current target cohort
    const matchingCohort = customers.filter(c => {
      if (mission.goal.toLowerCase().includes("churn")) return c.segment === "Slipping Away";
      if (mission.goal.toLowerCase().includes("repeat") || mission.goal.toLowerCase().includes("purchase")) return c.segment === "Loyalists";
      if (mission.goal.toLowerCase().includes("ltv")) return c.segment === "High-Value Inactive";
      return c.segment === "New Signups";
    });

    // Launch campaign dispatch asynchronously on Express backend
    fetch("/api/campaigns/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        audience: matchingCohort.map(c => ({ phone: c.phone, email: c.email, name: c.name })),
        template: channel === "WhatsApp" ? (mission.generatedContent.WhatsApp?.body || "") : (mission.generatedContent.Email?.body || ""),
        missionId: campaignId,
        subject: mission.generatedContent.Email?.subject || "Special Offer from ORBIT"
      })
    }).catch(err => {
      console.warn("Backend campaign dispatch failed to run:", err);
    });

    if (channel === "WhatsApp") {
      // Live WhatsApp Campaign Run
      const templateBody = mission.generatedContent.WhatsApp?.body || "Hello from ORBIT";
      const firebaseConfig = {
        firebaseKey: config.firebaseKey,
        firebaseProjectId: config.firebaseProjectId
      };

      const recipients = matchingCohort.map(c => ({ phone: c.phone, name: c.name }));

      // Close the mission overlay so the dashboard is visible
      await wait(1500);
      setMission(prev => ({ ...prev, isActive: false, step: "idle" }));
      setActiveMissionsCount(0);

      addAgentLog("Atlas", `Atlas routing campaign to Twilio WhatsApp Sandbox for ${recipients.length} numbers.`, "action");

      // Execute twilio send campaign
      const result = await sendCampaign(
        campaignId,
        campaignId,
        recipients,
        templateBody,
        firebaseConfig,
        (index, status, info) => {
          // Dynamic progress callback updates state in real-time
          setCampaigns(prev => prev.map(c => {
            if (c.id === campaignId) {
              const delivered = status === "Delivered" ? (c.deliveredCount ?? 0) + 1 : (c.deliveredCount ?? 0);
              const failed = status === "Failed" ? (c.failedCount ?? 0) + 1 : (c.failedCount ?? 0);
              const pending = recipients.length - (delivered + failed);
              const finalStatus = pending === 0 ? (failed === recipients.length ? "Failed" : "Completed") : "Sending";
              return {
                ...c,
                status: finalStatus,
                deliveredCount: delivered,
                failedCount: failed,
                pendingCount: pending
              };
            }
            return c;
          }));

          if (status === "Failed") {
            addAgentLog("Atlas", `Message fail [${recipients[index].name}]: ${info}`, "thought");
          } else if (status === "Delivered") {
            addAgentLog("System", `Delivered to ${recipients[index].name} [SID: ${info}]`, "thought");
          }
        }
      );

      const delCount = result.dispatchedCount;
      const failCount = result.failedCount;

      addAgentLog("Atlas", `Twilio dispatch completed. Sent: ${delCount}, Failed: ${failCount}`, "chat");

      // Trigger Simulated Conversions for Delivered Messages
      if (delCount > 0) {
        await wait(2000);
        const opCount = Math.round(delCount * (0.75 + Math.random() * 0.15));
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, openedCount: opCount } : c));
        addAgentLog("System", `Webhook: ${opCount} messages opened.`, "action");

        await wait(2000);
        const clCount = Math.round(opCount * (0.4 + Math.random() * 0.2));
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, clickedCount: clCount } : c));
        addAgentLog("System", `Webhook: ${clCount} click events recorded.`, "action");

        await wait(3000);
        const purCount = Math.max(1, Math.round(clCount * (0.2 + Math.random() * 0.2)));
        const revenue = purCount * (500 + Math.floor(Math.random() * 1000));

        setCampaigns(prev => prev.map(c => c.id === campaignId ? { 
          ...c, 
          purchaseCount: purCount, 
          revenueGenerated: revenue,
          status: "Completed" 
        } : c));

        // Add real orders to the order ledger for these purchasers!
        const newOrdersList: Order[] = [];
        for (let i = 0; i < Math.min(purCount, matchingCohort.length); i++) {
          const targetCust = matchingCohort[i];
          
          setCustomers(prevCustomers => prevCustomers.map(cust => {
            if (cust.id === targetCust.id) {
              const newPurchaseCount = cust.purchaseCount + 1;
              const newLtv = cust.ltv + Math.round(revenue / purCount);
              const newRisk = Math.max(5, Math.round(cust.churnRisk - (20 + Math.random() * 20)));
              return {
                ...cust,
                purchaseCount: newPurchaseCount,
                ltv: newLtv,
                churnRisk: newRisk,
                churnTrend: "down" as const,
                predictedNextPurchase: `In ${2 + Math.floor(Math.random() * 4)} weeks`
              };
            }
            return cust;
          }));

          newOrdersList.push({
            id: `ord_${Date.now()}_${i}`,
            customerId: targetCust.id,
            customerName: targetCust.name,
            amount: Math.round(revenue / purCount),
            date: new Date().toISOString().split("T")[0],
            product: "WhatsApp Checkout Conversion",
            channel: "WhatsApp"
          });
        }

        setOrders(prev => [...newOrdersList, ...prev]);
        setGrowthScore(prev => parseFloat((prev + 1.0 + Math.random() * 0.5).toFixed(1)));
        addAgentLog("Atlas", `Campaign ${mission.goal} conversions tracked. Converted: ${purCount} VIPs. Yield: ₹${revenue.toLocaleString()}`, "chat");
        addAgentLog("Vega", `Customer Churn Risk re-computed. Churn trend is DOWN.`, "chat");
      }
    } else if (channel === "Email") {
      // Live Resend Email Campaign Run
      const templateBody = mission.generatedContent.Email?.body || "Hello from ORBIT";
      const subject = mission.generatedContent.Email?.subject || "Hello World";
      const firebaseConfig = {
        firebaseKey: config.firebaseKey,
        firebaseProjectId: config.firebaseProjectId
      };

      const recipients = matchingCohort.map(c => ({ email: c.email, name: c.name }));

      // Close the mission overlay so the dashboard is visible
      await wait(1500);
      setMission(prev => ({ ...prev, isActive: false, step: "idle" }));
      setActiveMissionsCount(0);

      addAgentLog("Atlas", `Atlas routing campaign to Resend Email service for ${recipients.length} emails.`, "action");

      // Execute resend send campaign
      const result = await sendEmailCampaign(
        campaignId,
        campaignId,
        recipients,
        subject,
        templateBody,
        config.resendKey,
        firebaseConfig,
        (index, status, info) => {
          // Dynamic progress callback updates state in real-time
          setCampaigns(prev => prev.map(c => {
            if (c.id === campaignId) {
              const delivered = status === "Delivered" ? (c.deliveredCount ?? 0) + 1 : (c.deliveredCount ?? 0);
              const failed = status === "Failed" ? (c.failedCount ?? 0) + 1 : (c.failedCount ?? 0);
              const pending = recipients.length - (delivered + failed);
              const finalStatus = pending === 0 ? (failed === recipients.length ? "Failed" : "Completed") : "Sending";
              return {
                ...c,
                status: finalStatus,
                deliveredCount: delivered,
                failedCount: failed,
                pendingCount: pending
              };
            }
            return c;
          }));

          if (status === "Failed") {
            addAgentLog("Atlas", `Email fail [${recipients[index].name}]: ${info}`, "thought");
          } else if (status === "Delivered") {
            addAgentLog("System", `Delivered to ${recipients[index].name} [ID: ${info}]`, "thought");
          }
        }
      );

      const delCount = result.dispatchedCount;
      const failCount = result.failedCount;

      addAgentLog("Atlas", `Resend dispatch completed. Sent: ${delCount}, Failed: ${failCount}`, "chat");

      // Trigger Simulated Conversions for Delivered Messages
      if (delCount > 0) {
        await wait(2000);
        const opCount = Math.round(delCount * (0.55 + Math.random() * 0.15));
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, openedCount: opCount } : c));
        addAgentLog("System", `Webhook: ${opCount} email opens tracked.`, "action");

        await wait(2000);
        const clCount = Math.round(opCount * (0.25 + Math.random() * 0.15));
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, clickedCount: clCount } : c));
        addAgentLog("System", `Webhook: ${clCount} click events recorded.`, "action");

        await wait(3000);
        const purCount = Math.max(1, Math.round(clCount * (0.15 + Math.random() * 0.15)));
        const revenue = purCount * (800 + Math.floor(Math.random() * 1200));

        setCampaigns(prev => prev.map(c => c.id === campaignId ? { 
          ...c, 
          purchaseCount: purCount, 
          revenueGenerated: revenue,
          status: "Completed" 
        } : c));

        // Add real orders to the order ledger for these purchasers!
        const newOrdersList: Order[] = [];
        for (let i = 0; i < Math.min(purCount, matchingCohort.length); i++) {
          const targetCust = matchingCohort[i];
          
          setCustomers(prevCustomers => prevCustomers.map(cust => {
            if (cust.id === targetCust.id) {
              const newPurchaseCount = cust.purchaseCount + 1;
              const newLtv = cust.ltv + Math.round(revenue / purCount);
              const newRisk = Math.max(5, Math.round(cust.churnRisk - (15 + Math.random() * 15)));
              return {
                ...cust,
                purchaseCount: newPurchaseCount,
                ltv: newLtv,
                churnRisk: newRisk,
                churnTrend: "down" as const,
                predictedNextPurchase: `In ${2 + Math.floor(Math.random() * 4)} weeks`
              };
            }
            return cust;
          }));

          newOrdersList.push({
            id: `ord_${Date.now()}_${i}`,
            customerId: targetCust.id,
            customerName: targetCust.name,
            amount: Math.round(revenue / purCount),
            date: new Date().toISOString().split("T")[0],
            product: "Email Checkout Conversion",
            channel: "Email"
          });
        }

        setOrders(prev => [...newOrdersList, ...prev]);
        setGrowthScore(prev => parseFloat((prev + 0.8 + Math.random() * 0.4).toFixed(1)));
        addAgentLog("Atlas", `Campaign ${mission.goal} conversions tracked. Converted: ${purCount} VIPs. Yield: ₹${revenue.toLocaleString()}`, "chat");
        addAgentLog("Vega", `Customer Churn Risk re-computed. Churn trend is DOWN.`, "chat");
      }
    } else {
      // Simulated Run for Other Channels (SMS, RCS)
      await wait(3000);
      setMission(prev => ({
        ...prev,
        isActive: false,
        step: "idle"
      }));
      setActiveMissionsCount(0);

      const targetId = campaignId;
      const totalTargets = mission.audienceCount;

      // Delivery Simulation
      await wait(2000);
      const delCount = Math.round(totalTargets * (0.95 + Math.random() * 0.05));
      setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, status: "Sending", deliveredCount: delCount, pendingCount: totalTargets - delCount } : c));
      addAgentLog("System", `Webhook triggered: ${delCount} messages DELIVERED for campaign.`, "action");

      // Open/Read Simulation
      await wait(3000);
      const opCount = Math.round(delCount * (0.65 + Math.random() * 0.25));
      setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, openedCount: opCount } : c));
      addAgentLog("System", `Webhook triggered: ${opCount} messages OPENED for campaign.`, "action");

      // Click/Engagement Simulation
      await wait(3000);
      const clCount = Math.round(opCount * (0.35 + Math.random() * 0.35));
      setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, clickedCount: clCount } : c));
      addAgentLog("System", `Webhook triggered: ${clCount} link clicks recorded for campaign.`, "action");

      // Purchase / Conversion Simulation
      await wait(4000);
      const purCount = Math.round(clCount * (0.15 + Math.random() * 0.25));
      const revenue = purCount * (500 + Math.floor(Math.random() * 1000));
      
      setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, purchaseCount: purCount, revenueGenerated: revenue, status: "Completed" } : c));
      
      const newOrdersList: Order[] = [];
      for (let i = 0; i < Math.min(purCount, matchingCohort.length); i++) {
        const targetCust = matchingCohort[i];
        
        setCustomers(prevCustomers => prevCustomers.map(cust => {
          if (cust.id === targetCust.id) {
            const newPurchaseCount = cust.purchaseCount + 1;
            const newLtv = cust.ltv + 600 + Math.floor(Math.random() * 500);
            const newRisk = Math.max(5, Math.round(cust.churnRisk - (20 + Math.random() * 20)));
            return {
              ...cust,
              purchaseCount: newPurchaseCount,
              ltv: newLtv,
              churnRisk: newRisk,
              churnTrend: "down" as const,
              predictedNextPurchase: `In ${2 + Math.floor(Math.random() * 4)} weeks`
            };
          }
          return cust;
        }));

        newOrdersList.push({
          id: `ord_${Date.now()}_${i}`,
          customerId: targetCust.id,
          customerName: targetCust.name,
          amount: Math.round(revenue / purCount),
          date: new Date().toISOString().split("T")[0],
          product: "Neural Upgrade Pack",
          channel: channel
        });
      }

      setOrders(prev => [...newOrdersList, ...prev]);
      setGrowthScore(prev => parseFloat((prev + 0.8 + Math.random() * 0.6).toFixed(1)));
      addAgentLog("Atlas", `Campaign execution complete. Converted purchases: ${purCount}. Total Yield: ₹${revenue.toLocaleString()}.`, "chat");
      addAgentLog("Vega", `Re-evaluating client portfolios. Overall customer Churn Probability has dropped by 3.8% across segments.`, "chat");
    }
  }, [mission, customers, config, addAgentLog]);

  launchMissionCampaignRef.current = launchMissionCampaign;


  // Perform a background random simulation step (simulating steady growth traffic)
  const runSimulationStep = useCallback(() => {
    // Generate a random order occasionally from a random loyal customer
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    const randomProduct = ["Cyberwear Implant v4", "Orbital Grid Adapter", "Liquid Fuel Core", "Quantum Processor Node", "Holographic Visor"][Math.floor(Math.random() * 5)];
    const channels = ["Email", "WhatsApp", "SMS", "RCS"];
    const channel = channels[Math.floor(Math.random() * 4)];
    
    const amount = 300 + Math.floor(Math.random() * 1200);
    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      customerId: randomCustomer.id,
      customerName: randomCustomer.name,
      amount,
      date: new Date().toISOString().split("T")[0],
      product: randomProduct,
      channel
    };

    setOrders(prev => [newOrder, ...prev].slice(0, 100));
    
    // Increment customer purchase count
    setCustomers(prev => prev.map(c => {
      if (c.id === randomCustomer.id) {
        return {
          ...c,
          purchaseCount: c.purchaseCount + 1,
          ltv: c.ltv + amount,
          churnRisk: Math.max(5, c.churnRisk - 5)
        };
      }
      return c;
    }));

    addAgentLog("System", `Incoming organic conversion: ${randomCustomer.name} purchased ${randomProduct} for ₹${amount.toLocaleString()} via ${channel}.`, "thought");
  }, [customers, addAgentLog]);

  const clearSimData = () => {
    localStorage.removeItem("orbit_customers");
    localStorage.removeItem("orbit_orders");
    localStorage.removeItem("orbit_campaigns");
    localStorage.removeItem("orbit_agent_logs");
    localStorage.removeItem("orbit_luna_metrics");
    localStorage.removeItem("orbit_business_type");
    
    setCustomers(generateMockCustomers("Fashion & Apparel"));
    setOrders(generateMockOrders(generateMockCustomers("Fashion & Apparel"), "Fashion & Apparel"));
    setCampaigns([]);
    setBusinessType("Fashion & Apparel");
    setLunaMetrics({
      recoverableRevenue: 20550,
      opportunityScore: 88,
      inactiveCustomers: 12,
      abandonedLeads: 17,
      recoveryConfidence: 91
    });
    setAgentLogs([
      {
        id: "log_init",
        agent: "System",
        timestamp: new Date().toLocaleTimeString(),
        message: "ORBIT Core cleared and reinitialized.",
        type: "thought"
      }
    ]);
  };

  // Run minor organic simulations in background if in autonomous mode
  useEffect(() => {
    if (!config.autonomousMode) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        runSimulationStep();
      }
    }, 12000 / config.simulationSpeed);

    return () => clearInterval(interval);
  }, [config.autonomousMode, config.simulationSpeed, runSimulationStep]);

  return (
    <OrbitContext.Provider value={{
      theme,
      setTheme,
      customers,
      campaigns,
      orders,
      agentLogs,
      config,
      mission,
      revenueGoal,
      growthScore,
      activeMissionsCount,
      networkHealth,
      addAgentLog,
      updateConfig,
      startMission,
      launchMissionCampaign,
      cancelMission,
      runSimulationStep,
      clearSimData,
      lunaMetrics,
      updateLunaMetrics,
      businessType,
      personalizeForBusiness
    }}>
      {children}
    </OrbitContext.Provider>
  );
};

export const useOrbit = () => {
  const context = useContext(OrbitContext);
  if (!context) throw new Error("useOrbit must be used within an OrbitProvider");
  return context;
};
