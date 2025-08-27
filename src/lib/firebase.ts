import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "pabnamart.firebaseapp.com",
  projectId: "pabnamart",
  storageBucket: "pabnamart.appspot.com",
  messagingSenderId: "600614180848",
  appId: "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
  measurementId: "G-XXXXXXXXXX" // Optional: Add your measurement ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
