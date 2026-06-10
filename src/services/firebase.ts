import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize default Firebase App safely
let app: any;
let auth: any;

try {
  if (defaultFirebaseConfig.apiKey && defaultFirebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(defaultFirebaseConfig) : getApp();
    auth = getAuth(app);
  } else {
    console.warn("Firebase credentials are not configured. Running with fallback mock authentication.");
    // Dummy config to prevent firebase SDK crash during startup
    const dummyConfig = {
      apiKey: "placeholder-api-key",
      authDomain: "placeholder-auth-domain",
      projectId: "placeholder-project-id"
    };
    app = getApps().length === 0 ? initializeApp(dummyConfig) : getApp();
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    },
    signOut: async () => {}
  } as any;
}

export { auth };

interface FirebaseConfig {
  firebaseKey?: string;
  firebaseProjectId?: string;
}

let firestoreInstance: Firestore | null = null;

/**
 * Get the Firestore database instance if credentials are configured.
 * Otherwise, falls back to the default application configuration credentials.
 */
export function getDb(config?: FirebaseConfig): Firestore | null {
  const apiKey = config?.firebaseKey || defaultFirebaseConfig.apiKey;
  const projectId = config?.firebaseProjectId || defaultFirebaseConfig.projectId;

  if (!apiKey || !projectId || apiKey === "placeholder-api-key" || apiKey === "") {
    return null;
  }

  try {
    if (!firestoreInstance) {
      // If we need a custom project (different from auth), check if another app is needed
      if (projectId !== defaultFirebaseConfig.projectId) {
        const appName = `custom-${projectId}`;
        const customApp = getApps().find(a => a.name === appName) || initializeApp({
          apiKey,
          authDomain: `${projectId}.firebaseapp.com`,
          projectId,
          storageBucket: `${projectId}.appspot.com`,
        }, appName);
        firestoreInstance = getFirestore(customApp);
      } else {
        if (app && defaultFirebaseConfig.apiKey !== "placeholder-api-key") {
          firestoreInstance = getFirestore(app);
        } else {
          return null;
        }
      }
    }
    return firestoreInstance;
  } catch (error) {
    console.error("Failed to initialize Firebase/Firestore:", error);
    return null;
  }
}
