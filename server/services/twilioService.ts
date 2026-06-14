import twilio from "twilio";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } from "../config/twilio";
import { db } from "../config/firebase";

// Initialize twilio client if keys exist
let client: any = null;
const isTwilioConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);

if (isTwilioConfigured) {
  try {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log("Twilio client successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error);
  }
} else {
  console.warn("Twilio API keys missing from environment. WhatsApp runs in simulated mode.");
}

export interface Recipient {
  phone?: string;
  email?: string;
  name: string;
}

/**
 * Sends a single WhatsApp message.
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId: string; simulated?: boolean; error?: string }> {
  try {
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const formattedTo = cleanPhone.startsWith("whatsapp:") ? cleanPhone : `whatsapp:${cleanPhone}`;

    if (client) {
      const response = await client.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: formattedTo,
        body: message,
      });
      return { success: true, messageId: response.sid };
    } else {
      // simulated mode
      const simulatedSid = `SM_sim_${Math.random().toString(36).substring(2, 11)}`;
      console.log(`[Twilio Mock WhatsApp] Sent to: ${formattedTo} | Msg: "${message}" | SID: ${simulatedSid}`);
      return { success: true, messageId: simulatedSid, simulated: true };
    }
  } catch (err: any) {
    console.error("Twilio sendWhatsAppMessage error:", err);
    return { success: false, messageId: "", error: err.message || "Twilio sending failed" };
  }
}

/**
 * Dispatches a WhatsApp campaign and logs detailed records in Firestore collection: campaigns
 */
export async function sendCampaignWhatsApp(
  campaignId: string,
  missionId: string,
  recipients: Recipient[],
  templateBody: string
): Promise<{ success: boolean; dispatchedCount: number; failedCount: number }> {
  let dispatchedCount = 0;
  let failedCount = 0;

  console.log(`Launching Twilio WhatsApp Campaign ${campaignId} to ${recipients.length} recipients...`);

  // Write initial campaign collection entry if DB is set
  try {
    await db.collection("campaigns").doc(campaignId).set({
      missionId,
      id: campaignId,
      name: `${missionId} - WhatsApp Loop`,
      channel: "WhatsApp",
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
    const phone = recipient.phone || "";
    if (!phone) {
      failedCount++;
      continue;
    }

    const personalizedMessage = templateBody.replace(/\{\{name\}\}/gi, recipient.name);
    
    // Dispatch
    const res = await sendWhatsAppMessage(phone, personalizedMessage);
    
    // Log in database campaigns collections logs (or sub-collection, or inline array)
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
        phone,
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
