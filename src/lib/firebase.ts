
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(): FirebaseApp | null {
    if (typeof window === 'undefined') {
        return null;
    }
    if (getApps().length > 0) {
        return getApp();
    }
    if (firebaseConfig.apiKey) {
        return initializeApp(firebaseConfig);
    }
    console.warn("Firebase API key is missing. Firebase will not be initialized.");
    return null;
}

const app = getFirebaseApp();
export const messaging = (typeof window !== 'undefined' && app) ? getMessaging(app) : null;
export default app;
