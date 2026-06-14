import { db } from "./config/firebase";

const customers = [
  { id: "cust_1", name: "Aarav Mehta", email: "aarav.mehta@galaxy.net", phone: "+919876543210", segment: "Loyalists", ltv: 45000, purchaseCount: 8, churnRisk: 12, churnTrend: "stable" },
  { id: "cust_2", name: "Ananya Sharma", email: "ananya.sharma@galaxy.net", phone: "+918979660550", segment: "Slipping Away", ltv: 32000, purchaseCount: 5, churnRisk: 78, churnTrend: "up" },
  { id: "cust_3", name: "Vihaan Patel", email: "vihaan.patel@galaxy.net", phone: "+919560123456", segment: "High-Value Inactive", ltv: 58000, purchaseCount: 11, churnRisk: 84, churnTrend: "up" },
  { id: "cust_4", name: "Diya Iyer", email: "diya.iyer@galaxy.net", phone: "+919810012345", segment: "New Signups", ltv: 0, purchaseCount: 0, churnRisk: 25, churnTrend: "stable" },
  { id: "cust_5", name: "Kabir Singh", email: "kabir.singh@galaxy.net", phone: "+919999012345", segment: "Loyalists", ltv: 38000, purchaseCount: 7, churnRisk: 18, churnTrend: "down" },
  { id: "cust_6", name: "Isha Gupta", email: "isha.gupta@galaxy.net", phone: "+919877112233", segment: "Slipping Away", ltv: 18000, purchaseCount: 3, churnRisk: 72, churnTrend: "up" },
  { id: "cust_7", name: "Arjun Reddy", email: "arjun.reddy@galaxy.net", phone: "+918800112233", segment: "High-Value Inactive", ltv: 62000, purchaseCount: 12, churnRisk: 80, churnTrend: "stable" },
  { id: "cust_8", name: "Riya Sen", email: "riya.sen@galaxy.net", phone: "+919955887766", segment: "New Signups", ltv: 1200, purchaseCount: 1, churnRisk: 30, churnTrend: "down" }
];

const campaigns = [
  {
    id: "camp_1",
    name: "Q2 Win-back Initiative",
    goal: "Reduce Churn",
    description: "Re-engage dormant premium accounts with custom credits drops.",
    channel: "WhatsApp",
    status: "Completed",
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
    channel: "Email",
    status: "Completed",
    sentCount: 430,
    deliveredCount: 428,
    openedCount: 310,
    clickedCount: 189,
    purchaseCount: 45,
    revenueGenerated: 82000,
    createdAt: "2026-05-28T09:15:00Z"
  }
];

const brandDna = {
  id: "dna_default",
  businessType: "Fashion & Apparel",
  growthStyle: "High Growth",
  customerUniverse: 1250,
  growthPotential: "High",
  orbitHealth: 88,
  recommendedMissions: [
    "Recover slipping Q2 buyers",
    "Launch premium checkout drops",
    "Scale VIP LTV thresholds"
  ],
  createdAt: new Date().toISOString()
};

const opportunities = [
  {
    id: "opp_1",
    title: "Dormant VIP Re-engagement",
    cohort: "High-Value Inactive",
    description: "Recover premium spenders inactive for 45+ days.",
    potentialRevenue: 32000,
    opportunityScore: 94,
    recommendedChannel: "WhatsApp",
    confidence: "High"
  },
  {
    id: "opp_2",
    title: "Cart Recovery Optimization",
    cohort: "Slipping Away",
    description: "Trigger automations on checkout leaks in the last 7 days.",
    potentialRevenue: 15400,
    opportunityScore: 88,
    recommendedChannel: "Email",
    confidence: "High"
  },
  {
    id: "opp_3",
    title: "Festive Cross-sell Campaign",
    cohort: "Loyalists",
    description: "Target repeat buyers with a festive collection early access.",
    potentialRevenue: 42000,
    opportunityScore: 85,
    recommendedChannel: "RCS",
    confidence: "Medium"
  }
];

const analytics = [
  { date: "2026-06-05", revenue: 24500, purchases: 18, conversionRate: 11.2 },
  { date: "2026-06-06", revenue: 32000, purchases: 24, conversionRate: 12.8 },
  { date: "2026-06-07", revenue: 28000, purchases: 20, conversionRate: 10.5 },
  { date: "2026-06-08", revenue: 41000, purchases: 31, conversionRate: 14.1 },
  { date: "2026-06-09", revenue: 38500, purchases: 29, conversionRate: 13.2 }
];

async function seed() {
  console.log("🌱 Seeding database with pre-populated Manthan data...");

  try {
    // 1. Seed brand DNA
    await db.collection("brand_dna").doc(brandDna.id).set(brandDna);
    console.log("✅ Seeded Brand DNA");

    // 2. Seed opportunities
    for (const opp of opportunities) {
      await db.collection("opportunities").doc(opp.id).set({
        ...opp,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("✅ Seeded Opportunities");

    // 3. Seed customers
    for (const cust of customers) {
      await db.collection("customers").doc(cust.id).set(cust);
    }
    console.log("✅ Seeded Customers");

    // 4. Seed campaigns
    for (const camp of campaigns) {
      await db.collection("campaigns").doc(camp.id).set(camp);
    }
    console.log("✅ Seeded Campaigns");

    // 5. Seed analytics
    for (const item of analytics) {
      const docId = "an_" + item.date;
      await db.collection("analytics").doc(docId).set({
        ...item,
        createdAt: new Date(item.date).toISOString()
      });
    }
    console.log("✅ Seeded Analytics Snapshots");

    console.log("🎉 Seeding complete! Database is now fully prepared.");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
}

seed();
