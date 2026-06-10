import { db } from "../server/config/firebase";

// Aura Threads Business Profile Metadata
const BRAND_DNA_ID = "dna_aura_threads";
const BRAND_DNA_DATA = {
  id: BRAND_DNA_ID,
  businessName: "Aura Threads",
  businessType: "Fashion & Apparel",
  industry: "Women's Fashion & Kurtis",
  growthStyle: "High Growth",
  primaryChannel: "Instagram",
  monthlyRevenue: 250000,
  averageOrderValue: 1299,
  customerUniverse: 500,
  instagramFollowers: 12000,
  whatsAppSubscribers: 800,
  growthPotential: "High",
  orbitHealth: 91,
  recommendedMissions: [
    "Increase Repeat Purchases",
    "Recover Lost Leads",
    "Launch Summer Collection",
    "Reduce Churn",
    "Increase VIP Revenue"
  ],
  createdAt: new Date().toISOString()
};

// Mapped segments compatibility mapping
const SEGMENT_MAPPING = {
  "VIP Customers": "Loyalists",
  "Repeat Buyers": "Loyalists",
  "New Customers": "New Signups",
  "Inactive Customers": "High-Value Inactive",
  "At Risk Customers": "Slipping Away",
  "Abandoned Cart Customers": "Slipping Away"
};

const SEGMENTS = Object.keys(SEGMENT_MAPPING);
const MAPPED_SEGMENTS = ["Loyalists", "New Signups", "High-Value Inactive", "Slipping Away"];

// Quadrant centers for Customer Galaxy
const GALAXY_CENTERS = {
  "Loyalists": { cx: 500, cy: 500 },
  "Slipping Away": { cx: 280, cy: 280 },
  "High-Value Inactive": { cx: 720, cy: 720 },
  "New Signups": { cx: 720, cy: 280 }
};

// Generative pools for Kurtis and Indian names
const FIRST_NAMES = [
  "Aaradhya", "Ananya", "Diya", "Isha", "Neha", "Priya", "Riya", "Kavya", "Tanvi", "Sanjana", 
  "Meera", "Shruti", "Aditi", "Pooja", "Ritu", "Sneha", "Kriti", "Shreya", "Kiran", "Tanya", 
  "Aishwarya", "Deepika", "Priyanka", "Sonam", "Alia", "Kiara", "Kareena", "Katrina", "Janhvi", "Sara"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Mehta", "Patel", "Singh", "Nair", "Das", "Joshi", "Kumar", "Gupta", 
  "Rao", "Reddy", "Sen", "Bose", "Choudhury", "Jha", "Mishra", "Trivedi", "Pandey", "Chawla", 
  "Bhasin", "Kapoor", "Khan", "Malhotra", "Bhatt", "Roy", "Chatterjee", "Mukherjee", "Banerjee", "Dutta"
];

const KURTI_CATEGORIES = [
  "Anarkali Kurtis", "Festive Kurta Sets", "Cotton Dailywear", "Designer Tunics", "Jaipuri Prints", 
  "Silk Straight Kurtis", "Chanderi Kurtas", "Gota Patti Suit Sets", "A-Line Printed Kurtis", "Embroidered Kurtas"
];

const CHANNELS = ["WhatsApp", "Email", "SMS", "RCS"];

// 1. Generate Customers
function generateCustomers(count: number = 500): any[] {
  const customers: any[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 99 + 1)}@gmail.com`;
    const phone = `+91 ${9000000000 + Math.floor(Math.random() * 999999999)}`;
    
    // Choose segment
    const origSegment = SEGMENTS[i % SEGMENTS.length];
    const segment = SEGMENT_MAPPING[origSegment];
    
    // Spending patterns based on segment
    let purchaseCount = 1;
    let churnRisk = 25;
    if (segment === "Loyalists") {
      purchaseCount = 5 + Math.floor(Math.random() * 15);
      churnRisk = 5 + Math.floor(Math.random() * 20);
    } else if (segment === "New Signups") {
      purchaseCount = Math.random() > 0.4 ? 1 : 0;
      churnRisk = 20 + Math.floor(Math.random() * 30);
    } else if (segment === "High-Value Inactive") {
      purchaseCount = 4 + Math.floor(Math.random() * 6);
      churnRisk = 65 + Math.floor(Math.random() * 20);
    } else { // Slipping Away
      purchaseCount = 1 + Math.floor(Math.random() * 3);
      churnRisk = 75 + Math.floor(Math.random() * 20);
    }
    
    const ltv = purchaseCount * 1299 + (purchaseCount > 0 ? Math.floor(Math.random() * 400 - 200) : 0);
    const churnTrend = churnRisk > 70 ? "up" : churnRisk < 35 ? "down" : "stable";
    
    // Preferred channels (WhatsApp & Instagram prioritized)
    const preferredChannel = Math.random() > 0.45 ? "WhatsApp" : (Math.random() > 0.5 ? "Email" : (Math.random() > 0.5 ? "SMS" : "RCS"));
    
    // Customer DNA keywords
    const dnaPool = [
      "Cotton Fabric Preferred", "Instagram Discovery", "Festive Wear Buyer", "Discount Responsive", 
      "Anarkali Lover", "Aura VIP", "WhatsApp Order", "Repeat Customer", "Jaipuri Prints", "Kurta Sets Preferred"
    ];
    const dna = [...dnaPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Next purchase prediction
    const predictedNextPurchase = churnRisk > 80 ? "Unlikely" : `In ${1 + Math.floor(Math.random() * 3)} weeks`;
    const predictedCategory = KURTI_CATEGORIES[Math.floor(Math.random() * KURTI_CATEGORIES.length)];
    
    // Galaxy coordinates clustering
    const center = GALAXY_CENTERS[segment] || { cx: 500, cy: 500 };
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 130;
    const x = Math.round(center.cx + Math.cos(angle) * distance);
    const y = Math.round(center.cy + Math.sin(angle) * distance);
    
    customers.push({
      id: `cust_${1001 + i}`,
      name,
      email,
      phone,
      segment,
      originalSegment: origSegment, // keep track of requested segment name
      ltv,
      churnRisk,
      churnTrend,
      purchaseCount,
      dna,
      preferredChannel,
      predictedNextPurchase,
      predictedCategory,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (i * 1000000)}?auto=format&fit=crop&w=100&h=100&q=80`,
      x,
      y
    });
  }
  return customers;
}

