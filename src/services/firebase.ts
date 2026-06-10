import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const defaultFirebaseConfig = {
  apiKey: "AIzaSyAZgKPUAF7NuZH1jkWIeXaTXycMIJ-l5zA",
  authDomain: "login-page-144f8.firebaseapp.com",
  databaseURL: "https://login-page-144f8-default-rtdb.firebaseio.com",
  projectId: "login-page-144f8",
  storageBucket: "login-page-144f8.firebasestorage.app",
  messagingSenderId: "672015601724",
  appId: "1:672015601724:web:69d5421b6863b79c52f339",
  measurementId: "G-2BD81KSQ4Z"
};

// Initialize default Firebase App
const app = getApps().length === 0 ? initializeApp(defaultFirebaseConfig) : getApp();
export const auth = getAuth(app);

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

  if (!apiKey || !projectId) {
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
        firestoreInstance = getFirestore(app);
      }
    }
    return firestoreInstance;
  } catch (error) {
    console.error("Failed to initialize Firebase/Firestore:", error);
    return null;
  }
}
