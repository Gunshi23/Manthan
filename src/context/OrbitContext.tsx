import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { callGeminiAPI, parseGeminiJson } from "../utils/gemini";
import { sendCampaign } from "../services/twilioService";
import { sendEmailCampaign } from "../services/resendService";
import * as XLSX from "xlsx";

// Theme types
export type ThemeMode = "command-center" | "executive";

// Persona Interface
export interface Persona {
  id: string;
  name: string;
  description: string;
  motivation: string;
  buyingPattern: string;
  preferredChannel: "Email" | "WhatsApp" | "SMS" | "RCS";
  averageSpend: number;
  purchaseFrequency: string;
  loyaltyScore: number;
  riskScore: number; // 0-100
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  predictedLtv: number;
  revenueContributionPct: number;
  customerCount: number;
  growthOpportunity: string;
  recommendedStrategy: string;
  whatTheyBuy: string;
  whyTheyBuy: string;
  whenTheyBuy: string;
  bestCommChannel: string;
  suggestedCampaign: string;
  avatar: string;
  revenuePotential: number;
  
  // Demographic and Classification fields
  ageRange: string;
  lifestyle: string;
  buyingTriggers: string;
  preferredProducts: string;
  aiInsightsTargeting: string;
}

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
  region: string;
  
  customerId?: string;
  persona?: string;
  totalSpent?: number;
  lastPurchaseDate?: string;
  riskScore?: number;
  lifetimeValue?: number;
  ordersCount?: number;
  customerSentiment?: "Positive" | "Neutral" | "Negative";
  growthOpportunity?: string;
  reviews?: string[];
  sentiment?: "Positive" | "Neutral" | "Negative";
  lifecycleStage?: "Recent Buyer" | "Cooling Period" | "Miss You" | "Inactive" | "Dormant";
  birthday?: string;   // "MM-DD" format e.g. "02-14"
  ageGroup?: "Teen" | "Young Adult" | "Adult" | "Senior"; // for Seasonal Intelligence targeting
  // Regional Intelligence fields
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
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
  predictedRoi?: number;
  predictedRevenue?: number;
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

export interface BoardroomVerdict {
  scenarioName: string;
  scenarioDescription: string;
  targetPersona: string;
  region: string;
  currentTrend: string;
  futureTrend: string;
  revenueOpportunity: number;
  expectedRoi: number;
  launchDate: string;
  confidenceScore: number;
  forecast: {
    d30: string;
    d60: string;
    d90: string;
  };
  timestamp: string;
}

// Business DNA — the universal profile derived from uploaded data or manual setup
export interface BusinessDNA {
  // Core identity
  industryType: string;          // e.g. "Restaurant", "Gym", "Fashion Brand"
  businessModel: string;         // e.g. "B2C Subscription", "D2C Retail"
  detectedLanguage: string;      // e.g. "INR", "USD"
  currency: string;
  
  // Key metrics extracted from data
  totalRevenue: number;
  totalCustomers: number;
  totalTransactions: number;
  avgOrderValue: number;
  topProduct: string;
  topCategory: string;
  growthRate: number;            // % month-over-month estimated
  
  // AI-derived insights
  primaryMetric: string;         // Most important KPI for this industry
  secondaryMetric: string;
  riskAreas: string[];           // Top 3 risk areas
  opportunities: string[];       // Top 3 opportunities
  
  // Data source metadata
  dataSource: "csv" | "json" | "manual" | "preset";
  columns: string[];             // Detected column names from upload
  sampleRows: number;            // Row count of uploaded file
  uploadedAt: string;            // ISO timestamp
  
  // Personalization hooks
  suggestedPersonaNames: string[]; // Industry-appropriate persona archetypes
  suggestedCampaignTypes: string[];
  primaryChannel: string;
}

interface OrbitContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  customers: Customer[];
  campaigns: Campaign[];
  orders: Order[];
  agentLogs: AgentLog[];
  config: SystemConfig;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  updateCustomer: (customerId: string, updatedFields: Partial<Customer>) => void;
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
  addCampaign: (campaign: Campaign) => void;
  cancelMission: () => void;
  runSimulationStep: () => void;
  clearSimData: () => void;
  missions: any[];
  refreshMissions: () => Promise<void>;
  updateMissionStatus: (id: string, status: string) => Promise<void>;
  duplicateMission: (id: string) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  personas: Persona[];
  topPersona: Persona | null;
  riskPersona: Persona | null;
  growthPersona: Persona | null;
  highestRevenuePersona: Persona | null;
  personaDistribution: { name: string; percentage: number; count: number; color: string }[];
  generatePersonas: () => Promise<void>;
  latestVerdict: BoardroomVerdict | null;
  updateLatestVerdict: (verdict: BoardroomVerdict) => void;
  // Universal Business Intelligence & Workspaces
  workspaceDna: BusinessDNA | null;
  isAnalyzingDataset: boolean;
  uploadDatasetAndReconfigure: (file: File) => Promise<void>;
  applyDnaPreset: (industryKey: string) => void;
  workspaces: WorkspaceMetadata[];
  currentWorkspaceId: string | null;
  switchWorkspace: (id: string) => Promise<void>;
  deleteWorkspace: (id: string) => void;
}

export interface WorkspaceMetadata {
  id: string;
  name: string;
  type: "demo" | "uploaded";
  businessType: string;
  uploadedAt?: string;
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

  // Geo data pool — 10 Indian cities
  const GEO_POOL = [
    { city: "New Delhi",  state: "Delhi",          region: "North Delhi",  pincode: "110001", country: "India" },
    { city: "Noida",      state: "Uttar Pradesh",   region: "Noida",       pincode: "201301", country: "India" },
    { city: "Lucknow",    state: "Uttar Pradesh",   region: "Lucknow",     pincode: "226001", country: "India" },
    { city: "Mumbai",     state: "Maharashtra",     region: "Mumbai",      pincode: "400001", country: "India" },
    { city: "Pune",       state: "Maharashtra",     region: "South Delhi", pincode: "411001", country: "India" },
    { city: "Bangalore",  state: "Karnataka",       region: "Bangalore",   pincode: "560001", country: "India" },
    { city: "Chennai",    state: "Tamil Nadu",       region: "Bangalore",   pincode: "600001", country: "India" },
    { city: "Hyderabad",  state: "Telangana",       region: "South Delhi", pincode: "500001", country: "India" },
    { city: "Kolkata",    state: "West Bengal",     region: "Noida",       pincode: "700001", country: "India" },
    { city: "Ahmedabad",  state: "Gujarat",         region: "Mumbai",      pincode: "380001", country: "India" },
  ];

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

    // Generate a random birthday (month-day)
    const bdMonth = String(1 + (i * 7 % 12)).padStart(2, "0");
    const bdDay = String(1 + (i * 13 % 28)).padStart(2, "0");
    const birthday = `${bdMonth}-${bdDay}`;

    // ageGroup derived from persona segment index
    const ageGroupPool: Customer["ageGroup"][] = ["Teen", "Young Adult", "Adult", "Senior"];
    const ageGroup = ageGroupPool[(i * 3) % ageGroupPool.length];

