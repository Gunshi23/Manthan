import { db } from "../server/config/firebase";

// Helper to clear collection
async function clearCollection(name: string) {
  try {
    const snapshot = await db.collection(name).get();
    let count = 0;
    const batch: Promise<void>[] = [];
    snapshot.forEach((doc: any) => {
      batch.push(db.collection(name).doc(doc.id).delete());
      count++;
    });
    await Promise.all(batch);
    if (count > 0) {
      console.log(`🧹 Cleared ${count} records from collection: ${name}`);
    }
  } catch (err: any) {
    console.warn(`Could not clear collection ${name} (might be empty or initialized as mock):`, err.message || err);
  }
}

// Lists for generation
const INDIAN_FEMALE_FIRST_NAMES = [
  "Priya", "Ananya", "Neha", "Diya", "Riya", "Pooja", "Anjali", "Tanvi", "Isha", "Shreya",
  "Sneha", "Divya", "Deepika", "Kavita", "Kiran", "Meera", "Aditi", "Preeti", "Sanjana", "Nisha",
  "Ridhi", "Aishwarya", "Shruti", "Nikita", "Payal", "Shweta", "Kajal", "Sheetal", "Preeti", "Nalini",
  "Swati", "Rashmi", "Jyoti", "Pallavi", "Geeta", "Sunita", "Anita", "Ritu", "Seema", "Alka",
  "Komal", "Pinky", "Monika", "Richa", "Suman", "Vandana", "Rekha", "Usha", "Mamta", "Babita"
];

const LAST_NAMES = [
  "Sharma", "Sharma", "Sharma", "Sharma", "Sharma", // High frequency
  "Gupta", "Gupta", "Gupta", "Gupta",
  "Patel", "Patel", "Patel", "Patel",
  "Sharma", "Verma", "Mehta", "Singh", "Nair", "Das", "Joshi", "Iyer", "Sen", "Bose",
  "Reddy", "Rao", "Choudhury", "Gupta", "Kumar", "Trivedi", "Mishra", "Pandey", "Chatterjee"
];

const PRODUCTS = [
  { name: "Daily Wear Cotton Kurti", price: 999, category: "Kurtis" },
  { name: "Anarkali Suit Set", price: 1899, category: "Anarkalis" },
  { name: "Indigo Palazzo Set", price: 1499, category: "Palazzo Sets" },
  { name: "Festive Silk Kurti", price: 1699, category: "Kurtis" },
  { name: "Georgette Floral Kurta", price: 1199, category: "Kurtis" },
  { name: "Chanderi Straight Kurti", price: 1399, category: "Kurtis" },
  { name: "Cotton Linen Tunic", price: 1099, category: "Cotton Tunics" },
  { name: "Rayon A-Line Kurti", price: 899, category: "Kurtis" },
  { name: "Embroidered Kurta Set", price: 2199, category: "Palazzo Sets" },
  { name: "Block Print Kurti", price: 1099, category: "Kurtis" }
];

const CHANNELS: ("Email" | "WhatsApp" | "SMS" | "RCS")[] = ["WhatsApp", "Email", "SMS", "RCS"];