// 2. Generate Orders
function generateOrders(customers: any[], count: number = 2500): any[] {
  const orders: any[] = [];
  const channels = ["Instagram DM Checkout", "WhatsApp Order Routing", "Direct Online Store", "In-App Dispatch"];
  
  // Base date around current local time
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 300); // 300 days ago
  
  for (let i = 0; i < count; i++) {
    // Pick a random customer with purchaseCount > 0
    let customer = customers[Math.floor(Math.random() * customers.length)];
    while (customer.purchaseCount === 0) {
      customer = customers[Math.floor(Math.random() * customers.length)];
    }
    
    const amount = 1299 + Math.floor(Math.random() * 600 - 300); // Centered around ₹1,299 AOV
    
    // Distribute date randomly over the last 300 days
    const orderDate = new Date(startDate.getTime() + Math.random() * (new Date().getTime() - startDate.getTime()));
    
    orders.push({
      id: `ord_${100001 + i}`,
      customerId: customer.id,
      customerName: customer.name,
      amount,
      date: orderDate.toISOString().split("T")[0],
      product: KURTI_CATEGORIES[Math.floor(Math.random() * KURTI_CATEGORIES.length)],
      channel: channels[Math.floor(Math.random() * channels.length)]
    });
  }
  return orders;
}

// 3. Campaigns List (10 campaigns)
const CAMPAIGNS = [
  {
    id: "camp_1",
    name: "Summer Collection Launch",
    goal: "Launch Summer Collection",
    description: "Introductory campaign showcasing premium cotton kurtas and printed tunics.",
    channel: "Instagram",
    status: "Completed",
    sentCount: 12000,
    deliveredCount: 11850,
    openedCount: 9480,
    clickedCount: 4740,
    purchaseCount: 948,
    revenueGenerated: 1231452,
    createdAt: "2026-03-15T09:00:00Z"
  },
  {
    id: "camp_2",
    name: "Diwali Festive Dhamaka",
    goal: "Increase VIP Revenue",
    description: "Premium heavy-embroidered suit sets and silk straight kurtas for festive seasons.",
    channel: "WhatsApp",
    status: "Completed",
    sentCount: 800,
    deliveredCount: 798,
    openedCount: 760,
    clickedCount: 532,
    purchaseCount: 212,
    revenueGenerated: 423788,
    createdAt: "2026-05-20T10:15:00Z"
  },
  {
    id: "camp_3",
    name: "VIP Early Access Sale",
    goal: "Increase VIP Revenue",
    description: "Exclusive pre-sale catalog invite offering 20% discount on new Jaipuri arrivals.",
    channel: "RCS",
    status: "Completed",
    sentCount: 180,
    deliveredCount: 178,
    openedCount: 169,
    clickedCount: 118,
    purchaseCount: 59,
    revenueGenerated: 114920,
    createdAt: "2026-05-28T14:30:00Z"
  },
  {
    id: "camp_4",
    name: "Instagram DM Recovery Campaign",
    goal: "Recover Lost Leads",
    description: "Follow up with users who enquired about kurti sizes but didn't finish billing.",
    channel: "Instagram",
    status: "Completed",
    sentCount: 650,
    deliveredCount: 642,
    openedCount: 577,
    clickedCount: 346,
    purchaseCount: 104,
    revenueGenerated: 135096,
    createdAt: "2026-06-01T11:00:00Z"
  },
  {
    id: "camp_5",
    name: "WhatsApp Reactivation Broadcast",
    goal: "Reduce Churn",
    description: "Win back slipping customers with a custom ₹250 flat discount voucher code.",
    channel: "WhatsApp",
    status: "Completed",
    sentCount: 420,
    deliveredCount: 416,
    openedCount: 388,
    clickedCount: 194,
    purchaseCount: 48,
    revenueGenerated: 62352,
    createdAt: "2026-06-03T16:00:00Z"
  },
  {
    id: "camp_6",
    name: "Anarkali Special Showcase",
    goal: "Increase Repeat Purchases",
    description: "Targeting previous kurti buyers with new geometric Anarkali cuts.",
    channel: "Email",
    status: "Completed",
    sentCount: 1500,
    deliveredCount: 1485,
    openedCount: 891,
    clickedCount: 356,
    purchaseCount: 71,
    revenueGenerated: 92229,
    createdAt: "2026-06-05T08:30:00Z"
  },
  {
    id: "camp_7",
    name: "Weekend Dailywear Flash Promotion",
    goal: "Increase Repeat Purchases",
    description: "Short flash sale (48 hours) on basic office wear tunics.",
    channel: "SMS",
    status: "Completed",
    sentCount: 3000,
    deliveredCount: 2940,
    openedCount: 1764,
    clickedCount: 441,
    purchaseCount: 88,
    revenueGenerated: 114312,
    createdAt: "2026-06-07T12:00:00Z"
  },
  {
    id: "camp_8",
    name: "Cart Leakage Autopilot",
    goal: "Recover Lost Leads",
    description: "Trigger automated follow-ups 30 minutes after shopping cart abandons.",
    channel: "WhatsApp",
    status: "Running",
    sentCount: 124,
    deliveredCount: 124,
    openedCount: 115,
    clickedCount: 78,
    purchaseCount: 23,
    revenueGenerated: 29877,
    createdAt: "2026-06-09T10:00:00Z"
  },
  {
    id: "camp_9",
    name: "Cotton Kurtas Combo Blast",
    goal: "Increase Repeat Purchases",
    description: "Buy 2 Get 1 Free promotion on dailywear products.",
    channel: "Email",
    status: "Running",
    sentCount: 2100,
    deliveredCount: 2050,
    openedCount: 1025,
    clickedCount: 410,
    purchaseCount: 61,
    revenueGenerated: 79239,
    createdAt: "2026-06-10T09:00:00Z"
  },
  {
    id: "camp_10",
    name: "Monsoon Clearance Launch",
    goal: "Reduce Churn",
    description: "Seasonal clearance of past stocks with up to 40% markdowns.",
    channel: "SMS",
    status: "Draft",
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    clickedCount: 0,
    purchaseCount: 0,
    revenueGenerated: 0,
    createdAt: "2026-06-10T13:30:00Z"
  }
];

