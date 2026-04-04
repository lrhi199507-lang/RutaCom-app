import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Tus datos reales
const firebaseConfig = {
  apiKey: "AIzaSyCXBs3-Z4-SC2UUAtZhjMgMZ74sD9rqq9Y",
  authDomain: "rutacom-4ea87.firebaseapp.com",
  projectId: "rutacom-4ea87",
  storageBucket: "rutacom-4ea87.firebasestorage.app",
  messagingSenderId: "1080063705561",
  appId: "1:1080063705561:web:13da1c6fe35eb0e40ad9c8",
  measurementId: "G-2TYQF2QBYD"
};

// 1. Inicializamos la App
const app = initializeApp(firebaseConfig);

// 2. Inicializamos el Auth de forma sencilla
// Esto corregirá el error de "Missing export"
const auth = getAuth(app);

export { auth };
