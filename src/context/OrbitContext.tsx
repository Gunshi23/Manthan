import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  status: "Draft" | "Running" | "Completed";
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  purchaseCount: number;
  revenueGenerated: number;
  createdAt: string;
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
    return saved ? JSON.parse(saved) : {
      geminiKey: "",
      deepgramKey: "",
      elevenLabsKey: "",
      resendKey: "",
      simulationSpeed: 1,
      autonomousMode: false,
      voiceSynthesis: false
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

  const updateLunaMetrics = useCallback((metrics: Partial<LunaMetrics>) => {
    setLunaMetrics(prev => ({ ...prev, ...metrics }));
  }, []);

  const personalizeForBusiness = useCallback((type: string) => {
    setBusinessType(type);
    
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
    addAgentLog("Polaris", "Analyzing customer database graph. Searching for matching demographic signals.", "action");
    
    // Step 2: Polaris finds audience
    await wait(2000);
    let targetSegment: Customer["segment"] = "Loyalists";
    let filterMsg = "";
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

    const cohort = customers.filter(c => c.segment === targetSegment);
    setMission(prev => ({
      ...prev,
      step: "segmenting",
      audienceCount: cohort.length
    }));
    
    addAgentLog("Polaris", `Filtering complete. Target cohort: ${targetSegment}. ${filterMsg}`, "chat");

    // Step 2.5: Luna searches for leaks
    await wait(1800);
    let recoveredCount = 0;
    let recoveredValue = 0;
    let confidence = 85 + Math.floor(Math.random() * 12);
    if (goal.toLowerCase().includes("churn") || goal.toLowerCase().includes("retention")) {
      recoveredCount = 12;
      recoveredValue = 8500;
      addAgentLog("Luna", `Detected ${recoveredCount} inactive VIP customer nodes. Predicted reactivation rate: 14%. Estimated recovery revenue: ₹${recoveredValue.toLocaleString()}.`, "action");
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
      addAgentLog("Luna", `Detected ${recoveredCount} abandoned Instagram & web checkout enquiries. High purchase affinity confirmed (${confidence}% confidence). Potential recovered revenue: ₹${recoveredValue.toLocaleString()}.`, "action");
      setLunaMetrics(prev => ({
        ...prev,
        abandonedLeads: recoveredCount,
        recoverableRevenue: recoveredValue,
        recoveryConfidence: confidence,
        opportunityScore: Math.min(100, Math.max(0, prev.opportunityScore + 3))
      }));
    }

    // Step 3: Vega predicts ROI
    await wait(2000);
    setMission(prev => ({
      ...prev,
      step: "predicting"
    }));
    addAgentLog("Vega", `Starting conversion forecast for ${cohort.length} targets. Simulating ROI curves.`, "action");
    
    await wait(1800);
    const predictedRoi = 3.5 + Math.random() * 2.8;
    const predictedRevenue = Math.round(cohort.length * 280 * (1 + Math.random() * 0.4));
    
    setMission(prev => ({
      ...prev,
      predictedRoi: parseFloat(predictedRoi.toFixed(2)),
      predictedRevenue
    }));
    addAgentLog("Vega", `Forecast: Channel yield optimal. Expected revenue: ₹${predictedRevenue.toLocaleString()}. Predicted ROI: ${predictedRoi.toFixed(1)}x. Preferred channel: WhatsApp.`, "chat");

    // Step 4: Nova generates content
    await wait(2200);
    setMission(prev => ({
      ...prev,
      step: "generating"
    }));
    addAgentLog("Nova", "Spinning content generation engine. Assembling custom visual copywriting nodes.", "action");

    await wait(2000);
    const copy = {
      Email: {
        subject: `Exclusive Access: Elevate Your Setup with Orbit Core`,
        body: `Hello {{name}},\n\nYour journey with ORBIT is just beginning. As one of our select targets, we are opening up access to the all-new Cyberwear Implant upgrades. \n\nGet yours today with priority shipping.\n\nBest regards,\nOrbit Intelligence Network`
      },
      WhatsApp: {
        body: `⚡ *ORBIT ALERT* ⚡\nHey {{name}}, ready to upgrade your setup? Get exclusive pre-launch access to the Quantum Deck. Reply *YES* to claim. Free priority shipping included.`
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

    let selectedChannel: Campaign["channel"] = "WhatsApp";
    if (targetSegment === "High-Value Inactive") selectedChannel = "Email";
    else if (targetSegment === "New Signups") selectedChannel = "RCS";
    else if (targetSegment === "Loyalists") selectedChannel = "WhatsApp";

    setMission(prev => ({
      ...prev,
      step: "ready",
      generatedContent: copy,
      selectedChannel
    }));

    addAgentLog("Nova", "Marketing copies generated across channels (WhatsApp, Email, SMS, RCS). Content hyper-personalized using DNA tags.", "chat");
    addAgentLog("Atlas", "Analyzing delivery nodes. Channels optimized. Verification flags cleared. Awaiting launch confirmation.", "chat");
    
    // In autonomous mode, auto-dispatch immediately
    if (config.autonomousMode) {
      await wait(1500);
      addAgentLog("Atlas", "[Autonomous Mode Activated] Dispatching campaign automatically.", "action");
      launchMissionCampaign(selectedChannel);
    }
  }, [customers, config.simulationSpeed, config.autonomousMode, addAgentLog]);

  // Launch simulated campaign and run engagement loops
  const launchMissionCampaign = useCallback(async (channel: "Email" | "WhatsApp" | "SMS" | "RCS") => {
    if (!mission.isActive) return;

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      name: `${mission.goal} - Autonomous Loop`,
      goal: mission.goal,
      description: `Targeting ${mission.audienceCount} customers via ${channel}.`,
      channel,
      status: "Running",
      sentCount: mission.audienceCount,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      purchaseCount: 0,
      revenueGenerated: 0,
      createdAt: new Date().toISOString()
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setMission(prev => ({
      ...prev,
      step: "dispatched"
    }));

    addAgentLog("Atlas", `Campaign dispatched successfully via ${channel}. Initializing tracking webhook nodes...`, "action");

    // Close the mission state after some seconds and let it run in the background
    const speedMultiplier = config.simulationSpeed;
    const wait = (ms: number) => new Promise(res => setTimeout(res, ms / speedMultiplier));

    await wait(3000);
    // Remove the mission focus overlay so the user can look at the dashboards
    setMission(prev => ({
      ...prev,
      isActive: false,
      step: "idle"
    }));
    setActiveMissionsCount(0);

    // Simulate engagement callbacks (Sent -> Delivered -> Opened -> Clicked -> Purchased)
    // We will update this campaign state step by step in the campaigns list!
    const targetId = newCampaign.id;
    const totalTargets = newCampaign.sentCount;

    // Delivery Simulation
    await wait(2000);
    const delCount = Math.round(totalTargets * (0.95 + Math.random() * 0.05));
    setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, deliveredCount: delCount } : c));
    addAgentLog("System", `Webhook triggered: ${delCount} messages DELIVERED for campaign ${newCampaign.name}.`, "action");

    // Open/Read Simulation
    await wait(3000);
    const opCount = Math.round(delCount * (0.65 + Math.random() * 0.25));
    setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, openedCount: opCount } : c));
    addAgentLog("System", `Webhook triggered: ${opCount} messages OPENED for campaign ${newCampaign.name}.`, "action");

    // Click/Engagement Simulation
    await wait(3000);
    const clCount = Math.round(opCount * (0.35 + Math.random() * 0.35));
    setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, clickedCount: clCount } : c));
    addAgentLog("System", `Webhook triggered: ${clCount} link clicks recorded for campaign ${newCampaign.name}.`, "action");

    // Purchase / Conversion Simulation
    await wait(4000);
    const purCount = Math.round(clCount * (0.15 + Math.random() * 0.25));
    const revenue = purCount * (500 + Math.floor(Math.random() * 1000));
    
    setCampaigns(prev => prev.map(c => c.id === targetId ? { ...c, purchaseCount: purCount, revenueGenerated: revenue, status: "Completed" } : c));
    
    // Add real orders to the order ledger for these purchasers!
    const matchingCohort = customers.filter(c => {
      if (mission.goal.toLowerCase().includes("churn")) return c.segment === "Slipping Away";
      if (mission.goal.toLowerCase().includes("repeat") || mission.goal.toLowerCase().includes("purchase")) return c.segment === "Loyalists";
      if (mission.goal.toLowerCase().includes("ltv")) return c.segment === "High-Value Inactive";
      return c.segment === "New Signups";
    });

    const newOrdersList: Order[] = [];
    for (let i = 0; i < Math.min(purCount, matchingCohort.length); i++) {
      const targetCust = matchingCohort[i];
      
      // Update customer DNA, churnRisk & ltv in the database
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

      // Create order
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
    
    // Update global dashboard items
    setGrowthScore(prev => parseFloat((prev + 0.8 + Math.random() * 0.6).toFixed(1)));
    addAgentLog("Atlas", `Campaign ${newCampaign.name} execution complete. Converted purchases: ${purCount}. Total Yield: ₹${revenue.toLocaleString()}.`, "chat");
    addAgentLog("Vega", `Re-evaluating client portfolios. Overall customer Churn Probability has dropped by 3.8% across segments.`, "chat");
  }, [mission, customers, config.simulationSpeed, addAgentLog]);

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