// 4. Opportunities (20 Radar entries)
const OPPORTUNITIES = [
  {
    id: "opp_1",
    title: "Instagram DM Cart Recovery",
    type: "Lead",
    cohort: "Abandoned Cart Customers",
    description: "Recover potential leads from social DM enquiries who abandoned carts.",
    potentialRevenue: 22000,
    opportunityScore: 96,
    recommendedChannel: "WhatsApp",
    confidence: "High",
    audienceSize: 17,
    priorityScore: 95,
    recommendedAction: "Recover Lost Revenue",
    reasoning: "Users who drop off in Instagram messages show extremely high recovery conversion rates when re-engaged on WhatsApp within 3 hours.",
    color: "Green",
    angle: 42,
    distance: 40
  },
  {
    id: "opp_2",
    title: "Slipping VIP Recovery",
    type: "VIP",
    cohort: "Inactive VIP Customers",
    description: "Win back premium buyers showing no purchase activity for 60+ days.",
    potentialRevenue: 45000,
    opportunityScore: 92,
    recommendedChannel: "WhatsApp",
    confidence: "High",
    audienceSize: 12,
    priorityScore: 91,
    recommendedAction: "Reduce Customer Churn",
    reasoning: "High LTV VIP customers representing substantial latent buying potential. Re-engaging them with early festive releases yields high conversions.",
    color: "Purple",
    angle: 120,
    distance: 55
  },
  {
    id: "opp_3",
    title: "Jaipuri Prints Cross-Sell",
    type: "Prospect",
    cohort: "Repeat Buyers",
    description: "Cross-sell new Jaipuri print models to cotton dailywear catalog buyers.",
    potentialRevenue: 32000,
    opportunityScore: 88,
    recommendedChannel: "RCS",
    confidence: "High",
    audienceSize: 45,
    priorityScore: 89,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Customers purchasing dailywear cotton items have a 68% cross-sell affinity score toward premium Jaipuri patterned designs.",
    color: "Yellow",
    angle: 200,
    distance: 65
  },
  {
    id: "opp_4",
    title: "Festive Gota Patti Early Access",
    type: "VIP",
    cohort: "VIP Customers",
    description: "Offer pre-sale access to designer collections to high LTV buyers.",
    potentialRevenue: 58000,
    opportunityScore: 94,
    recommendedChannel: "RCS",
    confidence: "High",
    audienceSize: 8,
    priorityScore: 93,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Top loyalty tier customers show extremely high conversion (over 40%) when offered early private slots on premium festive inventories.",
    color: "Green",
    angle: 280,
    distance: 30
  },
  {
    id: "opp_5",
    title: "Cotton Dailywear Bundling",
    type: "Prospect",
    cohort: "New Customers",
    description: "Target new buyers with dailywear kurtis bundling offers.",
    potentialRevenue: 18500,
    opportunityScore: 85,
    recommendedChannel: "Email",
    confidence: "Medium",
    audienceSize: 28,
    priorityScore: 82,
    recommendedAction: "Increase Customer LTV",
    reasoning: "New users who make single purchases are highly receptive to multi-buy combos to save on delivery fees.",
    color: "Blue",
    angle: 310,
    distance: 70
  },
  {
    id: "opp_6",
    title: "Monsoon Clearance Cross-Sell",
    type: "Inactive",
    cohort: "Inactive Customers",
    description: "Clear out old stocks to dormant users with steep markdowns.",
    potentialRevenue: 28000,
    opportunityScore: 81,
    recommendedChannel: "SMS",
    confidence: "Medium",
    audienceSize: 64,
    priorityScore: 78,
    recommendedAction: "Recover Lost Revenue",
    reasoning: "Dormant users who haven't opened emails react strongly to low-pricing clearout offers sent via SMS.",
    color: "Yellow",
    angle: 85,
    distance: 60
  },
  {
    id: "opp_7",
    title: "Abandoned Checkout Email Loop",
    type: "Lead",
    cohort: "Abandoned Cart Customers",
    description: "Trigger automatic email vouchers for users dropping off at checkout.",
    potentialRevenue: 15000,
    opportunityScore: 89,
    recommendedChannel: "Email",
    confidence: "High",
    audienceSize: 22,
    priorityScore: 87,
    recommendedAction: "Recover Lost Revenue",
    reasoning: "Automatically emailing checkout drop-offs within 1 hour recovers up to 15% of cart values.",
    color: "Green",
    angle: 15,
    distance: 45
  },
  {
    id: "opp_8",
    title: "Instagram Post Clearance Push",
    type: "Prospect",
    cohort: "Repeat Buyers",
    description: "Leverage Instagram DM post comments automation to boost conversion.",
    potentialRevenue: 19000,
    opportunityScore: 87,
    recommendedChannel: "WhatsApp",
    confidence: "High",
    audienceSize: 31,
    priorityScore: 86,
    recommendedAction: "Acquire New Customers",
    reasoning: "Setting up auto-replies to users commenting 'PRICE' on Instagram posts increases checkout completions by 28%.",
    color: "Purple",
    angle: 145,
    distance: 72
  },
  {
    id: "opp_9",
    title: "Cotton Dailywear Repeat Reminders",
    type: "Inactive",
    cohort: "Inactive Customers",
    description: "Send re-purchase prompts for office wear kurtas at 90 days.",
    potentialRevenue: 12000,
    opportunityScore: 78,
    recommendedChannel: "SMS",
    confidence: "Medium",
    audienceSize: 18,
    priorityScore: 75,
    recommendedAction: "Reduce Customer Churn",
    reasoning: "Dailywear items are subject to regular lifecycle decay; prompting re-purchase at 90 days drives repeat rates.",
    color: "Red",
    angle: 225,
    distance: 80
  },
  {
    id: "opp_10",
    title: "Anarkali Suite Upsell Program",
    type: "VIP",
    cohort: "Repeat Buyers",
    description: "Upsell premium heavy cotton Anarkali items to regular kurti shoppers.",
    potentialRevenue: 38000,
    opportunityScore: 90,
    recommendedChannel: "RCS",
    confidence: "High",
    audienceSize: 20,
    priorityScore: 89,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Shoppers who bought 3+ basic kurtas are prime candidates for complete suite sets containing matching pants and dupattas.",
    color: "Green",
    angle: 345,
    distance: 48
  },
  {
    id: "opp_11",
    title: "Slipping Dailywear buyers",
    type: "Inactive",
    cohort: "At Risk Customers",
    description: "Re-engage basic wear buyers showing declining activity metrics.",
    potentialRevenue: 14000,
    opportunityScore: 79,
    recommendedChannel: "WhatsApp",
    confidence: "Medium",
    audienceSize: 25,
    priorityScore: 76,
    recommendedAction: "Reduce Customer Churn",
    reasoning: "Risk indicators include reduced page clicks and cart abandonment. A soft WhatsApp checklist offer mitigates risk.",
    color: "Yellow",
    angle: 185,
    distance: 75
  },
  {
    id: "opp_12",
    title: "First Purchase Incentive Blast",
    type: "Prospect",
    cohort: "New Customers",
    description: "Push first checkout completions to newly registered users.",
    potentialRevenue: 9500,
    opportunityScore: 84,
    recommendedChannel: "Email",
    confidence: "Medium",
    audienceSize: 32,
    priorityScore: 80,
    recommendedAction: "Acquire New Customers",
    reasoning: "Users registering profiles but exiting checkout can be nudged with a special 10% welcome coupon code.",
    color: "Blue",
    angle: 65,
    distance: 82
  },
  {
    id: "opp_13",
    title: "Jaipuri Gota Patti Cross-sell",
    type: "VIP",
    cohort: "VIP Customers",
    description: "Promote handblock premium print collections to top spenders.",
    potentialRevenue: 29000,
    opportunityScore: 91,
    recommendedChannel: "WhatsApp",
    confidence: "High",
    audienceSize: 6,
    priorityScore: 90,
    recommendedAction: "Increase Customer LTV",
    reasoning: "VIPs show maximum ticket size growth when offered premium craft handblock prints and artisanal details.",
    color: "Green",
    angle: 110,
    distance: 35
  },
  {
    id: "opp_14",
    title: "Abandoned checkout SMS reminder",
    type: "Lead",
    cohort: "Abandoned Cart Customers",
    description: "Trigger backup SMS notifications for cart recovery failures.",
    potentialRevenue: 8000,
    opportunityScore: 74,
    recommendedChannel: "SMS",
    confidence: "Low",
    audienceSize: 15,
    priorityScore: 72,
    recommendedAction: "Recover Lost Revenue",
    reasoning: "When WhatsApp recovery remains unopened for 12 hours, a failover SMS helps capture remaining intent.",
    color: "Red",
    angle: 255,
    distance: 88
  },
  {
    id: "opp_15",
    title: "Silk Kurtas Festive Pre-order",
    type: "VIP",
    cohort: "VIP Customers",
    description: "Collect advance bookings on upcoming silk festive catalogs.",
    potentialRevenue: 52000,
    opportunityScore: 95,
    recommendedChannel: "RCS",
    confidence: "High",
    audienceSize: 10,
    priorityScore: 94,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Top customers prefer reservation programs. Booking silk designs in advance reduces inventory risk.",
    color: "Green",
    angle: 295,
    distance: 25
  },
  {
    id: "opp_16",
    title: "Dormant Dailywear Reactivation",
    type: "Inactive",
    cohort: "Inactive Customers",
    description: "Re-engage cotton kurta buyers inactive for 90+ days.",
    potentialRevenue: 17500,
    opportunityScore: 82,
    recommendedChannel: "Email",
    confidence: "Medium",
    audienceSize: 38,
    priorityScore: 80,
    recommendedAction: "Reduce Customer Churn",
    reasoning: "Dormant users can be reactivated by showing fresh dailywear designs and catalog lookbooks.",
    color: "Yellow",
    angle: 130,
    distance: 64
  },
  {
    id: "opp_17",
    title: "Instagram Post Comment Automations",
    type: "Lead",
    cohort: "New Customers",
    description: "Convert comments on viral posts into direct WhatsApp leads.",
    potentialRevenue: 13000,
    opportunityScore: 86,
    recommendedChannel: "WhatsApp",
    confidence: "High",
    audienceSize: 26,
    priorityScore: 84,
    recommendedAction: "Acquire New Customers",
    reasoning: "Connecting viral post comments to direct chat checkouts boosts conversion ratios.",
    color: "Purple",
    angle: 50,
    distance: 58
  },
  {
    id: "opp_18",
    title: "Office wear kurtas Cross-sell",
    type: "Prospect",
    cohort: "New Customers",
    description: "Introduce solid cotton kurtis to casual tunics buyers.",
    potentialRevenue: 11000,
    opportunityScore: 80,
    recommendedChannel: "Email",
    confidence: "Medium",
    audienceSize: 20,
    priorityScore: 78,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Office wear products hold high frequency buying traits. Cross-selling daily items drives repeat conversion.",
    color: "Blue",
    angle: 325,
    distance: 78
  },
  {
    id: "opp_19",
    title: "Festive Dupattas Add-ons",
    type: "Prospect",
    cohort: "Repeat Buyers",
    description: "Prompt dupatta matches at checkout for printed kurtas.",
    potentialRevenue: 14500,
    opportunityScore: 88,
    recommendedChannel: "RCS",
    confidence: "High",
    audienceSize: 50,
    priorityScore: 87,
    recommendedAction: "Increase Customer LTV",
    reasoning: "Gifting recommendations or matching dupatta add-on prompts increase order sizes by ₹350 on average.",
    color: "Green",
    angle: 215,
    distance: 50
  },
  {
    id: "opp_20",
    title: "Inactive VIP winback RCS blast",
    type: "Inactive",
    cohort: "Inactive VIP Customers",
    description: "Send high definition lookbook catalog to dormant VIPs.",
    potentialRevenue: 24000,
    opportunityScore: 84,
    recommendedChannel: "RCS",
    confidence: "Medium",
    audienceSize: 15,
    priorityScore: 82,
    recommendedAction: "Reduce Customer Churn",
    reasoning: "A visual rich lookbook works better than discount codes to bring back premium boutique buyers.",
    color: "Yellow",
    angle: 150,
    distance: 68
  }
];