// Seed function
async function seed() {
  console.log("🌱 STARTING FIRESTORE SEEDING SYSTEM for Manthan.ai.ai...");
  console.log("Business Target: Aura Threads (Women's Fashion & Kurtis)");

  // 1. Clear existing collections to prevent duplicates
  const collectionsToClear = [
    "brand_dna", "customers", "orders", "campaigns", "missions", "opportunities", 
    "analytics", "agent_logs", "simulations", "mission_updates",
    "competitors", "market_signals", "industry_trends", "products", "seasonal_events", "social_insights"
  ];
  
  for (const coll of collectionsToClear) {
    await clearCollection(coll);
  }

  try {
    // ════════════════════════════════════════
    // 1. BRAND DNA
    // ════════════════════════════════════════
    const brandDnaData = {
      id: "dna_default",
      businessName: "Aura Threads",
      businessType: "Women's Fashion & Kurtis",
      primaryChannel: "Instagram",
      monthlyRevenue: 250000,
      averageOrderValue: 1299,
      instagramFollowers: 12000,
      whatsAppSubscribers: 800,
      growthStyle: "High Growth",
      customerUniverse: 500,
      growthPotential: "High",
      orbitHealth: 92,
      recommendedMissions: [
        "Increase Repeat Purchases",
        "Recover Lost Leads",
        "Launch Summer Collection",
        "Reduce Churn",
        "Increase VIP Revenue"
      ],
      createdAt: new Date().toISOString()
    };
    await db.collection("brand_dna").doc(brandDnaData.id).set(brandDnaData);
    console.log("✅ Seeded Brand DNA for Aura Threads");

    // ════════════════════════════════════════
    // 2. CUSTOMERS (500) & ORDERS (2500)
    // ════════════════════════════════════════
    console.log("⏳ Generating 500 customers and 2,500 orders...");
    
    const customers: any[] = [];
    const orders: any[] = [];
    
    // Distribution of segments to exactly add up to 2500 orders
    // - 120 Loyalists (average 10 purchases = 1200 orders)
    // - 100 Slipping Away (average 3 purchases = 300 orders)
    // - 100 High-Value Inactive (average 7 purchases = 700 orders)
    // - 180 New Signups (average 1.6 purchases = 300 orders)
    
    const segmentSpecs = [
      { name: "Loyalists", count: 120, avgPurchases: 10, churnMin: 5, churnMax: 20, trend: "stable", cx: 500, cy: 500 },
      { name: "Slipping Away", count: 100, avgPurchases: 3, churnMin: 65, churnMax: 90, trend: "up", cx: 280, cy: 280 },
      { name: "High-Value Inactive", count: 100, avgPurchases: 7, churnMin: 70, churnMax: 95, trend: "stable", cx: 720, cy: 720 },
      { name: "New Signups", count: 180, avgPurchases: 1, churnMin: 20, churnMax: 50, trend: "down", cx: 720, cy: 280 }
    ];

    let custIndex = 1;
    let ordIndex = 1;

    for (const spec of segmentSpecs) {
      for (let i = 0; i < spec.count; i++) {
        const first = INDIAN_FEMALE_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FEMALE_FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const fullName = `${first} ${last}`;
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${custIndex}@aurathreads.in`;
        const phone = `+919${Math.floor(100000000 + Math.random() * 900000000)}`;
        
        // Exact purchase count generation to keep stats aligned
        let purchaseCount = spec.avgPurchases;
        if (spec.name === "New Signups") {
          // 60% have 1 purchase, 40% have 2 purchases (adds up to 300 orders across 180 customers)
          purchaseCount = Math.random() < 0.6 ? 1 : 2;
        } else if (spec.name === "Slipping Away") {
          // Distribute around 3: [2, 3, 4]
          purchaseCount = 2 + Math.floor(Math.random() * 3);
        } else if (spec.name === "High-Value Inactive") {
          // Distribute around 7: [5, 6, 7, 8, 9]
          purchaseCount = 5 + Math.floor(Math.random() * 5);
        } else {
          // Loyalists: Distribute around 10: [8, 9, 10, 11, 12]
          purchaseCount = 8 + Math.floor(Math.random() * 5);
        }

        // Calculate LTV based on purchase count and average item price
        let ltv = 0;
        const customerOrders: any[] = [];
        
        for (let o = 0; o < purchaseCount; o++) {
          const productItem = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
          const amount = productItem.price;
          ltv += amount;

          // Date distribution (over the last 1.5 years)
          const daysAgo = Math.floor(Math.random() * 550);
          const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

          customerOrders.push({
            id: `ord_${ordIndex}`,
            customerId: `cust_${custIndex}`,
            customerName: fullName,
            amount,
            date,
            product: productItem.name,
            channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)]
          });
          ordIndex++;
        }

        // Coordinate cluster offset
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 150;
        const x = Math.round(spec.cx + Math.cos(angle) * dist);
        const y = Math.round(spec.cy + Math.sin(angle) * dist);

        // DNA Tags
        const dnaPool = ["Cotton Lover", "Instagram Shopper", "Anarkali Fan", "Festive Buyer", "Discount seeker", "WhatsApp Preferred", "Early Adopter", "High Spender"];
        const dna = dnaPool.sort(() => 0.5 - Math.random()).slice(0, 3);

        const customerDoc = {
          id: `cust_${custIndex}`,
          name: fullName,
          email,
          phone,
          segment: spec.name as any,
          ltv,
          churnRisk: Math.floor(spec.churnMin + Math.random() * (spec.churnMax - spec.churnMin)),
          churnTrend: spec.trend as any,
          purchaseCount,
          dna,
          preferredChannel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
          predictedNextPurchase: spec.name === "Loyalists" ? "Immediate" : spec.name === "New Signups" ? "14 Days" : "30 Days",
          predictedCategory: PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)].category,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + (custIndex * 200000) % 100000000000}?auto=format&fit=crop&w=100&h=100&q=80`,
          x,
          y
        };

        customers.push(customerDoc);
        orders.push(...customerOrders);
        custIndex++;
      }
    }

    // Write customers to DB in parallel chunks
    const custChunkSize = 100;
    for (let i = 0; i < customers.length; i += custChunkSize) {
      const chunk = customers.slice(i, i + custChunkSize);
      await Promise.all(chunk.map(cust => db.collection("customers").doc(cust.id).set(cust)));
    }
    console.log(`✅ Seeded ${customers.length} Customers`);

    // Write orders to DB in parallel chunks
    const ordChunkSize = 100;
    for (let i = 0; i < orders.length; i += ordChunkSize) {
      const chunk = orders.slice(i, i + ordChunkSize);
      await Promise.all(chunk.map(ord => db.collection("orders").doc(ord.id).set(ord)));
    }
    console.log(`✅ Seeded ${orders.length} Orders`);

    // ════════════════════════════════════════
    // 3. CAMPAIGNS (10)
    // ════════════════════════════════════════
    const campaigns = [
      {
        id: "camp_1",
        name: "Summer Cotton Kurtis Drop",
        goal: "Increase Repeat Purchases",
        description: "Launching premium breathable daily wear Kurtis collection on Instagram & WhatsApp.",
        channel: "WhatsApp" as const,
        status: "Completed" as const,
        sentCount: 800,
        deliveredCount: 785,
        openedCount: 720,
        clickedCount: 380,
        purchaseCount: 94,
        revenueGenerated: 122106,
        createdAt: "2026-05-01T10:00:00Z"
      },
      {
        id: "camp_2",
        name: "Diwali Festive Kurtas Spark",
        goal: "Increase VIP Revenue",
        description: "High-end silk Kurta collections with direct discount codes for VIP Loyalist segments.",
        channel: "Email" as const,
        status: "Completed" as const,
        sentCount: 120,
        deliveredCount: 120,
        openedCount: 98,
        clickedCount: 56,
        purchaseCount: 28,
        revenueGenerated: 61572,
        createdAt: "2026-05-15T09:00:00Z"
      },
      {
        id: "camp_3",
        name: "Instagram DM Leak Recovery",
        goal: "Recover Lost Revenue",
        description: "Re-engage checkout abandonment leads mapping to specific sizing blocks.",
        channel: "WhatsApp" as const,
        status: "Completed" as const,
        sentCount: 245,
        deliveredCount: 241,
        openedCount: 228,
        clickedCount: 112,
        purchaseCount: 48,
        revenueGenerated: 62352,
        createdAt: "2026-05-20T14:30:00Z"
      },
      {
        id: "camp_4",
        name: "Dormant VIP Win-back Loop",
        goal: "Reduce Churn",
        description: "WhatsApp activation voucher for VIP buyers inactive for 60+ days.",
        channel: "WhatsApp" as const,
        status: "Completed" as const,
        sentCount: 100,
        deliveredCount: 98,
        openedCount: 89,
        clickedCount: 45,
        purchaseCount: 18,
        revenueGenerated: 23382,
        createdAt: "2026-05-25T11:15:00Z"
      },
      {
        id: "camp_5",
        name: "New Signups Welcomer",
        goal: "Acquire New Customers",
        description: "Email onboarding sequence with ₹150 off first purchase.",
        channel: "Email" as const,
        status: "Running" as const,
        sentCount: 180,
        deliveredCount: 178,
        openedCount: 110,
        clickedCount: 52,
        purchaseCount: 15,
        revenueGenerated: 19485,
        createdAt: "2026-06-01T08:00:00Z"
      },
      {
        id: "camp_6",
        name: "Monsoon Kurtis Clearance",
        goal: "Increase Repeat Purchases",
        description: "SMS blast advertising 25% off end-of-season daily wear styles.",
        channel: "SMS" as const,
        status: "Draft" as const,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        purchaseCount: 0,
        revenueGenerated: 0,
        createdAt: "2026-06-09T17:00:00Z"
      },
      {
        id: "camp_7",
        name: "RCS Indigo Palazzo Spotlight",
        goal: "Increase Repeat Purchases",
        description: "Rich card RCS campaign featuring high-affinity Indigo Palazzo coordinates.",
        channel: "RCS" as const,
        status: "Draft" as const,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        purchaseCount: 0,
        revenueGenerated: 0,
        createdAt: "2026-06-10T12:00:00Z"
      },
      {
        id: "camp_8",
        name: "Cart Recovery SMS Loop",
        goal: "Recover Lost Revenue",
        description: "Automated SMS sequences triggered 4h post cart abandonment.",
        channel: "SMS" as const,
        status: "Running" as const,
        sentCount: 84,
        deliveredCount: 83,
        openedCount: 0,
        clickedCount: 12,
        purchaseCount: 4,
        revenueGenerated: 5196,
        createdAt: "2026-06-02T13:00:00Z"
      },
      {
        id: "camp_9",
        name: "Micro-Influencer Reel Promo",
        goal: "Acquire New Customers",
        description: "Countering StyleKart Micro Reels with direct Instagram checkout vouchers.",
        channel: "WhatsApp" as const,
        status: "Completed" as const,
        sentCount: 300,
        deliveredCount: 295,
        openedCount: 260,
        clickedCount: 124,
        purchaseCount: 32,
        revenueGenerated: 41568,
        createdAt: "2026-05-18T16:00:00Z"
      },
      {
        id: "camp_10",
        name: "Pre-Festival Premium Trunk",
        goal: "Increase VIP Revenue",
        description: "Invite-only trunk show previews for VIP buyers.",
        channel: "Email" as const,
        status: "Completed" as const,
        sentCount: 80,
        deliveredCount: 80,
        openedCount: 71,
        clickedCount: 42,
        purchaseCount: 16,
        revenueGenerated: 35184,
        createdAt: "2026-05-22T10:00:00Z"
      }
    ];

    for (const camp of campaigns) {
      await db.collection("campaigns").doc(camp.id).set(camp);
    }
    console.log("✅ Seeded 10 Campaigns");

    // ════════════════════════════════════════
    // 4. OPPORTUNITIES (20)
    // ════════════════════════════════════════
    const opportunitiesList = [
      {
        id: "opp_1",
        title: "Abandoned Cart Recovery",
        type: "Lead",
        description: "34 checkout nodes left items in Kurtis checkouts.",
        potentialRevenue: 44166,
        confidence: 91,
        audienceSize: 34,
        priorityScore: 95,
        recommendedAction: "Recover Lost Revenue",
        reasoning: "Pragya discovered a 34% leak rate during checkout sizes selection. Direct WhatsApp links can recover 30% of this revenue.",
        color: "Yellow",
        angle: 45,
        distance: 65
      },
      {
        id: "opp_2",
        title: "Inactive VIP Customers",
        type: "Inactive",
        description: "Re-engage top VIP spenders showing zero orders for 60+ days.",
        potentialRevenue: 64950,
        confidence: 88,
        audienceSize: 50,
        priorityScore: 88,
        recommendedAction: "Reduce Customer Churn",
        reasoning: "VIP buyers have churn risk indices over 70% due to seasonal dormancy. Reach them with silk Kurti exclusive vouchers.",
        color: "Purple",
        angle: 160,
        distance: 80
      },
      {
        id: "opp_3",
        title: "Cross-Sell Opportunities",
        type: "VIP",
        description: "Expose palazzo sets to Kurti-only repeat buyers.",
        potentialRevenue: 78540,
        confidence: 94,
        audienceSize: 60,
        priorityScore: 92,
        recommendedAction: "Increase Customer LTV",
        reasoning: "Kurti buyers have high affinity coordinate sets. Khoj forecasts 4.2x ROI by introducing Palazzo Set bundle catalogs.",
        color: "Green",
        angle: 290,
        distance: 45
      },
      {
        id: "opp_4",
        title: "Repeat Purchase Promotion",
        type: "Lead",
        description: "Recommend next purchase to first-time shoppers at day 14.",
        potentialRevenue: 32475,
        confidence: 85,
        audienceSize: 25,
        priorityScore: 85,
        recommendedAction: "Increase Repeat Purchases",
        reasoning: "New buyers show high purchase intent decay 14 days after delivery. Direct discount codes drive conversion repeat loops.",
        color: "Purple",
        angle: 110,
        distance: 35
      },
      {
        id: "opp_5",
        title: "Seasonal Festival Demand",
        type: "Prospect",
        description: "Capture upcoming festive buy surge on Instagram DMs.",
        potentialRevenue: 95000,
        confidence: 89,
        audienceSize: 120,
        priorityScore: 90,
        recommendedAction: "Acquire New Customers",
        reasoning: "Diwali shopping search volume spikes 4.2x in kurtis. Deploy high-fidelity RCS catalog drops.",
        color: "Green",
        angle: 30,
        distance: 55
      }
    ];

    // Generate remaining 15 opportunities procedurally to make 20 total
    const categories: ("Lead" | "Inactive" | "VIP" | "Prospect")[] = ["Lead", "Inactive", "VIP", "Prospect"];
    const actions: ("Recover Lost Revenue" | "Reduce Customer Churn" | "Increase Customer LTV" | "Acquire New Customers" | "Increase Repeat Purchases")[] = [
      "Recover Lost Revenue", "Reduce Customer Churn", "Increase Customer LTV", "Acquire New Customers"
    ];
    const colors: ("Red" | "Yellow" | "Green" | "Purple")[] = ["Red", "Yellow", "Green", "Purple"];
    
    for (let k = 6; k <= 20; k++) {
      const type = categories[k % categories.length];
      const recAction = actions[k % actions.length];
      const color = colors[k % colors.length];
      const size = 10 + Math.floor(Math.random() * 80);
      const rev = size * 1299;
      
      opportunitiesList.push({
        id: `opp_${k}`,
        title: `Opportunity Node ID: ${k} (${type})`,
        type,
        description: `Procedural monitoring channel flag ${k} tracking ${size} targets.`,
        potentialRevenue: rev,
        confidence: 75 + Math.floor(Math.random() * 20),
        audienceSize: size,
        priorityScore: 60 + Math.floor(Math.random() * 35),
        recommendedAction: recAction as any,
        reasoning: `Pragya identified signal matching group parameters. Recommended channel matching target coordinates.`,
        color,
        angle: Math.floor(Math.random() * 360),
        distance: 20 + Math.floor(Math.random() * 75)
      });
    }

    for (const opp of opportunitiesList) {
      await db.collection("opportunities").doc(opp.id).set({
        ...opp,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("✅ Seeded 20 Opportunities");

    // ════════════════════════════════════════
    // 5. MISSIONS (15)
    // ════════════════════════════════════════
    const missionsList = [
      {
        id: "miss_1",
        goal: "Increase Repeat Purchases",
        status: "Completed",
        progress: 100,
        roi: 4.8,
        createdAt: "2026-05-01T10:00:00Z",
        Drishti: { segment: "Loyalists", explanation: "Targeting repeat Kurti buyers." },
        Pragya: { recoverableRevenue: 122106, recoveryConfidence: 94, explanation: "Pragya optimized checkouts." },
        Khoj: { predictedRoi: 4.8, predictedRevenue: 120000, explanation: "Khoj forecast correct." },
        recommendation: { summary: "Standard Whatsapp campaign.", confidenceScore: 94 }
      },
      {
        id: "miss_2",
        goal: "Recover Lost Leads",
        status: "Running",
        progress: 65,
        roi: 3.9,
        createdAt: "2026-06-02T13:00:00Z",
        Drishti: { segment: "Slipping Away", explanation: "Targeting cart abandoners." },
        Pragya: { recoverableRevenue: 44166, recoveryConfidence: 91, explanation: "Detected cart leaks." },
        Khoj: { predictedRoi: 3.9, predictedRevenue: 40000, explanation: "Conversion projections active." },
        recommendation: { summary: "Cart recovery sequences.", confidenceScore: 91 }
      }
    ];

    // Procedural generation of 13 other missions
    const statusTypes = ["Completed", "Running", "Queued"];
    const missionGoals = [
      "Increase Repeat Purchases", "Recover Lost Leads", "Launch Summer Collection", 
      "Reduce Churn", "Increase VIP Revenue", "Acquire Instagram Followers", "Reward Loyalty Segment"
    ];

    for (let mIndex = 3; mIndex <= 15; mIndex++) {
      const status = statusTypes[mIndex % statusTypes.length];
      const goal = missionGoals[mIndex % missionGoals.length];
      const progress = status === "Completed" ? 100 : status === "Running" ? 20 + Math.floor(Math.random() * 60) : 0;
      const daysAgo = 10 + mIndex;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      
      missionsList.push({
        id: `miss_${mIndex}`,
        goal,
        status,
        progress,
        roi: parseFloat((2.5 + Math.random() * 3).toFixed(1)),
        createdAt,
        Drishti: { segment: "Loyalists", explanation: "Drishti mapped coordinate nodes." },
        Pragya: { recoverableRevenue: 15000 * mIndex, recoveryConfidence: 85, explanation: "Pragya audited leakage nodes." },
        Khoj: { predictedRoi: 3.2, predictedRevenue: 18000 * mIndex, explanation: "Khoj computed conversion loops." },
        recommendation: { summary: "Run autonomous directives via selected channel.", confidenceScore: 85 }
      });
    }

    for (const miss of missionsList) {
      await db.collection("missions").doc(miss.id).set(miss);
      // Write mission update to track timeline
      await db.collection("mission_updates").add({
        missionId: miss.id,
        status: miss.status,
        timestamp: miss.createdAt
      });
    }
    console.log("✅ Seeded 15 Missions");

    // ════════════════════════════════════════
    // 6. AGENT LOGS (30)
    // ════════════════════════════════════════
    const agentsList: ("System" | "Drishti" | "Rachna" | "Khoj" | "Saarthi" | "Pragya")[] = [
      "System", "Drishti", "Pragya", "Khoj", "Rachna", "Saarthi"
    ];
    
    const messagesPool = [
      "[Drishti] Segmenting Indian female buyers. Group A matches Kurti preferences.",
      "[Pragya] Scanning billing gateways. Identified 12% cart leakage on checkout screen.",
      "[Khoj] Projections locked. Expected conversion yields: 24% under current WhatsApp template.",
      "[Rachna] Copy draft finished: 'Hey Priya, get 15% off Swadeshi Kurtis today!'.",
      "[Saarthi] Queuing dispatch hooks. Target: 10:30 AM Tuesday peak opens.",
      "[System] Syncing cognitive registers with Firestore database.",
      "[Drishti] 120 repeat buyers show early affinity toward Chanderi palazzo sets.",
      "[Pragya] Instagram checkout leak alert: 34 nodes left baskets active.",
      "[Khoj] ROI evaluation: 4.8x baseline yields on early VIP invite triggers.",
      "[Rachna] Drafted RCS rich template with cotton kurti catalog images.",
      "[Saarthi] Webhooks verified. Direct checkout API online and responsive.",
      "[System] Operational network metrics nominal. Latency: 5ms.",
      "[Drishti] Alert: Slipping VIP segment churn score has climbed by 4.2%.",
      "[Pragya] Recoverable revenue potential from dormant VIPs: ₹65,000.",
      "[Khoj] Forecast: Churn reduction campaign projects ₹35,000 in saved value.",
      "[Rachna] Direct WhatsApp interactive copy armed. CTA: Shop Kurtis.",
      "[Saarthi] Webhook dispatch channels routing complete.",
      "[System] Calibrating boardroom consensus vectors."
    ];

    for (let logI = 1; logI <= 30; logI++) {
      const agent = agentsList[logI % agentsList.length];
      const message = messagesPool[logI % messagesPool.length];
      const typesList: ("thought" | "action" | "chat" | "result")[] = ["thought", "action", "chat", "result"];
      const type = typesList[logI % typesList.length];
      const minAgo = 60 * 24 - logI * 15;
      const ts = new Date(Date.now() - minAgo * 60 * 1000).toISOString();
      
      const logDoc = {
        id: `log_${logI}`,
        agent,
        timestamp: new Date(ts).toLocaleTimeString(),
        message,
        type,
        createdAt: ts
      };
      await db.collection("agent_logs").doc(logDoc.id).set(logDoc);
    }
    console.log("✅ Seeded 30 Agent Logs");

    // ════════════════════════════════════════
    // 7. FUTURE SIMULATIONS (10)
    // ════════════════════════════════════════
    for (let simI = 1; simI <= 10; simI++) {
      const simDoc = {
        id: `sim_${simI}`,
        discount: 10 + simI * 2,
        channel: CHANNELS[simI % CHANNELS.length],
        audience: "Loyalists",
        createdAt: new Date(Date.now() - simI * 24 * 60 * 60 * 1000).toISOString(),
        conservative: {
          conversionRate: parseFloat((1.5 + simI * 0.2).toFixed(1)),
          revenue: Math.round(15000 * simI),
          roi: parseFloat((1.8 + simI * 0.1).toFixed(1)),
          customerFatigue: "Low",
          optOutRate: 0.3
        },
        recommended: {
          conversionRate: parseFloat((4.2 + simI * 0.3).toFixed(1)),
          revenue: Math.round(35000 * simI),
          roi: parseFloat((4.2 + simI * 0.2).toFixed(1)),
          customerFatigue: "Medium",
          optOutRate: 0.8
        },
        aggressive: {
          conversionRate: parseFloat((6.8 + simI * 0.4).toFixed(1)),
          revenue: Math.round(55000 * simI),
          roi: parseFloat((3.6 + simI * 0.15).toFixed(1)),
          customerFatigue: "High",
          optOutRate: 2.1
        }
      };
      await db.collection("simulations").doc(simDoc.id).set(simDoc);
    }
    console.log("✅ Seeded 10 Future Simulations");

    // ════════════════════════════════════════
    // 8. COMPETITORS (5)
    // ════════════════════════════════════════
    const competitorsList = [
      { id: "comp_1", name: "FashionHub",   abbr: "FH", followerGrowth: "+14.2%", engagementRate: "4.8%", campaignActivity: "High" as const,   newProducts: 12, promoStatus: "Diwali Sale Active",  threat: "red" as const,    threatLabel: "Threat",      marketShare: 28, topChannel: "Instagram" },
      { id: "comp_2", name: "StyleKart",    abbr: "SK", followerGrowth: "+8.7%",  engagementRate: "3.2%", campaignActivity: "Medium" as const, newProducts: 6,  promoStatus: "Flash Sale Weekly",   threat: "yellow" as const, threatLabel: "Monitor",     marketShare: 19, topChannel: "WhatsApp" },
      { id: "comp_3", name: "TrendWear",    abbr: "TW", followerGrowth: "+5.1%",  engagementRate: "2.9%", campaignActivity: "Low" as const,    newProducts: 3,  promoStatus: "Clearance Running",   threat: "green" as const,  threatLabel: "Opportunity", marketShare: 12, topChannel: "Email" },
      { id: "comp_4", name: "UrbanLooks",   abbr: "UL", followerGrowth: "+11.3%", engagementRate: "5.4%", campaignActivity: "High" as const,   newProducts: 9,  promoStatus: "Influencer Collab",   threat: "red" as const,    threatLabel: "Threat",      marketShare: 22, topChannel: "Reels" },
      { id: "comp_5", name: "Elite Closet", abbr: "EC", followerGrowth: "+3.2%",  engagementRate: "1.8%", campaignActivity: "Low" as const,    newProducts: 2,  promoStatus: "No Active Promo",     threat: "green" as const,  threatLabel: "Opportunity", marketShare: 8,  topChannel: "SMS" }
    ];

    for (const comp of competitorsList) {
      await db.collection("competitors").doc(comp.id).set(comp);
    }
    console.log("✅ Seeded 5 Competitors");

    // ════════════════════════════════════════
    // 9. LIVE MARKET SIGNALS (6)
    // ════════════════════════════════════════
    const marketSignals = [
      { id: "sig_1", title: "FashionHub launched a Diwali Kurta Sale", desc: "Aggressive 40% discount blast via WhatsApp and Reels. Engagement spiked 42% in 24 hours.", impact: 91, confidence: 88, agent: "Drishti", agentColor: "#3B82F6", type: "threat" as const, trend: "up" as const },
      { id: "sig_2", title: "Kurti reels engagement up 2.4x industry-wide", desc: "Short-form video showcasing palazzo coordinate sets outperforms static catalog posts.", impact: 84, confidence: 92, agent: "Khoj", agentColor: "#8B5CF6", type: "opportunity" as const, trend: "up" as const },
      { id: "sig_3", title: "Instagram DM shopping cart checkout leaks fell 8%", desc: "Direct payment links in Instagram chats increased checkout yields by 8%.", impact: 76, confidence: 85, agent: "Pragya", agentColor: "#EC4899", type: "opportunity" as const, trend: "up" as const },
      { id: "sig_4", title: "Aura Threads WhatsApp unsubscribe rates rose 1.2%", desc: "Dormant users reporting message fatigue due to repeated static clearances.", impact: 88, confidence: 90, agent: "Khoj", agentColor: "#8B5CF6", type: "threat" as const, trend: "up" as const },
      { id: "sig_5", title: "Limited-time Kurtis vouchers conversion rate rose 38%", desc: "Customers converted 38% faster when countdown timers were added to landing pages.", impact: 79, confidence: 87, agent: "Rachna", agentColor: "#F59E0B", type: "opportunity" as const, trend: "up" as const },
      { id: "sig_6", title: "StyleKart launched micro-influencer product drops", desc: "Tapping nano-influencers in Mumbai and Delhi for kurti style hauls, driving high web traffic.", impact: 72, confidence: 83, agent: "Saarthi", agentColor: "#22C55E", type: "threat" as const, trend: "up" as const }
    ];

    for (const sig of marketSignals) {
      await db.collection("market_signals").doc(sig.id).set(sig);
    }
    console.log("✅ Seeded 6 Market Signals");

    // ════════════════════════════════════════
    // 10. INDUSTRY TRENDS (7)
    // ════════════════════════════════════════
    const industryTrends = [
      { id: "trend_1", label: "Short Video Reels", score: 94, growth: "+34% YoY", revenue: "₹12L potential", difficulty: "Medium" as const, color: "#3B82F6", x: 380, y: 180, vx: 0.3, vy: -0.2 },
      { id: "trend_2", label: "Festival Buying Surge", score: 89, growth: "+28% YoY", revenue: "₹28L potential", difficulty: "Low" as const, color: "#F59E0B", x: 220, y: 280, vx: -0.2, vy: 0.3 },
      { id: "trend_3", label: "WhatsApp Commerce", score: 92, growth: "+41% YoY", revenue: "₹34L potential", difficulty: "Low" as const, color: "#22C55E", x: 480, y: 320, vx: 0.2, vy: 0.2 },
      { id: "trend_4", label: "Influencer Kurti Hauls", score: 78, growth: "+22% YoY", revenue: "₹9L potential", difficulty: "Medium" as const, color: "#EC4899", x: 160, y: 140, vx: 0.15, vy: 0.25 },
      { id: "trend_5", label: "UGC Styling Guides", score: 71, growth: "+19% YoY", revenue: "₹6L potential", difficulty: "Low" as const, color: "#8B5CF6", x: 560, y: 160, vx: -0.3, vy: 0.1 },
      { id: "trend_6", label: "Interactive RCS Catalogs", score: 86, growth: "+31% YoY", revenue: "₹18L potential", difficulty: "Low" as const, color: "#EF4444", x: 320, y: 360, vx: 0.1, vy: -0.3 },
      { id: "trend_7", label: "Zero-Friction Cart Links", score: 67, growth: "+58% YoY", revenue: "₹7L potential", difficulty: "High" as const, color: "#06B6D4", x: 440, y: 100, vx: -0.2, vy: -0.2 }
    ];

    for (const tr of industryTrends) {
      await db.collection("industry_trends").doc(tr.id).set(tr);
    }
    console.log("✅ Seeded 7 Industry Trends");

    // ════════════════════════════════════════
    // 11. PRODUCTS (10)
    // ════════════════════════════════════════
    for (let pI = 0; pI < PRODUCTS.length; pI++) {
      const p = PRODUCTS[pI];
      await db.collection("products").doc(`prod_${pI + 1}`).set({
        id: `prod_${pI + 1}`,
        name: p.name,
        category: p.category,
        price: p.price,
        salesCount: 50 + Math.floor(Math.random() * 400)
      });
    }
    console.log("✅ Seeded 10 Products");

    // ════════════════════════════════════════
    // 12. SEASONAL EVENTS (5)
    // ════════════════════════════════════════
    const seasonalEvents = [
      { id: "event_1", name: "Diwali Festive Blast", date: "2026-11-05", daysLeft: 148, channel: "WhatsApp", projectedRevenue: 150000 },
      { id: "event_2", name: "Monsoon Kurtis Clearance", date: "2026-07-15", daysLeft: 35, channel: "SMS", projectedRevenue: 60000 },
      { id: "event_3", name: "Raksha Bandhan Gifting", date: "2026-08-28", daysLeft: 79, channel: "WhatsApp", projectedRevenue: 95000 },
      { id: "event_4", name: "Independence Day Sale", date: "2026-08-15", daysLeft: 66, channel: "Email", projectedRevenue: 75000 },
      { id: "event_5", name: "Dussehra Collection Reveal", date: "2026-10-20", daysLeft: 132, channel: "RCS", projectedRevenue: 110000 }
    ];

    for (const ev of seasonalEvents) {
      await db.collection("seasonal_events").doc(ev.id).set(ev);
    }
    console.log("✅ Seeded 5 Seasonal Events");

    // ════════════════════════════════════════
    // 13. SOCIAL INSIGHTS (5)
    // ════════════════════════════════════════
    const socialInsights = [
      { id: "soc_1", topic: "Kurti Size Fit Queries", sentiment: "Negative" as const, volume: 154, growth: "+24% this week" },
      { id: "soc_2", topic: "Pastel Kurtas Hype", sentiment: "Positive" as const, volume: 432, growth: "+68% this week" },
      { id: "soc_3", topic: "Cotton Palazzo Comfort", sentiment: "Positive" as const, volume: 284, growth: "+42% this week" },
      { id: "soc_4", topic: "Instagram DM checkout delays", sentiment: "Negative" as const, volume: 98, growth: "+12% this week" },
      { id: "soc_5", topic: "Aura Threads Swadeshi collection", sentiment: "Positive" as const, volume: 512, growth: "+95% this week" }
    ];

    for (const soc of socialInsights) {
      await db.collection("social_insights").doc(soc.id).set(soc);
    }
    console.log("✅ Seeded 5 Social Insights");

    // ════════════════════════════════════════
    // 14. ANALYTICS SNAPSHOTS (30 days)
    // ════════════════════════════════════════
    console.log("⏳ Generating 30 days of analytics trends...");
    for (let day = 30; day >= 1; day--) {
      const dateVal = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
      const dateStr = dateVal.toISOString().split("T")[0];
      const docId = `an_${dateStr}`;
      
      // Let's create a curve with weekly peaks and overall positive trajectory
      const weekday = dateVal.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = weekday === 0 || weekday === 6;
      const baseRev = 7000 + (30 - day) * 100; // growing over time
      const revenue = Math.round(baseRev * (isWeekend ? 1.4 : 1.0) * (0.9 + Math.random() * 0.2));
      const purchases = Math.round(revenue / 1299);
      const conversionRate = parseFloat((8.5 + (30 - day) * 0.1 + (isWeekend ? 2.5 : 0) + Math.random() * 2).toFixed(1));

      const analyticsDoc = {
        date: dateStr,
        revenue,
        purchases,
        conversionRate,
        createdAt: dateVal.toISOString()
      };
      await db.collection("analytics").doc(docId).set(analyticsDoc);
    }
    console.log("✅ Seeded 30 Analytics Snapshots");

    console.log("🎉 FIRESTORE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("Ready for Manthan.ai: 500 customers, 2500 orders, campaigns, logs, simulations, and market signals mapped.");
  } catch (err: any) {
    console.error("❌ Firestore Seeding failed:", err.message || err);
  }
}

seed();
