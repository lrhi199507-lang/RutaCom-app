importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// ⚠️ REEMPLAZA ESTO CON TUS DATOS REALES DE FIREBASE
const firebaseConfig = {
  apiKey: "BLa_YfTJFTTFpYubl3GEZOy6Wo6cL0fBmG9z0-n2v6wA7V08nwQI7oK5RKPFIDF1QjW4RUxsdMqTIHDiEatFrOk",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializamos la app en segundo plano
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Este código detecta la notificación cuando la app está cerrada o en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en background ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.svg', // Icono que aparecerá en la notificación
    badge: '/favicon.svg', // Icono pequeño
    vibrate: [200, 100, 200, 100, 200, 100, 200] // Patrón de vibración
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
