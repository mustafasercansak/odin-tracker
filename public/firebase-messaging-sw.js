importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These values will be replaced or used from global config
firebase.initializeApp({
  apiKey: "REPLACED_BY_BUILD",
  authDomain: "REPLACED_BY_BUILD",
  projectId: "REPLACED_BY_BUILD",
  storageBucket: "REPLACED_BY_BUILD",
  messagingSenderId: "REPLACED_BY_BUILD",
  appId: "REPLACED_BY_BUILD"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