// 5. Missions List (15 missions)
const MISSIONS = [
  {
    id: "miss_1",
    goal: "Increase Repeat Purchases",
    status: "Completed",
    progress: 100,
    predictedRoi: 4.8,
    predictedRevenue: 95000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 150,
    createdAt: "2026-05-10T10:00:00Z"
  },
  {
    id: "miss_2",
    goal: "Recover Lost Leads",
    status: "Completed",
    progress: 100,
    predictedRoi: 3.5,
    predictedRevenue: 42000,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "Instagram",
    audienceCount: 65,
    createdAt: "2026-05-18T14:00:00Z"
  },
  {
    id: "miss_3",
    goal: "Launch Summer Collection",
    status: "Completed",
    progress: 100,
    predictedRoi: 6.2,
    predictedRevenue: 280000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "RCS",
    audienceCount: 1200,
    createdAt: "2026-05-25T09:30:00Z"
  },
  {
    id: "miss_4",
    goal: "Reduce Churn",
    status: "Completed",
    progress: 100,
    predictedRoi: 4.1,
    predictedRevenue: 65000,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 220,
    createdAt: "2026-06-01T11:00:00Z"
  },
  {
    id: "miss_5",
    goal: "Increase VIP Revenue",
    status: "Completed",
    progress: 100,
    predictedRoi: 5.5,
    predictedRevenue: 110000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "RCS",
    audienceCount: 180,
    createdAt: "2026-06-03T16:00:00Z"
  },
  {
    id: "miss_6",
    goal: "Recover Lost Leads",
    status: "Running",
    progress: 75,
    predictedRoi: 3.8,
    predictedRevenue: 34500,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 17,
    createdAt: "2026-06-06T08:30:00Z"
  },
  {
    id: "miss_7",
    goal: "Increase Repeat Purchases",
    status: "Running",
    progress: 60,
    predictedRoi: 4.5,
    predictedRevenue: 82000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "RCS",
    audienceCount: 45,
    createdAt: "2026-06-07T12:00:00Z"
  },
  {
    id: "miss_8",
    goal: "Launch Summer Collection",
    status: "Running",
    progress: 40,
    predictedRoi: 5.8,
    predictedRevenue: 150000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "Email",
    audienceCount: 350,
    createdAt: "2026-06-08T10:00:00Z"
  },
  {
    id: "miss_9",
    goal: "Reduce Churn",
    status: "Running",
    progress: 25,
    predictedRoi: 3.4,
    predictedRevenue: 48000,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 88,
    createdAt: "2026-06-09T09:00:00Z"
  },
  {
    id: "miss_10",
    goal: "Increase VIP Revenue",
    status: "Queued",
    progress: 0,
    predictedRoi: 5.2,
    predictedRevenue: 75000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "RCS",
    audienceCount: 84,
    createdAt: "2026-06-10T09:00:00Z"
  },
  {
    id: "miss_11",
    goal: "Recover Lost Leads",
    status: "Queued",
    progress: 0,
    predictedRoi: 4.0,
    predictedRevenue: 25000,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 32,
    createdAt: "2026-06-10T11:00:00Z"
  },
  {
    id: "miss_12",
    goal: "Increase Repeat Purchases",
    status: "Queued",
    progress: 0,
    predictedRoi: 3.9,
    predictedRevenue: 40000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "Email",
    audienceCount: 110,
    createdAt: "2026-06-10T12:00:00Z"
  },
  {
    id: "miss_13",
    goal: "Reduce Churn",
    status: "Completed",
    progress: 100,
    predictedRoi: 3.6,
    predictedRevenue: 32000,
    assignedAgents: ["Polaris", "Luna", "Vega", "Nova", "Atlas"],
    selectedChannel: "SMS",
    audienceCount: 120,
    createdAt: "2026-05-05T10:00:00Z"
  },
  {
    id: "miss_14",
    goal: "Increase VIP Revenue",
    status: "Completed",
    progress: 100,
    predictedRoi: 5.8,
    predictedRevenue: 85000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 65,
    createdAt: "2026-05-12T13:15:00Z"
  },
  {
    id: "miss_15",
    goal: "Launch Summer Collection",
    status: "Completed",
    progress: 100,
    predictedRoi: 5.1,
    predictedRevenue: 120000,
    assignedAgents: ["Polaris", "Vega", "Nova", "Atlas"],
    selectedChannel: "WhatsApp",
    audienceCount: 240,
    createdAt: "2026-05-15T11:00:00Z"
  }
];

