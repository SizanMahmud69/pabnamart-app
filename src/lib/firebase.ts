import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk",
  authDomain: "pabnamart.firebaseapp.com",
  projectId: "pabnamart",
  storageBucket: "pabnamart.firebasestorage.app",
  messagingSenderId: "600614180848",
  appId: "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
  measurementId: ""
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
