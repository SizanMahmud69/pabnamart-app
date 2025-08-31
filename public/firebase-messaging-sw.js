// This file must be in the public folder.

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration
// It's safe to expose this, as security is handled by Firebase rules
const firebaseConfig = {
  apiKey: "AIzaSyDlDx1lFR_B5M2mq_sLTZCfjrDLxY5pInk",
  authDomain: "pabnamart.firebaseapp.com",
  projectId: "pabnamart",
  storageBucket: "pabnamart.appspot.com",
  messagingSenderId: "600614180848",
  appId: "1:600614180848:web:6f4e21fb4f5b6cd42a6f35",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (payload.notification) {
    const notificationTitle = payload.notification.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification.body || 'You have a new message.',
      icon: payload.notification.icon || '/favicon.ico'
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
