// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

// Start Firebase
const app = initializeApp(firebaseConfig);

if (import.meta.env.DEV) {
  console.info("[Firebase] Running in development mode");
  console.debug("[Firebase] Configuration", {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId
  });
}

const FIRESTORE_DATABASE_ID = import.meta.env.VITE_FIRESTORE_DATABASE || "(default)";

// Export the Firestore database (you can target a multi-database instance by setting VITE_FIRESTORE_DATABASE)
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