// 6. Agent Logs (30 logs)
const AGENT_LOGS = [
  {
    id: "log_1",
    agent: "System",
    timestamp: "10:00:01 AM",
    message: "ORBIT Core System online. Loading brand intelligence matrices for Aura Threads node.",
    type: "thought",
    createdAt: "2026-06-01T10:00:01Z"
  },
  {
    id: "log_2",
    agent: "Polaris",
    timestamp: "10:01:05 AM",
    message: "Initiated directory index scan of Aura Threads customer base. Mapped 500 nodes.",
    type: "action",
    createdAt: "2026-06-01T10:01:05Z"
  },
  {
    id: "log_3",
    agent: "Luna",
    timestamp: "10:02:12 AM",
    message: "Audited abandoned Instagram shopping checkouts. Discovered 17 premium checkout drops representing ₹22,000 leakage.",
    type: "thought",
    createdAt: "2026-06-01T10:02:12Z"
  },
  {
    id: "log_4",
    agent: "Vega",
    timestamp: "10:03:30 AM",
    message: "Fitted regression models to Slipping VIP cohort. Calculated 3.8x ROI yield coefficients for recovery message templates.",
    type: "thought",
    createdAt: "2026-06-01T10:03:30Z"
  },
  {
    id: "log_5",
    agent: "Nova",
    timestamp: "10:04:15 AM",
    message: "Generated 3 copy layout variations for WhatsApp checkout nudges, focusing on cotton dailywear.",
    type: "action",
    createdAt: "2026-06-01T10:04:15Z"
  },
  {
    id: "log_6",
    agent: "Atlas",
    timestamp: "10:05:00 AM",
    message: "Operations dispatch pipeline initialized. Webhook response time checks: 12ms nominal. Ready to dispatch.",
    type: "result",
    createdAt: "2026-06-01T10:05:00Z"
  },
  {
    id: "log_7",
    agent: "Polaris",
    timestamp: "09:15:30 AM",
    message: "Isolating 120 tech-savier handblock print enthusiasts for early access collection launch.",
    type: "action",
    createdAt: "2026-06-03T09:15:30Z"
  },
  {
    id: "log_8",
    agent: "Vega",
    timestamp: "09:17:45 AM",
    message: "Estimating revenue conversion curves. Optimal channel is RCS cards (estimated 42% conversions, ₹58,000 potential).",
    type: "thought",
    createdAt: "2026-06-03T09:17:45Z"
  },
  {
    id: "log_9",
    agent: "Nova",
    timestamp: "09:19:10 AM",
    message: "Crafting visual rich card structures with direct billing options for Gota Patti festive sets.",
    type: "action",
    createdAt: "2026-06-03T09:19:10Z"
  },
  {
    id: "log_10",
    agent: "Atlas",
    timestamp: "09:20:00 AM",
    message: "Dispatched 800 WhatsApp messages. Handshake rate: 100%. Delivery queues cleared.",
    type: "result",
    createdAt: "2026-06-03T09:20:00Z"
  },
  {
    id: "log_11",
    agent: "System",
    timestamp: "11:00:05 AM",
    message: "Scheduled automated weekly re-engagement loops for Aura Threads. Scanning for checkout leakage.",
    type: "thought",
    createdAt: "2026-06-05T11:00:05Z"
  },
  {
    id: "log_12",
    agent: "Luna",
    timestamp: "11:02:15 AM",
    message: "Detected 22 abandoned checkout leads. Adding recovery priority tokens to active operational buffers.",
    type: "action",
    createdAt: "2026-06-05T11:02:15Z"
  },
  {
    id: "log_13",
    agent: "Vega",
    timestamp: "11:03:40 AM",
    message: "Running random forest analysis on inactive dailywear purchasers. Selected SMS channel due to low active email rates.",
    type: "thought",
    createdAt: "2026-06-05T11:03:40Z"
  },
  {
    id: "log_14",
    agent: "Nova",
    timestamp: "11:05:10 AM",
    message: "Drafting high-conversion SMS copy layouts with embedded discount codes.",
    type: "action",
    createdAt: "2026-06-05T11:05:10Z"
  },
  {
    id: "log_15",
    agent: "Atlas",
    timestamp: "11:06:00 AM",
    message: "Dispatched SMS push clearances. Delivery rate: 98%. Recovered ₹15,000 in immediate purchases.",
    type: "result",
    createdAt: "2026-06-05T11:06:00Z"
  },
  {
    id: "log_16",
    agent: "Polaris",
    timestamp: "02:15:30 PM",
    message: "Scanning Loyalist graphs. Identified 8 VIP customers suitable for advance festival collections pre-orders.",
    type: "action",
    createdAt: "2026-06-07T14:15:30Z"
  },
  {
    id: "log_17",
    agent: "Luna",
    timestamp: "02:17:10 PM",
    message: "VIP billing loops show zero friction points. Perfect cohort state for complete suite pre-order programs.",
    type: "thought",
    createdAt: "2026-06-07T14:17:10Z"
  },
  {
    id: "log_18",
    agent: "Vega",
    timestamp: "02:18:45 PM",
    message: "Expected VIP pre-order LTV bump is ₹15,000 per user. Forecasting ₹52,000 cumulative revenue (94% confidence).",
    type: "thought",
    createdAt: "2026-06-07T14:18:45Z"
  },
  {
    id: "log_19",
    agent: "Nova",
    timestamp: "02:20:15 PM",
    message: "Generated personalized WhatsApp templates with direct pre-order reservations and premium product cards.",
    type: "action",
    createdAt: "2026-06-07T14:20:15Z"
  },
  {
    id: "log_20",
    agent: "Atlas",
    timestamp: "02:22:00 PM",
    message: "Routing pre-order VIP links via conversational channels. Processing webhook confirmations.",
    type: "result",
    createdAt: "2026-06-07T14:22:00Z"
  },
  {
    id: "log_21",
    agent: "System",
    timestamp: "09:00:10 AM",
    message: "Executing Aura Threads daily operations script. Performing database replication.",
    type: "thought",
    createdAt: "2026-06-08T09:00:10Z"
  },
  {
    id: "log_22",
    agent: "Polaris",
    timestamp: "09:02:10 AM",
    message: "Daily cohort scan: 18 VIP customers flagged at risk. Slipping Away segment average risk score spikes to 78%.",
    type: "action",
    createdAt: "2026-06-08T09:02:10Z"
  },
  {
    id: "log_23",
    agent: "Luna",
    timestamp: "09:04:15 AM",
    message: "Auditing slipping VIP behaviors. 8 accounts abandoned Gota Patti set checkouts in last 7 days. Action required.",
    type: "thought",
    createdAt: "2026-06-08T09:04:15Z"
  },
  {
    id: "log_24",
    agent: "Vega",
    timestamp: "09:05:40 AM",
    message: "Mitigation equations show high recovery scores (64% yield) when re-engaged within a 24h window. Suggested ROI: 4.2x.",
    type: "thought",
    createdAt: "2026-06-08T09:05:40Z"
  },
  {
    id: "log_25",
    agent: "Nova",
    timestamp: "09:07:05 AM",
    message: "Generated custom win-back designs with past checkout restorations. Optimized layout for WhatsApp message loops.",
    type: "action",
    createdAt: "2026-06-08T09:07:05Z"
  },
  {
    id: "log_26",
    agent: "Atlas",
    timestamp: "09:08:30 AM",
    message: "Win-back dispatch armed. Triggering automatic recovery notifications. Webhook listener active.",
    type: "result",
    createdAt: "2026-06-08T09:08:30Z"
  },
  {
    id: "log_27",
    agent: "System",
    timestamp: "10:30:15 AM",
    message: "Executing weekly lookbook lookahead checks. Mapped 38 cotton dailywear buyer profiles.",
    type: "thought",
    createdAt: "2026-06-10T10:30:15Z"
  },
  {
    id: "log_28",
    agent: "Polaris",
    timestamp: "10:32:00 AM",
    message: "Cotton dailywear buyers have been isolated. Mapped 38 profiles with high-frequency traits.",
    type: "action",
    createdAt: "2026-06-10T10:32:00Z"
  },
  {
    id: "log_29",
    agent: "Vega",
    timestamp: "10:34:00 AM",
    message: "Dailywear buyers show high response yields (45% opens). Recommended channel: RCS cards containing lookbooks.",
    type: "thought",
    createdAt: "2026-06-10T10:34:00Z"
  },
  {
    id: "log_30",
    agent: "Atlas",
    timestamp: "10:35:00 AM",
    message: "Dispatched weekly lookbook campaign. 38 threads executed successfully.",
    type: "result",
    createdAt: "2026-06-10T10:35:00Z"
  }
];

