
// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker with the shared config
const urlParams = new URLSearchParams(location.search);
const firebaseConfig = Object.fromEntries(urlParams.entries());

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png',
    image: payload.notification.image || null
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
