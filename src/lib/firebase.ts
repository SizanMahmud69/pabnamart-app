import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyA_...Your_API_Key", // This is a placeholder, you should use your actual API key
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