// 7. Simulations List (10 simulations)
const SIMULATIONS = [
  {
    id: "sim_1",
    audience: "Repeat Buyers",
    discount: 15,
    channel: "WhatsApp",
    createdAt: "2026-05-15T12:00:00Z",
    conservative: { conversionRate: 5.5, revenue: 35000, roi: 2.8, customerFatigue: "Low", optOutRate: 0.3 },
    recommended: { conversionRate: 12.0, revenue: 78000, roi: 4.8, customerFatigue: "Medium", optOutRate: 0.8 },
    aggressive: { conversionRate: 16.5, revenue: 115000, roi: 3.9, customerFatigue: "High", optOutRate: 2.2 }
  },
  {
    id: "sim_2",
    audience: "VIP Customers",
    discount: 10,
    channel: "RCS",
    createdAt: "2026-05-18T10:30:00Z",
    conservative: { conversionRate: 8.5, revenue: 45000, roi: 3.5, customerFatigue: "Low", optOutRate: 0.1 },
    recommended: { conversionRate: 15.0, revenue: 85000, roi: 5.8, customerFatigue: "Low", optOutRate: 0.3 },
    aggressive: { conversionRate: 22.0, revenue: 130000, roi: 4.6, customerFatigue: "Medium", optOutRate: 1.1 }
  },
  {
    id: "sim_3",
    audience: "Inactive Customers",
    discount: 20,
    channel: "Email",
    createdAt: "2026-05-22T14:15:00Z",
    conservative: { conversionRate: 3.2, revenue: 18000, roi: 1.8, customerFatigue: "Low", optOutRate: 0.4 },
    recommended: { conversionRate: 7.5, revenue: 42000, roi: 3.5, customerFatigue: "Medium", optOutRate: 0.9 },
    aggressive: { conversionRate: 11.2, revenue: 68000, roi: 2.9, customerFatigue: "High", optOutRate: 2.5 }
  },
  {
    id: "sim_4",
    audience: "New Customers",
    discount: 15,
    channel: "SMS",
    createdAt: "2026-05-28T09:00:00Z",
    conservative: { conversionRate: 4.5, revenue: 25000, roi: 2.2, customerFatigue: "Low", optOutRate: 0.2 },
    recommended: { conversionRate: 9.8, revenue: 58000, roi: 4.1, customerFatigue: "Medium", optOutRate: 0.7 },
    aggressive: { conversionRate: 14.0, revenue: 88000, roi: 3.2, customerFatigue: "High", optOutRate: 1.8 }
  },
  {
    id: "sim_5",
    audience: "Repeat Buyers",
    discount: 20,
    channel: "Multi-channel",
    createdAt: "2026-06-01T11:30:00Z",
    conservative: { conversionRate: 7.2, revenue: 52000, roi: 3.2, customerFatigue: "Medium", optOutRate: 0.5 },
    recommended: { conversionRate: 14.5, revenue: 110000, roi: 5.2, customerFatigue: "Medium", optOutRate: 1.2 },
    aggressive: { conversionRate: 20.1, revenue: 160000, roi: 4.0, customerFatigue: "High", optOutRate: 3.1 }
  },
  {
    id: "sim_6",
    audience: "VIP Customers",
    discount: 15,
    channel: "WhatsApp",
    createdAt: "2026-06-04T15:00:00Z",
    conservative: { conversionRate: 9.0, revenue: 62000, roi: 3.8, customerFatigue: "Low", optOutRate: 0.2 },
    recommended: { conversionRate: 18.5, revenue: 125000, roi: 6.2, customerFatigue: "Medium", optOutRate: 0.6 },
    aggressive: { conversionRate: 25.0, revenue: 175000, roi: 4.8, customerFatigue: "High", optOutRate: 1.9 }
  },
  {
    id: "sim_7",
    audience: "Inactive Customers",
    discount: 25,
    channel: "WhatsApp",
    createdAt: "2026-06-06T10:00:00Z",
    conservative: { conversionRate: 4.8, revenue: 28000, roi: 2.1, customerFatigue: "Low", optOutRate: 0.4 },
    recommended: { conversionRate: 9.2, revenue: 55000, roi: 3.9, customerFatigue: "Medium", optOutRate: 1.1 },
    aggressive: { conversionRate: 13.8, revenue: 85000, roi: 3.0, customerFatigue: "High", optOutRate: 2.8 }
  },
  {
    id: "sim_8",
    audience: "New Customers",
    discount: 10,
    channel: "Email",
    createdAt: "2026-06-07T13:45:00Z",
    conservative: { conversionRate: 2.8, revenue: 15000, roi: 1.6, customerFatigue: "Low", optOutRate: 0.1 },
    recommended: { conversionRate: 6.1, revenue: 32000, roi: 3.0, customerFatigue: "Low", optOutRate: 0.4 },
    aggressive: { conversionRate: 9.5, revenue: 52000, roi: 2.4, customerFatigue: "Medium", optOutRate: 0.9 }
  },
  {
    id: "sim_9",
    audience: "Repeat Buyers",
    discount: 5,
    channel: "SMS",
    createdAt: "2026-06-08T16:00:00Z",
    conservative: { conversionRate: 3.0, revenue: 16000, roi: 1.9, customerFatigue: "Low", optOutRate: 0.1 },
    recommended: { conversionRate: 5.8, revenue: 30000, roi: 2.8, customerFatigue: "Low", optOutRate: 0.3 },
    aggressive: { conversionRate: 8.2, revenue: 45000, roi: 2.1, customerFatigue: "Medium", optOutRate: 0.8 }
  },
  {
    id: "sim_10",
    audience: "Inactive Customers",
    discount: 15,
    channel: "RCS",
    createdAt: "2026-06-10T10:15:00Z",
    conservative: { conversionRate: 4.1, revenue: 22000, roi: 2.0, customerFatigue: "Low", optOutRate: 0.2 },
    recommended: { conversionRate: 8.0, revenue: 48000, roi: 3.6, customerFatigue: "Medium", optOutRate: 0.7 },
    aggressive: { conversionRate: 12.2, revenue: 75000, roi: 2.9, customerFatigue: "High", optOutRate: 1.9 }
  }
];

