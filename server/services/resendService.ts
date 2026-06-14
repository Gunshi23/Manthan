import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "../config/resend";
import { db } from "../config/firebase";
import { Recipient } from "./twilioService";

// Check if Resend configured
const isResendConfigured = !!(RESEND_API_KEY && !RESEND_API_KEY.startsWith("placeholder") && RESEND_API_KEY !== "");

/**
 * Sends a single email via Resend API (or mock).
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId: string; simulated?: boolean; error?: string }> {
  try {
    const cleanTo = to.trim();

    // Map mock galaxy.net emails to real email for sandbox convenience if needed
    let recipientEmail = cleanTo;
    if (recipientEmail.endsWith("@galaxy.net")) {
      recipientEmail = "gunshikaagarwaldpr@gmail.com";
    }

    if (isResendConfigured) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: recipientEmail,
          subject: subject,
          html: body.replace(/\n/g, "<br>")
        })
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        return { success: false, messageId: "", error: errorData?.message || "Resend sending failed" };
      }

      const responseData = await response.json() as any;
      return { success: true, messageId: responseData?.id || "" };
    } else {
      // simulated mode
      const simulatedId = `re_sim_${Math.random().toString(36).substring(2, 11)}`;
      console.log(`[Resend Mock Email] Sent to: ${recipientEmail} | Subject: "${subject}" | SID: ${simulatedId}`);
      return { success: true, messageId: simulatedId, simulated: true };
    }
  } catch (err: any) {
    console.error("Resend sendEmail error:", err);
    return { success: false, messageId: "", error: err.message || "Resend sending failed" };
  }
}

/**
 * Dispatches an Email campaign and logs detailed records in Firestore collection: campaigns
 */
export async function sendCampaignEmail(
  campaignId: string,
  missionId: string,
  recipients: Recipient[],
  subject: string,
  templateBody: string
): Promise<{ success: boolean; dispatchedCount: number; failedCount: number }> {
  let dispatchedCount = 0;
  let failedCount = 0;

  console.log(`Launching Resend Email Campaign ${campaignId} to ${recipients.length} recipients...`);

  // Write initial campaign collection entry if DB is set
  try {
    await db.collection("campaigns").doc(campaignId).set({
      missionId,
      id: campaignId,
      name: `${missionId} - Email Loop`,
      channel: "Email",
      status: "Sending",
      audienceSize: recipients.length,
      createdAt: new Date().toISOString(),
      sentCount: recipients.length,
      deliveredCount: 0,
      failedCount: 0,
      openedCount: 0,
      clickedCount: 0,
      purchaseCount: 0,
      revenueGenerated: 0
    });
  } catch (err) {
    console.warn("Failed to create campaign record in Firestore:", err);
  }

  // Loop recipients and send
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const email = recipient.email || "";
    if (!email) {
      failedCount++;
      continue;
    }

    const personalizedMessage = templateBody.replace(/\{\{name\}\}/gi, recipient.name);
    
    // Dispatch
    const res = await sendEmail(email, subject, personalizedMessage);
    
    if (res.success) {
      dispatchedCount++;
    } else {
      failedCount++;
    }

    // Update individual recipient dispatch stats
    try {
      await db.collection("campaign_dispatches").add({
        campaignId,
        recipient: recipient.name,
        email,
        messageId: res.messageId,
        status: res.success ? "Delivered" : "Failed",
        error: res.error || null,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // ignore
    }
  }

  // Update final status
  const finalStatus = failedCount === recipients.length ? "Failed" : "Completed";
  try {
    await db.collection("campaigns").doc(campaignId).update({
      status: finalStatus,
      deliveredCount: dispatchedCount,
      failedCount: failedCount,
      completedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to finalize campaign record in Firestore:", err);
  }

  return {
    success: dispatchedCount > 0,
    dispatchedCount,
    failedCount
  };
}
