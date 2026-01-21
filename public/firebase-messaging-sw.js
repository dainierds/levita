importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
    apiKey: "ignored-in-sw",
    authDomain: "ignored-in-sw",
    projectId: "ignored-in-sw",
    storageBucket: "ignored-in-sw",
    messagingSenderId: "172087532840", // Obtained from existing firebase.ts or environment
    appId: "ignored-in-sw",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png' // Ensure this icon exists
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
