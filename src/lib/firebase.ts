
"use client";

import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// It's okay for these values to be undefined during the build process
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if all keys are provided
const app = firebaseConfig.apiKey ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : null;

if (!app) {
    console.warn("Firebase config is missing or incomplete. Firebase will not be initialized.");
}


// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = (typeof window !== 'undefined' && app) ? getMessaging(app) : null;
export default app;
