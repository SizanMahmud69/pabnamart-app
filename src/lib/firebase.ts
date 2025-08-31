import { initializeApp, getApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk",
  authDomain: "pabnamart.firebaseapp.com",
  projectId: "pabnamart",
  storageBucket: "pabnamart.appspot.com",
  messagingSenderId: "600614180848",
  appId: "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Add your measurement ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;

export default app;
