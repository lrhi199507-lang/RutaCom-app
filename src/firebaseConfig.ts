import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCXBs3-Z4-SC2UUAtZhjMgMZ74sD9rqq9Y",
  authDomain: "rutacom-4ea87.firebaseapp.com",
  projectId: "rutacom-4ea87",
  storageBucket: "rutacom-4ea87.firebasestorage.app",
  messagingSenderId: "1080063705561",
  appId: "1:1080063705561:web:13da1c6fe35eb0e40ad9c8",
  measurementId: "G-2TYQF2QBYD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔥 CACHÉ LOCAL OFFLINE ACTIVADA AQUÍ
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});

const storage = getStorage(app);
const messaging = getMessaging(app);
const functions = getFunctions(app, "us-central1");

export { auth, db, storage, messaging, functions };
