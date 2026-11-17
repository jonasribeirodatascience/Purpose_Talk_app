/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/13.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.3.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB_eyKVHMNNsLDUAJRO__t_wAKDhoDFzV0',
  authDomain: 'helical-monolith-hxq1s.firebaseapp.com',
  projectId: 'helical-monolith-hxq1s',
  storageBucket: 'helical-monolith-hxq1s.firebasestorage.app',
  messagingSenderId: '762119788256',
  appId: '1:762119788256:web:9d3d3648302e2c204ce285',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    (payload && payload.notification && payload.notification.title) ||
    (payload && payload.data && payload.data.title) ||
    'Purpose Talk · Sua streak está em risco!';
  const body =
    (payload && payload.notification && payload.notification.body) ||
    (payload && payload.data && payload.data.body) ||
    'Pratique 5 minutos de inglês hoje para manter sua ofensiva ativa.';

  const notificationOptions = {
    body,
    tag: 'purpose-talk-streak-reminder',
    renotify: true,
    data: {
      url: (payload && payload.data && payload.data.url) || '/',
    },
  };

  return self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
