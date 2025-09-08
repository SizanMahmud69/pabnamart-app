
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

if (typeof window !== 'undefined' && app.options.projectId) {
    try {
        messagingInstance = getMessaging(app);
    } catch (e) {
        console.error("Failed to initialize Firebase Messaging", e);
    }
}

export const messaging = messagingInstance;
export default app;
