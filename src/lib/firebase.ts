
"use client";

import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

export const firebaseConfig: FirebaseOptions = {
  "projectId": "pabnamart",
  "appId": "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
  "storageBucket": "pabnamart.appspot.com",
  "apiKey": "AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk",
  "authDomain": "pabnamart.firebaseapp.com",
  "messagingSenderId": "600614180848"
};

function createFirebaseApp(config: FirebaseOptions): FirebaseApp {
    if (getApps().length > 0) {
        return getApp();
    }

    return initializeApp(config);
}

const app: FirebaseApp = createFirebaseApp(firebaseConfig);

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