// 8. Analytics snapshots (30 days of records matching daily targets)
function generateAnalytics(): any[] {
  const analytics: any[] = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    
    // Aura Threads daily run rate centered around ₹8,333/day to yield ₹2,50,000 monthly
    const revenue = Math.round(8333 + Math.random() * 4000 - 2000);
    const purchases = Math.round(revenue / 1299 + Math.random() * 2 - 1);
    const conversionRate = parseFloat((8.5 + Math.random() * 5).toFixed(1));
    
    analytics.push({
      date: dateStr,
      revenue,
      purchases: Math.max(1, purchases),
      conversionRate,
      createdAt: date.toISOString()
    });
  }
  return analytics;
}

// 9. Mission Updates (15 updates)
const MISSION_UPDATES = [
  { missionId: "miss_1", status: "Delivered", timestamp: "2026-05-10T10:30:00Z" },
  { missionId: "miss_2", status: "Delivered", timestamp: "2026-05-18T14:45:00Z" },
  { missionId: "miss_3", status: "Delivered", timestamp: "2026-05-25T11:00:00Z" },
  { missionId: "miss_4", status: "Delivered", timestamp: "2026-06-01T12:30:00Z" },
  { missionId: "miss_5", status: "Delivered", timestamp: "2026-06-03T18:00:00Z" },
  { missionId: "miss_6", status: "Sending", timestamp: "2026-06-06T09:00:00Z" },
  { missionId: "miss_7", status: "Delivered", timestamp: "2026-06-07T13:30:00Z" },
  { missionId: "miss_8", status: "Queued", timestamp: "2026-06-08T10:15:00Z" },
  { missionId: "miss_9", status: "Failed", timestamp: "2026-06-09T09:45:00Z" },
  { missionId: "miss_10", status: "Queued", timestamp: "2026-06-10T09:00:00Z" },
  { missionId: "miss_11", status: "Queued", timestamp: "2026-06-10T11:00:00Z" },
  { missionId: "miss_12", status: "Queued", timestamp: "2026-06-10T12:00:00Z" },
  { missionId: "miss_13", status: "Delivered", timestamp: "2026-05-05T10:30:00Z" },
  { missionId: "miss_14", status: "Delivered", timestamp: "2026-05-12T13:45:00Z" },
  { missionId: "miss_15", status: "Delivered", timestamp: "2026-05-15T11:30:00Z" }
];

