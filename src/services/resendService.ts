import { getDb } from "./firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";

interface FirebaseConfig {
  firebaseKey?: string;
  firebaseProjectId?: string;
}

interface Recipient {
  email: string;
  name: string;
}

/**
 * Sends a single Email via the backend Resend endpoint.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  resendKey?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: to.trim(), subject, body, resendKey }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText || `HTTP error ${response.status}` };
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error in sendEmail wrapper:", error);
    return { success: false, error: error.message || "Network request failed" };
  }
}

/**
 * Sends an Email campaign via Resend and updates Firestore logs.
 */
export async function sendEmailCampaign(
  missionId: string,
  campaignId: string,
  recipients: Recipient[],
  subject: string,
  templateBody: string,
  resendKey?: string,
  firebaseConfig?: FirebaseConfig,
  onProgress?: (
    index: number,
    status: "Queued" | "Sending" | "Delivered" | "Failed",
    info?: string
  ) => void
): Promise<{ success: boolean; dispatchedCount: number; failedCount: number }> {
  let dispatchedCount = 0;
  let failedCount = 0;

  const db = getDb(firebaseConfig);
  let firestoreDocId = "";

  if (db) {
    try {
      const docRef = await addDoc(collection(db, "campaigns"), {
        missionId,
        channel: "Email",
        status: "Queued",
        audienceSize: recipients.length,
        createdAt: new Date().toISOString(),
        messageId: campaignId,
      });
      firestoreDocId = docRef.id;
    } catch (err) {
      console.warn("Failed to create campaign activity document in Firestore:", err);
    }
  }

  // Log dispatch starting to updates channel
  await sendMissionUpdate(missionId, "Sending", firebaseConfig);

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const email = recipient.email;
    const personalizedMessage = templateBody.replace(/\{\{name\}\}/gi, recipient.name);

    if (onProgress) {
      onProgress(i, "Sending");
    }

    const res = await sendEmail(email, subject, personalizedMessage, resendKey);

    if (res.success) {
      dispatchedCount++;
      if (onProgress) {
        onProgress(i, "Delivered", res.messageId);
      }
    } else {
      failedCount++;
      if (onProgress) {
        onProgress(i, "Failed", res.error);
      }
    }
  }

  const finalStatus = failedCount === recipients.length ? "Failed" : "Delivered";
  if (db && firestoreDocId) {
    try {
      const campaignDoc = doc(db, "campaigns", firestoreDocId);
      await updateDoc(campaignDoc, {
        status: finalStatus,
        deliveredCount: dispatchedCount,
        failedCount: failedCount,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed to update campaign activity document in Firestore:", err);
    }
  }

  await sendMissionUpdate(missionId, finalStatus, firebaseConfig);

  return {
    success: dispatchedCount > 0,
    dispatchedCount,
    failedCount,
  };
}

export async function sendMissionUpdate(
  missionId: string,
  status: "Queued" | "Sending" | "Delivered" | "Failed",
  firebaseConfig?: FirebaseConfig
): Promise<void> {
  const db = getDb(firebaseConfig);
  if (!db) return;

  try {
    await addDoc(collection(db, "mission_updates"), {
      missionId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Failed to log mission update to Firestore:", err);
  }
}
