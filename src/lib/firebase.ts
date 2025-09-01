
"use client";

import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';
import { useEffect } from 'react';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk",
  authDomain: "pabnamart.firebaseapp.com",
  projectId: "pabnamart",
  storageBucket: "pabnamart.appspot.com",
  messagingSenderId: "600614180848",
  appId: "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;

// Function to register the service worker
export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const firebaseConfigParams = new URLSearchParams(
      Object.entries(firebaseConfig).reduce((acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    
    navigator.serviceWorker.register(`/firebase-messaging-sw.js?${firebaseConfigParams}`, { scope: '/' })
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
};

// A component that handles service worker registration on the client side
export const FirebaseMessagingProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <>{children}</>;
};


export default app;