async function seed() {
  console.log("🌱 Seeding database with realistic Aura Threads business demo data...");

  try {
    // 1. Seed brand DNA
    await db.collection("brand_dna").doc(BRAND_DNA_ID).set(BRAND_DNA_DATA);
    console.log("✅ Seeded Brand DNA (Aura Threads)");

    // 2. Generate and Seed Customers (500)
    console.log("Generating 500 customers...");
    const customers = generateCustomers(500);
    const batchSize = 100;
    for (let i = 0; i < customers.length; i += batchSize) {
      const chunk = customers.slice(i, i + batchSize);
      await Promise.all(chunk.map(customer => db.collection("customers").doc(customer.id).set(customer)));
      console.log(`   Written ${Math.min(i + batchSize, customers.length)} / ${customers.length} customers...`);
    }
    console.log("✅ Seeded 500 Customers");

    // 3. Generate and Seed Orders (2500)
    console.log("Generating 2500 orders...");
    const orders = generateOrders(customers, 2500);
    // Write in chunks to prevent firestore payload limit warnings
    for (let i = 0; i < orders.length; i += batchSize) {
      const chunk = orders.slice(i, i + batchSize);
      await Promise.all(chunk.map(order => db.collection("orders").doc(order.id).set(order)));
      console.log(`   Written ${Math.min(i + batchSize, orders.length)} / ${orders.length} orders...`);
    }
    console.log("✅ Seeded 2500 Orders");

    // 4. Seed Campaigns (10)
    for (const campaign of CAMPAIGNS) {
      await db.collection("campaigns").doc(campaign.id).set(campaign);
    }
    console.log("✅ Seeded 10 Campaigns");

    // 5. Seed Opportunities (20)
    for (const opp of OPPORTUNITIES) {
      await db.collection("opportunities").doc(opp.id).set(opp);
    }
    console.log("✅ Seeded 20 Opportunities");

    // 6. Seed Missions (15)
    for (const mission of MISSIONS) {
      await db.collection("missions").doc(mission.id).set(mission);
    }
    console.log("✅ Seeded 15 Missions");

    // 7. Seed Agent Logs (30)
    for (const log of AGENT_LOGS) {
      await db.collection("agent_logs").doc(log.id).set(log);
    }
    console.log("✅ Seeded 30 Agent Logs");

    // 8. Seed Simulations (10)
    for (const sim of SIMULATIONS) {
      await db.collection("simulations").doc(sim.id).set(sim);
    }
    console.log("✅ Seeded 10 Future Simulations");

    // 9. Generate and Seed Analytics Snapshots (30)
    const analytics = generateAnalytics();
    for (const item of analytics) {
      const docId = "an_" + item.date;
      await db.collection("analytics").doc(docId).set(item);
    }
    console.log("✅ Seeded 30 Analytics Snapshots");

    // 10. Seed Mission Updates
    for (const update of MISSION_UPDATES) {
      const docId = `up_${update.missionId}_${update.status}`;
      await db.collection("mission_updates").doc(docId).set(update);
    }
    console.log("✅ Seeded Mission Updates");

    console.log("🎉 Seeding complete! Database is now fully prepared with high-fidelity demo data for Aura Threads.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
}

seed();
