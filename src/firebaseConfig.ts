import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Importamos Firestore

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

// 2. Inicializamos Auth (para usuarios)
const auth = getAuth(app);

// 3. Inicializamos Firestore (para saldo y datos)
const db = getFirestore(app);

// EXPORTAMOS AMBOS
export { auth, db }; 