    // Geo assignment
    const geo = GEO_POOL[i % GEO_POOL.length];

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
      y,
      region: geo.region,
      birthday,
      ageGroup,
      city: geo.city,
      state: geo.state,
      pincode: geo.pincode,
      country: geo.country,
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

// Dynamic local customer-to-persona clustering mapping helper
const mapCustomersToPersonas = (customers: Customer[], businessType: string): Persona[] => {
  const genz = customers.filter(c => c.segment === "New Signups");
  const professionals = customers.filter(c => c.segment === "Loyalists" && c.ltv < 4000);
  const homemakers = customers.filter(c => c.segment === "Slipping Away" && c.purchaseCount < 4);
  const traditional = customers.filter(c => c.segment === "Slipping Away" && c.purchaseCount >= 4);
  const premium = customers.filter(c => c.segment === "Loyalists" && c.ltv >= 4000);
  const festival = customers.filter(c => c.segment === "High-Value Inactive");

  const totalLtv = customers.reduce((sum, c) => sum + c.ltv, 0);

  const getContribution = (subList: Customer[]) => {
    if (totalLtv === 0) return 0;
    const subLtv = subList.reduce((sum, c) => sum + c.ltv, 0);
    return Math.round((subLtv / totalLtv) * 100);
  };

  const getAvgSpend = (subList: Customer[]) => {
    if (subList.length === 0) return 2500;
    return Math.round(subList.reduce((sum, c) => sum + c.ltv, 0) / subList.length / 3);
  };

  const getAvgLtv = (subList: Customer[]) => {
    if (subList.length === 0) return 5000;
    return Math.round(subList.reduce((sum, c) => sum + c.ltv, 0) / subList.length);
  };

  const getAvgRisk = (subList: Customer[]) => {
    if (subList.length === 0) return 10;
    return Math.round(subList.reduce((sum, c) => sum + c.churnRisk, 0) / subList.length);
  };

  const getPreferredChannel = (subList: Customer[]): "Email" | "WhatsApp" | "SMS" | "RCS" => {
    if (subList.length === 0) return "WhatsApp";
    const counts = { WhatsApp: 0, Email: 0, SMS: 0, RCS: 0 };
    subList.forEach(c => {
      counts[c.preferredChannel] = (counts[c.preferredChannel] || 0) + 1;
    });
    let maxChan: "Email" | "WhatsApp" | "SMS" | "RCS" = "WhatsApp";
    let maxVal = -1;
    (Object.keys(counts) as Array<keyof typeof counts>).forEach(k => {
      if (counts[k] > maxVal) {
        maxVal = counts[k];
        maxChan = k;
      }
    });
    return maxChan;
  };

  const isFashion = businessType.toLowerCase().includes("fashion") || businessType.toLowerCase().includes("apparel");

  return [
    {
      id: "persona_genz",
      name: "Student / Gen Z",
      description: "Young trend-focused mobile-first shoppers who respond rapidly to social discovery and visuals.",
      avatar: "sparkles",
      averageSpend: getAvgSpend(genz),
      purchaseFrequency: "Bi-weekly",
      preferredChannel: getPreferredChannel(genz),
      loyaltyScore: 78,
      riskScore: getAvgRisk(genz),
      predictedLtv: getAvgLtv(genz),
      growthOpportunity: "Deploy visual RCS carousels showcasing trending aesthetics and micro-influencer items.",
      motivation: "Status alignment, aesthetics, peer trends, and instant gratification.",
      buyingPattern: "Mobile-first shopping cycles. Spontaneous checkouts triggered by direct alerts.",
      riskLevel: "Medium",
      revenuePotential: getAvgLtv(genz) * 1.8,
      revenueContributionPct: getContribution(genz),
      customerCount: genz.length,
      recommendedStrategy: "Send a visual style drop with countdown timers to prompt spontaneous checkouts.",
      whatTheyBuy: isFashion ? "Graphic tees, trending streetwear, mini accessories." : "Starter subscriptions, cloud keys, mobile accessories.",
      whyTheyBuy: "To look on-trend, fit in socially, and experience immediate styling upgrades.",
      whenTheyBuy: "Social feeds scrolling hours, late-night sessions, instant discount drops.",
      bestCommChannel: "Rich RCS carousels with direct click-to-buy links.",
      suggestedCampaign: "Gen Z Streetwear Style Drop (Expected ROI: 4.2x)",
      ageRange: "18 - 24",
      lifestyle: "Digital native, highly active on social media, mobile-first, and value-oriented.",
      buyingTriggers: "Social media visual updates, micro-influencer looks, and checkout coupon code alerts.",
      preferredProducts: isFashion ? "Streetwear, accessories, capsule basics" : "App subscriptions, gadget skins, mobile mounts",
      aiInsightsTargeting: "Gen Z represents the future loyalty pipeline. Engaging them with visual assets, social proof, and seamless mobile checkouts maximizes early lifetime value."
    },
    {
      id: "persona_professional",
      name: "Young Working Professional",
      description: "Fast-paced urban professionals valuing convenience, premium quality, and effortless workwear edits.",
      avatar: "user-plus",
      averageSpend: getAvgSpend(professionals),
      purchaseFrequency: "Weekly",
      preferredChannel: getPreferredChannel(professionals),
      loyaltyScore: 88,
      riskScore: getAvgRisk(professionals),
      predictedLtv: getAvgLtv(professionals),
      growthOpportunity: "Bundle styling recommendations to simplify the buying path for professional wear.",
      motivation: "Professional status, styling efficiency, convenience, and build quality.",
      buyingPattern: "Consistently purchases smart-casual fits. High repeat potential on workday drops.",
      riskLevel: "Low",
      revenuePotential: getAvgLtv(professionals) * 1.5,
      revenueContributionPct: getContribution(professionals),
      customerCount: professionals.length,
      recommendedStrategy: "Deliver smart workwear edits and payday promotions via Email on Thursday evenings.",
      whatTheyBuy: isFashion ? "Smart blazers, tailored shirts, sleek office trousers." : "Team collaboration packages, dual-screen docks, pro sleeves.",
      whyTheyBuy: "To express confidence, look professional in the workplace, and save shopping time.",
      whenTheyBuy: "Midday work breaks, Thursday evenings (weekend preparation), and payday windows.",
      bestCommChannel: "Sleek professional HTML email campaigns.",
      suggestedCampaign: "Desk to Dinner Curated Edits (Expected ROI: 4.5x)",
      ageRange: "25 - 34",
      lifestyle: "Fast-paced urban corporate career, balances work-life, values time-saving solutions.",
      buyingTriggers: "Curated workwear alerts, paycheck deposits, convenience shipping options.",
      preferredProducts: isFashion ? "Office wear, smart jackets, utility accessories" : "Software bundles, premium tech sleeves, charging stations",
      aiInsightsTargeting: "Professionals have high disposable income but limited time. Streamlining their choice with pre-styled bundles and desktop-friendly email edits drives rapid repeat purchases."
    },
    {
      id: "persona_homemaker",
      name: "Homemaker",
      description: "Value-conscious decision makers buying comfortable apparel and versatile family goods.",
      avatar: "percent",
      averageSpend: getAvgSpend(homemakers),
      purchaseFrequency: "Monthly",
      preferredChannel: getPreferredChannel(homemakers),
      loyaltyScore: 75,
      riskScore: getAvgRisk(homemakers),
      predictedLtv: getAvgLtv(homemakers),
      growthOpportunity: "Introduce family bundle coupon drops to increase average cart sizes.",
      motivation: "Family comfort, versatile wear, product durability, and budgetary savings.",
      buyingPattern: "Occasional bulk purchases. Highly discount-sensitive and tracks clearance calendars.",
      riskLevel: "Medium",
      revenuePotential: getAvgLtv(homemakers) * 1.3,
      revenueContributionPct: getContribution(homemakers),
      customerCount: homemakers.length,
      recommendedStrategy: "Deliver family bundle offers and loungewear clearance highlights via WhatsApp.",
      whatTheyBuy: isFashion ? "Loungewear sets, versatile denims, kidswear bundles." : "Smart home security keys, multi-device plans, durable protective cases.",
      whyTheyBuy: "To secure comfort, versatility, and high value for the entire household budget.",
      whenTheyBuy: "Morning hours post-commute, mid-season clearance windows, major festival holiday weeks.",
      bestCommChannel: "Conversational WhatsApp catalogs containing copyable coupon alerts.",
      suggestedCampaign: "Family Comfort Loungewear Blast (Expected ROI: 3.8x)",
      ageRange: "35 - 50",
      lifestyle: "Family-centric, runs household logistics, values comfort, versatile fits, and durable products.",
      buyingTriggers: "BOGO coupon alerts, free delivery milestones, clearance calendar notifications.",
      preferredProducts: isFashion ? "Comfort loungewear, kids wear, everyday denims" : "Family license packs, smart home plugs, kitchen scale accessories",
      aiInsightsTargeting: "Homemakers prioritize versatility and family budget metrics. Delivering multi-item discounts and loungewear comfort highlights via WhatsApp recovers checkout cart sessions effectively."
    },
    {
      id: "persona_traditional",
      name: "Traditional Buyer",
      description: "Established consumers preferring classic styling, direct clear fit guides, and simple messaging.",
      avatar: "battery-low",
      averageSpend: getAvgSpend(traditional),
      purchaseFrequency: "Quarterly",
      preferredChannel: getPreferredChannel(traditional),
      loyaltyScore: 82,
      riskScore: getAvgRisk(traditional),
      predictedLtv: getAvgLtv(traditional),
      growthOpportunity: "Provide high-touch offline booking features and detailed fabric specifications.",
      motivation: "Fabric/product durability, simple classic styling, high-touch support, and returns reliability.",
      buyingPattern: "Low frequency, high consideration. Relies on classic lookbooks and repeat style purchases.",
      riskLevel: "Medium",
      revenuePotential: getAvgLtv(traditional) * 1.2,
      revenueContributionPct: getContribution(traditional),
      customerCount: traditional.length,
      recommendedStrategy: "Send straightforward SMS notifications highlighting classic collection catalog releases.",
      whatTheyBuy: isFashion ? "Tailored knitwear, classic polos, high-comfort trousers." : "Legacy accounting keys, high-support desktop monitors, desktop accessories.",
      whyTheyBuy: "To maintain a classic, reliable appearance without tracking volatile trend lines.",
      whenTheyBuy: "Seasonal changeover months, major annual milestone sales, early morning hours.",
      bestCommChannel: "Simple, high-contrast SMS notifications with direct telephone hotline links.",
      suggestedCampaign: "Classic Heritage Fall Release (Expected ROI: 3.5x)",
      ageRange: "50+",
      lifestyle: "Established career or retired, seeks simplicity, appreciates classic styles, highly loyal to trusted brands.",
      buyingTriggers: "Straightforward SMS alerts, brand heritage notifications, simplified checkout flows.",
      preferredProducts: isFashion ? "Classic knitwear, structured polos, premium leather shoes" : "On-premise software licenses, keyboard upgrades, desk planners",
      aiInsightsTargeting: "Traditional buyers show lower digital sessions but highly stable lifetime value. Keeping copy direct and avoiding slang or complex interactive UI elements optimizes their checkout completion."
    },
    {
      id: "persona_premium",
      name: "Premium Fashion Enthusiast",
      description: "Status-driven luxury shoppers seeking limited-edition drops and premium brand capsules.",
      avatar: "crown",
      averageSpend: getAvgSpend(premium),
      purchaseFrequency: "Weekly",
      preferredChannel: getPreferredChannel(premium),
      loyaltyScore: 95,
      riskScore: getAvgRisk(premium),
      predictedLtv: getAvgLtv(premium),
      growthOpportunity: "Invite to early access product drops and offer private designer capsules.",
      motivation: "Exclusivity, status display, premium fabric craft, and personal styling support.",
      buyingPattern: "Instant purchase upon limited-edition launch. Insensitive to high-tier pricing.",
      riskLevel: "Low",
      revenuePotential: getAvgLtv(premium) * 1.6,
      revenueContributionPct: getContribution(premium),
      customerCount: premium.length,
      recommendedStrategy: "Deliver private pre-order catalog drops via dedicated WhatsApp concierge.",
      whatTheyBuy: isFashion ? "Limited outerwear, luxury designer collaborations, premium accessories." : "Enterprise custom packages, developer API plans, dedicated hosting.",
      whyTheyBuy: "To express status, secure premium design first, and command white-glove service perks.",
      whenTheyBuy: "Private pre-release windows, major capsule launch times, night hours.",
      bestCommChannel: "Personalized WhatsApp VIP styling concierge.",
      suggestedCampaign: "Private VIP Early Collection Pre-Order (Expected ROI: 5.2x)",
      ageRange: "28 - 45",
      lifestyle: "Status-conscious, tracks international design houses, values global travel and premium services.",
      buyingTriggers: "Early access invitations, limited stock alerts, white-glove packaging promises.",
      preferredProducts: isFashion ? "Designer wear, leather outer garments, luxury bags" : "Enterprise API support, workstation keys, hardware integrations",
      aiInsightsTargeting: "Enthusiasts represent our highest margin segments. Providing private VIP pre-orders and direct concierge communication unlocks massive untapped discretionary spend."
    },
    {
      id: "persona_festival",
      name: "Festival Shopper",
      description: "High-volume event shoppers buying expressive items around holiday calendars.",
      avatar: "sparkles",
      averageSpend: getAvgSpend(festival),
      purchaseFrequency: "Quarterly",
      preferredChannel: getPreferredChannel(festival),
      loyaltyScore: 70,
      riskScore: getAvgRisk(festival),
      predictedLtv: getAvgLtv(festival),
      growthOpportunity: "Deploy event-countdown notifications and expressive styling lookbooks.",
      motivation: "Expressive holiday styles, festive lookbook designs, seasonal promotions.",
      buyingPattern: "Concentrated seasonal spending spikes. High cart abandonments outside festival months.",
      riskLevel: "High",
      revenuePotential: getAvgLtv(festival) * 1.5,
      revenueContributionPct: getContribution(festival),
      customerCount: festival.length,
      recommendedStrategy: "Deliver occasion-countdown catalogs and express shipping alerts via RCS.",
      whatTheyBuy: isFashion ? "Festive collections, vibrant occasion wear, statement designer belts." : "Holiday smart lighting nodes, festival sound modules, promo credits.",
      whyTheyBuy: "To dress up for social gatherings, celebrate milestones, and share looks.",
      whenTheyBuy: "Diwali/Holi countdown weeks, major holiday gift seasons, summer weekend periods.",
      bestCommChannel: "Visual RCS templates containing occasion countdown timers.",
      suggestedCampaign: "Festive Occasion Style Guide (Expected ROI: 4.8x)",
      ageRange: "21 - 40",
      lifestyle: "Socially active, plans weekends around cultural festivals and occasion gatherings.",
      buyingTriggers: "Holiday calendar milestones, shipping cutoff countdowns, styling capsules.",
      preferredProducts: isFashion ? "Festive wear, statement items, bright outer garments" : "Seasonal tech kits, portable bluetooth accessories, light bars",
      aiInsightsTargeting: "Festival shoppers buy in large batches but exhibit high dormancy. Re-engaging them with holiday lookbooks and guaranteed cutoff delivery times captures seasonal peaks."
    }
  ];
};

const getPersonaName = (c: Customer, dna: BusinessDNA | null): string => {
  let idx = 0;
  if (c.segment === "New Signups") {
    idx = 0;
  } else if (c.segment === "Loyalists" && c.ltv < 4000) {
    idx = 1;
  } else if (c.segment === "Slipping Away" && c.purchaseCount < 4) {
    idx = 2;
  } else if (c.segment === "Slipping Away" && c.purchaseCount >= 4) {
    idx = 3;
  } else if (c.segment === "Loyalists" && c.ltv >= 4000) {
    idx = 4;
  } else if (c.segment === "High-Value Inactive") {
    idx = 5;
  }
  
  if (dna && dna.suggestedPersonaNames && dna.suggestedPersonaNames[idx]) {
    return dna.suggestedPersonaNames[idx];
  }
  
  const fallbacks = [
    "Student / Gen Z",
    "Young Working Professional",
    "Homemaker",
    "Traditional Buyer",
    "Premium Fashion Enthusiast",
    "Festival Shopper"
  ];
  return fallbacks[idx];
};

const getEnrichedCustomers = (rawCustomers: Customer[], rawOrders: Order[], dna: BusinessDNA | null): Customer[] => {
  return rawCustomers.map(c => {
    const customerOrders = rawOrders.filter(o => o.customerId === c.id);
    const sortedOrders = [...customerOrders].sort((a, b) => b.date.localeCompare(a.date));
    
    let lastPurchaseDate = "2026-05-15";
    if (sortedOrders[0]) {
      lastPurchaseDate = sortedOrders[0].date;
    } else {
      const idNum = parseInt(c.id.replace(/\D/g, "")) || 0;
      let daysAgo = 10;
      if (c.segment === "Loyalists") {
        daysAgo = 10 + (idNum % 30);
      } else if (c.segment === "New Signups") {
        daysAgo = 1 + (idNum % 15);
      } else if (c.segment === "Slipping Away") {
        daysAgo = 61 + (idNum % 45);
      } else if (c.segment === "High-Value Inactive") {
        daysAgo = 100 + (idNum % 120);
      }
      
      const calcDate = new Date(new Date("2026-06-14").getTime() - daysAgo * 24 * 60 * 60 * 1000);
      lastPurchaseDate = calcDate.toISOString().split("T")[0];
    }

    const currentDate = new Date("2026-06-14");
    const lastDate = new Date(lastPurchaseDate);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let lifecycleStage: "Recent Buyer" | "Cooling Period" | "Miss You" | "Inactive" | "Dormant" = "Dormant";
    if (diffDays <= 30) lifecycleStage = "Recent Buyer";
    else if (diffDays <= 60) lifecycleStage = "Cooling Period";
    else if (diffDays <= 90) lifecycleStage = "Miss You";
    else if (diffDays <= 180) lifecycleStage = "Inactive";

    const totalSpent = customerOrders.reduce((sum, o) => sum + o.amount, 0) || c.ltv || 0;
    const ordersCount = customerOrders.length || c.purchaseCount || 0;
    
    const personaName = getPersonaName(c, dna);

    let sentiment: "Positive" | "Neutral" | "Negative" = "Neutral";
    let reviews: string[] = [];
    
    const idNum = parseInt(c.id.replace(/\D/g, "")) || 0;
    if (c.segment === "Loyalists" || c.churnRisk < 30) {
      sentiment = "Positive";
      const pool = [
        "Excellent experience, absolutely love the quality and design!",
        "Prompt delivery and very friendly support. Highly recommended.",
        "Perfect fit and material. Will definitely buy again.",
        "The best brand in the market. Consistent performance and superb style."
      ];
      reviews = [pool[idNum % pool.length], pool[(idNum + 1) % pool.length]];
    } else if (c.segment === "Slipping Away" || c.churnRisk > 70) {
      sentiment = "Negative";
      const pool = [
        "Disappointed with the recent purchase. Quality has gone down.",
        "Customer support was unresponsive when I asked for a return.",
        "Overpriced for the build quality. Looking for alternatives.",
        "Delivery was delayed by a week, and the package was slightly damaged."
      ];
      reviews = [pool[idNum % pool.length]];
    } else if (c.segment === "High-Value Inactive") {
      sentiment = "Neutral";
      const pool = [
        "Loved the premium collection, but haven't seen any new styles lately.",
        "Great service in the past, but the app has been lagging recently.",
        "Decent collection, but I wish there were more budget-friendly options.",
        "Good experience overall, though I haven't bought anything in a while."
      ];
      reviews = [pool[idNum % pool.length]];
    } else {
      sentiment = "Positive";
      const pool = [
        "Nice onboarding experience, eagerly waiting to place my next order.",
        "Smooth check-out process. Looking forward to exploring more products.",
        "Decent quality, but shipping took a bit longer than expected."
      ];
      reviews = [pool[idNum % pool.length]];
    }

    const finalReviews = c.reviews && c.reviews.length > 0 ? c.reviews : reviews;
    const finalSentiment = c.sentiment || sentiment;

    let growthOpportunity = "Cross-sell premium accessories and early access VIP releases. Target average order value increase of 25%.";
    if (c.segment === "Slipping Away") {
      growthOpportunity = "Launch high-intent re-engagement campaign via WhatsApp with a 15% discount code valid for 48 hours.";
    } else if (c.segment === "High-Value Inactive") {
      growthOpportunity = "Deploy win-back flow featuring personalized collection highlights and an exclusive milestone gift.";
    } else if (c.segment === "New Signups") {
      growthOpportunity = "Nurture with first-purchase welcome series. Highlight top-selling items in their preferred channel.";
    }

    return {
      ...c,
      customerId: c.id,
      persona: personaName,
      totalSpent,
      lastPurchaseDate,
      riskScore: c.churnRisk,
      lifetimeValue: c.ltv,
      ordersCount,
      reviews: finalReviews,
      sentiment: finalSentiment,
      lifecycleStage,
      customerSentiment: finalSentiment,
      growthOpportunity,
      birthday: c.birthday,
      ageGroup: c.ageGroup,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      country: c.country,
    };
  });
};

export const OrbitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("orbit_theme") as ThemeMode;
    return saved || "command-center";
  });
  const [workspaces, setWorkspaces] = useState<WorkspaceMetadata[]>(() => {
    const saved = localStorage.getItem("orbit_workspaces");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(() => {
    return localStorage.getItem("orbit_current_workspace_id") || null;
  });

  const [businessType, setBusinessType] = useState<string>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return "Fashion & Apparel";
    return localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
  });

  const [latestVerdict, setLatestVerdict] = useState<BoardroomVerdict | null>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return null;
    const saved = localStorage.getItem("orbit_latest_verdict");
    if (saved) return JSON.parse(saved);
    const isFashion = businessType.toLowerCase().includes("fashion") || businessType.toLowerCase().includes("apparel");
    return {
      scenarioName: "North Delhi Minimal Streetwear Launch",
      scenarioDescription: "Targeting Students/Gen Z in North Delhi shifting from Korean Fashion to Minimal Streetwear.",
      targetPersona: "Student / Gen Z",
      region: "North Delhi",
      currentTrend: isFashion ? "Oversized Korean Fashion" : "SaaS Cluster Monitoring",
      futureTrend: isFashion ? "Minimal Streetwear" : "Serverless LLM Gateway Keys",
      revenueOpportunity: 145000,
      expectedRoi: 4.5,
      launchDate: "Immediate (within 14 days)",
      confidenceScore: 92,
      forecast: {
        d30: isFashion ? "Trend Stable - Oversized Korean Fashion remains high volume but flat." : "Trend Stable - SaaS monitoring continues solid baseline.",
        d60: isFashion ? "Growth Slowing - Initial minimal streetwear collections show 15% adoption." : "Growth Slowing - Initial Serverless LLM Gateway keys show 10% adoption.",
        d90: isFashion ? "Minimal Streetwear becomes dominant - expected shift of 60% Gen Z market share." : "Serverless LLM Gateway becomes dominant - expected shift of 50% developer volume."
      },
      timestamp: new Date().toISOString()
    };
  });

  const updateLatestVerdict = useCallback((verdict: BoardroomVerdict) => {
    setLatestVerdict(verdict);
    localStorage.setItem("orbit_latest_verdict", JSON.stringify(verdict));
  }, []);

  const [missions, setMissions] = useState<any[]>([]);

  // Universal Business Intelligence - Business DNA
  const [workspaceDna, setWorkspaceDna] = useState<BusinessDNA | null>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return null;
    const saved = localStorage.getItem("orbit_workspace_dna");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAnalyzingDataset, setIsAnalyzingDataset] = useState(false);

  const [rawCustomers, setCustomers] = useState<Customer[]>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return [];
    const saved = localStorage.getItem("orbit_customers");
    const savedType = localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
    if (!saved) return generateMockCustomers(savedType);
    const parsed: Customer[] = JSON.parse(saved);
    // Normalize coords for any stale records missing valid x/y
    const GALAXY_CENTERS: Record<string, { cx: number; cy: number }> = {
      "Loyalists":           { cx: 500, cy: 500 },
      "Slipping Away":       { cx: 280, cy: 280 },
      "High-Value Inactive": { cx: 720, cy: 720 },
      "New Signups":         { cx: 720, cy: 280 },
    };
    return parsed.map(c => {
      const hasValidCoords =
        typeof c.x === "number" && typeof c.y === "number" &&
        c.x > 0 && c.y > 0 && c.x < 1000 && c.y < 850;
      const regions = ["North Delhi", "South Delhi", "Mumbai", "Bangalore", "Lucknow", "Noida"];
      const region = c.region || regions[Math.floor(Math.random() * regions.length)];
      if (hasValidCoords) return { ...c, region };
      const center = GALAXY_CENTERS[c.segment] || { cx: 500, cy: 500 };
      const angle = Math.random() * Math.PI * 2;
      const dist  = 40 + Math.random() * 130;
      return { 
        ...c, 
        x: Math.round(center.cx + Math.cos(angle) * dist), 
        y: Math.round(center.cy + Math.sin(angle) * dist),
        region
      };
    });
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return [];
    const saved = localStorage.getItem("orbit_orders");
    const savedType = localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
    return saved ? JSON.parse(saved) : generateMockOrders(generateMockCustomers(savedType), savedType);
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const customers = useMemo(() => {
    return getEnrichedCustomers(rawCustomers, orders, workspaceDna);
  }, [rawCustomers, orders, workspaceDna]);

  const updateCustomer = useCallback((id: string, updatedFields: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  }, []);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return [];
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

  const [personas, setPersonas] = useState<Persona[]>(() => {
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return [];
    const saved = localStorage.getItem("orbit_personas");
    if (saved) return JSON.parse(saved);
    const savedType = localStorage.getItem("orbit_business_type") || "Fashion & Apparel";
    const savedCustomers = localStorage.getItem("orbit_customers");
    const custs = savedCustomers ? JSON.parse(savedCustomers) : generateMockCustomers(savedType);
    return mapCustomersToPersonas(custs, savedType);
  });

  const topPersona = useMemo(() => {
    if (personas.length === 0) return null;
    return personas.reduce((max, p) => p.customerCount > max.customerCount ? p : max, personas[0]);
  }, [personas]);

  const riskPersona = useMemo(() => {
    if (personas.length === 0) return null;
    return personas.reduce((max, p) => p.riskScore > max.riskScore ? p : max, personas[0]);
  }, [personas]);

  const growthPersona = useMemo(() => {
    if (personas.length === 0) return null;
    return personas.reduce((max, p) => p.revenuePotential > max.revenuePotential ? p : max, personas[0]);
  }, [personas]);

  const highestRevenuePersona = useMemo(() => {
    if (personas.length === 0) return null;
    return personas.reduce((max, p) => p.revenueContributionPct > max.revenueContributionPct ? p : max, personas[0]);
  }, [personas]);

  const personaDistribution = useMemo(() => {
    const total = personas.reduce((sum, p) => sum + p.customerCount, 0) || 1;
    const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#F59E0B", "#10B981"];
    return personas.map((p, idx) => ({
      name: p.name,
      percentage: Math.round((p.customerCount / total) * 100),
      count: p.customerCount,
      color: colors[idx % colors.length]
    }));
  }, [personas]);

  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem("orbit_config");
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      geminiKey: parsed.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || "",
      deepgramKey: parsed.deepgramKey || import.meta.env.VITE_DEEPGRAM_API_KEY || "",
      elevenLabsKey: parsed.elevenLabsKey || import.meta.env.VITE_ELEVENLABS_API_KEY || "",
      resendKey: parsed.resendKey || import.meta.env.VITE_RESEND_API_KEY || "",
      simulationSpeed: parsed.simulationSpeed ?? 1,
      autonomousMode: parsed.autonomousMode ?? false,
      voiceSynthesis: parsed.voiceSynthesis ?? false,
      firebaseKey: parsed.firebaseKey || import.meta.env.VITE_FIREBASE_API_KEY || "",
      firebaseProjectId: parsed.firebaseProjectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || ""
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
    const currentId = localStorage.getItem("orbit_current_workspace_id");
    if (!currentId) return { recoverableRevenue: 0, opportunityScore: 0, inactiveCustomers: 0, abandonedLeads: 0, recoveryConfidence: 0 };
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

    // Sync to backend DB in background
    fetch("/api/agent-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent, message, type })
    }).catch(err => console.warn("Failed to sync agent log to backend:", err));

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

  useEffect(() => {
    localStorage.setItem("orbit_personas", JSON.stringify(personas));
  }, [personas]);

  useEffect(() => {
    if (workspaceDna) {
      localStorage.setItem("orbit_workspace_dna", JSON.stringify(workspaceDna));
    }
  }, [workspaceDna]);

  // Sync personas dynamically when customer base changes locally
  useEffect(() => {
    const localPersonas = mapCustomersToPersonas(customers, businessType);
    setPersonas(localPersonas);
  }, [customers, businessType]);

  // Sync state with backend APIs on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const healthRes = await fetch("/api/health");
        if (!healthRes.ok) throw new Error("Backend offline");
        const health = await healthRes.json();
        if (health.status !== "online") throw new Error("Backend status invalid");

        console.log("Connected to ORBIT Backend. Fetching state...");

        // Sync API keys on startup if loaded from localStorage or env
        const startupPayload: any = {};
        if (config.geminiKey) startupPayload.geminiKey = config.geminiKey;
        if (config.deepgramKey) startupPayload.deepgramKey = config.deepgramKey;

        if (Object.keys(startupPayload).length > 0) {
          fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(startupPayload)
          }).catch(err => console.warn("Failed to sync keys on startup:", err));
        }

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

        // Load customers
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          const custData = await custRes.json();
          if (custData && custData.length > 0) {
            // Normalize galaxy coordinates — ensure every customer has valid x/y
            const GALAXY_CENTERS: Record<string, { cx: number; cy: number }> = {
              "Loyalists":         { cx: 500, cy: 500 },
              "Slipping Away":     { cx: 280, cy: 280 },
              "High-Value Inactive": { cx: 720, cy: 720 },
              "New Signups":       { cx: 720, cy: 280 },
            };
            const normalized = custData.map((c: any) => {
              const center = GALAXY_CENTERS[c.segment] || { cx: 500, cy: 500 };
              const hasValidCoords =
                typeof c.x === "number" && typeof c.y === "number" &&
                c.x > 0 && c.y > 0 && c.x < 1000 && c.y < 850;
              if (hasValidCoords) return c;
              const angle = Math.random() * Math.PI * 2;
              const dist  = 40 + Math.random() * 130;
              return {
                ...c,
                x: Math.round(center.cx + Math.cos(angle) * dist),
                y: Math.round(center.cy + Math.sin(angle) * dist),
              };
            });
            setCustomers(normalized);
          }
        }

        // Load orders
        const ordRes = await fetch("/api/orders");
        if (ordRes.ok) {
          const ordData = await ordRes.json();
          if (ordData && ordData.length > 0) {
            setOrders(ordData);
          }
        }

        // Load agent logs
        const logsRes = await fetch("/api/agent-logs");
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          if (logsData && logsData.length > 0) {
            setAgentLogs(logsData);
          }
        }

        // Load missions
        try {
          const missionsRes = await fetch("/api/autonomous-mission/history");
          if (missionsRes.ok) {
            const missionsData = await missionsRes.json();
            setMissions(missionsData);
          }
        } catch (e) {
          console.warn("Failed to retrieve missions history on start:", e);
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

  const generatePersonas = useCallback(async () => {
    addAgentLog("System", "Initializing AI Customer DNA Persona analysis...", "thought");
    
    if (config.geminiKey) {
      addAgentLog("Polaris", "Analyzing customer buying profiles, LTV, preferred channels, and transaction registers...", "action");
      
      const loyalists = customers.filter(c => c.segment === "Loyalists");
      const slipping = customers.filter(c => c.segment === "Slipping Away");
      const inactive = customers.filter(c => c.segment === "High-Value Inactive");
      const newSignups = customers.filter(c => c.segment === "New Signups");
      
      const totalLtv = customers.reduce((sum, c) => sum + c.ltv, 0);
      const avgLoyalistLtv = loyalists.length > 0 ? Math.round(loyalists.reduce((sum, c) => sum + c.ltv, 0) / loyalists.length) : 0;
      const avgSlippingLtv = slipping.length > 0 ? Math.round(slipping.reduce((sum, c) => sum + c.ltv, 0) / slipping.length) : 0;
      const avgSlippingRisk = slipping.length > 0 ? Math.round(slipping.reduce((sum, c) => sum + c.churnRisk, 0) / slipping.length) : 0;
      const avgInactiveLtv = inactive.length > 0 ? Math.round(inactive.reduce((sum, c) => sum + c.ltv, 0) / inactive.length) : 0;
      const avgNewLtv = newSignups.length > 0 ? Math.round(newSignups.reduce((sum, c) => sum + c.ltv, 0) / newSignups.length) : 0;

      const channelsCount = customers.reduce((acc, c) => {
        acc[c.preferredChannel] = (acc[c.preferredChannel] || 0) + 1;
        return acc;
      }, { WhatsApp: 0, Email: 0, SMS: 0, RCS: 0 });

      const prompt = `Analyze our customer database summary:
- Total Customers: ${customers.length} (Total LTV: ₹${totalLtv})
- Segment breakdown:
  * Loyalists: ${loyalists.length} customers (average LTV: ₹${avgLoyalistLtv})
  * Slipping Away: ${slipping.length} customers (average LTV: ₹${avgSlippingLtv}, average churn risk: ${avgSlippingRisk}%)
  * High-Value Inactive: ${inactive.length} customers (average LTV: ₹${avgInactiveLtv})
  * New Signups: ${newSignups.length} customers (average LTV: ₹${avgNewLtv})
- Channel preferences: WhatsApp (${channelsCount.WhatsApp}), Email (${channelsCount.Email}), SMS (${channelsCount.SMS}), RCS (${channelsCount.RCS})
- Business Type: "${workspaceDna ? workspaceDna.industryType : businessType}"
${workspaceDna ? `- Primary Metric: ${workspaceDna.primaryMetric}
- Business Model: ${workspaceDna.businessModel}
- Top Category: ${workspaceDna.topCategory}
- Suggested Persona Names: ${workspaceDna.suggestedPersonaNames.join(", ")}` : ""}

Generate exactly 6 customer personas/archetypes that are SPECIFIC to the "${workspaceDna ? workspaceDna.industryType : businessType}" business.
${workspaceDna ? `Use these industry-specific persona names: ${workspaceDna.suggestedPersonaNames.slice(0, 6).map((n, i) => `${i + 1}. ${n}`).join(", ")}` : `1. Student / Gen Z (Age Range 18-24, digital-native, budget-conscious)
2. Young Working Professional (Age Range 25-34, fast-paced, convenience-oriented)
3. Homemaker (Age Range 35-50, family-centric, comfort/value-focused)
4. Traditional Buyer (Age Range 50+, classic styling, low digital engagement)
5. Premium Fashion Enthusiast (Age Range 28-45, luxury, status-driven)
6. Festival Shopper (Age Range 21-40, high-volume event/occasion seasonal purchases)`}

For each persona, generate:
1. Name (exactly one of the 6 names above)
2. Description (A brief demographic summary)
3. Motivation (What drives their lifestyle and purchasing)
4. Buying Pattern (How and when they purchase)
5. Risk Level ('Low' | 'Medium' | 'High' | 'Critical')
6. Risk Score (0-100)
7. Loyalty Score (0-100)
8. Preferred Channel ('WhatsApp' | 'Email' | 'SMS' | 'RCS')
9. Average Spend (number, e.g. 4500)
10. Purchase Frequency (e.g. 'Weekly', 'Monthly')
11. Predicted Lifetime Value (LTV) (number, e.g. 25000)
12. Revenue Potential (number, e.g. 45000)
13. Customer Count (How many of our ${customers.length} customers belong to this archetype, sum of all counts must equal ${customers.length})
14. Revenue Contribution % (Percentage of total LTV revenue, e.g. 20)
15. Growth Opportunity (Growth potential summary)
16. Recommended Strategy (Actionable targeting step)
17. What they buy
18. Why they buy
19. When they buy
20. Best communication channel (elaborated)
21. Suggested campaign (e.g. campaign name and expected ROI like 'Diwali Flash Sale (Expected ROI: 4.5x)')
22. ageRange (Age range, e.g. "18 - 24")
23. lifestyle (Lifestyle Description)
24. buyingTriggers (Buying triggers/prompts)
25. preferredProducts (Preferred products/categories)
26. aiInsightsTargeting (AI insights explaining why they matter and how ORBIT should target them)

Return a single valid JSON object with a "personas" array containing these 6 personas. Do not return any markdown code block formatting. Only return the raw JSON object matching this schema:
{
  "personas": [
    {
      "name": "...",
      "description": "...",
      "motivation": "...",
      "buyingPattern": "...",
      "riskLevel": "Low" | "Medium" | "High" | "Critical",
      "riskScore": 25,
      "loyaltyScore": 85,
      "preferredChannel": "WhatsApp",
      "averageSpend": 4500,
      "purchaseFrequency": "Weekly",
      "predictedLtv": 25000,
      "revenuePotential": 45000,
      "customerCount": 24,
      "revenueContributionPct": 30,
      "growthOpportunity": "...",
      "recommendedStrategy": "...",
      "whatTheyBuy": "...",
      "whyTheyBuy": "...",
      "whenTheyBuy": "...",
      "bestCommChannel": "...",
      "suggestedCampaign": "...",
      "ageRange": "...",
      "lifestyle": "...",
      "buyingTriggers": "...",
      "preferredProducts": "...",
      "aiInsightsTargeting": "..."
    }
  ]
}
`;

      try {
        const sys = "You are the ORBIT Customer DNA Engine. Group the customer base into 6 demographic archetypes and return a structured JSON response.";
        const res = await callGeminiAPI(prompt, sys, config.geminiKey);
        const parsed = parseGeminiJson<any>(res, null);
        if (parsed && Array.isArray(parsed.personas) && parsed.personas.length > 0) {
          const avatars = ["sparkles", "user-plus", "percent", "battery-low", "crown", "sparkles"];
          const finalPersonas: Persona[] = parsed.personas.map((p: any, idx: number) => ({
            ...p,
            id: `persona_${idx + 1}`,
            avatar: avatars[idx % avatars.length]
          }));
          setPersonas(finalPersonas);
          addAgentLog("Polaris", `Successfully mapped ${finalPersonas.length} Customer DNA profiles dynamically using Gemini.`, "result");
          return;
        }
      } catch (err: any) {
        console.error("Gemini persona generation failed:", err);
      }
    }

    const localPersonas = mapCustomersToPersonas(customers, businessType);
    setPersonas(localPersonas);
    addAgentLog("Polaris", `Clustered ${localPersonas.length} Customer DNA profiles dynamically using local mapping.`, "result");
  }, [customers, businessType, workspaceDna, config.geminiKey, addAgentLog]);

  // ─── UNIVERSAL BUSINESS INTELLIGENCE ENGINE ─────────────────────────────────

  /** Parse a CSV string into array of row objects */
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
  };

  /** Detect currency/language from column values */
  const detectCurrency = (rows: Record<string, string>[]): string => {
    const sample = rows.slice(0, 20).map(r => Object.values(r).join(" ")).join(" ");
    if (/₹|INR|Rs\.?/i.test(sample)) return "INR";
    if (/\$|USD/i.test(sample)) return "USD";
    if (/€|EUR/i.test(sample)) return "EUR";
    if (/£|GBP/i.test(sample)) return "GBP";
    return "INR"; // default for Indian market
  };

  /** Build a lightweight summary of column data for Gemini */
  const buildDataSummary = (headers: string[], rows: Record<string, string>[], maxRows = 8): string => {
    const sample = rows.slice(0, maxRows).map(r => headers.map(h => `${h}: ${r[h] ?? ""}`).join(" | ")).join("\n");
    return `Columns: ${headers.join(", ")}\nSample rows (${Math.min(maxRows, rows.length)} of ${rows.length}):\n${sample}`;
  };

  /** Generate a fallback DNA for a given industry when Gemini is unavailable */
  const buildFallbackDna = (industryType: string, totalRevenue: number, totalCustomers: number, columns: string[], sampleRows: number): BusinessDNA => {
    const dnaPrefabs: Record<string, Partial<BusinessDNA>> = {
      "restaurant": { businessModel: "B2C Food Service", primaryMetric: "Orders", secondaryMetric: "Avg Check Size", topProduct: "Signature Dish", topCategory: "Dine-In", growthRate: 12, riskAreas: ["Weekend capacity limits", "High staff turnover", "Food cost inflation"], opportunities: ["Lunch corporate delivery", "Loyalty punch-card program", "Weekend brunch upsell"], suggestedPersonaNames: ["Regular Diner", "Corporate Lunch Crowd", "Weekend Foodie", "Health-Conscious Eater", "Delivery-Only Customer", "Special Occasion Guest"], suggestedCampaignTypes: ["Weekday lunch combo", "Birthday perks", "Table pre-booking"], primaryChannel: "WhatsApp" },
      "gym": { businessModel: "B2C Subscription", primaryMetric: "Active Members", secondaryMetric: "Churn Rate", topProduct: "Monthly Membership", topCategory: "Fitness", growthRate: 18, riskAreas: ["New year churn spike", "Unused memberships", "Competitor pricing"], opportunities: ["Personal training upsell", "Supplement retail", "Corporate wellness packages"], suggestedPersonaNames: ["Weekend Warrior", "Daily Fitness Devotee", "Corporate Wellness Buyer", "New Year Resolver", "Weight-Loss Seeker", "Athlete in Training"], suggestedCampaignTypes: ["Renewal reminder", "Referral program", "Personal trainer promo"], primaryChannel: "WhatsApp" },
      "real estate": { businessModel: "B2C Property Sales & Rental", primaryMetric: "Listings Closed", secondaryMetric: "Revenue Per Deal", topProduct: "2BHK Apartment", topCategory: "Residential", growthRate: 8, riskAreas: ["Interest rate hikes", "Slow inventory movement", "Lead-to-closure ratio"], opportunities: ["NRI investor outreach", "Pre-launch access programs", "Smart home upgrades"], suggestedPersonaNames: ["First-Time Buyer", "Real Estate Investor", "NRI Buyer", "Upgrader Family", "Rental Seeker", "Commercial Buyer"], suggestedCampaignTypes: ["Site visit invite", "Pre-launch offer", "Investment ROI report"], primaryChannel: "Email" },
      "hospital": { businessModel: "B2C Healthcare", primaryMetric: "Patient Visits", secondaryMetric: "Revenue Per Consultation", topProduct: "General OPD", topCategory: "Primary Care", growthRate: 10, riskAreas: ["Patient retention", "Insurance claim delays", "Seasonal surge management"], opportunities: ["Health check packages", "Telemedicine expansion", "Corporate tie-ups"], suggestedPersonaNames: ["Regular Patient", "Preventive Care Seeker", "Corporate Tie-Up Patient", "Senior Citizen", "Pediatric Care Parent", "Emergency Walk-In"], suggestedCampaignTypes: ["Annual health check", "Vaccination reminder", "Specialist appointment"], primaryChannel: "SMS" },
      "saas": { businessModel: "B2B SaaS Subscription", primaryMetric: "MRR", secondaryMetric: "Churn Rate", topProduct: "Pro Plan", topCategory: "Productivity Software", growthRate: 25, riskAreas: ["Free-to-paid conversion", "Enterprise churn risk", "Feature adoption gap"], opportunities: ["Annual plan upgrades", "Add-on seat sales", "API partner integrations"], suggestedPersonaNames: ["Startup Founder", "Enterprise Admin", "Individual Developer", "SMB Operations Team", "Tech-First Power User", "Cost-Conscious Evaluator"], suggestedCampaignTypes: ["Trial expiry nudge", "Upgrade to annual", "Feature education email"], primaryChannel: "Email" },
      "electronics": { businessModel: "B2C Retail", primaryMetric: "Units Sold", secondaryMetric: "Margin Per SKU", topProduct: "Smartphone", topCategory: "Mobile & Accessories", growthRate: 14, riskAreas: ["Post-season inventory", "Grey market pricing", "Return rates"], opportunities: ["Extended warranty sales", "Smart home bundle", "Corporate bulk orders"], suggestedPersonaNames: ["Tech Enthusiast", "Budget Buyer", "Corporate Procurement", "Upgrade Seeker", "Gift Buyer", "Brand Loyalist"], suggestedCampaignTypes: ["Festive exchange offer", "EMI zero-cost", "New launch pre-order"], primaryChannel: "RCS" },
      "coaching": { businessModel: "B2C Education Services", primaryMetric: "Enrollments", secondaryMetric: "Batch Fill Rate", topProduct: "JEE / NEET Batch", topCategory: "Competitive Exam Prep", growthRate: 20, riskAreas: ["Mid-session dropout", "Faculty quality consistency", "Online competitor pricing"], opportunities: ["Doubt-clearing sessions", "Mock test series", "Parent engagement portal"], suggestedPersonaNames: ["Aspirant Student", "Parent Decision Maker", "Repeater Candidate", "Online Learner", "Scholarship Seeker", "Drop-Year Student"], suggestedCampaignTypes: ["Free demo class", "Scholarship test", "Result success story"], primaryChannel: "WhatsApp" },
      "travel": { businessModel: "B2C Travel Agency", primaryMetric: "Bookings", secondaryMetric: "Revenue Per Booking", topProduct: "International Tour Package", topCategory: "Leisure Travel", growthRate: 22, riskAreas: ["Last-minute cancellations", "Visa rejection impact", "Seasonal demand spikes"], opportunities: ["Honeymoon package upsell", "Corporate MICE bookings", "Solo traveler groups"], suggestedPersonaNames: ["Honeymoon Planner", "Family Vacationer", "Solo Explorer", "Budget Backpacker", "Luxury Traveler", "Corporate Traveler"], suggestedCampaignTypes: ["Early bird offer", "Flash sale weekend", "Visa-free destination promo"], primaryChannel: "WhatsApp" },
      "fashion": { businessModel: "D2C Fashion Brand", primaryMetric: "Revenue", secondaryMetric: "Repeat Purchase Rate", topProduct: "Oversized Streetwear", topCategory: "Casual Wear", growthRate: 15, riskAreas: ["Inventory clearance", "Trend obsolescence", "Return rates"], opportunities: ["VIP early access drops", "Festival collection", "Gen Z social commerce"], suggestedPersonaNames: ["Student / Gen Z", "Young Working Professional", "Homemaker", "Traditional Buyer", "Premium Fashion Enthusiast", "Festival Shopper"], suggestedCampaignTypes: ["New collection drop", "VIP pre-launch", "Flash sale"], primaryChannel: "RCS" }
    };
    const key = Object.keys(dnaPrefabs).find(k => industryType.toLowerCase().includes(k)) || "fashion";
    const prefab = dnaPrefabs[key] || dnaPrefabs["fashion"];
    return {
      industryType,
      businessModel: prefab.businessModel!,
      detectedLanguage: "en",
      currency: "INR",
      totalRevenue,
      totalCustomers,
      totalTransactions: Math.round(totalCustomers * 2.5),
      avgOrderValue: totalCustomers > 0 ? Math.round(totalRevenue / Math.max(totalCustomers * 2.5, 1)) : 1500,
      topProduct: prefab.topProduct!,
      topCategory: prefab.topCategory!,
      growthRate: prefab.growthRate!,
      primaryMetric: prefab.primaryMetric!,
      secondaryMetric: prefab.secondaryMetric!,
      riskAreas: prefab.riskAreas!,
      opportunities: prefab.opportunities!,
      dataSource: "csv",
      columns,
      sampleRows,
      uploadedAt: new Date().toISOString(),
      suggestedPersonaNames: prefab.suggestedPersonaNames!,
      suggestedCampaignTypes: prefab.suggestedCampaignTypes!,
      primaryChannel: prefab.primaryChannel!
    };
  };

  /** Upload & analyze a dataset file (CSV, JSON or XLSX) */
  const uploadDatasetAndReconfigure = useCallback(async (file: File) => {
    setIsAnalyzingDataset(true);
    addAgentLog("System", `Dataset received: ${file.name} (${(file.size / 1024).toFixed(1)} KB). Initializing Business DNA Engine...`, "thought");

    try {
      let rows: Record<string, string>[] = [];
      let headers: string[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || [];
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedData = XLSX.utils.sheet_to_json<any>(worksheet);
        rows = parsedData.map(r => {
          const newRow: Record<string, string> = {};
          Object.keys(r).forEach(k => { newRow[k] = String(r[k]); });
          return newRow;
        });
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      } else {
        // CSV
        const text = await file.text();
        rows = parseCSV(text);
        headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      }

      const currency = detectCurrency(rows);
      const sampleRows = rows.length;
      addAgentLog("Polaris", `Parsed ${sampleRows} records with ${headers.length} columns. Detected currency: ${currency}.`, "action");

      // Extract numeric revenue and customer count heuristically
      const revenueKeys = headers.filter(h => /revenue|amount|total|sales|price|value|earnings/i.test(h));
      const customerKeys = headers.filter(h => /customer|client|user|buyer|member|id/i.test(h));
      let totalRevenue = 0;
      const uniqueCustomers = new Set<string>();

      rows.forEach(row => {
        revenueKeys.forEach(k => {
          const val = parseFloat(String(row[k]).replace(/[^0-9.]/g, ""));
          if (!isNaN(val)) totalRevenue += val;
        });
        customerKeys.slice(0, 1).forEach(k => {
          if (row[k]) uniqueCustomers.add(row[k]);
        });
      });

      const totalCustomers = uniqueCustomers.size || Math.round(sampleRows * 0.6);
      const dataSummary = buildDataSummary(headers, rows);

      let dna: BusinessDNA;

      if (config.geminiKey) {
        addAgentLog("Polaris", "Sending dataset schema to Gemini for industry classification and DNA extraction...", "action");
        const geminiPrompt = `You are the ORBIT Universal Business DNA Engine.

Analyze this dataset schema and sample data, then return a complete Business DNA profile.

DATASET DETAILS:
File: ${file.name}
Total Rows: ${sampleRows}
Detected Currency: ${currency}
Estimated Total Revenue: ${totalRevenue.toFixed(0)}
Estimated Unique Customers: ${totalCustomers}

${dataSummary}

Classify this business and extract intelligence. Return ONLY a valid JSON object with this exact schema:
{
  "industryType": "string (e.g. Restaurant, Gym, Fashion Brand, SaaS, Hospital, Real Estate, Electronics Store, Coaching Institute, Travel Agency)",
  "businessModel": "string (e.g. B2C Subscription, D2C Retail, B2B SaaS)",
  "detectedLanguage": "en",
  "currency": "${currency}",
  "totalRevenue": number,
  "totalCustomers": number,
  "totalTransactions": number,
  "avgOrderValue": number,
  "topProduct": "string (most popular product/service inferred)",
  "topCategory": "string (main product category)",
  "growthRate": number (estimated % MoM growth),
  "primaryMetric": "string (most important KPI for this industry)",
  "secondaryMetric": "string (second most important KPI)",
  "riskAreas": ["string", "string", "string"],
  "opportunities": ["string", "string", "string"],
  "dataSource": "csv",
  "columns": ${JSON.stringify(headers)},
  "sampleRows": ${sampleRows},
  "uploadedAt": "${new Date().toISOString()}",
  "suggestedPersonaNames": ["string x6 — industry-appropriate customer archetypes"],
  "suggestedCampaignTypes": ["string", "string", "string"],
  "primaryChannel": "WhatsApp | Email | SMS | RCS"
}`;

        try {
          const res = await callGeminiAPI(geminiPrompt, "You are the ORBIT Business DNA Engine. Return only valid JSON.", config.geminiKey);
          const parsed = parseGeminiJson<any>(res, null);
          if (parsed && parsed.industryType) {
            dna = { ...parsed, dataSource: "csv", columns: headers, sampleRows, uploadedAt: new Date().toISOString() };
            addAgentLog("Polaris", `Business DNA decoded: ${dna.industryType} — ${dna.businessModel}. Primary metric: ${dna.primaryMetric}.`, "result");
          } else {
            throw new Error("Invalid Gemini DNA response");
          }
        } catch (err) {
          console.warn("Gemini DNA extraction failed, using fallback:", err);
          // Heuristic industry detection from filename + columns
          const hint = (file.name + " " + headers.join(" ")).toLowerCase();
          const industryGuess = hint.includes("restaurant") || hint.includes("food") || hint.includes("order") ? "Restaurant"
            : hint.includes("gym") || hint.includes("member") || hint.includes("fitness") ? "Gym"
            : hint.includes("hospital") || hint.includes("patient") || hint.includes("doctor") ? "Hospital"
            : hint.includes("saas") || hint.includes("subscription") || hint.includes("mrr") ? "SaaS Startup"
            : hint.includes("real estate") || hint.includes("property") || hint.includes("listing") ? "Real Estate Agency"
            : hint.includes("travel") || hint.includes("booking") || hint.includes("hotel") ? "Travel Agency"
            : hint.includes("electronics") || hint.includes("gadget") || hint.includes("device") ? "Electronics Store"
            : hint.includes("coaching") || hint.includes("student") || hint.includes("course") ? "Coaching Institute"
            : "Fashion Brand";
          dna = buildFallbackDna(industryGuess, totalRevenue, totalCustomers, headers, sampleRows);
        }
      } else {
        const hint = (file.name + " " + headers.join(" ")).toLowerCase();
        const industryGuess = hint.includes("restaurant") || hint.includes("food") ? "Restaurant"
          : hint.includes("gym") || hint.includes("member") ? "Gym"
          : hint.includes("hospital") || hint.includes("patient") ? "Hospital"
          : hint.includes("saas") || hint.includes("subscription") ? "SaaS Startup"
          : hint.includes("real estate") || hint.includes("property") ? "Real Estate Agency"
          : hint.includes("travel") || hint.includes("booking") ? "Travel Agency"
          : hint.includes("electronics") || hint.includes("gadget") ? "Electronics Store"
          : hint.includes("coaching") || hint.includes("student") ? "Coaching Institute"
          : "Fashion Brand";
        dna = buildFallbackDna(industryGuess, totalRevenue, totalCustomers, headers, sampleRows);
        addAgentLog("Polaris", `Gemini not available. Heuristic classification: ${dna.industryType}.`, "result");
      }

      const newCustomers = generateMockCustomers(dna.industryType);
      const newOrders = generateMockOrders(newCustomers, dna.industryType);
      const newPersonas = mapCustomersToPersonas(newCustomers, dna.industryType);
      const initialLunaMetrics = {
        recoverableRevenue: Math.round(totalRevenue * 0.05) || 20550,
        opportunityScore: 85,
        inactiveCustomers: Math.max(1, Math.round(newCustomers.length * 0.15)),
        abandonedLeads: Math.max(1, Math.round(newCustomers.length * 0.2)),
        recoveryConfidence: 91
      };
      const initialAgentLogs = [
        {
          id: `log_${Date.now()}`,
          agent: "System" as const,
          timestamp: new Date().toLocaleTimeString(),
          message: `Calibrated ORBIT modules for uploaded business: ${file.name}.`,
          type: "thought" as const
        }
      ];

      // Save new workspace data in localStorage
      const newId = "uploaded-" + Date.now();
      const newWorkspaceMetadata: WorkspaceMetadata = {
        id: newId,
        name: file.name,
        type: "uploaded",
        businessType: dna.industryType,
        uploadedAt: new Date().toISOString()
      };

      const dataToSave = {
        workspaceDna: dna,
        customers: newCustomers,
        orders: newOrders,
        campaigns: [],
        personas: newPersonas,
        latestVerdict: null,
        agentLogs: initialAgentLogs,
        missions: [],
        lunaMetrics: initialLunaMetrics
      };
      
      localStorage.setItem(`orbit_workspace_data_${newId}`, JSON.stringify(dataToSave));

      // Update workspaces metadata
      const nextList = [...workspaces, newWorkspaceMetadata];
      setWorkspaces(nextList);
      localStorage.setItem("orbit_workspaces", JSON.stringify(nextList));

      // Persist DNA and configure current active workspace
      setWorkspaceDna(dna);
      localStorage.setItem("orbit_workspace_dna", JSON.stringify(dna));
      setBusinessType(dna.industryType);
      localStorage.setItem("orbit_business_type", dna.industryType);
      setCustomers(newCustomers);
      localStorage.setItem("orbit_customers", JSON.stringify(newCustomers));
      setOrders(newOrders);
      localStorage.setItem("orbit_orders", JSON.stringify(newOrders));
      setCampaigns([]);
      localStorage.setItem("orbit_campaigns", JSON.stringify([]));
      setPersonas(newPersonas);
      localStorage.setItem("orbit_personas", JSON.stringify(newPersonas));
      setLatestVerdict(null);
      localStorage.removeItem("orbit_latest_verdict");
      setLunaMetrics(initialLunaMetrics);
      localStorage.setItem("orbit_luna_metrics", JSON.stringify(initialLunaMetrics));
      setAgentLogs(initialAgentLogs);
      setMissions([]);

      setCurrentWorkspaceId(newId);
      localStorage.setItem("orbit_current_workspace_id", newId);

      // Persist brand DNA to backend
      fetch("/api/brand-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: dna.industryType, growthStyle: "High Growth", dna })
      }).catch(() => {});

      addAgentLog("System", `ORBIT reconfigured for ${dna.industryType}. All modules updated to industry DNA profile.`, "thought");

    } catch (err) {
      console.error("Dataset upload failed:", err);
      addAgentLog("System", `Dataset processing error: ${err}. Please check file format.`, "result");
    } finally {
      setIsAnalyzingDataset(false);
    }
  }, [config.geminiKey, addAgentLog, workspaces, currentWorkspaceId]);

  /** Apply a known industry DNA preset (no file upload needed) */
  const applyDnaPreset = useCallback((industryKey: string) => {
    const dna = buildFallbackDna(industryKey, 0, 80, [], 0);
    dna.dataSource = "preset";
    setWorkspaceDna(dna);
    localStorage.setItem("orbit_workspace_dna", JSON.stringify(dna));
    setBusinessType(dna.industryType);
    const newCustomers = generateMockCustomers(dna.industryType);
    const newOrders = generateMockOrders(newCustomers, dna.industryType);
    setCustomers(newCustomers);
    setOrders(newOrders);
    setTimeout(() => {
      setPersonas(mapCustomersToPersonas(newCustomers, dna.industryType));
    }, 100);
    addAgentLog("System", `Applied ${industryKey} DNA preset. ORBIT modules reconfigured.`, "thought");
    fetch("/api/brand-dna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessType: dna.industryType, growthStyle: "High Growth" })
    }).catch(() => {});
  }, [addAgentLog]);

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
    localStorage.setItem("orbit_theme", mode);
  };

  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      const payload: any = {};
      if (newConfig.geminiKey !== undefined) payload.geminiKey = newConfig.geminiKey;
      if (newConfig.deepgramKey !== undefined) payload.deepgramKey = newConfig.deepgramKey;

      if (Object.keys(payload).length > 0) {
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(res => {
          if (res.ok) {
            if (payload.geminiKey !== undefined) {
              addAgentLog("System", "Gemini API Key successfully synchronized with the backend Node.", "thought");
            }
            if (payload.deepgramKey !== undefined) {
              addAgentLog("System", "Deepgram API Key successfully synchronized with the backend Node.", "thought");
            }
          } else {
            console.warn("Failed to sync credentials with the backend");
          }
        })
        .catch(err => {
          console.warn("Error syncing credentials with backend:", err);
        });
      }
      return updated;
    });
    addAgentLog("System", `System parameters reconfigured. Speed: ${newConfig.simulationSpeed || config.simulationSpeed}x`, "thought");
  };

  const refreshMissions = useCallback(async () => {
    try {
      const res = await fetch("/api/autonomous-mission/history");
      if (res.ok) {
        const data = await res.json();
        setMissions(data);
      }
    } catch (err) {
      console.warn("Failed to refresh missions:", err);
    }
  }, []);

  const updateMissionStatus = useCallback(async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/autonomous-mission/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        addAgentLog("System", `Mission status updated to ${status}.`, "thought");
      }
    } catch (err) {
      console.error("Failed to update mission status:", err);
    }
  }, [addAgentLog]);

  const duplicateMission = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/autonomous-mission/duplicate/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        const newMission = await res.json();
        setMissions(prev => [newMission, ...prev]);
        addAgentLog("System", `Mission duplicated successfully.`, "thought");
      }
    } catch (err) {
      console.error("Failed to duplicate mission:", err);
    }
  }, [addAgentLog]);

  const deleteMission = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/autonomous-mission/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMissions(prev => prev.filter(m => m.id !== id));
        addAgentLog("System", `Mission removed/archived.`, "thought");
      }
    } catch (err) {
      console.error("Failed to delete mission:", err);
    }
  }, [addAgentLog]);

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

    // Try to run mission generation on the Express backend with a 3.5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      addAgentLog("System", "Initiating AI Mission Plan generation on backend...", "action");
      const res = await fetch("/api/autonomous-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, businessType }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        consolidatedResult = await res.json();
        addAgentLog("System", "Backend mission plan generated successfully.", "result");
      } else {
        throw new Error(`HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
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

    // Retrieve boardroom dialogue sequence from Express backend with a 3-second timeout
    const brController = new AbortController();
    const brTimeoutId = setTimeout(() => brController.abort(), 3000);

    try {
      const boardroomRes = await fetch("/api/boardroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, missionPlan: consolidatedResult }),
        signal: brController.signal
      });
      clearTimeout(brTimeoutId);

      if (boardroomRes.ok) {
        const brData = await boardroomRes.json();
        if (brData && brData.messages) {
          bRoomDialogue = brData.messages;
        }
      }
    } catch (brErr) {
      clearTimeout(brTimeoutId);
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

  const addCampaign = useCallback((campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  }, []);

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
    localStorage.removeItem("orbit_personas");
    
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
    setPersonas(mapCustomersToPersonas(generateMockCustomers("Fashion & Apparel"), "Fashion & Apparel"));
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

  const switchWorkspace = useCallback(async (id: string) => {
    // 1. Save current workspace data if it is an uploaded one
    if (currentWorkspaceId && currentWorkspaceId.startsWith("uploaded-")) {
      const dataToSave = {
        workspaceDna,
        customers,
        orders,
        campaigns,
        personas,
        latestVerdict,
        agentLogs,
        missions,
        lunaMetrics
      };
      localStorage.setItem(`orbit_workspace_data_${currentWorkspaceId}`, JSON.stringify(dataToSave));
    }

    if (!id) {
      setCurrentWorkspaceId(null);
      localStorage.removeItem("orbit_current_workspace_id");
      setWorkspaceDna(null);
      localStorage.removeItem("orbit_workspace_dna");
      setCustomers([]);
      setOrders([]);
      setPersonas([]);
      setCampaigns([]);
      setLatestVerdict(null);
      setAgentLogs([]);
      setMissions([]);
      setLunaMetrics({ recoverableRevenue: 0, opportunityScore: 0, inactiveCustomers: 0, abandonedLeads: 0, recoveryConfidence: 0 });
      return;
    }

    // 2. Load the new workspace
    setCurrentWorkspaceId(id);
    localStorage.setItem("orbit_current_workspace_id", id);

    if (id.startsWith("demo-")) {
      const presetKey = id === "demo-fashion" ? "Fashion & Apparel"
        : id === "demo-restaurant" ? "Restaurant"
        : id === "demo-gym" ? "Gym"
        : "SaaS Startup";
      
      const dna = buildFallbackDna(presetKey, 0, 80, [], 0);
      dna.dataSource = "preset";
      setWorkspaceDna(dna);
      localStorage.setItem("orbit_workspace_dna", JSON.stringify(dna));
      setBusinessType(dna.industryType);
      localStorage.setItem("orbit_business_type", dna.industryType);
      
      const newCustomers = generateMockCustomers(dna.industryType);
      const newOrders = generateMockOrders(newCustomers, dna.industryType);
      setCustomers(newCustomers);
      localStorage.setItem("orbit_customers", JSON.stringify(newCustomers));
      setOrders(newOrders);
      localStorage.setItem("orbit_orders", JSON.stringify(newOrders));
      
      const isFashion = presetKey.toLowerCase().includes("fashion") || presetKey.toLowerCase().includes("apparel");
      const tempLatestVerdict = {
        scenarioName: isFashion ? "North Delhi Minimal Streetwear Launch" : `${presetKey} Growth Window`,
        scenarioDescription: isFashion ? "Targeting Students/Gen Z in North Delhi shifting from Korean Fashion to Minimal Streetwear." : `Boardroom strategy for ${presetKey} expansion opportunities.`,
        targetPersona: isFashion ? "Student / Gen Z" : "Weekend Warrior",
        region: "North Delhi",
        currentTrend: isFashion ? "Oversized Korean Fashion" : "General Baseline",
        futureTrend: isFashion ? "Minimal Streetwear" : "Accelerated Expansion",
        revenueOpportunity: 145000,
        expectedRoi: 4.5,
        launchDate: "Immediate (within 14 days)",
        confidenceScore: 92,
        forecast: {
          d30: "Trend Stable - initial baseline begins.",
          d60: "Growth accelerating.",
          d90: "Adoption peak reached."
        },
        timestamp: new Date().toISOString()
      };
      setLatestVerdict(tempLatestVerdict);
      localStorage.setItem("orbit_latest_verdict", JSON.stringify(tempLatestVerdict));

      const tempLunaMetrics = {
        recoverableRevenue: presetKey === "Fashion & Apparel" ? 20550 : presetKey === "Restaurant" ? 12400 : presetKey === "Gym" ? 8900 : 34500,
        opportunityScore: 88,
        inactiveCustomers: 12,
        abandonedLeads: 17,
        recoveryConfidence: 91
      };
      setLunaMetrics(tempLunaMetrics);
      localStorage.setItem("orbit_luna_metrics", JSON.stringify(tempLunaMetrics));

      setMissions([]);
      setAgentLogs([
        {
          id: `log_${Date.now()}`,
          agent: "System",
          timestamp: new Date().toLocaleTimeString(),
          message: `Calibrated ORBIT boardroom registers for ${presetKey} Demo workspace.`,
          type: "thought"
        }
      ]);
      
      setTimeout(() => {
        const p = mapCustomersToPersonas(newCustomers, dna.industryType);
        setPersonas(p);
        localStorage.setItem("orbit_personas", JSON.stringify(p));
      }, 100);

      fetch("/api/brand-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: dna.industryType, growthStyle: "High Growth", dna })
      }).catch(() => {});

    } else {
      // It is an uploaded workspace
      const saved = localStorage.getItem(`orbit_workspace_data_${id}`);
      if (saved) {
        const data = JSON.parse(saved);
        setWorkspaceDna(data.workspaceDna);
        localStorage.setItem("orbit_workspace_dna", JSON.stringify(data.workspaceDna));
        setBusinessType(data.workspaceDna.industryType);
        localStorage.setItem("orbit_business_type", data.workspaceDna.industryType);
        
        setCustomers(data.customers || []);
        localStorage.setItem("orbit_customers", JSON.stringify(data.customers || []));
        setOrders(data.orders || []);
        localStorage.setItem("orbit_orders", JSON.stringify(data.orders || []));
        setCampaigns(data.campaigns || []);
        localStorage.setItem("orbit_campaigns", JSON.stringify(data.campaigns || []));
        setPersonas(data.personas || []);
        localStorage.setItem("orbit_personas", JSON.stringify(data.personas || []));
        
        setLatestVerdict(data.latestVerdict || null);
        if (data.latestVerdict) {
          localStorage.setItem("orbit_latest_verdict", JSON.stringify(data.latestVerdict));
        } else {
          localStorage.removeItem("orbit_latest_verdict");
        }

        setLunaMetrics(data.lunaMetrics || { recoverableRevenue: 0, opportunityScore: 0, inactiveCustomers: 0, abandonedLeads: 0, recoveryConfidence: 0 });
        if (data.lunaMetrics) {
          localStorage.setItem("orbit_luna_metrics", JSON.stringify(data.lunaMetrics));
        }

        setAgentLogs(data.agentLogs || []);
        setMissions(data.missions || []);
      }
    }
  }, [currentWorkspaceId, workspaceDna, customers, orders, campaigns, personas, latestVerdict, agentLogs, missions, lunaMetrics]);

  const deleteWorkspace = useCallback((id: string) => {
    const nextList = workspaces.filter(w => w.id !== id);
    setWorkspaces(nextList);
    localStorage.setItem("orbit_workspaces", JSON.stringify(nextList));
    localStorage.removeItem(`orbit_workspace_data_${id}`);

    if (currentWorkspaceId === id) {
      if (nextList.length > 0) {
        switchWorkspace(nextList[0].id);
      } else {
        setCurrentWorkspaceId(null);
        localStorage.removeItem("orbit_current_workspace_id");
        setWorkspaceDna(null);
        localStorage.removeItem("orbit_workspace_dna");
        setCustomers([]);
        setOrders([]);
        setPersonas([]);
        setCampaigns([]);
        setLatestVerdict(null);
        setAgentLogs([]);
        setMissions([]);
        setLunaMetrics({ recoverableRevenue: 0, opportunityScore: 0, inactiveCustomers: 0, abandonedLeads: 0, recoveryConfidence: 0 });
      }
    }
  }, [workspaces, currentWorkspaceId, switchWorkspace]);

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
      selectedCustomerId,
      setSelectedCustomerId,
      updateCustomer,
      mission,
      revenueGoal,
      growthScore,
      activeMissionsCount,
      networkHealth,
      addAgentLog,
      updateConfig,
      startMission,
      launchMissionCampaign,
      addCampaign,
      cancelMission,
      runSimulationStep,
      clearSimData,
      lunaMetrics,
      updateLunaMetrics,
      businessType,
      personalizeForBusiness,
      missions,
      refreshMissions,
      updateMissionStatus,
      duplicateMission,
      deleteMission,
      personas,
      topPersona,
      riskPersona,
      growthPersona,
      highestRevenuePersona,
      personaDistribution,
      generatePersonas,
      latestVerdict,
      updateLatestVerdict,
      workspaceDna,
      isAnalyzingDataset,
      uploadDatasetAndReconfigure,
      applyDnaPreset,
      workspaces,
      currentWorkspaceId,
      switchWorkspace,
      deleteWorkspace
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
