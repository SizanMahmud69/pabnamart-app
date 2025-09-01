
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = Object.fromEntries(urlParams.entries());

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title || "New Notification";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: payload.notification.icon || "/icons/icon-192x192.png", // Provide a default icon
    image: payload.notification.image,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
