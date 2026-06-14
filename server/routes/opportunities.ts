import { Router } from "express";
import { generateOpportunityRadar } from "../services/geminiService";
import { db } from "../config/firebase";

const router = Router();

router.get("/", async (req, res) => {
  try {
    // 1. Fetch raw data from Firestore
    let customersList: any[] = [];
    let campaignsList: any[] = [];
    let analyticsList: any[] = [];
    let brandDnaList: any[] = [];

    try {
      const custSnap = await db.collection("customers").get();
      custSnap.forEach((doc: any) => customersList.push(doc.data()));
    } catch (e) {
      console.warn("Failed to fetch customers for opportunities aggregation:", e);
    }

    try {
      const campSnap = await db.collection("campaigns").get();
      campSnap.forEach((doc: any) => campaignsList.push(doc.data()));
    } catch (e) {
      console.warn("Failed to fetch campaigns for opportunities aggregation:", e);
    }

    try {
      const analyticsSnap = await db.collection("analytics").get();
      analyticsSnap.forEach((doc: any) => analyticsList.push(doc.data()));
    } catch (e) {
      console.warn("Failed to fetch analytics for opportunities aggregation:", e);
    }

    try {
      const brandSnap = await db.collection("brand_dna").get();
      brandSnap.forEach((doc: any) => brandDnaList.push(doc.data()));
    } catch (e) {
      console.warn("Failed to fetch brand DNA for opportunities aggregation:", e);
    }

    // 2. Perform aggregation
    const totalCustomers = customersList.length;
    const segmentsCount: Record<string, number> = {
      "Loyalists": 0,
      "Slipping Away": 0,
      "High-Value Inactive": 0,
      "New Signups": 0
    };
    let totalCustomerLtv = 0;
    const vipSpenders: any[] = [];

    customersList.forEach(c => {
      if (c.segment && c.segment in segmentsCount) {
        segmentsCount[c.segment]++;
      }
      if (c.ltv) {
        totalCustomerLtv += c.ltv;
        if (c.ltv > 40000) {
          vipSpenders.push({ name: c.name, ltv: c.ltv, segment: c.segment, churnRisk: c.churnRisk });
        }
      }
    });

    const totalCampaigns = campaignsList.length;
    let totalCampaignRevenue = 0;
    campaignsList.forEach(c => {
      if (c.revenueGenerated) {
        totalCampaignRevenue += c.revenueGenerated;
      }
    });

    const brandDna = brandDnaList[0] || { businessType: "Fashion & Retail", growthStyle: "High Growth" };

    const summaryContext = {
      totalCustomers,
      segments: segmentsCount,
      totalCustomerLtv,
      vipSpendersCount: vipSpenders.length,
      vipSpenders,
      campaigns: {
        totalCampaigns,
        totalCampaignRevenue
      },
      brandDna: {
        businessType: brandDna.businessType,
        growthStyle: brandDna.growthStyle
      },
      recentAnalyticsCount: analyticsList.length
    };

    // 3. Generate opportunities via Gemini
    const result = await generateOpportunityRadar(summaryContext);
    const opportunities = result.opportunities || [];

    // 4. Save each opportunity to Firestore
    for (const opp of opportunities) {
      try {
        await db.collection("opportunities").doc(opp.id).set({
          ...opp,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn(`Failed to save opportunity ${opp.id} to Firestore:`, err);
      }
    }

    // Return the full structural payload
    res.status(200).json({
      totalPotentialRevenue: result.totalPotentialRevenue || 45600,
      highestPriority: result.highestPriority || "Abandoned Cart Recovery",
      opportunities
    });
  } catch (error: any) {
    console.error("Opportunities route error:", error);
    res.status(500).json({ error: error.message || "Failed to retrieve revenue opportunities" });
  }
});

export default router;
